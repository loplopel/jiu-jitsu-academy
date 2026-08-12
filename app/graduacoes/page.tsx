'use client';
import {useEffect,useMemo,useState} from 'react';
import {AppShell} from '@/components/app-shell';
import {Award,RefreshCw,TrendingUp,AlertTriangle,Clock3,CalendarCheck,Medal,ChevronDown,CheckCircle2} from 'lucide-react';

type Belt={id:string;name:string;sort_order:number;minimum_months:number};
type Grad={id:string;graduation_date:string;degrees:number;notes?:string;from?:{name?:string}|null;to?:{name?:string}|null;professor?:{name?:string}|null};
type Evo={score:number;status:string;attendance30:number;attendance60:number;attendance90:number;totalAttendance:number;streakWeeks:number;trainingMonths:number;monthsInBelt:number;eventCount:number;competitionCount:number;graduationCount:number;daysAbsent:number|null;risk:string;attendanceSinceGraduation:number;classesToNextDegree:number;degreeEligible:boolean;beltEligible:boolean;components:Record<string,number>};
type Student={id:string;degrees:number;profiles?:{name?:string;avatar_url?:string}|null;belts?:{id?:string;name?:string;minimum_months?:number;sort_order?:number}|null;evolution:Evo;graduations:Grad[]};

function formatTrainingTime(months:number){
  const years=Math.floor(months/12); const rest=months%12;
  if(years<=0)return `${rest} ${rest===1?'mês':'meses'}`;
  if(rest===0)return `${years} ${years===1?'ano':'anos'}`;
  return `${years} ${years===1?'ano':'anos'} e ${rest} ${rest===1?'mês':'meses'}`;
}

