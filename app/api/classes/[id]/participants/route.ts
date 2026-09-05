import {NextResponse} from 'next/server';
import {z} from 'zod';
import {getSupabaseAdmin,getSupabaseServerClient} from '@/lib/supabase-server';
import {buildEvolution} from '@/lib/evolution';

async function gateClass(id:string){
  const sb=await getSupabaseServerClient();
  const admin=getSupabaseAdmin();

  if(!sb||!admin){
    return {
      error:NextResponse.json(
        {error:'Supabase não configurado'},
        {status:503}
      )
    } as const;
  }

  const {data:{user}}=await sb.auth.getUser();

  if(!user){
    return {
      error:NextResponse.json(
        {error:'Não autenticado'},
        {status:401}
      )
    } as const;
  }

  const {data:p}=await admin
    .from('profiles')
    .select('role,active')
    .eq('id',user.id)
    .single();

  if(
    !p||
    p.active===false||
    !['admin','professor'].includes(p.role)
  ){
    return {
      error:NextResponse.json(
        {error:'Sem permissão'},
        {status:403}
      )
    } as const;
  }

  const {data:cls}=await admin
    .from('classes')
    .select('professor_id,capacity,status,ends_at')
    .eq('id',id)
    .single();

  if(!cls){
    return {
      error:NextResponse.json(
        {error:'Aula não encontrada'},
        {status:404}
      )
    } as const;
  }

  /*
   * Professor somente pode administrar
   * as próprias aulas.
   */
  if(
    p.role==='professor' &&
    cls.professor_id!==user.id
  ){
    return {
      error:NextResponse.json(
        {error:'Sem permissão'},
        {status:403}
      )
    } as const;
  }

  return {
    admin,
    user,
    profile:p,
    cls
  } as const;
}

