import {NextResponse} from 'next/server';import {getSupabaseServerClient,getSupabaseAdmin} from '@/lib/supabase-server';import {hashQrToken,isExpired} from '@/lib/qr';import {z} from 'zod';
const schema=z.object({token:z.string().min(10),lat:z.number().optional(),lng:z.number().optional()});
function haversine(a:number,b:number,c:number,d:number){const R=6371e3,p1=a*Math.PI/180,p2=c*Math.PI/180,dp=(c-a)*Math.PI/180,dl=(d-b)*Math.PI/180;const x=Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;return R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x))}
export async function POST(req:Request){
  const sb=await getSupabaseServerClient();const admin=getSupabaseAdmin();if(!sb||!admin)return NextResponse.json({error:'Supabase não configurado'},{status:503});
  const {data:{user}}=await sb.auth.getUser();if(!user)return NextResponse.json({error:'Faça login como aluno antes do check-in.'},{status:401});
  const {data:student}=await admin.from('students').select('id,status').eq('id',user.id).maybeSingle();if(!student||student.status!=='ativo')return NextResponse.json({error:'Seu cadastro de aluno não está ativo.'},{status:403});
  const parsed=schema.safeParse(await req.json());if(!parsed.success)return NextResponse.json({error:'Dados inválidos'},{status:400});const {token,lat,lng}=parsed.data;
  const {data:qr}=await admin.from('qr_tokens').select('*').eq('token_hash',hashQrToken(token)).maybeSingle();if(!qr||qr.used_at||isExpired(qr.expires_at))return NextResponse.json({error:'QR Code expirado ou já utilizado.'},{status:409});
  const {data:cls}=await admin.from('classes').select('id,status,starts_at,ends_at,capacity,professor_id').eq('id',qr.class_id).single();
  if(!cls||cls.status!=='open')return NextResponse.json({error:'A aula não está aberta para check-in.'},{status:409});
  const {data:primary}=await admin.from('students').select('responsible_professor_id').eq('id',user.id).single();
  const {data:secondary}=await admin.from('student_professors').select('professor_id').eq('student_id',user.id).eq('professor_id',cls.professor_id).maybeSingle();
  if(primary?.responsible_professor_id!==cls.professor_id&&!secondary){
    return NextResponse.json({error:'Esta aula não está disponível para o seu vínculo de professor.'},{status:403});
  }
  const now=Date.now();if(now<new Date(cls.starts_at).getTime()||now>new Date(cls.ends_at).getTime())return NextResponse.json({error:'O check-in só é permitido durante o horário da aula.'},{status:409});
  const {data:existing}=await admin.from('attendance').select('id').eq('class_id',qr.class_id).eq('student_id',user.id).maybeSingle();if(existing)return NextResponse.json({error:'Presença já registrada nesta aula.'},{status:409});
  const {data:reservation}=await admin.from('reservations').select('id,status').eq('class_id',qr.class_id).eq('student_id',user.id).maybeSingle();
  if(!reservation||reservation.status!=='reserved'){
    const {count}=await admin.from('reservations').select('*',{count:'exact',head:true}).eq('class_id',qr.class_id).eq('status','reserved');
    if((count||0)>=cls.capacity)return NextResponse.json({error:'A aula está lotada e você não possui reserva.'},{status:409});
    await admin.from('reservations').upsert({class_id:qr.class_id,student_id:user.id,status:'reserved',cancelled_at:null},{onConflict:'class_id,student_id'});
  }
  const alat=Number(process.env.NEXT_PUBLIC_ACADEMY_LAT),alng=Number(process.env.NEXT_PUBLIC_ACADEMY_LNG),max=Number(process.env.CHECKIN_MAX_DISTANCE_METERS||250);
  if(lat!=null&&lng!=null&&Number.isFinite(alat)&&Number.isFinite(alng)&&process.env.NEXT_PUBLIC_ACADEMY_LAT&&haversine(lat,lng,alat,alng)>max)return NextResponse.json({error:'Você está fora da área permitida para check-in.'},{status:403});
  const ip=req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||req.headers.get('x-real-ip')||null;const device=req.headers.get('user-agent');
  const {error:attErr}=await admin.from('attendance').insert({class_id:qr.class_id,student_id:user.id,checked_in_at:new Date().toISOString(),ip_address:ip,device_info:device,latitude:lat??null,longitude:lng??null,qr_token_id:qr.id});
  if(attErr?.code==='23505')return NextResponse.json({error:'Presença já registrada nesta aula.'},{status:409});if(attErr)return NextResponse.json({error:'Falha ao registrar presença.'},{status:500});
  const {data:consumed}=await admin.from('qr_tokens').update({used_at:new Date().toISOString(),used_by:user.id}).eq('id',qr.id).is('used_at',null).select('id').maybeSingle();
  if(!consumed){await admin.from('attendance').delete().eq('class_id',qr.class_id).eq('student_id',user.id);return NextResponse.json({error:'Este QR acabou de ser utilizado. Escaneie o novo código.'},{status:409});}
  return NextResponse.json({message:'Presença confirmada com sucesso!'})
}
