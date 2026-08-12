'use client';
import {useEffect,useMemo,useState} from 'react';
import {AppShell} from '@/components/app-shell';
import {exportCSV,exportPDF,exportExcel} from '@/lib/export';
import {FileDown,Table2,FileSpreadsheet,RefreshCw} from 'lucide-react';

type ReportConfig={table:string;select:string;dateKeys:string[]};
type PresenceRow={Nome:string;Jan:number;Fev:number;Mar:number;Abr:number;Mai:number;Jun:number;Jul:number;Ago:number;Set:number;Out:number;Nov:number;Dez:number;Total:number};
const months=['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'] as const;
const configs:Record<string,ReportConfig>={
  Graduacao:{table:'graduations',select:'graduation_date,degrees,iea_score,student_id,professor_id',dateKeys:['graduation_date']},
  Professor:{table:'classes',select:'title,starts_at,ends_at,capacity,status,professor_id',dateKeys:['starts_at']},
  Aluno:{table:'students',select:'id,status,start_date,degrees,training_time_months',dateKeys:['start_date']},
  Evolucao:{table:'iea_scores',select:'student_id,score,frequency,streak,training_time,graduation,attendance,calculated_at',dateKeys:['calculated_at']},
};
const labels:Record<string,string>={Presenca:'Presença mensal',Graduacao:'Graduação',Professor:'Professor / aulas',Aluno:'Alunos',Evolucao:'Evolução / IEA'};