export async function GET(
  req:Request,
  {params}:{params:Promise<{id:string}>}
){
  const {id}=await params;

  const g=await gateClass(id);

  if('error'in g)return g.error;

  const url=new URL(req.url);

  /*
   * Lista de alunos que podem ser adicionados
   * manualmente pelo professor.
   */
  if(url.searchParams.get('mode')==='available'){

    const {data:reserved}=await g.admin
      .from('reservations')
      .select('student_id')
      .eq('class_id',id)
      .eq('status','reserved');

    const reservedIds=(reserved||[])
      .map((r:any)=>r.student_id);

    let query=g.admin
      .from('students')
      .select(`
        id,
        status,
        responsible_professor_id,
        profiles!students_id_fkey(
          name,
          username,
          avatar_url
        ),
        belts(name)
      `)
      .eq('status','ativo')
      .order('id');

    /*
     * Professor pode adicionar:
     *
     * - seus alunos principais
     * - seus alunos adicionais
     */
    if(g.profile.role==='professor'){

      const {data:secondaryLinks}=await g.admin
        .from('student_professors')
        .select('student_id')
        .eq('professor_id',g.user.id);

      const secondaryIds=new Set(
        (secondaryLinks||[])
          .map((row:any)=>row.student_id)
      );

      const {data:primaryStudents}=await g.admin
        .from('students')
        .select('id')
        .eq('responsible_professor_id',g.user.id)
        .eq('status','ativo');

      const allowedIds=Array.from(
        new Set([
          ...(primaryStudents||[])
            .map((row:any)=>row.id),
          ...Array.from(secondaryIds)
        ])
      );

      const filtered=await query;

      if(filtered.error){
        return NextResponse.json(
          {error:filtered.error.message},
          {status:500}
        );
      }

      const rows=(filtered.data||[])
        .filter(
          (s:any)=>
            allowedIds.includes(s.id)&&
            !reservedIds.includes(s.id)
        );

      return NextResponse.json(
        rows
          .map((s:any)=>({
            id:s.id,
            name:s.profiles?.name||'Aluno',
            login:s.profiles?.username||'',
            avatar_url:s.profiles?.avatar_url||null,
            belt:s.belts?.name||'-',
          }))
          .sort(
            (a:any,b:any)=>
              a.name.localeCompare(
                b.name,
                'pt-BR'
              )
          )
      );
    }

    if(reservedIds.length){
      query=query.not(
        'id',
        'in',
        `(${reservedIds.join(',')})`
      );
    }

    const {data,error}=await query;

    if(error){
      return NextResponse.json(
        {error:error.message},
        {status:500}
      );
    }

    return NextResponse.json(
      (data||[])
        .map((s:any)=>({
          id:s.id,
          name:s.profiles?.name||'Aluno',
          login:s.profiles?.username||'',
          avatar_url:s.profiles?.avatar_url||null,
          belt:s.belts?.name||'-',
        }))
        .sort(
          (a:any,b:any)=>
            a.name.localeCompare(
              b.name,
              'pt-BR'
            )
        )
    );
  }

  /*
   * Inscritos da aula.
   */
    const {data:reservations,error:rerr}=await g.admin
    .from('reservations')
    .select(`
      id,
      status,
      created_at,
      student_id,
      students!reservations_student_id_fkey(
        id,
        start_date,
        last_graduation_date,
        belt_id,
        degrees,
        status,
        responsible_professor_id,
        profiles!students_id_fkey(
          name,
          username,
          contact_email,
          phone,
          avatar_url
        ),
        belts(
          id,
          name,
          minimum_months,
          sort_order
        )
      )
    `)
    .eq('class_id',id)
    .order('created_at');

  if(rerr){
    return NextResponse.json(
      {error:rerr.message},
      {status:500}
    );
  }

  const {data:attendance,error:aerr}=await g.admin
    .from('attendance')
    .select(
      'student_id,checked_in_at,notes,confirmed_by,qr_token_id'
    )
    .eq('class_id',id);

  if(aerr){
    return NextResponse.json(
      {error:aerr.message},
      {status:500}
    );
  }

  const attendanceMap=new Map(
    (attendance||[]).map(
      (a:any)=>[a.student_id,a]
    )
  );

  /*
   * IDs dos alunos inscritos.
   */
  const studentIds=(reservations||[])
    .filter((r:any)=>r.status==='reserved')
    .map((r:any)=>r.student_id);

  /*
   * Buscamos todo o histórico necessário para calcular
   * o IEA oficial exatamente pela mesma regra do sistema.
   */
  const [allAttendance,allGraduations]=studentIds.length
    ? await Promise.all([
        g.admin
          .from('attendance')
          .select('student_id,checked_in_at')
          .in('student_id',studentIds),

        g.admin
          .from('graduations')
          .select(`
            id,
            student_id,
            graduation_date,
            degrees,
            notes,
            iea_score,
            from:belts!graduations_from_belt_id_fkey(name),
            to:belts!graduations_to_belt_id_fkey(name),
            professor:profiles!graduations_professor_id_fkey(name)
          `)
          .in('student_id',studentIds)
          .order('graduation_date',{ascending:false})
      ])
    : [
        {data:[] as any[],error:null},
        {data:[] as any[],error:null}
      ];

  if(allAttendance.error){
    return NextResponse.json(
      {error:allAttendance.error.message},
      {status:500}
    );
  }

  if(allGraduations.error){
    return NextResponse.json(
      {error:allGraduations.error.message},
      {status:500}
    );
  }

  const now=new Date();

  const rows=(reservations||[])
    .filter(
      (r:any)=>r.status==='reserved'
    )
    .map((r:any)=>{

      const att:any=
        attendanceMap.get(r.student_id);

      const student:any=
        r.students||{};

      /*
       * Histórico de presença deste aluno.
       */
      const studentAttendance=
        (allAttendance.data||[])
          .filter(
            (a:any)=>
              a.student_id===r.student_id
          );

      /*
       * Histórico de graduações deste aluno.
       */
      const studentGraduations=
        (allGraduations.data||[])
          .filter(
            (g:any)=>
              g.student_id===r.student_id
          );

      /*
       * Mesmo cálculo oficial utilizado pelo
       * sistema de evolução/graduação.
       */
      const evolution=buildEvolution(
        student,
        studentAttendance as any,
        [],
        studentGraduations as any,
        now
      );

      return {
        id:r.id,
        student_id:r.student_id,
        status:r.status,
        created_at:r.created_at,

        name:
          student.profiles?.name||
          'Aluno',

        login:
          student.profiles?.username||
          '',

        contact_email:
          student.profiles?.contact_email||
          '',

        phone:
          student.profiles?.phone||
          '',

        avatar_url:
          student.profiles?.avatar_url||
          null,

        belt:
          student.belts?.name||
          '-',

        degrees:
          student.degrees||
          0,

        /*
         * IEA oficial.
         */
        iea:
          Number(evolution.score||0),

        present:!!att,

        checked_in_at:
          att?.checked_in_at||
          null,

        manual:
          !!att&&
          !!att.confirmed_by&&
          !att.qr_token_id,
      };
    });

  return NextResponse.json(rows);
}

const actionSchema=z.object({
  student_id:z.string().uuid(),
  action:z.enum([
    'confirm',
    'remove',
    'add'
  ])
});

