import {NextResponse} from 'next/server';
import {z} from 'zod';
import {getSupabaseAdmin,getSupabaseServerClient} from '@/lib/supabase-server';

const createSchema=z.object({
  title:z.string().min(2),
  starts_at:z.string().datetime(),
  ends_at:z.string().datetime(),
  capacity:z.number().int().min(1).max(300),
  notes:z.string().optional().nullable(),
  professor_id:z.string().uuid().optional()
});

async function auth(){
  const sb=await getSupabaseServerClient();
  const admin=getSupabaseAdmin();

  if(!sb||!admin){
    return {
      error:NextResponse.json(
        {error:'Supabase não configurado'},
        {status:503}
      )
    };
  }

  const {data:{user}}=await sb.auth.getUser();

  if(!user){
    return {
      error:NextResponse.json(
        {error:'Não autenticado'},
        {status:401}
      )
    };
  }

  const {data:profile}=await admin
    .from('profiles')
    .select('role,active')
    .eq('id',user.id)
    .single();

  if(!profile||profile.active===false){
    return {
      error:NextResponse.json(
        {error:'Usuário inativo'},
        {status:403}
      )
    };
  }

  return {admin,user,profile};
}

export async function GET(){
  const g=await auth();

  if('error'in g)return g.error;

  /*
   * ALUNO
   *
   * O aluno pode visualizar aulas dos professores
   * aos quais está vinculado:
   *
   * - professor responsável
   * - professor adicional
   */
  const {data:links}=g.profile.role==='aluno'
    ? await g.admin
        .from('student_professors')
        .select('professor_id')
        .eq('student_id',g.user.id)
    : {data:[] as any[]};

  const {data:studentLink}=g.profile.role==='aluno'
    ? await g.admin
        .from('students')
        .select('responsible_professor_id')
        .eq('id',g.user.id)
        .single()
    : {data:null as any};

  const allowedProfessorIds=g.profile.role==='aluno'
    ? Array.from(
        new Set([
          studentLink?.responsible_professor_id,
          ...(links||[]).map((row:any)=>row.professor_id)
        ].filter(Boolean))
      )
    : null;

  /*
   * PROFESSOR
   *
   * Professor só recebe as aulas nas quais ele é
   * o professor responsável.
   *
   * Isso protege também o Histórico, e não apenas
   * a interface.
   */
  const professorFilter=
    g.profile.role==='professor'
      ? g.user.id
      : null;

  const {data,error}=await g.admin
    .from('classes')
    .select(`
      id,
      title,
      starts_at,
      ends_at,
      capacity,
      status,
      notes,
      professor_id,
      profiles!classes_professor_id_fkey(name),
      reservations(id,student_id,status)
    `)
    .order('starts_at',{ascending:true});

  if(error){
    return NextResponse.json(
      {error:error.message},
      {status:500}
    );
  }

  const rows=(data||[])
    .filter((c:any)=>{

      /*
       * ADMIN:
       * vê todas as aulas.
       */
      if(g.profile.role==='admin'){
        return true;
      }

      /*
       * PROFESSOR:
       * vê somente as aulas dele.
       */
      if(g.profile.role==='professor'){
        return c.professor_id===professorFilter;
      }

      /*
       * ALUNO:
       * vê somente aulas dos professores vinculados.
       */
      if(g.profile.role==='aluno'){
        return allowedProfessorIds!.includes(c.professor_id);
      }

      return false;
    })
    .map((c:any)=>{

      const reservations=(c.reservations||[])
        .filter((r:any)=>r.status==='reserved');

      const mine=(c.reservations||[])
        .find((r:any)=>r.student_id===g.user.id);

      return {
        id:c.id,
        title:c.title,
        starts_at:c.starts_at,
        ends_at:c.ends_at,
        capacity:c.capacity,
        status:c.status,
        notes:c.notes,
        professor_id:c.professor_id,
        professor_name:c.profiles?.name||'Professor',
        reservations:reservations.length,
        my_reservation_status:mine?.status||null
      };
    });

  return NextResponse.json({
    role:g.profile.role,
    user_id:g.user.id,
    classes:rows
  });
}

export async function POST(req:Request){
  const g=await auth();

  if('error'in g)return g.error;

  if(!['admin','professor'].includes(g.profile.role)){
    return NextResponse.json(
      {error:'Sem permissão'},
      {status:403}
    );
  }

  const parsed=createSchema.safeParse(await req.json());

  if(!parsed.success){
    return NextResponse.json(
      {error:'Revise os dados da aula.'},
      {status:400}
    );
  }

  const d=parsed.data;

  if(new Date(d.ends_at)<=new Date(d.starts_at)){
    return NextResponse.json(
      {error:'O término deve ser depois do início.'},
      {status:400}
    );
  }

  /*
   * Professor cria a própria aula.
   * Admin pode escolher outro professor.
   */
  let professorId=g.user.id;

  if(g.profile.role==='admin'&&d.professor_id){
    professorId=d.professor_id;
  }

  /*
   * Quando o admin escolhe um professor,
   * validamos se ele realmente é professor ativo.
   */
  if(g.profile.role==='admin'&&professorId!==g.user.id){

    const {data:p}=await g.admin
      .from('profiles')
      .select('id,role,active')
      .eq('id',professorId)
      .single();

    if(!p||p.role!=='professor'||p.active===false){
      return NextResponse.json(
        {error:'Professor inválido ou inativo.'},
        {status:400}
      );
    }
  }

  const {data,error}=await g.admin
    .from('classes')
    .insert({
      title:d.title,
      starts_at:d.starts_at,
      ends_at:d.ends_at,
      capacity:d.capacity,
      notes:d.notes||null,
      professor_id:professorId,
      status:'open'
    })
    .select()
    .single();

  if(error){
    return NextResponse.json(
      {error:error.message},
      {status:500}
    );
  }

  return NextResponse.json(
    data,
    {status:201}
  );
}