export default function Page(){
  const[type,setType]=useState('Presenca'); const[msg,setMsg]=useState(''); const[preview,setPreview]=useState<Record<string,unknown>[]>([]); const[loading,setLoading]=useState(false);
  const now=new Date(); const first=useMemo(()=>new Date(now.getFullYear(),now.getMonth(),1).toISOString().slice(0,10),[]); const today=useMemo(()=>new Date().toISOString().slice(0,10),[]);
  const[from,setFrom]=useState(first); const[to,setTo]=useState(today); const[year,setYear]=useState(now.getFullYear());

  async function loadPresence():Promise<PresenceRow[]>{
    const {getSupabaseBrowserClient}=await import('@/lib/supabase-browser'); const sb=getSupabaseBrowserClient();
    if(!sb){setMsg('Supabase não configurado.');return []}
    const start=`${year}-01-01T00:00:00.000Z`; const end=`${year+1}-01-01T00:00:00.000Z`;
    const [{data:students,error:studentsError},{data:attendance,error:attendanceError}]=await Promise.all([
      sb.from('students').select('id,status,profiles!students_id_fkey(name)').order('start_date'),
      sb.from('attendance').select('student_id,checked_in_at').gte('checked_in_at',start).lt('checked_in_at',end),
    ]);
    if(studentsError||attendanceError){setMsg(studentsError?.message||attendanceError?.message||'Falha ao carregar presenças.');return []}
    const counts=new Map<string,number[]>();
    for(const a of attendance||[]){const arr=counts.get(a.student_id)||Array(12).fill(0);const month=Number(String(a.checked_in_at).slice(5,7))-1;if(month>=0&&month<12)arr[month]++;counts.set(a.student_id,arr)}
    return (students||[]).map((s:any)=>{
      const arr=counts.get(s.id)||Array(12).fill(0); const p=Array.isArray(s.profiles)?s.profiles[0]:s.profiles;
      const row:any={Nome:p?.name||'Aluno'}; months.forEach((m,i)=>row[m]=arr[i]); row.Total=arr.reduce((a:number,b:number)=>a+b,0); return row as PresenceRow;
    }).sort((a:PresenceRow,b:PresenceRow)=>a.Nome.localeCompare(b.Nome,'pt-BR'));
  }

  async function loadGeneric(){
    const c=configs[type]; const {getSupabaseBrowserClient}=await import('@/lib/supabase-browser'); const sb=getSupabaseBrowserClient();
    if(!sb){setMsg('Supabase não configurado.');return [] as Record<string,unknown>[]}
    const {data,error}=await sb.from(c.table).select(c.select); if(error){setMsg(error.message);return [] as Record<string,unknown>[]}
    let rows=(data||[]) as unknown as Record<string,unknown>[]; const key=c.dateKeys.find(k=>rows.some(r=>r[k]));
    if(key&&(from||to)) rows=rows.filter(r=>{const raw=r[key];if(!raw)return true;const day=String(raw).slice(0,10);return (!from||day>=from)&&(!to||day<=to)});
    return rows;
  }

  async function load(){setLoading(true);setMsg('');const rows=type==='Presenca'?await loadPresence():await loadGeneric();setPreview(rows);setLoading(false);return rows}
  useEffect(()=>{void load()},[type,year]);

  async function go(kind:'pdf'|'csv'|'xlsx'){
    const rows=preview.length?preview:await load(); if(!rows.length){setMsg('Nenhum dado encontrado para os filtros selecionados.');return}
    const name=type==='Presenca'?`presenca-${year}`:`relatorio-${type.toLowerCase()}-${from||'inicio'}-${to||'hoje'}`;
    if(kind==='pdf')exportPDF(rows,name); if(kind==='csv')exportCSV(rows,name); if(kind==='xlsx')exportExcel(rows,name); setMsg(`Relatório gerado: ${rows.length} aluno(s)/registro(s).`);
  }

  return <AppShell>
    <section className="hero"><div className="split"><div><h1>Relatórios</h1><div className="muted">Presença por aluno e mês, graduações, aulas e evolução em PDF, Excel ou CSV.</div></div><button className="btn btn-secondary" onClick={()=>load()}><RefreshCw size={15}/> Atualizar</button></div></section>
    <div className="card" style={{padding:20}}>
      <div className="toolbar" style={{alignItems:'end'}}>
        <label className="label">Relatório<select className="input" value={type} onChange={e=>{setType(e.target.value);setPreview([])}}><option value="Presenca">{labels.Presenca}</option>{Object.keys(configs).map(x=><option key={x} value={x}>{labels[x]}</option>)}</select></label>
        {type==='Presenca'?<label className="label">Ano<input className="input" type="number" min="2020" max="2100" value={year} onChange={e=>{setYear(Number(e.target.value));setPreview([])}}/></label>:<><label className="label">De<input className="input" type="date" value={from} onChange={e=>{setFrom(e.target.value);setPreview([])}}/></label><label className="label">Até<input className="input" type="date" value={to} onChange={e=>{setTo(e.target.value);setPreview([])}}/></label></>}
      </div>
      <div className="toolbar" style={{marginTop:16}}><button className="btn btn-primary" onClick={()=>go('pdf')}><FileDown size={15}/> PDF</button><button className="btn btn-secondary" onClick={()=>go('xlsx')}><FileSpreadsheet size={15}/> Excel</button><button className="btn btn-secondary" onClick={()=>go('csv')}><Table2 size={15}/> CSV</button></div>
      {msg&&<div className="notice success" style={{marginTop:14}}>{msg}</div>}
    </div>

    {type==='Presenca'&&<div className="card" style={{padding:20,marginTop:18}}><div className="section-title"><div><h2>Presença • {year}</h2><p className="muted">Quantidade de aulas com check-in confirmado em cada mês.</p></div></div>{loading?<div className="empty-state">Carregando presença...</div>:!preview.length?<div className="empty-state">Nenhum aluno encontrado.</div>:<div className="table-wrap"><table className="table attendance-matrix"><thead><tr><th>Nome</th>{months.map(m=><th key={m}>{m}</th>)}<th>Total</th></tr></thead><tbody>{(preview as unknown as PresenceRow[]).map((r,i)=><tr key={`${r.Nome}-${i}`}><td><strong>{r.Nome}</strong></td>{months.map(m=><td key={m}>{r[m]}</td>)}<td><strong>{r.Total}</strong></td></tr>)}</tbody></table></div>}</div>}
  </AppShell>
}