export default function Page(){
  const[data,setData]=useState<{role:string;students:Student[];belts:Belt[]}>({role:'aluno',students:[],belts:[]});
  const[loading,setLoading]=useState(true);const[msg,setMsg]=useState('');const[selected,setSelected]=useState<Student|null>(null);
  const[form,setForm]=useState({to_belt_id:'',degrees:0,graduation_date:new Date().toISOString().slice(0,10),notes:''});

  async function load(){setLoading(true);const r=await fetch('/api/evolution',{cache:'no-store'});const j=await r.json();if(r.ok)setData(j);else setMsg(j.error||'Falha ao carregar evolução.');setLoading(false)}
  useEffect(()=>{void load()},[]);
  const summary=useMemo(()=>{const s=data.students;return {avg:s.length?Math.round(s.reduce((a,x)=>a+x.evolution.score,0)/s.length):0,risk:s.filter(x=>['alto','atencao'].includes(x.evolution.risk)).length,excellent:s.filter(x=>x.evolution.score>=80).length,active30:s.filter(x=>x.evolution.attendance30>0).length}},[data.students]);

  async function recalc(id:string){setMsg('Atualizando IEA...');const r=await fetch('/api/evolution',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'recalculate',student_id:id})});const j=await r.json();setMsg(r.ok?'IEA atualizado com sucesso.':j.error||'Falha ao atualizar IEA.');if(r.ok)await load()}

  function openGraduation(s:Student){
    if(data.role!=='professor')return;
    const currentId=s.belts?.id||'';
    if(s.evolution.beltEligible){
      const currentOrder=Number(s.belts?.sort_order||0);
      const next=[...data.belts].sort((a,b)=>a.sort_order-b.sort_order).find(b=>b.sort_order>currentOrder);
      if(!next){setMsg('Este aluno já está na última faixa cadastrada.');return;}
      setForm({to_belt_id:next.id,degrees:0,graduation_date:new Date().toISOString().slice(0,10),notes:''});
    }else{
      setForm({to_belt_id:currentId,degrees:Math.min(4,(s.degrees||0)+1),graduation_date:new Date().toISOString().slice(0,10),notes:''});
    }
    setSelected(s);
  }

  async function graduate(e:React.FormEvent){e.preventDefault();if(!selected)return;setMsg('Registrando graduação...');const r=await fetch('/api/evolution',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'graduate',student_id:selected.id,...form})});const j=await r.json();setMsg(r.ok?'Graduação registrada com sucesso.':j.error||'Falha ao registrar graduação.');if(r.ok){setSelected(null);await load()}}

  return <AppShell>
    <section className="hero"><div className="split"><div><h1>Graduação e evolução</h1><div className="muted">Presença, sequência, tempo de treino, faixa, graus e IEA em um único lugar.</div></div><button className="btn btn-secondary" onClick={load}><RefreshCw size={15}/> Atualizar</button></div></section>
    {msg&&<div className={msg.includes('sucesso')?'notice success':'notice error'} style={{marginBottom:14}}>{msg}</div>}

    {data.role!=='aluno'&&<div className="grid grid-4 compact-stats">
      <div className="card stat"><span className="muted">IEA médio</span><strong>{summary.avg}</strong><small>Equipe acompanhada</small></div>
      <div className="card stat"><span className="muted">Treinaram em 30 dias</span><strong>{summary.active30}</strong><small>Alunos ativos no tatame</small></div>
      <div className="card stat"><span className="muted">Excelente evolução</span><strong>{summary.excellent}</strong><small>IEA 80 ou mais</small></div>
      <div className="card stat attention"><span className="muted">Precisam de atenção</span><strong>{summary.risk}</strong><small>Queda ou ausência recente</small></div>
    </div>}

    {loading?<div className="empty-state" style={{marginTop:18}}>Calculando evolução...</div>:!data.students.length?<div className="empty-state" style={{marginTop:18}}>Ainda não há histórico suficiente para exibir evolução.</div>:<div className="evolution-list">
      {data.students.map(s=><article className="card evolution-card" key={s.id}>
        <div className="evolution-head">
          <div className="student-cell">{s.profiles?.avatar_url?<img src={s.profiles.avatar_url} className="student-avatar" alt=""/>:<div className="student-avatar mini"><Award size={16}/></div>}<div><h2>{s.profiles?.name||'Aluno'}</h2><div className="muted">{s.belts?.name||'Sem faixa'} • {s.degrees||0} grau(s)</div></div></div>
          <div className={`iea-score ${s.evolution.score>=80?'good':s.evolution.score<40?'risk':''}`}><strong>{s.evolution.score}</strong><span>IEA</span></div>
        </div>

        <div className="evolution-grid">
          <div><CalendarCheck size={16}/><span>Treinos realizados</span><strong>{s.evolution.totalAttendance}</strong></div>
          <div><TrendingUp size={16}/><span>Sequência</span><strong>{s.evolution.streakWeeks} semana(s)</strong></div>
          <div><Clock3 size={16}/><span>Tempo total</span><strong>{formatTrainingTime(s.evolution.trainingMonths)}</strong></div>
          <div><Medal size={16}/><span>Faixa atual</span><strong>{s.belts?.name||'Sem faixa'}</strong></div>
        </div>

        {data.role==='professor'&&<div className={`graduation-rule ${s.evolution.beltEligible||s.evolution.degreeEligible?'ready':''}`}>
          {s.evolution.beltEligible?<><CheckCircle2 size={18}/><div><strong>Apto à troca de faixa</strong><span>O aluno já recebeu os 4 graus desta faixa.</span></div></>:
           s.evolution.degreeEligible?<><CheckCircle2 size={18}/><div><strong>{Math.min(4,(s.degrees||0)+1)}º grau disponível</strong><span>Completou 70 aulas desde a última graduação.</span></div></>:
           <><Award size={18}/><div><strong>Progresso para o próximo grau: {s.evolution.attendanceSinceGraduation}/70 aulas</strong><span>Faltam {s.evolution.classesToNextDegree} aula(s) para liberar o próximo grau.</span></div></>}
        </div>}

        <div className="progress-line"><div><span>Status</span><strong>{s.evolution.status}</strong></div><div className="progress-track"><span style={{width:`${s.evolution.score}%`}}/></div></div>
        <div className="evolution-actions">
          {s.evolution.risk!=='normal'&&<span className="risk-note"><AlertTriangle size={15}/>{s.evolution.daysAbsent===null?'Sem presença registrada':`${s.evolution.daysAbsent} dias sem treinar`}</span>}
          {data.role==='professor'&&<div className="toolbar">
            <button className="btn btn-secondary" onClick={()=>recalc(s.id)}>Salvar IEA</button>
            <button className="btn btn-primary" disabled={!s.evolution.degreeEligible&&!s.evolution.beltEligible} onClick={()=>openGraduation(s)}><Award size={15}/>{s.evolution.beltEligible?'Trocar faixa':s.evolution.degreeEligible?`Registrar ${Math.min(4,(s.degrees||0)+1)}º grau`:`Faltam ${s.evolution.classesToNextDegree} aulas`}</button>
          </div>}
        </div>

        {!!s.graduations?.length&&<details className="history-details"><summary><ChevronDown size={15}/> Histórico de graduações ({s.graduations.length})</summary><div className="history-list">{s.graduations.map(g=><div key={g.id}><strong>{g.to?.name||'-'} • {g.degrees||0} grau(s)</strong><span>{new Date(g.graduation_date+'T12:00:00').toLocaleDateString('pt-BR')} {g.professor?.name?`• ${g.professor.name}`:''}</span>{g.notes&&<small>{g.notes}</small>}</div>)}</div></details>}
      </article>)}
    </div>}

    {selected&&<div className="modal-backdrop"><form className="card modal-card" onSubmit={graduate}>
      <h2>{selected.evolution.beltEligible?'Registrar troca de faixa':'Registrar grau'}</h2>
      <p className="muted">{selected.profiles?.name} • {selected.evolution.beltEligible?'4 graus concluídos.':'70 aulas concluídas desde a última graduação.'}</p>
      <label className="label">Faixa</label><select className="input" value={form.to_belt_id} disabled>{data.belts.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select>
      <label className="label">Graus</label><input className="input" type="number" min="0" max="4" value={form.degrees} disabled/>
      <label className="label">Data</label><input className="input" type="date" value={form.graduation_date} onChange={e=>setForm({...form,graduation_date:e.target.value})} required/>
      <label className="label">Observações</label><textarea className="input" rows={3} value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/>
      <div className="toolbar"><button className="btn btn-primary">Confirmar graduação</button><button type="button" className="btn btn-secondary" onClick={()=>setSelected(null)}>Cancelar</button></div>
    </form></div>}
  </AppShell>
}