export async function POST(
  req:Request,
  {params}:{params:Promise<{id:string}>}
){
  const {id}=await params;

  const g=await gateClass(id);

  if('error'in g)return g.error;

  const parsed=
    actionSchema.safeParse(
      await req.json()
    );

  if(!parsed.success){
    return NextResponse.json(
      {error:'Dados inválidos.'},
      {status:400}
    );
  }

  const {
    student_id,
    action
  }=parsed.data;

  /*
   * =====================================================
   * ALUNO CHEGOU SEM RESERVA
   * =====================================================
   *
   * Pode ser adicionado mesmo depois que a aula terminou.
   *
   * Isso permite corrigir posteriormente a lista de
   * inscritos e registrar a presença normalmente.
   *
   * A única situação bloqueada é aula cancelada.
   */
  if(action==='add'){

    if(g.cls.status==='cancelled'){
      return NextResponse.json(
        {error:'Esta aula foi cancelada.'},
        {status:409}
      );
    }

    const {data:student}=await g.admin
      .from('students')
      .select(
        'id,status,responsible_professor_id'
      )
      .eq('id',student_id)
      .maybeSingle();

    if(
      !student||
      student.status!=='ativo'
    ){
      return NextResponse.json(
        {error:'Aluno não está ativo.'},
        {status:409}
      );
    }

    /*
     * Professor só pode adicionar aluno
     * vinculado a ele como:
     *
     * - responsável
     * - professor adicional
     */
    if(g.profile.role==='professor'){

      const {data:secondary}=await g.admin
        .from('student_professors')
        .select('student_id')
        .eq('student_id',student_id)
        .eq('professor_id',g.user.id)
        .maybeSingle();

      if(
        student.responsible_professor_id!==g.user.id &&
        !secondary
      ){
        return NextResponse.json(
          {error:'Este aluno não está vinculado a você.'},
          {status:403}
        );
      }
    }

    /*
     * Só contamos reservas ativas.
     */
    const {count}=await g.admin
      .from('reservations')
      .select('*',{
        count:'exact',
        head:true
      })
      .eq('class_id',id)
      .eq('status','reserved');

    if(
      (count||0)>=
      Number(g.cls.capacity||0)
    ){
      /*
       * Se o aluno já tiver presença registrada,
       * ainda permitimos a regularização da reserva.
       * Caso contrário, respeitamos a capacidade.
       */
      const {data:existingAttendance}=
        await g.admin
          .from('attendance')
          .select('id')
          .eq('class_id',id)
          .eq('student_id',student_id)
          .maybeSingle();

      if(!existingAttendance){
        return NextResponse.json(
          {error:'Aula lotada.'},
          {status:409}
        );
      }
    }

    /*
     * Cria ou reativa a reserva.
     */
    const {data:reservation,error}=await g.admin
      .from('reservations')
      .upsert(
        {
          class_id:id,
          student_id,
          status:'reserved',
          cancelled_at:null
        },
        {
          onConflict:'class_id,student_id'
        }
      )
      .select('id,status')
      .single();

    if(error){
      return NextResponse.json(
        {
          error:
            'Não foi possível adicionar o aluno à aula.'
        },
        {status:500}
      );
    }

    return NextResponse.json({
      message:'Aluno adicionado à aula.',
      reservation_id:reservation?.id||null
    });
  }

  /*
   * Confirmar ou remover presença exige uma
   * reserva ativa.
   */
  const {data:reservation}=await g.admin
    .from('reservations')
    .select('id,status')
    .eq('class_id',id)
    .eq('student_id',student_id)
    .maybeSingle();

  if(
    !reservation||
    reservation.status!=='reserved'
  ){
    return NextResponse.json(
      {
        error:
          'O aluno não possui reserva ativa nesta aula.'
      },
      {status:409}
    );
  }

  /*
   * CONFIRMAR PRESENÇA
   */
  if(action==='confirm'){

    const {data:existing}=await g.admin
      .from('attendance')
      .select(
        'id,checked_in_at'
      )
      .eq('class_id',id)
      .eq('student_id',student_id)
      .maybeSingle();

    if(existing){
      return NextResponse.json({
        message:'Presença já registrada.',
        checked_in_at:
          existing.checked_in_at
      });
    }

    const now=
      new Date().toISOString();

    const {error}=await g.admin
      .from('attendance')
      .insert({
        class_id:id,
        student_id,
        checked_in_at:now,
        confirmed_by:g.user.id,
        qr_token_id:null,
        device_info:'manual_professor',
        notes:
          'Presença confirmada manualmente pelo professor',
      });

    if(error?.code==='23505'){
      return NextResponse.json({
        message:'Presença já registrada.'
      });
    }

    if(error){
      return NextResponse.json(
        {
          error:
            'Não foi possível confirmar a presença.'
        },
        {status:500}
      );
    }

    return NextResponse.json({
      message:
        'Presença confirmada manualmente.',
      checked_in_at:now
    });
  }

  /*
   * REMOVER PRESENÇA MANUAL
   */
  const {data:existing}=await g.admin
    .from('attendance')
    .select(
      'id,confirmed_by,qr_token_id'
    )
    .eq('class_id',id)
    .eq('student_id',student_id)
    .maybeSingle();

  if(!existing){
    return NextResponse.json({
      message:
        'O aluno já está como aguardando.'
    });
  }

  if(existing.qr_token_id){
    return NextResponse.json(
      {
        error:
          'Presença feita por QR não pode ser removida por esta ação.'
      },
      {status:409}
    );
  }

  if(!existing.confirmed_by){
    return NextResponse.json(
      {
        error:
          'Esta presença não foi marcada manualmente.'
      },
      {status:409}
    );
  }

  const {error}=await g.admin
    .from('attendance')
    .delete()
    .eq('id',existing.id);

  if(error){
    return NextResponse.json(
      {
        error:
          'Não foi possível desfazer a presença.'
      },
      {status:500}
    );
  }

  return NextResponse.json({
    message:
      'Presença manual removida.'
  });
}