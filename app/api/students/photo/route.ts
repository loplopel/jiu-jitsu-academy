import {NextResponse} from 'next/server';
import {getSupabaseAdmin,getSupabaseServerClient} from '@/lib/supabase-server';

async function staffGate(){
  const sb=await getSupabaseServerClient(),admin=getSupabaseAdmin();
  if(!sb||!admin)return {error:NextResponse.json({error:'Supabase não configurado'},{status:503})};
  const {data:{user}}=await sb.auth.getUser(); if(!user)return {error:NextResponse.json({error:'Não autenticado'},{status:401})};
  const {data:p}=await admin.from('profiles').select('role,active').eq('id',user.id).single();
  if(!p||p.active===false||!['admin','professor'].includes(p.role))return {error:NextResponse.json({error:'Sem permissão'},{status:403})};
  return {admin};
}
export async function POST(req:Request){
  const g=await staffGate(); if('error'in g)return g.error;
  const form=await req.formData();
  const file=form.get('file'); const studentId=String(form.get('studentId')||'');
  if(!(file instanceof File)||!studentId)return NextResponse.json({error:'Arquivo e aluno são obrigatórios.'},{status:400});
  if(file.size>4*1024*1024)return NextResponse.json({error:'A foto deve ter no máximo 4 MB.'},{status:400});
  if(!['image/jpeg','image/png','image/webp'].includes(file.type))return NextResponse.json({error:'Use uma imagem JPG, PNG ou WEBP.'},{status:400});
  const ext=file.type==='image/png'?'png':file.type==='image/webp'?'webp':'jpg';
  const path=`${studentId}/avatar-${Date.now()}.${ext}`;
  const bytes=new Uint8Array(await file.arrayBuffer());
  const {error}=await g.admin.storage.from('student-photos').upload(path,bytes,{contentType:file.type,upsert:true});
  if(error)return NextResponse.json({error:error.message},{status:500});
  const {data}=g.admin.storage.from('student-photos').getPublicUrl(path);
  await g.admin.from('profiles').update({avatar_url:data.publicUrl}).eq('id',studentId);
  return NextResponse.json({url:data.publicUrl});
}
