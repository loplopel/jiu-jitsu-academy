import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin, getSupabaseServerClient } from '@/lib/supabase-server';

const nullableUuid = z.union([z.string().uuid(), z.literal(''), z.null()]).optional();
const nullableText = z.union([z.string(), z.null()]).optional();
const schema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2),
  email: z.string().email(),
  phone: nullableText,
  whatsapp: nullableText,
  avatar_url: nullableText,
  cpf: nullableText,
  birth_date: nullableText,
  sex: nullableText,
  weight: z.coerce.number().nonnegative().optional().nullable(),
  height: z.coerce.number().nonnegative().optional().nullable(),
  category_id: nullableUuid,
  responsible_professor_id: nullableUuid,
  start_date: nullableText,
  belt_id: nullableUuid,
  degrees: z.coerce.number().int().min(0).max(6).default(0),
  last_graduation_date: nullableText,
  notes: nullableText,
  emergency_contact: nullableText,
  emergency_name: nullableText,
  emergency_phone: nullableText,
  emergency_relation: nullableText,
  injuries: nullableText,
  plan_id: nullableUuid,
  status: z.enum(['ativo','inativo','bloqueado']).default('ativo')
});

async function gate(){
  const sb=await getSupabaseServerClient();
  const admin=getSupabaseAdmin();
  if(!sb||!admin)return {error:NextResponse.json({error:'Supabase não configurado'},{status:503})};
  const {data:{user}}=await sb.auth.getUser();
  if(!user)return {error:NextResponse.json({error:'Não autenticado'},{status:401})};
  const {data:p}=await admin.from('profiles').select('role').eq('id',user.id).single();
  if(!p||!['admin','professor'].includes(p.role))return {error:NextResponse.json({error:'Sem permissão'},{status:403})};
  return {admin,role:p.role as 'admin'|'professor'};
}

function studentPayload(d:z.infer<typeof schema>){
  return {
    cpf:d.cpf||null,
    whatsapp:d.whatsapp||null,
    birth_date:d.birth_date||null,
    sex:d.sex||null,
    weight:d.weight??null,
    height:d.height??null,
    category_id:d.category_id||null,
    responsible_professor_id:d.responsible_professor_id||null,
    start_date:d.start_date||new Date().toISOString().slice(0,10),
    belt_id:d.belt_id||null,
    degrees:d.degrees,
    last_graduation_date:d.last_graduation_date||null,
    notes:d.notes||null,
    emergency_contact:d.emergency_contact||null,
    emergency_name:d.emergency_name||null,
    emergency_phone:d.emergency_phone||null,
    emergency_relation:d.emergency_relation||null,
    injuries:d.injuries||null,
    plan_id:d.plan_id||null,
    status:d.status
  };
}

export async function GET(){
  const g=await gate(); if('error'in g)return g.error;
  const {data,error}=await g.admin.from('students').select(`
    id,cpf,whatsapp,birth_date,sex,weight,height,degrees,start_date,last_graduation_date,
    training_time_months,notes,emergency_contact,emergency_name,emergency_phone,emergency_relation,injuries,status,
    category_id,responsible_professor_id,belt_id,plan_id,
    profiles!students_id_fkey(name,email,phone,avatar_url,active),
    belts(name),plans(name,amount,billing_cycle),categories(name),
    responsible:profiles!students_responsible_professor_id_fkey(name)
  `).order('start_date',{ascending:false});
  if(error)return NextResponse.json({error:error.message},{status:500});
  return NextResponse.json(data||[]);
}

export async function POST(req:Request){
  const g=await gate(); if('error'in g)return g.error;
  const parsed=schema.safeParse(await req.json());
  if(!parsed.success)return NextResponse.json({error:'Revise os dados do aluno.',details:parsed.error.flatten()},{status:400});
  const d=parsed.data;
  const {data:inv,error}=await g.admin.auth.admin.inviteUserByEmail(d.email,{data:{name:d.name},redirectTo:`${process.env.NEXT_PUBLIC_APP_URL||'http://localhost:3000'}/update-password`});
  if(error||!inv.user)return NextResponse.json({error:error?.message||'Falha ao convidar aluno'},{status:400});
  const id=inv.user.id;
  const {error:profileError}=await g.admin.from('profiles').update({name:d.name,email:d.email,phone:d.phone||null,avatar_url:d.avatar_url||null,role:'aluno',active:d.status==='ativo'}).eq('id',id);
  if(profileError){await g.admin.auth.admin.deleteUser(id);return NextResponse.json({error:profileError.message},{status:500});}
  const {error:studentError}=await g.admin.from('students').insert({id,...studentPayload(d)});
  if(studentError){await g.admin.auth.admin.deleteUser(id);return NextResponse.json({error:studentError.message},{status:500});}
  return NextResponse.json({id,name:d.name,email:d.email},{status:201});
}

export async function PATCH(req:Request){
  const g=await gate(); if('error'in g)return g.error;
  const parsed=schema.safeParse(await req.json());
  if(!parsed.success||!parsed.data.id)return NextResponse.json({error:'Revise os dados do aluno.'},{status:400});
  const d=parsed.data;
  const {error:profileError}=await g.admin.from('profiles').update({name:d.name,phone:d.phone||null,avatar_url:d.avatar_url||null,active:d.status==='ativo'}).eq('id',d.id).eq('role','aluno');
  if(profileError)return NextResponse.json({error:profileError.message},{status:500});
  const {error:studentError}=await g.admin.from('students').update(studentPayload(d)).eq('id',d.id);
  if(studentError)return NextResponse.json({error:studentError.message},{status:500});
  return NextResponse.json({ok:true});
}
