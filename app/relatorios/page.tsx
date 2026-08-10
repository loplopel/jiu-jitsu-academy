'use client';
import { useMemo, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { exportCSV, exportPDF, exportExcel } from '@/lib/export';
import { FileDown, Table2, FileSpreadsheet } from 'lucide-react';

type ReportConfig={table:string;select:string;dateKeys:string[]};
const configs:Record<string,ReportConfig>={
  Presenca:{table:'attendance',select:'checked_in_at,class_id,student_id,ip_address,device_info',dateKeys:['checked_in_at']},
  Graduacao:{table:'graduations',select:'graduation_date,degrees,iea_score,student_id,professor_id',dateKeys:['graduation_date']},
  Professor:{table:'classes',select:'title,starts_at,ends_at,capacity,status,professor_id',dateKeys:['starts_at']},
  Aluno:{table:'students',select:'id,status,start_date,degrees,training_time_months',dateKeys:['start_date']},
  Evolucao:{table:'iea_scores',select:'student_id,score,frequency,streak,training_time,events,competitions,graduation,attendance,calculated_at',dateKeys:['calculated_at']},
};
const labels:Record<string,string>={Presenca:'Presença',Graduacao:'Graduação',Professor:'Professor / aulas',Aluno:'Alunos',Evolucao:'Evolução / IEA'};

export default function Page(){
  const[type,setType]=useState('Presenca'); const[msg,setMsg]=useState('');
  const now=new Date(); const first=useMemo(()=>new Date(now.getFullYear(),now.getMonth(),1).toISOString().slice(0,10),[]);
  const today=useMemo(()=>new Date().toISOString().slice(0,10),[]);
  const[from,setFrom]=useState(first); const[to,setTo]=useState(today);
  async function load(){
    setMsg(''); const c=configs[type]; const {getSupabaseBrowserClient}=await import('@/lib/supabase-browser'); const sb=getSupabaseBrowserClient();
    if(!sb){setMsg('Supabase não configurado.');return [] as Record<string,unknown>[]}
    const {data,error}=await sb.from(c.table).select(c.select); if(error){setMsg(error.message);return [] as Record<string,unknown>[]}
    let rows=(data||[]) as unknown as Record<string,unknown>[];
    const key=c.dateKeys.find(k=>rows.some(r=>r[k]));
    if(key&&(from||to)) rows=rows.filter(r=>{const raw=r[key];if(!raw)return true;const day=String(raw).slice(0,10);return (!from||day>=from)&&(!to||day<=to)});
    return rows;
  }
  async function go(kind:'pdf'|'csv'|'xlsx'){
    const rows=await load(); if(!rows.length){setMsg('Nenhum dado encontrado para os filtros selecionados.');return}
    const name=`relatorio-${type.toLowerCase()}-${from || 'inicio'}-${to || 'hoje'}`;
    if(kind==='pdf')exportPDF(rows,name); if(kind==='csv')exportCSV(rows,name); if(kind==='xlsx')exportExcel(rows,name); setMsg(`Relatório gerado: ${rows.length} registro(s).`);
  }
  return <AppShell><section className="hero"><h1>Relatórios</h1><div className="muted">Exporte presença, graduações, aulas, alunos e evolução em PDF, Excel ou CSV.</div></section><div className="card" style={{padding:20}}><div className="toolbar" style={{alignItems:'end'}}><label className="label">Relatório<select className="input" value={type} onChange={e=>setType(e.target.value)}>{Object.keys(configs).map(x=><option key={x} value={x}>{labels[x]}</option>)}</select></label><label className="label">De<input className="input" type="date" value={from} onChange={e=>setFrom(e.target.value)}/></label><label className="label">Até<input className="input" type="date" value={to} onChange={e=>setTo(e.target.value)}/></label></div><div className="toolbar" style={{marginTop:16}}><button className="btn btn-primary" onClick={()=>go('pdf')}><FileDown size={15}/> PDF</button><button className="btn btn-secondary" onClick={()=>go('xlsx')}><FileSpreadsheet size={15}/> Excel</button><button className="btn btn-secondary" onClick={()=>go('csv')}><Table2 size={15}/> CSV</button></div>{msg&&<div className="notice success" style={{marginTop:14}}>{msg}</div>}</div></AppShell>
}
