import {NextResponse} from 'next/server';
import {getSupabaseServerClient,getSupabaseAdmin} from '@/lib/supabase-server';
import {createQrToken,hashQrToken,QR_TTL_SECONDS,isExpired} from '@/lib/qr';

async function gate(id:string){
  const sb=await getSupabaseServerClient(); const admin=getSupabaseAdmin();
  if(!sb||!admin)return {error:NextResponse.json({error:'Supabase não configurado'},{status:503})};
  const {data:{user}}=await sb.auth.getUser(); if(!user)return {error:NextResponse.json({error:'Não autenticado'},{status:401})};
  const {data:p}=await admin.from('profiles').select('role,active').eq('id',user.id).single();
  if(!p||p.active===false||!['admin','professor'].includes(p.role))return {error:NextResponse.json({error:'Sem permissão'},{status:403})};
  const {data:cls}=await admin.from('classes').select('id,professor_id,starts_at,ends_at,status,title').eq('id',id).single();
  if(!cls)return {error:NextResponse.json({error:'Aula não encontrada'},{status:404})};
  if(p.role==='professor'&&cls.professor_id!==user.id)return {error:NextResponse.json({error:'Você só pode gerar QR das suas aulas.'},{status:403})};
  return {admin,user,cls};
}

export async function POST(_:Request,{params}:{params:Promise<{id:string}>}){
  const {id}=await params; const g=await gate(id); if('error'in g)return g.error;
  const now=Date.now(),start=new Date(g.cls.starts_at).getTime(),end=new Date(g.cls.ends_at).getTime();
  if(g.cls.status!=='open')return NextResponse.json({error:'A aula não está aberta.'},{status:409});
  if(now<start)return NextResponse.json({error:'O QR só pode ser gerado quando a aula começar.'},{status:409});
  if(now>end)return NextResponse.json({error:'Esta aula já terminou.'},{status:409});
  const token=createQrToken(); const expiresAt=new Date(Date.now()+QR_TTL_SECONDS*1000).toISOString();
  const {error}=await g.admin.from('qr_tokens').insert({class_id:id,token_hash:hashQrToken(token),expires_at:expiresAt,created_by:g.user.id});
  if(error)return NextResponse.json({error:error.message},{status:500});
  return NextResponse.json({token,expiresAt,ttl:QR_TTL_SECONDS,classTitle:g.cls.title});
}

export async function GET(req:Request,{params}:{params:Promise<{id:string}>}){
  const {id}=await params; const g=await gate(id); if('error'in g)return g.error;
  const token=new URL(req.url).searchParams.get('token'); if(!token)return NextResponse.json({error:'Token ausente'},{status:400});
  const {data:qr}=await g.admin.from('qr_tokens').select('used_at,expires_at').eq('class_id',id).eq('token_hash',hashQrToken(token)).maybeSingle();
  if(!qr)return NextResponse.json({valid:false,used:true});
  return NextResponse.json({valid:!qr.used_at&&!isExpired(qr.expires_at),used:Boolean(qr.used_at),expired:isExpired(qr.expires_at)});
}
