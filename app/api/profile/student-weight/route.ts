import {NextResponse} from 'next/server';
import {z} from 'zod';
import {getSupabaseAdmin,getSupabaseServerClient} from '@/lib/supabase-server';
import {competitionCategory} from '@/lib/competition-category';

const schema=z.object({weight:z.coerce.number().positive().max(300)});

export async function PATCH(req:Request){
  const sb=await getSupabaseServerClient(); const admin=getSupabaseAdmin();
  if(!sb||!admin)return NextResponse.json({error:'Supabase não configurado.'},{status:503});
  const {data:{user}}=await sb.auth.getUser(); if(!user)return NextResponse.json({error:'Não autenticado.'},{status:401});
  const {data:profile}=await admin.from('profiles').select('role,active').eq('id',user.id).single();
  if(!profile||profile.role!=='aluno'||profile.active===false)return NextResponse.json({error:'Apenas o aluno pode atualizar o próprio peso.'},{status:403});
  const parsed=schema.safeParse(await req.json()); if(!parsed.success)return NextResponse.json({error:'Informe um peso válido.'},{status:400});
  const {data:student,error:studentError}=await admin.from('students').select('birth_date,sex').eq('id',user.id).single();
  if(studentError||!student)return NextResponse.json({error:'Cadastro do aluno não encontrado.'},{status:404});
  const category=competitionCategory(student.birth_date,student.sex,parsed.data.weight);
  let categoryId:string|null=null;
  if(category.label){
    const {data:existing}=await admin.from('categories').select('id').eq('name',category.label).maybeSingle();
    if(existing?.id)categoryId=existing.id;
    else{
      const {data:created,error}=await admin.from('categories').insert({name:category.label,active:true}).select('id').single();
      if(error)return NextResponse.json({error:error.message},{status:500});
      categoryId=created.id;
    }
  }
  const {error}=await admin.from('students').update({weight:parsed.data.weight,category_id:categoryId}).eq('id',user.id);
  if(error)return NextResponse.json({error:error.message},{status:500});
  return NextResponse.json({ok:true,weight:parsed.data.weight,category:category.label});
}
