'use client';
import {useEffect,useMemo,useState} from 'react';
import {AppShell} from '@/components/app-shell';
import {Plus,RefreshCw,Pencil,Search,Upload,UserRound,Filter,Trash2,KeyRound} from 'lucide-react';
import {allowedBelts,competitionCategory} from '@/lib/competition-category';

type Opt={id:string;name:string;contact_email?:string};
type Row={
  id:string;cpf?:string;whatsapp?:string;birth_date?:string;sex?:string;weight?:number;height?:number;degrees?:number;start_date?:string;last_graduation_date?:string;notes?:string;emergency_contact?:string;emergency_name?:string;emergency_phone?:string;emergency_relation?:string;injuries?:string;status?:string;category_id?:string;responsible_professor_id?:string;belt_id?:string;
  profiles?:{name?:string;username?:string;contact_email?:string;phone?:string;avatar_url?:string}|null;belts?:{name?:string}|null;categories?:{name?:string}|null;responsible?:{name?:string}|null
};
const empty={name:'',username:'',password:'',contact_email:'',phone:'',whatsapp:'',avatar_url:'',cpf:'',birth_date:'',sex:'',weight:'',height:'',category_id:'',responsible_professor_id:'',start_date:'',belt_id:'',degrees:0,last_graduation_date:'',notes:'',emergency_contact:'',emergency_name:'',emergency_phone:'',emergency_relation:'',injuries:'',status:'ativo'};

