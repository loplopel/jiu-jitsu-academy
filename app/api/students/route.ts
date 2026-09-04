import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin, getSupabaseServerClient } from '@/lib/supabase-server';
import {isValidLogin,normalizeLogin,syntheticAuthEmail} from '@/lib/login';

const nullableUuid = z.union([z.string().uuid(), z.literal(''), z.null()]).optional();
const nullableText = z.union([z.string(), z.null()]).optional();
const schema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2), username:z.string().optional(), password:z.string().optional(), contact_email:z.union([z.string().email(),z.literal(''),z.null()]).optional(),
  phone: nullableText, whatsapp: nullableText, avatar_url: nullableText, cpf: nullableText, birth_date: nullableText, sex: nullableText,
  weight: z.coerce.number().nonnegative().optional().nullable(), height: z.coerce.number().nonnegative().optional().nullable(), category_id: nullableUuid, category_name: nullableText,
  responsible_professor_id: nullableUuid, additional_professor_ids: z.array(z.string().uuid()).optional().default([]), start_date: nullableText, belt_id: nullableUuid, degrees: z.coerce.number().int().min(0).max(6).default(0),
  last_graduation_date: nullableText, notes: nullableText, emergency_contact: nullableText, emergency_name: nullableText, emergency_phone: nullableText,
  emergency_relation: nullableText, injuries: nullableText, status: z.enum(['ativo','inativo','bloqueado']).default('ativo')
});

async function gate(){const sb=await getSupabaseServerClient();const admin=getSupabaseAdmin();if(!sb||!admin)return {error:NextResponse.json({error:'Supabase não configurado'},{status:503})};const {data:{user}}=await sb.auth.getUser();if(!user)return {error:NextResponse.json({error:'Não autenticado'},{status:401})};const {data:p}=await admin.from('profiles').select('role').eq('id',user.id).single();if(!p||!['admin','professor'].includes(p.role))return {error:NextResponse.json({error:'Sem permissão'},{status:403})};return {admin,role:p.role as 'admin'|'professor'};}
function studentPayload(d:z.infer<typeof schema>,categoryId:string|null){return {cpf:d.cpf||null,whatsapp:d.whatsapp||null,birth_date:d.birth_date||null,sex:d.sex||null,weight:d.weight??null,height:d.height??null,category_id:categoryId,responsible_professor_id:d.responsible_professor_id||null,start_date:d.start_date||new Date().toISOString().slice(0,10),belt_id:d.belt_id||null,degrees:d.degrees,last_graduation_date:d.last_graduation_date||null,notes:d.notes||null,emergency_contact:d.emergency_contact||null,emergency_name:d.emergency_name||null,emergency_phone:d.emergency_phone||null,emergency_relation:d.emergency_relation||null,injuries:d.injuries||null,status:d.status};}
async function resolveCategory(admin:any,d:z.infer<typeof schema>){const name=String(d.category_name||'').trim();if(!name)return d.category_id||null;const {data:existing,error:findError}=await admin.from('categories').select('id').eq('name',name).maybeSingle();if(findError)throw new Error(findError.message);if(existing?.id)return existing.id as string;const {data:created,error}=await admin.from('categories').insert({name,active:true}).select('id').single();if(error)throw new Error(error.message);return created.id as string;}
async function syncAdditionalProfessors(admin:any,studentId:string,ids:string[],primaryId:string|null){
  const clean=Array.from(new Set((ids||[]).filter(Boolean).filter(id=>id!==primaryId)));
  if(clean.length){
    const {data:valid,error}=await admin.from('profiles').select('id').in('id',clean).eq('role','professor').eq('active',true);
    if(error)throw new Error(error.message);
    const validIds=new Set((valid||[]).map((x:any)=>x.id));
    if(validIds.size!==clean.length)throw new Error('Um ou mais professores adicionais são inválidos ou estão inativos.');
  }
  const {error:delError}=await admin.from('student_professors').delete().eq('student_id',studentId);
  if(delError)throw new Error(delError.message);
  if(clean.length){
    const {error:insError}=await admin.from('student_professors').insert(clean.map(professor_id=>({student_id:studentId,professor_id})));
    if(insError)throw new Error(insError.message);
  }
}

