import {NextResponse} from 'next/server';
import {getSupabaseAdmin,getSupabaseServerClient} from '@/lib/supabase-server';
export async function adminGate(){
  const sb=await getSupabaseServerClient(); const admin=getSupabaseAdmin();
  if(!sb||!admin)return {error:NextResponse.json({error:'Supabase não configurado'},{status:503})};
  const {data:{user}}=await sb.auth.getUser();
  if(!user)return {error:NextResponse.json({error:'Não autenticado'},{status:401})};
  const {data:p}=await admin.from('profiles').select('role,active').eq('id',user.id).single();
  if(p?.role!=='admin'||p?.active===false)return {error:NextResponse.json({error:'Apenas Administrador Geral'},{status:403})};
  return {admin,user};
}
