import {NextResponse} from 'next/server';
import {getSupabaseAdmin,getSupabaseServerClient} from '@/lib/supabase-server';
export async function GET(){
  const sb=await getSupabaseServerClient(),admin=getSupabaseAdmin();
  if(!sb||!admin)return NextResponse.json({error:'Supabase não configurado'},{status:503});
  const {data:{user}}=await sb.auth.getUser(); if(!user)return NextResponse.json({error:'Não autenticado'},{status:401});
  const {data:p}=await admin.from('profiles').select('role,active').eq('id',user.id).single();
  if(!p||p.active===false||!['admin','professor'].includes(p.role))return NextResponse.json({error:'Sem permissão'},{status:403});
  const [belts,categories,plans,professors]=await Promise.all([
    admin.from('belts').select('id,name,sort_order').order('sort_order'),
    admin.from('categories').select('id,name,active').eq('active',true).order('name'),
    admin.from('plans').select('id,name,amount,billing_cycle,active').eq('active',true).order('name'),
    admin.from('profiles').select('id,name,username,contact_email').eq('role','professor').eq('active',true).order('name')
  ]);
  const err=belts.error||categories.error||plans.error||professors.error;
  if(err)return NextResponse.json({error:err.message},{status:500});
  return NextResponse.json({belts:belts.data||[],categories:categories.data||[],plans:plans.data||[],professors:professors.data||[]});
}
