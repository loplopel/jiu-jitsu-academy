import {NextResponse} from 'next/server';
import {z} from 'zod';
import {adminGate} from '@/lib/admin-gate';

const statusSchema=z.enum(['pending','paid','overdue','isento','cancelled']);
const singleSchema=z.object({
  student_id:z.string().uuid(),plan_id:z.string().uuid().optional().nullable(),reference_month:z.string().min(7),due_date:z.string(),
  amount:z.coerce.number().min(0),status:statusSchema.default('pending'),payment_method:z.string().optional().nullable(),notes:z.string().optional().nullable(),
  discount:z.coerce.number().min(0).optional().default(0),surcharge:z.coerce.number().min(0).optional().default(0)
});

function monthDate(value:string){return `${value.slice(0,7)}-01`}
function dueDate(reference:string,day:number){const [y,m]=reference.slice(0,7).split('-').map(Number);return `${y}-${String(m).padStart(2,'0')}-${String(Math.min(Math.max(day,1),28)).padStart(2,'0')}`}

export async function GET(){
  const g=await adminGate();if('error'in g)return g.error;
  await g.admin.from('monthly_fees').update({status:'overdue',updated_at:new Date().toISOString()}).eq('status','pending').lt('due_date',new Date().toISOString().slice(0,10));
  const [{data:fees,error},{data:students},{data:plans}]=await Promise.all([
    g.admin.from('monthly_fees').select('*,students!monthly_fees_student_id_fkey(billing_due_day,status,profiles!students_id_fkey(name,username,contact_email)),plans(name)').order('due_date',{ascending:false}),
    g.admin.from('students').select('id,status,billing_due_day,plan_id,profiles!students_id_fkey(name,username,contact_email),plans(name,amount,billing_cycle)').order('start_date',{ascending:false}),
    g.admin.from('plans').select('id,name,amount,billing_cycle').eq('active',true).order('name')
  ]);
  if(error)return NextResponse.json({error:error.message},{status:500});
  const rows=fees||[];const today=new Date().toISOString().slice(0,10);const currentMonth=today.slice(0,7);
  const metrics={
    received:rows.filter((x:any)=>x.status==='paid'&&String(x.paid_at||'').startsWith(currentMonth)).reduce((a:number,x:any)=>a+Number(x.paid_amount??(Number(x.amount)-Number(x.discount||0)+Number(x.surcharge||0))),0),
    pending:rows.filter((x:any)=>x.status==='pending').reduce((a:number,x:any)=>a+Math.max(0,Number(x.amount)-Number(x.discount||0)+Number(x.surcharge||0)),0),
    overdue:rows.filter((x:any)=>x.status==='overdue').reduce((a:number,x:any)=>a+Math.max(0,Number(x.amount)-Number(x.discount||0)+Number(x.surcharge||0)),0),
    overdueStudents:new Set(rows.filter((x:any)=>x.status==='overdue').map((x:any)=>x.student_id)).size,
    monthCount:rows.filter((x:any)=>String(x.reference_month).startsWith(currentMonth)).length
  };
  return NextResponse.json({fees:rows,students:students||[],plans:plans||[],metrics});
}

export async function POST(r:Request){
  const g=await adminGate();if('error'in g)return g.error;const body=await r.json();
  if(body?.mode==='bulk'){
    const reference=String(body.reference_month||'').slice(0,7);if(!/^\d{4}-\d{2}$/.test(reference))return NextResponse.json({error:'Competência inválida.'},{status:400});
    const {data:students,error}=await g.admin.from('students').select('id,plan_id,billing_due_day,status,plans(amount)').eq('status','ativo').not('plan_id','is',null);
    if(error)return NextResponse.json({error:error.message},{status:500});
    const payload=(students||[]).map((s:any)=>({student_id:s.id,plan_id:s.plan_id,reference_month:monthDate(reference),due_date:dueDate(reference,Number(s.billing_due_day||10)),amount:Number(s.plans?.amount||0),status:'pending',discount:0,surcharge:0,updated_at:new Date().toISOString()})).filter((x:any)=>x.amount>=0);
    if(!payload.length)return NextResponse.json({created:0,message:'Nenhum aluno ativo com plano cadastrado.'});
    const {data,error:insertError}=await g.admin.from('monthly_fees').upsert(payload,{onConflict:'student_id,reference_month',ignoreDuplicates:true}).select('id');
    if(insertError)return NextResponse.json({error:insertError.message},{status:400});
    return NextResponse.json({created:data?.length||0,total:payload.length});
  }
  const p=singleSchema.safeParse(body);if(!p.success)return NextResponse.json({error:'Dados inválidos.'},{status:400});
  const payload={...p.data,reference_month:monthDate(p.data.reference_month),updated_at:new Date().toISOString()};
  const{data,error}=await g.admin.from('monthly_fees').insert(payload).select().single();return error?NextResponse.json({error:error.message},{status:400}):NextResponse.json(data,{status:201});
}

export async function PATCH(r:Request){
  const g=await adminGate();if('error'in g)return g.error;const b=await r.json();const id=String(b.id||'');if(!id)return NextResponse.json({error:'Mensalidade inválida.'},{status:400});
  const action=String(b.action||'status');const changes:any={updated_at:new Date().toISOString()};
  if(action==='pay'){
    changes.status='paid';changes.paid_at=b.paid_at?new Date(b.paid_at).toISOString():new Date().toISOString();changes.payment_method=String(b.payment_method||'Outro');
    changes.discount=Math.max(0,Number(b.discount||0));changes.surcharge=Math.max(0,Number(b.surcharge||0));changes.paid_amount=Math.max(0,Number(b.paid_amount||0));changes.payment_reference=b.payment_reference?String(b.payment_reference):null;changes.notes=b.notes?String(b.notes):null;
  }else if(action==='reopen'){
    changes.status='pending';changes.paid_at=null;changes.payment_method=null;changes.paid_amount=null;changes.payment_reference=null;
  }else{
    const parsed=statusSchema.safeParse(b.status);if(!parsed.success)return NextResponse.json({error:'Status inválido.'},{status:400});changes.status=parsed.data;if(parsed.data!=='paid'){changes.paid_at=null;changes.paid_amount=null;}
  }
  const{data,error}=await g.admin.from('monthly_fees').update(changes).eq('id',id).select().single();return error?NextResponse.json({error:error.message},{status:400}):NextResponse.json(data);
}