export default function Page(){
  const[rows,setRows]=useState<Row[]>([]); const[progress,setProgress]=useState<Record<string,{attendanceSinceGraduation:number;classesToNextDegree:number;degreeEligible:boolean;beltEligible:boolean}>>({}); const[opts,setOpts]=useState<{belts:Opt[];categories:Opt[];professors:Opt[]}>({belts:[],categories:[],professors:[]});
  const[open,setOpen]=useState(false); const[editing,setEditing]=useState<string|null>(null); const[isAdmin,setIsAdmin]=useState(false); const[msg,setMsg]=useState(''); const[form,setForm]=useState<any>(empty); const[photo,setPhoto]=useState<File|null>(null); const[saving,setSaving]=useState(false);
  const[q,setQ]=useState(''); const[status,setStatus]=useState('todos'); const[belt,setBelt]=useState('todos');
  const category=useMemo(()=>competitionCategory(form.birth_date,form.sex,form.weight===''?null:Number(form.weight)),[form.birth_date,form.sex,form.weight]);
  const permittedBelts=useMemo(()=>{const names=allowedBelts(category.age);return names.length?opts.belts.filter(b=>names.includes(b.name)):opts.belts},[opts.belts,category.age]);

  async function load(){
    const[r,o,e]=await Promise.all([fetch('/api/students',{cache:'no-store'}),fetch('/api/students/options',{cache:'no-store'}),fetch('/api/evolution',{cache:'no-store'})]);
    const j=await r.json(); const jo=await o.json(); const je=await e.json();
    if(r.ok)setRows(j); else setMsg(j.error||'Falha ao carregar alunos.');
    if(o.ok)setOpts(jo); else setMsg(jo.error||'Falha ao carregar cadastros auxiliares.');
    if(e.ok){const map:Record<string,any>={};for(const item of (je.students||[]))map[item.id]=item.evolution;setProgress(map);}
  }
  useEffect(()=>{void load();void(async()=>{const {getSupabaseBrowserClient}=await import('@/lib/supabase-browser');const sb=getSupabaseBrowserClient();if(!sb)return;const {data:{user}}=await sb.auth.getUser();if(!user)return;const {data}=await sb.from('profiles').select('role').eq('id',user.id).single();setIsAdmin(data?.role==='admin')})()},[]);

  const filtered=useMemo(()=>rows.filter(x=>{
    const text=`${x.profiles?.name||''} ${x.profiles?.username||''} ${x.profiles?.contact_email||''} ${x.cpf||''} ${x.profiles?.phone||''}`.toLowerCase();
    return(!q||text.includes(q.toLowerCase()))&&(status==='todos'||x.status===status)&&(belt==='todos'||x.belt_id===belt);
  }),[rows,q,status,belt]);

  function beginNew(){setEditing(null);setForm({...empty,start_date:new Date().toISOString().slice(0,10)});setPhoto(null);setMsg('');setOpen(true)}
  function edit(x:Row){setEditing(x.id);setPhoto(null);setForm({
    name:x.profiles?.name||'',username:x.profiles?.username||'',password:'',contact_email:x.profiles?.contact_email||'',phone:x.profiles?.phone||'',whatsapp:x.whatsapp||'',avatar_url:x.profiles?.avatar_url||'',cpf:x.cpf||'',birth_date:x.birth_date||'',sex:x.sex||'',weight:x.weight??'',height:x.height??'',category_id:x.category_id||'',responsible_professor_id:x.responsible_professor_id||'',start_date:x.start_date||'',belt_id:x.belt_id||'',degrees:x.degrees??0,last_graduation_date:x.last_graduation_date||'',notes:x.notes||'',emergency_contact:x.emergency_contact||'',emergency_name:x.emergency_name||'',emergency_phone:x.emergency_phone||'',emergency_relation:x.emergency_relation||'',injuries:x.injuries||'',status:x.status||'ativo'
  });setOpen(true)}

  async function uploadPhoto(studentId:string){
    if(!photo)return form.avatar_url||'';
    const fd=new FormData(); fd.append('file',photo); fd.append('studentId',studentId);
    const r=await fetch('/api/students/photo',{method:'POST',body:fd}); const j=await r.json();
    if(!r.ok)throw new Error(j.error||'Falha ao enviar foto'); return j.url as string;
  }

  async function removeStudent(x:Row){
    const name=x.profiles?.name||'este aluno';
    if(!window.confirm(`Excluir ${name}? O acesso, cadastro e dados vinculados a este aluno serão removidos. Esta ação não pode ser desfeita.`))return;
    setMsg('Excluindo aluno...');
    const r=await fetch(`/api/students?id=${encodeURIComponent(x.id)}`,{method:'DELETE'});
    const j=await r.json();
    if(!r.ok){setMsg(j.error||'Falha ao excluir aluno.');return;}
    setMsg('Aluno excluído com sucesso.');
    await load();
  }

  async function resetAccess(x:Row){
    const password=window.prompt(`Defina uma nova senha para ${x.profiles?.name||'o aluno'} (mínimo 6 caracteres):`);
    if(!password)return;
    const r=await fetch('/api/admin/access',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({id:x.id,password})});
    const j=await r.json();
    setMsg(r.ok?'Senha do aluno redefinida com sucesso.':j.error||'Falha ao redefinir senha.');
  }

  async function save(e:React.FormEvent){
    e.preventDefault(); setSaving(true); setMsg('Salvando aluno...');
    try{
      const payload={...form,id:editing||undefined,weight:form.weight===''?null:Number(form.weight),height:form.height===''?null:Number(form.height),degrees:Number(form.degrees),category_id:form.category_id||null,responsible_professor_id:form.responsible_professor_id||null,belt_id:form.belt_id||null,category_name:category.label||null};
      const r=await fetch('/api/students',{method:editing?'PATCH':'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)}); const j=await r.json();
      if(!r.ok)throw new Error(j.error||'Falha ao salvar aluno');
      const id=editing||j.id; if(photo&&id)await uploadPhoto(id);
      setMsg(editing?'Aluno atualizado com sucesso.':`Aluno cadastrado. Login: ${j.username}`); setOpen(false); setEditing(null); setForm(empty); setPhoto(null); await load();
    }catch(err:any){setMsg(err.message||'Falha ao salvar aluno.')}finally{setSaving(false)}
  }

  return <AppShell>
    <section className="hero"><div className="split"><div><h1>Alunos</h1><div className="muted">Cadastro completo, vínculo com professor, categoria, faixa e acesso individual ao aplicativo.</div></div><button className="btn btn-primary" onClick={beginNew}><Plus size={16}/> Novo aluno</button></div></section>
    {msg&&<div className={msg.includes('sucesso')||msg.includes('convite')?'notice success':'notice error'} style={{marginBottom:14}}>{msg}</div>}

    {open&&<form className="card admin-form" onSubmit={save}>
      <div className="student-form-heading"><div><strong>{editing?'Editar aluno':'Novo aluno'}</strong><div className="muted small-text">O acesso é criado pela academia com login e senha. E-mail é apenas contato opcional.</div></div>{form.avatar_url?<img className="student-avatar-lg" src={form.avatar_url} alt="Foto do aluno"/>:<div className="student-avatar-placeholder"><UserRound size={30}/></div>}</div>

      <div className="form-section-title">Dados pessoais</div>
      <div className="grid grid-3">
        <F l="Nome" v={form.name} set={v=>setForm({...form,name:v})} req/>
        {!editing&&<><F l="Login" v={form.username} set={v=>setForm({...form,username:v})} req/><F l="Senha inicial" v={form.password} set={v=>setForm({...form,password:v})} type="password" req/></>}
        {editing&&<F l="Login" v={form.username} set={()=>{}} disabled/>}
        <F l="E-mail de contato (opcional)" v={form.contact_email} set={v=>setForm({...form,contact_email:v})} type="email"/>
        <F l="Data de nascimento" v={form.birth_date} set={v=>setForm({...form,birth_date:v})} type="date" req/>
        <div><label className="label">Sexo</label><select className="input" value={form.sex} onChange={e=>setForm({...form,sex:e.target.value})} required><option value="">Selecione</option><option value="Masculino">Masculino</option><option value="Feminino">Feminino</option></select></div>
        <F l="Peso (kg)" v={form.weight} set={v=>setForm({...form,weight:v})} type="number" step="0.1" min="0" req/>
      </div>

      <div className="form-section-title">Vínculos esportivos</div>
      <div className="grid grid-3">
        <div><label className="label">Categoria</label><div className="input category-readonly">{category.label||'Informe nascimento, sexo e peso'}</div><div className="muted small-text" style={{marginTop:6}}>{category.age!==null&&category.age<16?'A tabela enviada não traz pesos infantis; nesta idade a categoria usa somente a faixa etária.':'Calculada automaticamente por idade, sexo e peso.'}</div></div>
        <Select l="Professor responsável" v={form.responsible_professor_id} set={v=>setForm({...form,responsible_professor_id:v})} items={opts.professors}/>
        <Select l="Faixa" v={form.belt_id} set={v=>setForm({...form,belt_id:v})} items={permittedBelts}/>
        <F l="Graus" v={form.degrees} set={v=>setForm({...form,degrees:Number(v)})} type="number" min="0" max="6"/>
        <F l="Data de início" v={form.start_date} set={v=>setForm({...form,start_date:v})} type="date" req/>
        <div><label className="label">Foto do aluno</label><label className="upload-field"><Upload size={16}/><span>{photo?photo.name:'Selecionar JPG, PNG ou WEBP'}</span><input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={e=>setPhoto(e.target.files?.[0]||null)}/></label></div>
      </div>

      <div className="notice" style={{marginTop:16}}>Faixas disponíveis também seguem a categoria de idade enviada: infantil, juvenil, adulto e masters.</div>
      <div className="toolbar" style={{marginTop:16}}><button className="btn btn-primary" disabled={saving}>{saving?'Salvando...':editing?'Salvar alterações':'Cadastrar aluno'}</button><button type="button" className="btn btn-secondary" onClick={()=>setOpen(false)}>Cancelar</button></div>
    </form>}

    <div className="card" style={{padding:18}}><div className="student-toolbar"><div className="search-wrap"><Search size={16}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar por nome, login, CPF ou telefone"/></div><div className="filter-group"><Filter size={15}/><select className="input compact" value={status} onChange={e=>setStatus(e.target.value)}><option value="todos">Todos os status</option><option value="ativo">Ativos</option><option value="inativo">Inativos</option><option value="bloqueado">Bloqueados</option></select><select className="input compact" value={belt} onChange={e=>setBelt(e.target.value)}><option value="todos">Todas as faixas</option>{opts.belts.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></div><button className="btn btn-secondary" onClick={load}><RefreshCw size={14}/> Atualizar</button></div>
      <div className="student-summary"><span><strong>{filtered.length}</strong> exibido(s)</span><span><strong>{rows.filter(x=>x.status==='ativo').length}</strong> ativo(s)</span><span><strong>{rows.filter(x=>x.status==='bloqueado').length}</strong> bloqueado(s)</span></div>
      {!filtered.length?<div className="empty-state">Nenhum aluno encontrado. Clique em “Novo aluno” para iniciar a base real.</div>:<div className="table-wrap"><table className="table"><thead><tr><th>Aluno</th><th>Categoria</th><th>Faixa</th><th>Professor</th><th>Início</th><th>Progresso</th><th>Status</th><th>Ações</th></tr></thead><tbody>{filtered.map(x=><tr key={x.id}><td><div className="student-cell">{x.profiles?.avatar_url?<img src={x.profiles.avatar_url} className="student-avatar" alt=""/>:<div className="student-avatar mini"><UserRound size={16}/></div>}<div><strong>{x.profiles?.name||'-'}</strong><div className="muted small-text">{x.cpf||`Login: ${x.profiles?.username||'-'}`}</div></div></div></td><td>{x.categories?.name||'-'}</td><td>{x.belts?.name||'-'} <span className="muted">• {x.degrees??0} grau(s)</span></td><td>{x.responsible?.name||'-'}</td><td>{formatDate(x.start_date)}</td><td>{progress[x.id]?<div className={`student-grade-progress ${progress[x.id].degreeEligible||progress[x.id].beltEligible?'ready':''}`}><strong>{progress[x.id].beltEligible?'Troca de faixa':progress[x.id].degreeEligible?'Grau disponível':`${progress[x.id].attendanceSinceGraduation}/70`}</strong><span>{progress[x.id].beltEligible?'4 graus concluídos':progress[x.id].degreeEligible?'70 aulas concluídas':`Faltam ${progress[x.id].classesToNextDegree}`}</span></div>:<span className="muted">-</span>}</td><td><span className={`status-badge status-${x.status}`}>{x.status||'-'}</span></td><td><div style={{display:'flex',gap:6}}><button className="icon-btn" onClick={()=>edit(x)} title="Editar aluno"><Pencil size={15}/></button>{isAdmin&&<><button className="icon-btn" onClick={()=>resetAccess(x)} title="Redefinir senha"><KeyRound size={15}/></button><button className="icon-btn danger" onClick={()=>removeStudent(x)} title="Excluir aluno"><Trash2 size={15}/></button></>}</div></td></tr>)}</tbody></table></div>}
    </div>
  </AppShell>
}

function F({l,v,set,type='text',req=false,disabled=false,step,min,max}:{l:string;v:any;set:(v:any)=>void;type?:string;req?:boolean;disabled?:boolean;step?:string;min?:string;max?:string}){return <div><label className="label">{l}</label><input className="input" type={type} value={v??''} onChange={e=>set(e.target.value)} required={req} disabled={disabled} step={step} min={min} max={max}/></div>}
function Select({l,v,set,items}:{l:string;v:string;set:(v:string)=>void;items:Opt[]}){return <div><label className="label">{l}</label><select className="input" value={v||''} onChange={e=>set(e.target.value)}><option value="">Não informado</option>{items.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></div>}
function formatDate(v?:string){if(!v)return '-';const [y,m,d]=v.slice(0,10).split('-');return y&&m&&d?`${d}/${m}/${y}`:v}
