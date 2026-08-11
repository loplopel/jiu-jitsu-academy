'use client';
import {useEffect,useMemo,useState} from 'react';
import {AppShell} from '@/components/app-shell';
import {Plus,RefreshCw,Pencil,KeyRound} from 'lucide-react';
import {allowedBelts,calculateAge} from '@/lib/competition-category';

type Belt={id:string;name:string};
const empty={name:'',username:'',password:'',contact_email:'',phone:'',whatsapp:'',cpf:'',birth_date:'',sex:'',weight:'',belt_id:'',degrees:0,specialty:'Jiu-Jitsu',start_date:'',notes:'',active:true};

export default function Page(){
  const[rows,setRows]=useState<any[]>([]);const[belts,setBelts]=useState<Belt[]>([]);const[open,setOpen]=useState(false);const[editing,setEditing]=useState<string|null>(null);const[msg,setMsg]=useState('');const[form,setForm]=useState<any>(empty);
  const age=useMemo(()=>calculateAge(form.birth_date),[form.birth_date]);
  const permittedBelts=useMemo(()=>{const names=allowedBelts(age);return names.length?belts.filter(b=>names.includes(b.name)):belts},[belts,age]);
  async function load(){const[r,b]=await Promise.all([fetch('/api/admin/professors',{cache:'no-store'}),fetch('/api/admin/belts',{cache:'no-store'})]);const j=await r.json();const jb=await b.json();if(r.ok)setRows(j);else setMsg(j.error||'Falha ao carregar');if(b.ok)setBelts(jb)}
  useEffect(()=>{void load()},[]);
  function edit(x:any){const d=Array.isArray(x.professor_details)?(x.professor_details[0]||{}):(x.professor_details||{});setForm({name:x.name,username:x.username||'',password:'',contact_email:x.contact_email||'',phone:x.phone||'',whatsapp:d.whatsapp||'',cpf:d.cpf||'',birth_date:d.birth_date||'',sex:d.sex||'',weight:d.weight??'',belt_id:d.belt_id||'',degrees:d.degrees||0,specialty:d.specialty||'',start_date:d.start_date||'',notes:d.notes||'',active:x.active});setEditing(x.id);setOpen(true)}
  async function save(e:React.FormEvent){e.preventDefault();setMsg('Salvando...');const r=await fetch('/api/admin/professors',{method:editing?'PATCH':'POST',headers:{'content-type':'application/json'},body:JSON.stringify({...form,weight:form.weight===''?null:Number(form.weight),belt_id:form.belt_id||null,...(editing?{id:editing}:{})})});const j=await r.json();if(!r.ok){setMsg(j.error||'Falha ao salvar');return}setMsg(editing?'Professor atualizado com sucesso.':`Professor cadastrado. Login: ${j.username}`);setOpen(false);setEditing(null);setForm(empty);await load()}
  async function resetPassword(x:any){const password=prompt(`Defina uma nova senha para ${x.name} (mínimo 6 caracteres):`);if(!password)return;const r=await fetch('/api/admin/access',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({id:x.id,password})});const j=await r.json();setMsg(r.ok?'Senha redefinida com sucesso.':j.error||'Falha ao redefinir senha.')}
  return <AppShell>
    <section className="hero"><div className="split"><div><h1>Professores</h1><div className="muted">Cadastro esportivo e acesso por login + senha definidos pela equipe.</div></div><button className="btn btn-primary" onClick={()=>{setOpen(v=>!v);setEditing(null);setForm(empty)}}><Plus size={16}/> Novo professor</button></div></section>
    {msg&&<div className={msg.includes('sucesso')||msg.includes('Login')?'notice success':'notice error'} style={{marginBottom:14}}>{msg}</div>}
    {open&&<form className="card admin-form" onSubmit={save}>
      <div className="student-form-heading"><div><strong>{editing?'Editar professor':'Novo Professor'}</strong><div className="muted small-text">O login e a senha inicial são definidos pela equipe.</div></div></div>
      <div className="form-section-title">Dados pessoais</div>
      <div className="grid grid-3">
        <F l="Nome" v={form.name} set={v=>setForm({...form,name:v})} req/>
        {!editing&&<><F l="Login" v={form.username} set={v=>setForm({...form,username:v})} req/><F l="Senha inicial" v={form.password} set={v=>setForm({...form,password:v})} type="password" req/></>}
        {editing&&<F l="Login" v={form.username} set={()=>{}} disabled/>}
        <F l="Data de nascimento" v={form.birth_date} set={v=>setForm({...form,birth_date:v})} type="date" req/>
        <div><label className="label">Sexo</label><select className="input" value={form.sex} onChange={e=>setForm({...form,sex:e.target.value})} required><option value="">Selecione</option><option value="Masculino">Masculino</option><option value="Feminino">Feminino</option></select></div>
        <F l="Peso (kg)" v={form.weight} set={v=>setForm({...form,weight:v})} type="number" step="0.1" min="0" req/>
        <div><label className="label">Faixa</label><select className="input" value={form.belt_id} onChange={e=>setForm({...form,belt_id:e.target.value})}><option value="">Não informada</option>{permittedBelts.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
        <F l="Graus" v={form.degrees} set={v=>setForm({...form,degrees:Number(v)})} type="number" min="0" max="6"/>
        <div className="grid-span-3"><label className="label">Observação</label><textarea className="input" rows={4} value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/></div>
      </div>
      <div className="toolbar" style={{marginTop:16}}><button className="btn btn-primary">{editing?'Salvar alterações':'Cadastrar professor'}</button><button type="button" className="btn btn-secondary" onClick={()=>setOpen(false)}>Cancelar</button></div>
    </form>}
    <div className="card" style={{padding:18}}><div className="split" style={{marginBottom:12}}><strong>{rows.length} professor(es)</strong><button className="btn btn-secondary" onClick={load}><RefreshCw size={14}/> Atualizar</button></div>{!rows.length?<div className="empty-state">Nenhum professor cadastrado.</div>:<div className="table-wrap"><table className="table"><thead><tr><th>Professor</th><th>Login</th><th>Faixa</th><th>Nascimento</th><th>Peso</th><th>Status</th><th>Ações</th></tr></thead><tbody>{rows.map(x=>{const d=Array.isArray(x.professor_details)?(x.professor_details[0]||{}):(x.professor_details||{});return <tr key={x.id}><td><strong>{x.name}</strong></td><td><strong>{x.username||'-'}</strong></td><td>{d.belts?.name||'-'} • {d.degrees??0} grau(s)</td><td>{formatDate(d.birth_date)}</td><td>{d.weight!==null&&d.weight!==undefined?`${d.weight} kg`:'-'}</td><td>{x.active?'Ativo':'Inativo'}</td><td><div style={{display:'flex',gap:6}}><button className="icon-btn" title="Editar" onClick={()=>edit(x)}><Pencil size={15}/></button><button className="icon-btn" title="Redefinir senha" onClick={()=>resetPassword(x)}><KeyRound size={15}/></button></div></td></tr>})}</tbody></table></div>}</div>
  </AppShell>
}
function F({l,v,set,type='text',req=false,disabled=false,step,min,max}:{l:string;v:any;set:(v:any)=>void;type?:string;req?:boolean;disabled?:boolean;step?:string;min?:string;max?:string}){return <div><label className="label">{l}</label><input className="input" type={type} value={v??''} onChange={e=>set(e.target.value)} required={req} disabled={disabled} step={step} min={min} max={max}/></div>}
function formatDate(v?:string){if(!v)return '-';const[y,m,d]=v.slice(0,10).split('-');return y&&m&&d?`${d}/${m}/${y}`:v}
