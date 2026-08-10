import {NextResponse} from 'next/server';
import {getSupabaseAdmin,getSupabaseServerClient} from '@/lib/supabase-server';
export async function GET(){
  const sb=await getSupabaseServerClient();const admin=getSupabaseAdmin();if(!sb||!admin)return NextResponse.json({error:'Supabase não configurado'},{status:503});
  const{data:{user}}=await sb.auth.getUser();if(!user)return NextResponse.json({error:'Não autenticado'},{status:401});
  const{data:profile}=await admin.from('profiles').select('role').eq('id',user.id).single();if(profile?.role!=='aluno')return NextResponse.json({role:profile?.role||'aluno',fees:[]});
  const{data:student}=await admin.from('students').select('billing_due_day,plans(name,amount,billing_cycle)').eq('id',user.id).maybeSingle();
  const{data,error}=await admin.from('monthly_fees').select('*,plans(name)').eq('student_id',user.id).order('reference_month',{ascending:false});
  if(error)return NextResponse.json({error:error.message},{status:500});return NextResponse.json({role:'aluno',student,fees:data||[]});
}
