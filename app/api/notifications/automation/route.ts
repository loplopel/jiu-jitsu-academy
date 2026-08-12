import {NextResponse} from 'next/server';
import {getSupabaseAdmin,getSupabaseServerClient} from '@/lib/supabase-server';

async function auth(){
  const sb=await getSupabaseServerClient(); const admin=getSupabaseAdmin();
  if(!sb||!admin) return {error:NextResponse.json({error:'Supabase não configurado'},{status:503})};
  const {data:{user}}=await sb.auth.getUser(); if(!user) return {error:NextResponse.json({error:'Não autenticado'},{status:401})};
  const {data:p}=await admin.from('profiles').select('role,active').eq('id',user.id).single();
  if(p?.role!=='admin'||!p.active) return {error:NextResponse.json({error:'Apenas Administrador Geral'},{status:403})};
  return {admin,user};
}

export async function POST(){
  const g=await auth(); if('error' in g) return g.error;
  const {data:settings}=await g.admin.from('notification_settings').select('*').eq('id',true).single();
  let created=0; const now=new Date();
  const insertRows:Record<string,unknown>[]=[];

  if(settings?.class_reminders!==false){
    const until=new Date(now.getTime()+(settings?.class_reminder_minutes||120)*60000).toISOString();
    const {data:reservations}=await g.admin.from('reservations')
      .select('id,student_id,class_id,classes!inner(id,title,starts_at,status)')
      .eq('status','reserved').eq('classes.status','open').gte('classes.starts_at',now.toISOString()).lte('classes.starts_at',until);
    for(const r of reservations||[]){
      const c=Array.isArray(r.classes)?r.classes[0]:r.classes as any; if(!c) continue;
      const time=new Date(c.starts_at).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
      insertRows.push({user_id:r.student_id,title:'Sua aula está chegando',message:`${c.title} começa às ${time}. Sua reserva está confirmada.`,kind:'class',link_url:'/aulas',sent_by:g.user.id,source_key:`class:${c.id}:${r.student_id}`,delivered_at:now.toISOString()});
    }
  }

  if(settings?.birthday_messages!==false){
    const mmdd=`${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    const {data:students}=await g.admin.from('students').select('id,birth_date,profiles!inner(name)').not('birth_date','is',null);
    for(const s of students||[]){
      if(String(s.birth_date).slice(5)!==mmdd) continue;
      insertRows.push({user_id:s.id,title:'Feliz aniversário!',message:'A equipe Conexão Paulista deseja um excelente aniversário e muitos treinos pela frente.',kind:'birthday',link_url:'/meu-painel',sent_by:g.user.id,source_key:`birthday:${now.getFullYear()}:${s.id}`,delivered_at:now.toISOString()});
    }
  }

  if(insertRows.length){
    const {data,error}=await g.admin.from('notifications').upsert(insertRows,{onConflict:'source_key',ignoreDuplicates:true}).select('id');
    if(error) return NextResponse.json({error:error.message},{status:500});
    created=data?.length||0;
  }
  return NextResponse.json({created,checked:insertRows.length});
}
