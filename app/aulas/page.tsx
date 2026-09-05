'use client';
import {useEffect,useMemo,useState} from 'react';
import {AppShell} from '@/components/app-shell';
import {CalendarDays,Users,Clock,Plus,QrCode,UserCheck,Edit3,XCircle,Lock,RotateCcw,CheckCircle2,Search,UserPlus} from 'lucide-react';

type Role='admin'|'professor'|'aluno';
type C={id:string;title:string;starts_at:string;ends_at:string;capacity:number;status:'open'|'closed'|'cancelled';professor_id:string;professor_name:string;notes?:string|null;reservations:number;my_reservation_status?:string|null};
type Professor={id:string;name:string;username?:string;contact_email?:string};
type Participant={
  id:string;
  student_id:string;
  name:string;
  login?:string;
  contact_email?:string;
  phone:string;
  avatar_url?:string|null;
  belt:string;
  degrees:number;
  iea:number;
  present:boolean;
  checked_in_at?:string|null;
  manual?:boolean;
};
type AvailableStudent={id:string;name:string;login?:string;avatar_url?:string|null;belt:string};

const statusLabel:Record<C['status'],string>={open:'Aberta',closed:'Fechada',cancelled:'Cancelada'};
function localInput(iso:string){const d=new Date(iso);d.setMinutes(d.getMinutes()-d.getTimezoneOffset());return d.toISOString().slice(0,16)}

