import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin, getSupabaseServerClient } from '@/lib/supabase-server';

const createSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['admin','professor','aluno']),
  phone: z.string().optional(),
});

async function requireAdmin(){
  const sb=await getSupabaseServerClient(); const admin=getSupabaseAdmin();
  if(!sb||!admin) return {error:NextResponse.json({error:'Supabase não configurado'},{status:503})};
  const {data:{user}}=await sb.auth.getUser();
  if(!user) return {error:NextResponse.json({error:'Não autenticado'},{status:401})};
  const {data:profile}=await admin.from('profiles').select('role').eq('id',user.id).single();
  if(profile?.role!=='admin') return {error:NextResponse.json({error:'Apenas Administrador Geral'},{status:403})};
  return {admin};
}

export async function POST(req:Request){
  const gate=await requireAdmin(); if('error' in gate) return gate.error;
  const parsed=createSchema.safeParse(await req.json());
  if(!parsed.success) return NextResponse.json({error:'Dados de usuário inválidos'},{status:400});
  const {name,email,password,role,phone}=parsed.data;
  const {data,error}=await gate.admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{name}});
  if(error||!data.user) return NextResponse.json({error:error?.message||'Falha ao criar usuário'},{status:400});
  const {error:profileError}=await gate.admin.from('profiles').update({name,email,role,phone:phone||null}).eq('id',data.user.id);
  if(profileError){await gate.admin.auth.admin.deleteUser(data.user.id);return NextResponse.json({error:'Falha ao configurar perfil'},{status:500});}
  return NextResponse.json({id:data.user.id,name,email,role},{status:201});
}
