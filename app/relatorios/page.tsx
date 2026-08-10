'use client';

import { useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { exportCSV, exportPDF, exportExcel } from '@/lib/export';
import { FileDown, Table2, FileSpreadsheet } from 'lucide-react';

type ReportConfig = { table: string; select: string };

const configs: Record<string, ReportConfig> = {
  Presenca: { table: 'attendance', select: 'checked_in_at,class_id,student_id,ip_address,device_info' },
  Graduacao: { table: 'graduations', select: 'graduation_date,degrees,iea_score,student_id,professor_id' },
  Professor: { table: 'classes', select: 'title,starts_at,ends_at,capacity,status,professor_id' },
  Aluno: { table: 'students', select: 'id,status,start_date,degrees,training_time_months' },
  Evolucao: { table: 'iea_scores', select: 'student_id,score,frequency,streak,training_time,events,competitions,graduation,attendance,calculated_at' },
};
const labels: Record<string,string> = {Presenca:'Presença',Graduacao:'Graduação',Professor:'Professor',Aluno:'Aluno',Evolucao:'Evolução'};

export default function Page(){
  const [type,setType]=useState('Presenca');
  const [msg,setMsg]=useState('');
  async function load(){
    setMsg('');
    const c=configs[type];
    const {getSupabaseBrowserClient}=await import('@/lib/supabase-browser');
    const sb=getSupabaseBrowserClient();
    if(!sb){setMsg('Supabase não configurado.');return [] as Record<string,unknown>[];}
    const {data,error}=await sb.from(c.table).select(c.select);
    if(error){setMsg(error.message);return [] as Record<string,unknown>[];}
    return (data||[]) as unknown as Record<string,unknown>[];
  }
  async function go(kind:'pdf'|'csv'|'xlsx'){
    const rows=await load();
    if(!rows.length){setMsg('Nenhum dado encontrado para este relatório.');return;}
    const name=`relatorio-${type.toLowerCase()}`;
    if(kind==='pdf')exportPDF(rows,name);
    if(kind==='csv')exportCSV(rows,name);
    if(kind==='xlsx')exportExcel(rows,name);
    setMsg('Relatório gerado com sucesso.');
  }
  return <AppShell><section className="hero"><h1>Relatórios</h1><div className="muted">Presença, graduação, professores, alunos e evolução esportiva.</div></section><div className="card" style={{padding:20}}><div className="toolbar"><select className="input" style={{maxWidth:260}} value={type} onChange={e=>setType(e.target.value)}>{Object.keys(configs).map(x=><option key={x} value={x}>{labels[x]}</option>)}</select><button className="btn btn-primary" onClick={()=>go('pdf')}><FileDown size={15}/> PDF</button><button className="btn btn-secondary" onClick={()=>go('xlsx')}><FileSpreadsheet size={15}/> Excel</button><button className="btn btn-secondary" onClick={()=>go('csv')}><Table2 size={15}/> CSV</button></div>{msg&&<div className="notice success" style={{marginTop:14}}>{msg}</div>}</div></AppShell>;
}
