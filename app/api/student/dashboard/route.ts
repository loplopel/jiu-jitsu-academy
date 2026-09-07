import {NextResponse} from 'next/server';
import {getSupabaseAdmin,getSupabaseServerClient} from '@/lib/supabase-server';
import {buildEvolution} from '@/lib/evolution';

function brazilDateParts(value:string){

  const parts=new Intl.DateTimeFormat(
    'en-US',
    {
      timeZone:'America/Sao_Paulo',
      year:'numeric',
      month:'2-digit',
      day:'2-digit'
    }
  ).formatToParts(new Date(value));

  const result={
    year:Number(parts.find(p=>p.type==='year')?.value||0),
    month:Number(parts.find(p=>p.type==='month')?.value||0),
    day:Number(parts.find(p=>p.type==='day')?.value||0)
  };

  return result;

}

function monthCounts(dates:string[],year:number){

  const counts=Array.from(
    {length:12},
    ()=>0
  );

  for(const value of dates){

    const date=brazilDateParts(value);

    if(date.year===year){

      counts[date.month-1]++;

    }

  }

  return counts;

}

function attendanceDayKeys(
  dates:string[],
  year:number
){

  const days=new Set<string>();

  for(const value of dates){

    const date=brazilDateParts(value);

    if(date.year!==year)continue;

    const month=String(
      date.month
    ).padStart(2,'0');

    const day=String(
      date.day
    ).padStart(2,'0');

    days.add(
      `${year}-${month}-${day}`
    );

  }

  return Array.from(days);

}