export async function GET(){const g=await gate(); if('error'in g)return g.error;const {data,error}=await g.admin.from('students').select(`id,cpf,whatsapp,birth_date,sex,weight,height,degrees,start_date,last_graduation_date,training_time_months,notes,emergency_contact,emergency_name,emergency_phone,emergency_relation,injuries,status,category_id,responsible_professor_id,belt_id,profiles!students_id_fkey(name,username,contact_email,phone,avatar_url,active),belts(name),categories(name),responsible:profiles!students_responsible_professor_id_fkey(name),student_professors(professor_id,profiles!student_professors_professor_id_fkey(name))`).order('start_date',{ascending:false});if(error)return NextResponse.json({error:error.message},{status:500});
const rows=(data||[]).map((row:any)=>({
  ...row,
  additional_professor_ids:(row.student_professors||[]).map((x:any)=>x.professor_id),
  additional_professors:(row.student_professors||[]).map((x:any)=>x.profiles?.name).filter(Boolean)
}));
return NextResponse.json(rows);}
export async function POST(req:Request){const g=await gate(); if('error'in g)return g.error;const parsed=schema.safeParse(await req.json());if(!parsed.success)return NextResponse.json({error:'Revise os dados do aluno.',details:parsed.error.flatten()},{status:400});const d=parsed.data;const username=normalizeLogin(d.username||'');if(!isValidLogin(username))return NextResponse.json({error:'Informe um login com 3 a 32 caracteres.'},{status:400});if(!d.password||d.password.length<6)return NextResponse.json({error:'A senha inicial deve ter pelo menos 6 caracteres.'},{status:400});const {data:exists}=await g.admin.from('profiles').select('id').ilike('username',username).maybeSingle();if(exists)return NextResponse.json({error:'Este login já está em uso.'},{status:409});const authEmail=syntheticAuthEmail(crypto.randomUUID());const {data:created,error}=await g.admin.auth.admin.createUser({email:authEmail,password:d.password,email_confirm:true,user_metadata:{name:d.name,username}});const id=created.user?.id||'';if(error||!created.user)return NextResponse.json({error:error?.message||'Falha ao criar acesso do aluno'},{status:400});const {error:profileError}=await g.admin.from('profiles').update({name:d.name,username,contact_email:d.contact_email||null,email:authEmail,phone:d.phone||null,avatar_url:d.avatar_url||null,role:'aluno',active:d.status==='ativo'}).eq('id',id);if(profileError){await g.admin.auth.admin.deleteUser(id);return NextResponse.json({error:profileError.message},{status:500});}let categoryId:string|null=null;try{categoryId=await resolveCategory(g.admin,d)}catch(e:any){await g.admin.auth.admin.deleteUser(id);return NextResponse.json({error:e.message||'Falha ao definir categoria.'},{status:500});}const {error:studentError}=await g.admin.from('students').insert({id,...studentPayload(d,categoryId)});if(studentError){await g.admin.auth.admin.deleteUser(id);return NextResponse.json({error:studentError.message},{status:500});}
try{await syncAdditionalProfessors(g.admin,id,d.additional_professor_ids,d.responsible_professor_id||null);}catch(e:any){await g.admin.from('students').delete().eq('id',id);await g.admin.auth.admin.deleteUser(id);return NextResponse.json({error:e.message||'Falha ao salvar professores adicionais.'},{status:500});}
return NextResponse.json({id,name:d.name,username},{status:201});}
export async function PATCH(req:Request){const g=await gate(); if('error'in g)return g.error;const parsed=schema.safeParse(await req.json());if(!parsed.success||!parsed.data.id)return NextResponse.json({error:'Revise os dados do aluno.'},{status:400});const d=parsed.data;const {error:profileError}=await g.admin.from('profiles').update({name:d.name,contact_email:d.contact_email||null,phone:d.phone||null,avatar_url:d.avatar_url||null,active:d.status==='ativo'}).eq('id',d.id).eq('role','aluno');if(profileError)return NextResponse.json({error:profileError.message},{status:500});let categoryId:string|null=null;try{categoryId=await resolveCategory(g.admin,d)}catch(e:any){return NextResponse.json({error:e.message||'Falha ao definir categoria.'},{status:500});}const {error:studentError}=await g.admin.from('students').update(studentPayload(d,categoryId)).eq('id',d.id);if(studentError)return NextResponse.json({error:studentError.message},{status:500});
try{
  if(!d.id){
    return NextResponse.json(
      {error:'ID do aluno não informado.'},
      {status:400}
    );
  }

  await syncAdditionalProfessors(
    g.admin,
    d.id,
    d.additional_professor_ids,
    d.responsible_professor_id||null
  );
}catch(e:any){
  return NextResponse.json(
    {error:e.message||'Falha ao salvar professores adicionais.'},
    {status:500}
  );
}
return NextResponse.json({ok:true});}
export async function DELETE(req:Request){const g=await gate(); if('error'in g)return g.error;if(g.role!=='admin')return NextResponse.json({error:'Apenas o Administrador Geral pode excluir alunos.'},{status:403});const id=new URL(req.url).searchParams.get('id');if(!id||!z.string().uuid().safeParse(id).success)return NextResponse.json({error:'Aluno inválido.'},{status:400});for(const table of ['graduations','student_achievements','iea_scores']){const {error}=await g.admin.from(table).delete().eq('student_id',id);if(error)return NextResponse.json({error:`Falha ao limpar ${table}: ${error.message}`},{status:500});}const {data:files}=await g.admin.storage.from('student-photos').list(id,{limit:100});if(files?.length)await g.admin.storage.from('student-photos').remove(files.map(f=>`${id}/${f.name}`));const {error}=await g.admin.auth.admin.deleteUser(id);if(error)return NextResponse.json({error:error.message},{status:500});return NextResponse.json({ok:true});}
