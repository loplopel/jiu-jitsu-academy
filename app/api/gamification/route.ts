import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin, getSupabaseServerClient } from '@/lib/supabase-server';

async function gate(){
  const sb=await getSupabaseServerClient(),admin=getSupabaseAdmin();
  if(!sb||!admin)return {error:NextResponse.json({error:'Supabase não configurado'},{status:503})};
  const {data:{user}}=await sb.auth.getUser();
  if(!user)return {error:NextResponse.json({error:'Não autenticado'},{status:401})};
  const {data:profile}=await admin.from('profiles').select('role,active').eq('id',user.id).single();
  if(!profile||profile.active===false)return {error:NextResponse.json({error:'Acesso inativo'},{status:403})};
  return {admin,user,role:profile.role as 'admin'|'professor'|'aluno'};
}
function monthKey(d=new Date()){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;}
function weeklyStreak(rows:{checked_in_at:string}[]){
  const weeks=new Set(rows.map(r=>{const d=new Date(r.checked_in_at);const x=new Date(d);x.setHours(0,0,0,0);const day=(x.getDay()+6)%7;x.setDate(x.getDate()-day);return x.toISOString().slice(0,10)}));
  let cur=new Date(),n=0;for(let i=0;i<104;i++){const x=new Date(cur);x.setHours(0,0,0,0);const day=(x.getDay()+6)%7;x.setDate(x.getDate()-day);const k=x.toISOString().slice(0,10);if(weeks.has(k))n++;else if(i>0)break;cur.setDate(cur.getDate()-7)}return n;
}
async function eligibleStudents(g:any){
  let q=g.admin.from('students').select('id,responsible_professor_id,belts(name),profiles!students_id_fkey(name,avatar_url)').eq('status','ativo');
  if(g.role==='aluno')q=q.eq('id',g.user.id);
  if(g.role==='professor')q=q.eq('responsible_professor_id',g.user.id);
  const {data,error}=await q;if(error)throw error;return data||[];
}
export async function GET(){
  const g=await gate();if('error'in g)return g.error;
  try{
    const students:any[]=await eligibleStudents(g);const ids=students.map(s=>s.id);
    if(!ids.length)return NextResponse.json({role:g.role,rankings:{geral:[],mensal:[],anual:[],evolucao:[]},achievements:[],catalog:[],monthAward:null});
    const now=new Date(),monthStart=new Date(now.getFullYear(),now.getMonth(),1),yearStart=new Date(now.getFullYear(),0,1);
    const [attRes,scoreRes,achRes,catalogRes,awardRes]=await Promise.all([
      g.admin.from('attendance').select('student_id,checked_in_at').in('student_id',ids),
      g.admin.from('iea_scores').select('student_id,score,calculated_at').in('student_id',ids).order('calculated_at',{ascending:false}),
      g.admin.from('student_achievements').select('student_id,earned_at,achievement:achievements(code,name,description,icon)').in('student_id',ids).order('earned_at',{ascending:false}),
      g.admin.from('achievements').select('id,code,name,description,icon,threshold').eq('active',true).order('threshold',{ascending:true,nullsFirst:false}),
      g.admin.from('gamification_awards').select('student_id,award_month,student:profiles!gamification_awards_student_id_fkey(name)').eq('award_month',monthKey(now)).eq('award_type','student_month').maybeSingle(),
    ]);
    const att:any[]=attRes.data||[],latest=new Map<string,number>();for(const s of scoreRes.data||[])if(!latest.has(s.student_id))latest.set(s.student_id,Number(s.score||0));
    const map=students.map(s=>{const mine=att.filter(a=>a.student_id===s.id);return {id:s.id,name:s.profiles?.name||'Aluno',avatar_url:s.profiles?.avatar_url||null,belt:s.belts?.name||'-',total:mine.length,month:mine.filter(a=>new Date(a.checked_in_at)>=monthStart).length,year:mine.filter(a=>new Date(a.checked_in_at)>=yearStart).length,streak:weeklyStreak(mine),iea:latest.get(s.id)||0,achievements:(achRes.data||[]).filter((a:any)=>a.student_id===s.id).length};});
    const rank=(key:'total'|'month'|'year'|'iea'|'streak')=>[...map].sort((a,b)=>Number(b[key])-Number(a[key])).map((x,i)=>({...x,rank:i+1}));
    return NextResponse.json({role:g.role,rankings:{geral:rank('total'),mensal:rank('month'),anual:rank('year'),evolucao:rank('iea'),sequencia:rank('streak')},achievements:achRes.data||[],catalog:catalogRes.data||[],monthAward:awardRes.data||null});
  }catch(e:any){return NextResponse.json({error:e.message||'Falha ao carregar gamificação.'},{status:500})}
}
const schema=z.discriminatedUnion('action',[z.object({action:z.literal('refresh')}),z.object({action:z.literal('student_month'),student_id:z.string().uuid()})]);
export async function POST(req:Request){
  const g=await gate();if('error'in g)return g.error;if(g.role==='aluno')return NextResponse.json({error:'Sem permissão'},{status:403});
  const p=schema.safeParse(await req.json());if(!p.success)return NextResponse.json({error:'Dados inválidos'},{status:400});
  if(p.data.action==='student_month'){
    if(g.role!=='admin')return NextResponse.json({error:'Somente o Administrador Geral define o aluno do mês.'},{status:403});
    const m=monthKey();const {error}=await g.admin.from('gamification_awards').upsert({award_month:m,award_type:'student_month',student_id:p.data.student_id,awarded_by:g.user.id},{onConflict:'award_month,award_type'});if(error)return NextResponse.json({error:error.message},{status:500});
    const {data:a}=await g.admin.from('achievements').select('id').eq('code','STUDENT_MONTH').single();if(a)await g.admin.from('student_achievements').upsert({student_id:p.data.student_id,achievement_id:a.id},{onConflict:'student_id,achievement_id'});
    return NextResponse.json({ok:true});
  }
  const students:any[]=await eligibleStudents(g);for(const s of students){
    const [{data:att},{data:grads}]=await Promise.all([g.admin.from('attendance').select('checked_in_at').eq('student_id',s.id).order('checked_in_at'),g.admin.from('graduations').select('to:belts!graduations_to_belt_id_fkey(name)').eq('student_id',s.id)]);const rows:any[]=att||[],count=rows.length,codes:string[]=[];
    if(count>=1)codes.push('FIRST_CLASS');if(count>=10)codes.push('CLASSES_10');if(count>=50)codes.push('CLASSES_50');if(count>=100)codes.push('CLASSES_100');if(count>=200)codes.push('CLASSES_200');
    if(rows.length>=2&&(new Date(rows[rows.length-1].checked_in_at).getTime()-new Date(rows[0].checked_in_at).getTime())>=365*86400000)codes.push('DAYS_365');if(weeklyStreak(rows)>=8)codes.push('MAX_STREAK');
    for(const x of grads||[]){const n=(x as any).to?.name;if(n==='Azul')codes.push('BELT_BLUE');if(n==='Roxa')codes.push('BELT_PURPLE');if(n==='Marrom')codes.push('BELT_BROWN');if(n==='Preta')codes.push('BELT_BLACK');}
    if(codes.length){const {data:ach}=await g.admin.from('achievements').select('id,code').in('code',[...new Set(codes)]);for(const a of ach||[])await g.admin.from('student_achievements').upsert({student_id:s.id,achievement_id:a.id},{onConflict:'student_id,achievement_id'});}
  }
  return NextResponse.json({ok:true});
}