export async function GET(){

  const sb=
    await getSupabaseServerClient();

  const admin=
    getSupabaseAdmin();

  if(!sb||!admin){

    return NextResponse.json(
      {
        error:
          'Supabase não configurado.'
      },
      {
        status:503
      }
    );

  }

  const {
    data:{user}
  }=
    await sb.auth.getUser();

  if(!user){

    return NextResponse.json(
      {
        error:
          'Não autenticado.'
      },
      {
        status:401
      }
    );

  }

  const {
    data:profile
  }=
    await admin
      .from('profiles')
      .select(
        'role,active,name,avatar_url'
      )
      .eq('id',user.id)
      .single();

  if(
    !profile||
    profile.role!=='aluno'||
    profile.active===false
  ){

    return NextResponse.json(
      {
        error:
          'Painel disponível apenas para alunos ativos.'
      },
      {
        status:403
      }
    );

  }

  const {
    data:student,
    error:studentError
  }=
    await admin
      .from('students')
      .select(`
        id,
        start_date,
        last_graduation_date,
        degrees,
        weight,
        status,
        responsible_professor_id,

        belts(
          id,
          name,
          minimum_months,
          sort_order
        ),

        categories(
          name
        ),

        responsible:profiles!students_responsible_professor_id_fkey(
          name
        )
      `)
      .eq('id',user.id)
      .single();

  if(
    studentError||
    !student
  ){

    return NextResponse.json(
      {
        error:
          'Cadastro esportivo do aluno não encontrado.'
      },
      {
        status:404
      }
    );

  }

  const now=new Date();

  const nowBrazil=
    brazilDateParts(now.toISOString());

  const currentYear=
    nowBrazil.year;

  const startYear=
    new Date(
      currentYear,
      0,
      1
    ).toISOString();

  const {data:secondaryLinks}=
    await admin
      .from('student_professors')
      .select('professor_id')
      .eq('student_id',user.id);

  const allowedProfessorIds=Array.from(
    new Set([
      (student as any).responsible_professor_id,
      ...(secondaryLinks||[]).map((row:any)=>row.professor_id)
    ].filter(Boolean))
  );

  const [
    attendance,
    classes,
    graduations
  ]=
    await Promise.all([

      admin
        .from('attendance')
        .select(`
          checked_in_at,
          class_id,
          classes(
            title,
            starts_at
          )
        `)
        .eq(
          'student_id',
          user.id
        )
        .order(
          'checked_in_at',
          {
            ascending:false
          }
        ),

      admin
        .from('classes')
        .select(`
          id,
          title,
          starts_at,
          ends_at,
          capacity,
          status,
          professor_id,
          profiles!classes_professor_id_fkey(
            name
          ),
          reservations(
            id,
            student_id,
            status
          )
        `)
        .gte(
          'ends_at',
          new Date(
            now.getTime()-
            86400000
          ).toISOString()
        )
        .order(
          'starts_at',
          {
            ascending:true
          }
        ),

      admin
        .from('graduations')
        .select(`
          id,
          graduation_date,
          degrees,

          to:belts!graduations_to_belt_id_fkey(
            name
          ),

          professor:profiles!graduations_professor_id_fkey(
            name
          )
        `)
        .eq(
          'student_id',
          user.id
        )
        .order(
          'graduation_date',
          {
            ascending:false
          }
        )

    ]);

  const attendanceRows=
    (attendance.data||[]) as any[];

  /*
   * A frequência pertence ao dia da aula, não ao horário
   * em que o check-in foi registrado.
   *
   * Exemplo:
   * aula na sexta às 20:30 + check-in às 21:10
   * => frequência da sexta-feira.
   *
   * O checked_in_at continua sendo usado pelo histórico
   * e pelo cálculo da evolução/IEA.
   */
  const attendanceDates=
    attendanceRows
      .map(
        row=>
          row.classes?.starts_at||
          row.checked_in_at
      )
      .filter(
        (value): value is string=>
          Boolean(value)
      );

  const evolution=
    buildEvolution(
      student as any,

      attendanceRows.map(
        row=>({
          student_id:user.id,
          checked_in_at:
            row.checked_in_at
        })
      ),

      [],

      (graduations.data||[]).map(
        (g:any)=>({
          student_id:user.id,
          graduation_date:
            g.graduation_date
        })
      ),

      now
    );

  const upcoming=
    (classes.data||[])
      .filter(
        (row:any)=>
          row.status==='open'&&
          new Date(row.ends_at)>=now&&
          allowedProfessorIds.includes(row.professor_id)
      )
      .map(
        (row:any)=>{

          const reservations=
            (row.reservations||[])
              .filter(
                (r:any)=>
                  r.status==='reserved'
              );

          const mine=
            (row.reservations||[])
              .find(
                (r:any)=>
                  r.student_id===user.id
              );

          return {
            id:row.id,
            title:row.title,
            starts_at:row.starts_at,
            ends_at:row.ends_at,
            capacity:row.capacity,
            reservations:
              reservations.length,
            my_reservation_status:
              mine?.status||null,
            professor_name:
              row.profiles?.name||
              'Professor'
          };

        }
      )
      .slice(0,6);

  const currentMonth=
    nowBrazil.month;

  const monthAttendance=
    attendanceDates.filter(
      value=>{
        const date=brazilDateParts(value);

        return(
          date.year===currentYear&&
          date.month===currentMonth
        );

      }
    ).length;

  const yearAttendance=
    attendanceDates.filter(
      value=>
        brazilDateParts(value).year===currentYear
    ).length;

  const recentAttendance=
    attendanceRows
      .slice(0,12)
      .map(
        (row:any)=>({

          checked_in_at:
            row.checked_in_at,

          title:
            row.classes?.title||
            'Treino',

          class_starts_at:
            row.classes?.starts_at||
            null

        })
      );

  /*
   * Dias exatos de presença no ano.
   *
   * Exemplo:
   * [
   *   "2026-08-12",
   *   "2026-08-17",
   *   "2026-08-26"
   * ]
   *
   * O frontend usa essa lista
   * para pintar o calendário.
   */

  const attendanceDays=
    attendanceDayKeys(
      attendanceDates,
      currentYear
    );

  return NextResponse.json({

    profile:{
      name:
        profile.name||
        'Aluno',

      avatar_url:
        profile.avatar_url||
        null
    },

    student:{

      start_date:
        (student as any)
          .start_date||
        null,

      degrees:
        Number(
          (student as any)
            .degrees||
          0
        ),

      weight:
        (student as any)
          .weight??
        null,

      belt:
        (student as any)
          .belts?.name||
        '-',

      category:
        (student as any)
          .categories?.name||
        '-',

      professor:
        (student as any)
          .responsible?.name||
        '-'

    },

    evolution,

    attendance:{

      total:
        attendanceDates.length,

      month:
        monthAttendance,

      year:
        yearAttendance,

      months:
        monthCounts(
          attendanceDates,
          currentYear
        ),

      /*
       * NOVO
       */
      days:
        attendanceDays,

      recent:
        recentAttendance,

      yearLabel:
        currentYear

    },

    upcoming,

    graduations:
      graduations.data||[]

  });

}