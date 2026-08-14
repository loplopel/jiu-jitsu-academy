import {NextResponse} from 'next/server';
import {z} from 'zod';
import {getSupabaseAdmin,getSupabaseServerClient} from '@/lib/supabase-server';

async function gateClass(id:string){
  const sb=await getSupabaseServerClient(),admin=getSupabaseAdmin();
  if(!sb||!admin)return {error:NextResponse.json({error:'Supabase não configurado'},{status:503})} as const;
  const {data:{user}}=await sb.auth.getUser();
  if(!user)return {error:NextResponse.json({error:'Não autenticado'},{status:401})} as const;
  const {data:p}=await admin.from('profiles').select('role,active').eq('id',user.id).single();
  if(!p||p.active===false||!['admin','professor'].includes(p.role))return {error:NextResponse.json({error:'Sem permissão'},{status:403})} as const;
  const {data:cls}=await admin.from('classes').select('professor_id').eq('id',id).single();
  if(!cls)return {error:NextResponse.json({error:'Aula não encontrada'},{status:404})} as const;
  if(p.role==='professor'&&cls.professor_id!==user.id)return {error:NextResponse.json({error:'Sem permissão'},{status:403})} as const;
  return {admin,user,profile:p,cls} as const;
}

export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){
  const {id}=await params; const g=await gateClass(id); if('error'in g)return g.error;
  const {data:reservations,error:rerr}=await g.admin.from('reservations').select(`
    id,status,created_at,student_id,
    students!reservations_student_id_fkey(
      id,belt_id,degrees,
      profiles!students_id_fkey(name,username,contact_email,phone,avatar_url),
      belts(name)
    )
  `).eq('class_id',id).order('created_at');
  if(rerr)return NextResponse.json({error:rerr.message},{status:500});
  const {data:attendance,error:aerr}=await g.admin.from('attendance').select('student_id,checked_in_at,notes,confirmed_by,qr_token_id').eq('class_id',id);
  if(aerr)return NextResponse.json({error:aerr.message},{status:500});
  const attendanceMap=new Map((attendance||[]).map((a:any)=>[a.student_id,a]));
  const rows=(reservations||[]).filter((r:any)=>r.status==='reserved').map((r:any)=>{
    const att:any=attendanceMap.get(r.student_id);
    return {
      id:r.id,student_id:r.student_id,status:r.status,created_at:r.created_at,
      name:r.students?.profiles?.name||'Aluno',login:r.students?.profiles?.username||'',contact_email:r.students?.profiles?.contact_email||'',phone:r.students?.profiles?.phone||'',
      avatar_url:r.students?.profiles?.avatar_url||null,belt:r.students?.belts?.name||'-',degrees:r.students?.degrees||0,
      present:!!att,checked_in_at:att?.checked_in_at||null,
      manual:!!att&&!!att.confirmed_by&&!att.qr_token_id,
    };
  });
  return NextResponse.json(rows);
}

const actionSchema=z.object({student_id:z.string().uuid(),action:z.enum(['confirm','remove'])});
export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){
  const {id}=await params; const g=await gateClass(id); if('error'in g)return g.error;
  const parsed=actionSchema.safeParse(await req.json());
  if(!parsed.success)return NextResponse.json({error:'Dados inválidos.'},{status:400});
  const {student_id,action}=parsed.data;
  const {data:reservation}=await g.admin.from('reservations').select('id,status').eq('class_id',id).eq('student_id',student_id).maybeSingle();
  if(!reservation||reservation.status!=='reserved')return NextResponse.json({error:'O aluno não possui reserva ativa nesta aula.'},{status:409});

  if(action==='confirm'){
    const {data:existing}=await g.admin.from('attendance').select('id,checked_in_at').eq('class_id',id).eq('student_id',student_id).maybeSingle();
    if(existing)return NextResponse.json({message:'Presença já registrada.',checked_in_at:existing.checked_in_at});
    const now=new Date().toISOString();
    const {error}=await g.admin.from('attendance').insert({
      class_id:id,student_id,checked_in_at:now,confirmed_by:g.user.id,qr_token_id:null,
      device_info:'manual_professor',notes:'Presença confirmada manualmente pelo professor',
    });
    if(error?.code==='23505')return NextResponse.json({message:'Presença já registrada.'});
    if(error)return NextResponse.json({error:'Não foi possível confirmar a presença.'},{status:500});
    return NextResponse.json({message:'Presença confirmada manualmente.',checked_in_at:now});
  }

  const {data:existing}=await g.admin.from('attendance').select('id,confirmed_by,qr_token_id').eq('class_id',id).eq('student_id',student_id).maybeSingle();
  if(!existing)return NextResponse.json({message:'O aluno já está como aguardando.'});
  if(existing.qr_token_id)return NextResponse.json({error:'Presença feita por QR não pode ser removida por esta ação.'},{status:409});
  if(!existing.confirmed_by)return NextResponse.json({error:'Esta presença não foi marcada manualmente.'},{status:409});
  const {error}=await g.admin.from('attendance').delete().eq('id',existing.id);
  if(error)return NextResponse.json({error:'Não foi possível desfazer a presença.'},{status:500});
  return NextResponse.json({message:'Presença manual removida.'});
}
