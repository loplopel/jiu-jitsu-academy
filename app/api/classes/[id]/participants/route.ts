import {NextResponse} from 'next/server';
import {getSupabaseAdmin,getSupabaseServerClient} from '@/lib/supabase-server';

export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){
  const {id}=await params; const sb=await getSupabaseServerClient(),admin=getSupabaseAdmin();
  if(!sb||!admin)return NextResponse.json({error:'Supabase não configurado'},{status:503});
  const {data:{user}}=await sb.auth.getUser(); if(!user)return NextResponse.json({error:'Não autenticado'},{status:401});
  const {data:p}=await admin.from('profiles').select('role,active').eq('id',user.id).single();
  if(!p||p.active===false||!['admin','professor'].includes(p.role))return NextResponse.json({error:'Sem permissão'},{status:403});
  const {data:cls}=await admin.from('classes').select('professor_id').eq('id',id).single();
  if(!cls)return NextResponse.json({error:'Aula não encontrada'},{status:404});
  if(p.role==='professor'&&cls.professor_id!==user.id)return NextResponse.json({error:'Sem permissão'},{status:403});
  const {data:reservations,error:rerr}=await admin.from('reservations').select(`
    id,status,created_at,student_id,
    students!reservations_student_id_fkey(
      id,belt_id,degrees,
      profiles!students_id_fkey(name,username,contact_email,phone,avatar_url),
      belts(name)
    )
  `).eq('class_id',id).order('created_at');
  if(rerr)return NextResponse.json({error:rerr.message},{status:500});
  const {data:attendance,error:aerr}=await admin.from('attendance').select('student_id,checked_in_at,notes').eq('class_id',id);
  if(aerr)return NextResponse.json({error:aerr.message},{status:500});
  const attendanceMap=new Map((attendance||[]).map((a:any)=>[a.student_id,a]));
  const rows=(reservations||[]).filter((r:any)=>r.status==='reserved').map((r:any)=>({
    id:r.id,student_id:r.student_id,status:r.status,created_at:r.created_at,
    name:r.students?.profiles?.name||'Aluno',login:r.students?.profiles?.username||'',contact_email:r.students?.profiles?.contact_email||'',phone:r.students?.profiles?.phone||'',
    avatar_url:r.students?.profiles?.avatar_url||null,belt:r.students?.belts?.name||'-',degrees:r.students?.degrees||0,
    present:attendanceMap.has(r.student_id),checked_in_at:attendanceMap.get(r.student_id)?.checked_in_at||null
  }));
  return NextResponse.json(rows);
}
