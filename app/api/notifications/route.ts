import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin, getSupabaseServerClient } from '@/lib/supabase-server';

const sendSchema = z.object({
  title: z.string().trim().min(2).max(120),
  message: z.string().trim().min(2).max(1500),
  kind: z.enum(['general','class','event','birthday','achievement']).default('general'),
  audience: z.enum(['all','students','professors','user']).default('all'),
  user_id: z.string().uuid().optional(),
  link_url: z.string().trim().max(300).optional().nullable(),
});
const patchSchema = z.object({ id:z.string().uuid().optional(), mark_all:z.boolean().optional() });

async function ctx(){
  const sb=await getSupabaseServerClient(); const admin=getSupabaseAdmin();
  if(!sb||!admin) return {error:NextResponse.json({error:'Supabase não configurado'},{status:503})};
  const {data:{user}}=await sb.auth.getUser();
  if(!user) return {error:NextResponse.json({error:'Não autenticado'},{status:401})};
  const {data:profile}=await admin.from('profiles').select('role,active').eq('id',user.id).single();
  if(!profile?.active) return {error:NextResponse.json({error:'Usuário inativo'},{status:403})};
  return {admin,user,profile};
}

export async function GET(){
  const g=await ctx(); if('error' in g) return g.error;
  const now=new Date().toISOString();
  const {data,error}=await g.admin.from('notifications')
    .select('id,title,message,kind,link_url,read_at,created_at,scheduled_for')
    .eq('user_id',g.user.id)
    .or(`scheduled_for.is.null,scheduled_for.lte.${now}`)
    .order('created_at',{ascending:false}).limit(150);
  if(error) return NextResponse.json({error:error.message},{status:500});
  const items=data||[]; const unread=items.filter(x=>!x.read_at).length;
  return NextResponse.json({items,unread});
}

export async function POST(req:Request){
  const g=await ctx(); if('error' in g) return g.error;
  if(g.profile?.role!=='admin') return NextResponse.json({error:'Apenas Administrador Geral'},{status:403});
  const parsed=sendSchema.safeParse(await req.json());
  if(!parsed.success) return NextResponse.json({error:'Preencha título, mensagem e destinatário.'},{status:400});
  const p=parsed.data;
  let query=g.admin.from('profiles').select('id').eq('active',true);
  if(p.audience==='students') query=query.eq('role','aluno');
  if(p.audience==='professors') query=query.eq('role','professor');
  if(p.audience==='user'){
    if(!p.user_id) return NextResponse.json({error:'Selecione um usuário.'},{status:400});
    query=query.eq('id',p.user_id);
  }
  const {data:targets,error:targetError}=await query;
  if(targetError) return NextResponse.json({error:targetError.message},{status:500});
  const rows=(targets||[]).map(({id})=>({
    user_id:id,title:p.title,message:p.message,kind:p.kind,link_url:p.link_url||null,sent_by:g.user.id,delivered_at:new Date().toISOString()
  }));
  if(!rows.length) return NextResponse.json({error:'Nenhum destinatário encontrado.'},{status:400});
  const {error}=await g.admin.from('notifications').insert(rows);
  if(error) return NextResponse.json({error:error.message},{status:500});
  return NextResponse.json({sent:rows.length});
}

export async function PATCH(req:Request){
  const g=await ctx(); if('error' in g) return g.error;
  const parsed=patchSchema.safeParse(await req.json());
  if(!parsed.success) return NextResponse.json({error:'Dados inválidos'},{status:400});
  let q=g.admin.from('notifications').update({read_at:new Date().toISOString()}).eq('user_id',g.user.id).is('read_at',null);
  if(!parsed.data.mark_all){
    if(!parsed.data.id) return NextResponse.json({error:'Informe a notificação.'},{status:400});
    q=q.eq('id',parsed.data.id);
  }
  const {error}=await q; if(error) return NextResponse.json({error:error.message},{status:500});
  return NextResponse.json({ok:true});
}
