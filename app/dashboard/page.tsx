'use client';
import Link from 'next/link';
import {useEffect,useState} from 'react';
import {AppShell} from '@/components/app-shell';
import {MonthlyChart,OccupancyChart,type ChartPoint} from '@/components/charts';
import {getSupabaseBrowserClient} from '@/lib/supabase-browser';
import {UserPlus,GraduationCap,CalendarPlus,Users,CalendarDays,AlertTriangle,Cake,Award} from 'lucide-react';
type Metrics={students:number;active:number;attendance:number;newStudents:number;classes:number;reservations:number;iea:number;risk:number};
type TodayClass={id:string;title:string;starts_at:string;capacity:number;professor?:{name?:string}|null;reservations?:{id:string}[]};
const zero:Metrics={students:0,active:0,attendance:0,newStudents:0,classes:0,reservations:0,iea:0,risk:0};
export default function Page(){
  const[m,setM]=useState(zero);const[monthly,setMonthly]=useState<ChartPoint[]>([]);const[occupancy,setOccupancy]=useState<ChartPoint[]>([]);const[today,setToday]=useState<TodayClass[]>([]);
  useEffect(()=>{void(async()=>{const sb=getSupabaseBrowserClient();if(!sb)return;const now=new Date();const monthStart=new Date(now.getFullYear(),now.getMonth(),1).toISOString();const six=new Date(now.getFullYear(),now.getMonth()-5,1);const startDay=new Date(now);startDay.setHours(0,0,0,0);const endDay=new Date(now);endDay.setHours(23,59,59,999);
    const [{data:students},{data:att},{data:classes},{data:res},{data:iea},{data:todayRows}]=await Promise.all([
      sb.from('students').select('id,status,start_date'),sb.from('attendance').select('checked_in_at').gte('checked_in_at',six.toISOString()),sb.from('classes').select('id,starts_at,capacity').gte('starts_at',six.toISOString()),sb.from('reservations').select('class_id,status').eq('status','reserved'),sb.from('iea_scores').select('student_id,score,calculated_at').order('calculated_at',{ascending:false}),sb.from('classes').select('id,title,starts_at,capacity,professor:profiles!classes_professor_id_fkey(name),reservations(id)').gte('starts_at',startDay.toISOString()).lte('starts_at',endDay.toISOString()).neq('status','cancelled').order('starts_at')
    ]);
    const ss=students||[],aa=att||[],cc=classes||[],rr=res||[];
    const latest=new Map<string,number>();for(const x of iea||[])if(!latest.has(x.student_id))latest.set(x.student_id,Number(x.score));const scores=[...latest.values()];
    const attendanceByMonth=new Map<string,number>();for(const a of aa){const key=String(a.checked_in_at).slice(0,7);attendanceByMonth.set(key,(attendanceByMonth.get(key)||0)+1)}
    const reservedByClass=new Map<string,number>();for(const r of rr){reservedByClass.set(r.class_id,(reservedByClass.get(r.class_id)||0)+1)}
    const labels:Array<ChartPoint>=[];for(let i=5;i>=0;i--){const d=new Date(now.getFullYear(),now.getMonth()-i,1);const key=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;labels.push({label:d.toLocaleDateString('pt-BR',{month:'short'}).replace('.',''),value:attendanceByMonth.get(key)||0})}
    const byHour=new Map<string,{capacity:number;reserved:number}>();for(const c of cc){const h=new Date(c.starts_at).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});const item=byHour.get(h)||{capacity:0,reserved:0};item.capacity+=Number(c.capacity||0);item.reserved+=reservedByClass.get(c.id)||0;byHour.set(h,item)}
    setMonthly(labels);setOccupancy([...byHour.entries()].map(([label,x])=>({label,value:x.capacity?Math.round(x.reserved/x.capacity*100):0})).sort((a,b)=>a.label.localeCompare(b.label)).slice(-8));setToday((todayRows||[]) as unknown as TodayClass[]);
    setM({students:ss.length,active:ss.filter(x=>x.status==='ativo').length,attendance:aa.filter(x=>new Date(x.checked_in_at)>=new Date(monthStart)).length,newStudents:ss.filter(x=>x.start_date&&new Date(x.start_date)>=new Date(monthStart)).length,classes:cc.length,reservations:rr.length,iea:scores.length?Math.round(scores.reduce((a,b)=>a+b,0)/scores.length):0,risk:scores.filter(x=>x<40).length})
  })()},[]);
  return <AppShell>
    <section className="welcome-hero"><div><span className="eyebrow">PAINEL ADMINISTRATIVO</span><h1>Bom trabalho. O que precisa de atenção hoje?</h1><p>As ações mais usadas ficam aqui. Menos cliques, mais controle da academia.</p></div><div className="quick-actions">
      <Link href="/alunos" className="quick-action"><UserPlus size={20}/><span>Novo aluno</span></Link>
      <Link href="/cadastros/professores" className="quick-action"><GraduationCap size={20}/><span>Novo professor</span></Link>
      <Link href="/aulas" className="quick-action"><CalendarPlus size={20}/><span>Criar aula</span></Link>
      <Link href="/graduacoes" className="quick-action"><Award size={20}/><span>Evolução / IEA</span></Link>
    </div></section>
    <div className="grid grid-4 compact-stats"><div className="card stat"><span className="muted">Alunos ativos</span><strong>{m.active}</strong><small>{m.newStudents} novo(s) neste mês</small></div><div className="card stat"><span className="muted">Presenças no mês</span><strong>{m.attendance}</strong><small>Check-ins confirmados</small></div><div className="card stat"><span className="muted">Aulas hoje</span><strong>{today.length}</strong><small>{m.reservations} reserva(s) abertas</small></div><div className="card stat attention"><span className="muted">Alunos em atenção</span><strong>{m.risk}</strong><small>IEA abaixo de 40</small></div></div>
    <div className="grid admin-today-grid" style={{marginTop:18}}><section className="card today-card"><div className="section-title"><div><h2>Hoje na academia</h2><p className="muted">Agenda rápida das aulas do dia.</p></div><Link href="/aulas" className="btn btn-secondary">Ver agenda</Link></div>{!today.length?<div className="empty-state">Nenhuma aula programada para hoje.</div>:<div className="today-list">{today.map(a=><div className="today-row" key={a.id}><div className="today-time">{new Date(a.starts_at).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</div><div className="today-main"><strong>{a.title}</strong><span>{a.professor?.name||'Professor não definido'}</span></div><div className="today-count"><Users size={15}/>{a.reservations?.length||0}/{a.capacity}</div></div>)}</div>}</section>
      <section className="card attention-card"><div className="section-title"><h2>Atenção rápida</h2></div><Link href="/graduacoes" className="attention-row"><AlertTriangle size={18}/><div><strong>{m.risk} aluno(s) com IEA em atenção</strong><span>Acompanhar evolução</span></div></Link><Link href="/alunos" className="attention-row"><Users size={18}/><div><strong>{m.risk} aluno(s) em risco</strong><span>IEA abaixo de 40</span></div></Link><Link href="/eventos" className="attention-row"><Cake size={18}/><div><strong>Eventos e aniversários</strong><span>Ver próximos compromissos</span></div></Link></section></div>
    <div className="grid grid-2" style={{marginTop:18}}><div className="card chart-card"><div className="section-title"><h2>Presenças mensais</h2><span className="pill">6 meses</span></div><MonthlyChart data={monthly}/></div><div className="card chart-card"><div className="section-title"><h2>Ocupação por horário</h2></div><OccupancyChart data={occupancy}/></div></div>
  </AppShell>
}
