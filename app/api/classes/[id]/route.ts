import {NextResponse} from 'next/server';
import {z} from 'zod';
import {getSupabaseAdmin,getSupabaseServerClient} from '@/lib/supabase-server';

const patchSchema=z.object({
  title:z.string().min(2).optional(),
  starts_at:z.string().datetime().optional(),
  ends_at:z.string().datetime().optional(),
  capacity:z.number().int().min(1).max(300).optional(),
  notes:z.string().nullable().optional(),
  professor_id:z.string().uuid().optional(),
  status:z.enum(['open','closed','cancelled']).optional()
});

async function gate(id:string){
  const sb=await getSupabaseServerClient(),admin=getSupabaseAdmin();
  if(!sb||!admin)return {error:NextResponse.json({error:'Supabase não configurado'},{status:503})};
  const {data:{user}}=await sb.auth.getUser(); if(!user)return {error:NextResponse.json({error:'Não autenticado'},{status:401})};
  const {data:p}=await admin.from('profiles').select('role,active').eq('id',user.id).single();
  if(!p||p.active===false||!['admin','professor'].includes(p.role))return {error:NextResponse.json({error:'Sem permissão'},{status:403})};
  const {data:cls}=await admin.from('classes').select('id,professor_id,starts_at,ends_at,status').eq('id',id).single();
  if(!cls)return {error:NextResponse.json({error:'Aula não encontrada'},{status:404})};
  if(p.role==='professor'&&cls.professor_id!==user.id)return {error:NextResponse.json({error:'Você só pode gerenciar suas próprias aulas.'},{status:403})};
  return {admin,user,p,cls};
}

export async function PATCH(req:Request,{params}:{params:Promise<{id:string}>}){
  const {id}=await params; const g=await gate(id); if('error'in g)return g.error;
  const parsed=patchSchema.safeParse(await req.json()); if(!parsed.success)return NextResponse.json({error:'Dados inválidos'},{status:400});
  const d=parsed.data;
  if((d.starts_at||d.ends_at)){
    const start=new Date(d.starts_at||g.cls.starts_at),end=new Date(d.ends_at||g.cls.ends_at);
    if(end<=start)return NextResponse.json({error:'O término deve ser depois do início.'},{status:400});
  }
  if(d.professor_id&&g.p.role!=='admin')delete (d as any).professor_id;
  if(d.professor_id){
    const {data:p}=await g.admin.from('profiles').select('role,active').eq('id',d.professor_id).single();
    if(!p||p.role!=='professor'||p.active===false)return NextResponse.json({error:'Professor inválido ou inativo.'},{status:400});
  }
  const {data,error}=await g.admin.from('classes').update(d).eq('id',id).select().single();
  if(error)return NextResponse.json({error:error.message},{status:500});
  return NextResponse.json(data);
}
