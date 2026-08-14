import {NextResponse} from 'next/server';
import {getSupabaseAdmin,getSupabaseServerClient} from '@/lib/supabase-server';
import {buildEvolution} from '@/lib/evolution';

function monthCounts(dates:string[],year:number){
  const counts=Array.from({length:12},()=>0);
  for(const value of dates){
    const date=new Date(value);
    if(date.getFullYear()===year)counts[date.getMonth()]++;
  }
  return counts;
}

export async function GET(){
  const sb=await getSupabaseServerClient();
  const admin=getSupabaseAdmin();
  if(!sb||!admin)return NextResponse.json({error:'Supabase não configurado.'},{status:503});
  const {data:{user}}=await sb.auth.getUser();
  if(!user)return NextResponse.json({error:'Não autenticado.'},{status:401});
  const {data:profile}=await admin.from('profiles').select('role,active,name,avatar_url').eq('id',user.id).single();
  if(!profile||profile.role!=='aluno'||profile.active===false)return NextResponse.json({error:'Painel disponível apenas para alunos ativos.'},{status:403});

  const {data:student,error:studentError}=await admin.from('students').select(`
    id,start_date,last_graduation_date,degrees,weight,status,responsible_professor_id,
    belts(id,name,minimum_months,sort_order),categories(name),
    responsible:profiles!students_responsible_professor_id_fkey(name)
  `).eq('id',user.id).single();
  if(studentError||!student)return NextResponse.json({error:'Cadastro esportivo do aluno não encontrado.'},{status:404});

  const now=new Date();
  const startYear=new Date(now.getFullYear(),0,1).toISOString();
  const [attendance,classes,graduations]=await Promise.all([
    admin.from('attendance').select('checked_in_at,class_id,classes(title,starts_at)').eq('student_id',user.id).order('checked_in_at',{ascending:false}),
    admin.from('classes').select(`id,title,starts_at,ends_at,capacity,status,professor_id,profiles!classes_professor_id_fkey(name),reservations(id,student_id,status)`).gte('ends_at',new Date(now.getTime()-86400000).toISOString()).order('starts_at',{ascending:true}).limit(30),
    admin.from('graduations').select('id,graduation_date,degrees,to:belts!graduations_to_belt_id_fkey(name),professor:profiles!graduations_professor_id_fkey(name)').eq('student_id',user.id).order('graduation_date',{ascending:false})
  ]);

  const attendanceRows=(attendance.data||[]) as any[];
  const attendanceDates=attendanceRows.map(row=>row.checked_in_at);
  const evolution=buildEvolution(student as any,attendanceRows.map(row=>({student_id:user.id,checked_in_at:row.checked_in_at})),[],(graduations.data||[]).map((g:any)=>({student_id:user.id,graduation_date:g.graduation_date})),now);

  const upcoming=(classes.data||[]).filter((row:any)=>row.status==='open'&&new Date(row.ends_at)>=now).map((row:any)=>{
    const reservations=(row.reservations||[]).filter((r:any)=>r.status==='reserved');
    const mine=(row.reservations||[]).find((r:any)=>r.student_id===user.id);
    return {id:row.id,title:row.title,starts_at:row.starts_at,ends_at:row.ends_at,capacity:row.capacity,reservations:reservations.length,my_reservation_status:mine?.status||null,professor_name:row.profiles?.name||'Professor'};
  }).slice(0,6);

  const currentYear=now.getFullYear();
  const monthStart=new Date(currentYear,now.getMonth(),1);
  const monthAttendance=attendanceDates.filter(v=>new Date(v)>=monthStart).length;
  const yearAttendance=attendanceDates.filter(v=>new Date(v)>=new Date(startYear)).length;

  const recentAttendance=attendanceRows.slice(0,12).map((row:any)=>({
    checked_in_at:row.checked_in_at,
    title:row.classes?.title||'Treino',
    class_starts_at:row.classes?.starts_at||null
  }));

  return NextResponse.json({
    profile:{name:profile.name||'Aluno',avatar_url:profile.avatar_url||null},
    student:{
      start_date:(student as any).start_date||null,
      degrees:Number((student as any).degrees||0),
      weight:(student as any).weight??null,
      belt:(student as any).belts?.name||'-',
      category:(student as any).categories?.name||'-',
      professor:(student as any).responsible?.name||'-'
    },
    evolution,
    attendance:{total:attendanceDates.length,month:monthAttendance,year:yearAttendance,months:monthCounts(attendanceDates,currentYear),recent:recentAttendance,yearLabel:currentYear},
    upcoming,
    graduations:graduations.data||[]
  });
}