export default function Page(){
  const[rows,setRows]=useState<C[]>([]),[role,setRole]=useState<Role>('aluno'),[userId,setUserId]=useState('');
  const[professors,setProfessors]=useState<Professor[]>([]),[open,setOpen]=useState(false),[msg,setMsg]=useState(''),[busy,setBusy]=useState(false);
  const[history,setHistory]=useState(false),[studentView,setStudentView]=useState<'today'|'upcoming'|'reserved'|'history'>('upcoming'),[editing,setEditing]=useState<C|null>(null),[participantsFor,setParticipantsFor]=useState<C|null>(null),[participants,setParticipants]=useState<Participant[]>([]);
  const[participantQ,setParticipantQ]=useState(''),[available,setAvailable]=useState<AvailableStudent[]>([]),[addStudentId,setAddStudentId]=useState(''),[showAddStudent,setShowAddStudent]=useState(false);
  const[form,setForm]=useState({title:'Jiu-Jitsu Adulto',starts_at:'',ends_at:'',capacity:'30',professor_id:'',notes:''});

  async function load(){
    const r=await fetch('/api/classes',{cache:'no-store'}); const j=await r.json();
    if(!r.ok){setMsg(j.error||'Não foi possível carregar as aulas.');return}
    setRows(j.classes||[]);setRole(j.role||'aluno');setUserId(j.user_id||'');
    if(['admin','professor'].includes(j.role)){
      const o=await fetch('/api/students/options',{cache:'no-store'});if(o.ok){const oj=await o.json();setProfessors(oj.professors||[])}
    }
  }
  useEffect(()=>{void load()},[]);
  const staff=role==='admin'||role==='professor';
  const now=Date.now();
  const visible=useMemo(()=>{if(role!=='aluno')return rows.filter(a=>history?new Date(a.ends_at).getTime()<now||a.status!=='open':new Date(a.ends_at).getTime()>=now&&a.status!=='cancelled');const today=new Date();const sameDay=(iso:string)=>{const d=new Date(iso);return d.getFullYear()===today.getFullYear()&&d.getMonth()===today.getMonth()&&d.getDate()===today.getDate()};if(studentView==='today')return rows.filter(a=>sameDay(a.starts_at)&&a.status!=='cancelled');if(studentView==='reserved')return rows.filter(a=>a.my_reservation_status==='reserved'&&new Date(a.ends_at).getTime()>=now&&a.status!=='cancelled');if(studentView==='history')return rows.filter(a=>new Date(a.ends_at).getTime()<now||a.status==='closed');return rows.filter(a=>new Date(a.ends_at).getTime()>=now&&a.status!=='cancelled');},[rows,history,now,role,studentView]);

  function resetForm(){setForm({title:'Jiu-Jitsu Adulto',starts_at:'',ends_at:'',capacity:'30',professor_id:'',notes:''});setEditing(null)}
  async function save(e:React.FormEvent){
    e.preventDefault();setBusy(true);setMsg('Salvando aula...');
    const body={title:form.title,starts_at:new Date(form.starts_at).toISOString(),ends_at:new Date(form.ends_at).toISOString(),capacity:Number(form.capacity),professor_id:form.professor_id||undefined,notes:form.notes||null};
    const r=await fetch(editing?`/api/classes/${editing.id}`:'/api/classes',{method:editing?'PATCH':'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});const j=await r.json();setBusy(false);
    if(!r.ok){setMsg(j.error||'Falha ao salvar aula.');return}
    setMsg(editing?'Aula atualizada.':'Aula aberta com sucesso.');setOpen(false);resetForm();await load();
  }
  function startEdit(a:C){setEditing(a);setForm({title:a.title,starts_at:localInput(a.starts_at),ends_at:localInput(a.ends_at),capacity:String(a.capacity),professor_id:a.professor_id,notes:a.notes||''});setOpen(true);window.scrollTo({top:0,behavior:'smooth'})}
  async function setStatus(a:C,status:C['status']){if(!confirm(status==='cancelled'?'Cancelar esta aula?':'Alterar o status desta aula?'))return;setBusy(true);const r=await fetch(`/api/classes/${a.id}`,{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({status})});const j=await r.json();setBusy(false);setMsg(r.ok?(status==='closed'?'Aula fechada.':status==='open'?'Aula reaberta.':'Aula cancelada.'):(j.error||'Falha ao alterar aula.'));if(r.ok)await load()}
  async function reserve(a:C,cancel=false){setBusy(true);const r=await fetch('/api/reservations',{method:cancel?'DELETE':'POST',headers:{'content-type':'application/json'},body:JSON.stringify({class_id:a.id})});const j=await r.json();setBusy(false);setMsg(j.message||j.error||'Operação concluída.');if(r.ok)await load()}
  async function showParticipants(a:C){setParticipantsFor(a);setParticipants([]);setParticipantQ('');setShowAddStudent(false);setAddStudentId('');const r=await fetch(`/api/classes/${a.id}/participants`,{cache:'no-store'});const j=await r.json();if(r.ok)setParticipants(j);else setMsg(j.error||'Não foi possível carregar os inscritos.')}
  async function loadAvailable(){if(!participantsFor)return;const r=await fetch(`/api/classes/${participantsFor.id}/participants?mode=available`,{cache:'no-store'});const j=await r.json();if(r.ok)setAvailable(j);else setMsg(j.error||'Não foi possível carregar os alunos disponíveis.')}
  async function addStudentToClass(){if(!participantsFor||!addStudentId)return;setBusy(true);const r=await fetch(`/api/classes/${participantsFor.id}/participants`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({student_id:addStudentId,action:'add'})});const j=await r.json().catch(()=>({}));setBusy(false);setMsg(j.message||j.error||'Operação concluída.');if(r.ok){setAddStudentId('');setShowAddStudent(false);await showParticipants(participantsFor);}}
  async function manualAttendance(p:Participant,action:'confirm'|'remove'){if(!participantsFor)return;if(action==='remove'&&!confirm(`Desfazer a presença manual de ${p.name}?`))return;setBusy(true);const r=await fetch(`/api/classes/${participantsFor.id}/participants`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({student_id:p.student_id,action})});const j=await r.json().catch(()=>({}));setBusy(false);setMsg(j.message||j.error||'Operação concluída.');if(r.ok)await showParticipants(participantsFor);}
  function canManage(a:C){return role==='admin'||(role==='professor'&&a.professor_id===userId)}

  return <AppShell>
    <section className="hero"><div className="split"><div><h1>Aulas e reservas</h1><div className="muted">Professor abre a aula, aluno reserva e a presença pode ser confirmada por QR Code ou manualmente pelo professor.</div></div>{staff&&<button className="btn btn-primary" onClick={()=>{resetForm();setOpen(v=>!v)}}><Plus size={16}/> Nova aula</button>}</div></section>

    {open&&staff&&<form className="card admin-form" onSubmit={save}>
      <div className="section-title"><h2>{editing?'Editar aula':'Abrir nova aula'}</h2><button type="button" className="btn btn-secondary" onClick={()=>{setOpen(false);resetForm()}}>Cancelar</button></div>
      <div className="grid grid-3">
        <label><span className="label">Nome da aula</span><input className="input" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} required/></label>
        <label><span className="label">Início</span><input className="input" type="datetime-local" value={form.starts_at} onChange={e=>setForm({...form,starts_at:e.target.value})} required/></label>
        <label><span className="label">Término</span><input className="input" type="datetime-local" value={form.ends_at} onChange={e=>setForm({...form,ends_at:e.target.value})} required/></label>
        <label><span className="label">Limite de alunos</span><input className="input" type="number" min="1" max="300" value={form.capacity} onChange={e=>setForm({...form,capacity:e.target.value})}/></label>
        {role==='admin'&&<label><span className="label">Professor responsável</span><select className="input" value={form.professor_id} onChange={e=>setForm({...form,professor_id:e.target.value})}><option value="">Eu / Administrador</option>{professors.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>}
        <label className={role==='admin'?'':'grid-span-2'}><span className="label">Observações</span><input className="input" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="Opcional"/></label>
      </div><button className="btn btn-primary" style={{marginTop:14}} disabled={busy}>{busy?'Salvando...':editing?'Salvar alterações':'Abrir aula'}</button>
    </form>}

    {msg&&<div className={`notice ${msg.toLowerCase().includes('falha')||msg.toLowerCase().includes('não')||msg.toLowerCase().includes('invál')?'error':'success'}`} style={{marginBottom:14}}>{msg}</div>}

    {role==='aluno'?<div className="toolbar student-class-tabs" style={{marginBottom:16}}>
      <button className={`btn ${studentView==='today'?'btn-primary':'btn-secondary'}`} onClick={()=>setStudentView('today')}>Hoje</button>
      <button className={`btn ${studentView==='upcoming'?'btn-primary':'btn-secondary'}`} onClick={()=>setStudentView('upcoming')}>Próximas</button>
      <button className={`btn ${studentView==='reserved'?'btn-primary':'btn-secondary'}`} onClick={()=>setStudentView('reserved')}>Reservadas</button>
      <button className={`btn ${studentView==='history'?'btn-primary':'btn-secondary'}`} onClick={()=>setStudentView('history')}>Realizadas</button>
      <button className="btn btn-secondary" onClick={()=>void load()}><RotateCcw size={15}/> Atualizar</button>
    </div>:<div className="toolbar" style={{marginBottom:16}}><button className={`btn ${!history?'btn-primary':'btn-secondary'}`} onClick={()=>setHistory(false)}>Próximas aulas</button><button className={`btn ${history?'btn-primary':'btn-secondary'}`} onClick={()=>setHistory(true)}>Histórico</button><button className="btn btn-secondary" onClick={()=>void load()}><RotateCcw size={15}/> Atualizar</button></div>}

    {!visible.length?<div className="empty-state">{role==='aluno'?(studentView==='reserved'?'Você não tem aulas reservadas neste momento.':studentView==='history'?'Nenhum treino realizado no histórico.':studentView==='today'?'Nenhuma aula para hoje.':'Nenhuma próxima aula disponível.'):(history?'Nenhuma aula no histórico.':'Nenhuma aula disponível.')}</div>:<div className="grid grid-3">{visible.map(a=>{
      const pct=Math.min(100,Math.round((a.reservations||0)/Math.max(a.capacity,1)*100)),full=(a.reservations||0)>=a.capacity,reserved=a.my_reservation_status==='reserved';
      const started=Date.now()>=new Date(a.starts_at).getTime(),ended=Date.now()>new Date(a.ends_at).getTime();
      return <article className="card class-card" key={a.id}>
        <div className="split"><span className="pill"><CalendarDays size={13}/>{new Date(a.starts_at).toLocaleDateString('pt-BR')}</span><span className={`status-badge class-${a.status}`}>{statusLabel[a.status]}</span></div>
        <h2>{a.title}</h2><div className="muted class-meta"><span><Clock size={14}/> {new Date(a.starts_at).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}–{new Date(a.ends_at).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</span><span><UserCheck size={14}/> {a.professor_name}</span></div>
        {a.notes&&<p className="muted">{a.notes}</p>}
        <div className="split"><span><Users size={14} style={{verticalAlign:'middle'}}/> {a.reservations||0}/{a.capacity}</span><strong>{pct}%</strong></div><div className="progress"><span style={{width:`${pct}%`}}/></div>
        {role==='aluno'&&a.status==='open'&&!ended&&<div className="toolbar class-actions">{reserved?<button className="btn btn-secondary" disabled={busy} onClick={()=>void reserve(a,true)}><XCircle size={15}/> Cancelar reserva</button>:<button className="btn btn-primary" disabled={busy||full} onClick={()=>void reserve(a)}><CheckCircle2 size={15}/> {full?'Lotada':'Reservar vaga'}</button>}</div>}
        {canManage(a)&&<div className="toolbar class-actions">
          <button className="btn btn-secondary" onClick={()=>void showParticipants(a)}><Users size={15}/> Inscritos</button>
          {a.status==='open'&&started&&!ended&&<a className="btn btn-primary" href={`/check-in?class=${a.id}`}><QrCode size={15}/> Abrir QR</a>}
          {a.status==='open'&&!ended&&<button className="btn btn-secondary" onClick={()=>startEdit(a)}><Edit3 size={15}/> Editar</button>}
          {a.status==='open'&&<button className="btn btn-secondary" onClick={()=>void setStatus(a,'closed')}><Lock size={15}/> Fechar</button>}
          {a.status==='closed'&&!ended&&<button className="btn btn-secondary" onClick={()=>void setStatus(a,'open')}><RotateCcw size={15}/> Reabrir</button>}
          {a.status!=='cancelled'&&!ended&&<button className="btn btn-danger" onClick={()=>void setStatus(a,'cancelled')}><XCircle size={15}/> Cancelar aula</button>}
        </div>}
      </article>})}</div>}

    {participantsFor&&<div className="modal-backdrop" onClick={()=>setParticipantsFor(null)}><div className="card modal-card attendance-modal" onClick={e=>e.stopPropagation()}>
      <div className="section-title"><div><h2>Inscritos — {participantsFor.title}</h2><div className="muted">{participants.length} reserva(s) ativa(s)</div></div><button className="btn btn-secondary" onClick={()=>setParticipantsFor(null)}>Fechar</button></div>
      <div className="attendance-summary">
        <div><span>Presentes</span><strong>{participants.filter(p=>p.present).length}</strong></div>
        <div><span>Aguardando</span><strong>{participants.filter(p=>!p.present).length}</strong></div>
        <div><span>Total</span><strong>{participants.length}</strong></div>
      </div>
      <div className="attendance-toolbar">
        <label className="attendance-search"><Search size={16}/><input value={participantQ} onChange={e=>setParticipantQ(e.target.value)} placeholder="Buscar aluno..."/></label>
        <button className="btn btn-secondary" onClick={()=>{setShowAddStudent(v=>!v);if(!showAddStudent)void loadAvailable()}}><UserPlus size={16}/> Adicionar aluno</button>
      </div>
      {showAddStudent&&<div className="add-student-box"><div><strong>Aluno chegou sem reserva?</strong><div className="muted small-text">Adicione à aula e depois confirme a presença normalmente.</div></div><div className="toolbar"><select className="input" value={addStudentId} onChange={e=>setAddStudentId(e.target.value)}><option value="">Selecione um aluno</option>{available.map(s=><option key={s.id} value={s.id}>{s.name} • {s.belt}</option>)}</select><button className="btn btn-primary" disabled={busy||!addStudentId} onClick={()=>void addStudentToClass()}>Adicionar</button></div></div>}
      {!participants.length?<div className="empty-state">Nenhum aluno reservado.</div>:<div className="table-wrap"><table className="table"><thead><tr><th>Aluno</th><th>Faixa</th><th>Contato</th><th>Presença</th></tr></thead><tbody>{participants
        .filter(p=>!participantQ||`${p.name} ${p.login||''}`.toLowerCase().includes(participantQ.toLowerCase()))
        .sort(
          (a,b)=>
            b.iea-a.iea||
            a.name.localeCompare(b.name,'pt-BR')
        )
        .map(p=><tr key={p.id}><td><div className="student-cell">{p.avatar_url?<img className="student-avatar" src={p.avatar_url} alt=""/>:<span className="student-avatar mini">{p.name.slice(0,1)}</span>}<div><strong>{p.name}</strong>
<div className="muted small-text">
  IEA {Number(p.iea||0).toFixed(0)}
  {p.login
    ? ` • Login: ${p.login}`
    : p.contact_email
      ? ` • ${p.contact_email}`
      : ''}
</div></div></div></td><td>{p.belt}{p.degrees?` • ${p.degrees} grau(s)`:''}</td><td>{p.phone||'-'}</td><td>{p.present?<div className="toolbar" style={{gap:8,flexWrap:'wrap'}}><span className="status-badge status-ativo">Presente {p.checked_in_at?new Date(p.checked_in_at).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}):''}</span>{p.manual&&<button className="btn btn-secondary" disabled={busy} onClick={()=>void manualAttendance(p,'remove')}>Desfazer</button>}</div>:<button className="btn btn-primary" disabled={busy} onClick={()=>void manualAttendance(p,'confirm')}><UserCheck size={15}/> Confirmar presença</button>}</td></tr>)}</tbody></table></div>}
    </div></div>}
  </AppShell>
}
