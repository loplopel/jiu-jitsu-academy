'use client';

import {useCallback,useEffect,useMemo,useState} from 'react';
import Link from 'next/link';
import {AppShell} from '@/components/app-shell';
import {Bell,CheckCheck,Clock3,RefreshCw,Send,Settings2,Users,UserRound,GraduationCap,Trophy,CalendarClock,Cake,Award} from 'lucide-react';
import {getSupabaseBrowserClient} from '@/lib/supabase-browser';
import type {Role} from '@/lib/types';

type NotificationItem={id:string;title:string;message:string;kind:string;link_url:string|null;read_at:string|null;created_at:string;scheduled_for:string|null};
type UserOption={id:string;name:string;role:Role;username:string};
type Settings={class_reminders:boolean;class_reminder_minutes:number;event_reminders:boolean;event_reminder_hours:number;birthday_messages:boolean;achievement_messages:boolean};
const defaults:Settings={class_reminders:true,class_reminder_minutes:120,event_reminders:true,event_reminder_hours:24,birthday_messages:true,achievement_messages:true};
const kindLabels:Record<string,string>={general:'Aviso',class:'Aula',event:'Evento',birthday:'Aniversário',achievement:'Conquista'};
const kindIcons:Record<string,any>={general:Bell,class:CalendarClock,event:Trophy,birthday:Cake,achievement:Award};

export default function Page(){
  const[role,setRole]=useState<Role>('aluno');
  const[items,setItems]=useState<NotificationItem[]>([]); const[unread,setUnread]=useState(0); const[loading,setLoading]=useState(true);
  const[title,setTitle]=useState(''); const[message,setMessage]=useState(''); const[kind,setKind]=useState('general'); const[audience,setAudience]=useState('all'); const[userId,setUserId]=useState(''); const[linkUrl,setLinkUrl]=useState('');
  const[users,setUsers]=useState<UserOption[]>([]); const[status,setStatus]=useState(''); const[automationStatus,setAutomationStatus]=useState('');
  const[settings,setSettings]=useState<Settings>(defaults); const[savingSettings,setSavingSettings]=useState(false);

  const load=useCallback(async()=>{setLoading(true);const r=await fetch('/api/notifications',{cache:'no-store'});const j=await r.json();if(r.ok){setItems(j.items||[]);setUnread(j.unread||0)}setLoading(false)},[]);
  useEffect(()=>{void(async()=>{const sb=getSupabaseBrowserClient();const{data:{user}}=await sb?.auth.getUser()||{data:{user:null}} as any;if(user){const{data}=await sb!.from('profiles').select('role').eq('id',user.id).single();if(data?.role)setRole(data.role as Role)}await load()})()},[load]);
  useEffect(()=>{if(role!=='admin')return;void(async()=>{const[u,s]=await Promise.all([fetch('/api/notifications/users'),fetch('/api/notifications/settings')]);if(u.ok)setUsers(await u.json());if(s.ok)setSettings({...defaults,...await s.json()})})()},[role]);

  async function mark(id?:string){const r=await fetch('/api/notifications',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify(id?{id}:{mark_all:true})});if(r.ok)await load()}
  async function send(e:React.FormEvent){e.preventDefault();setStatus('Enviando...');const r=await fetch('/api/notifications',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({title,message,kind,audience,user_id:audience==='user'?userId:undefined,link_url:linkUrl||undefined})});const j=await r.json();if(r.ok){setStatus(`${j.sent} notificação(ões) enviada(s).`);setTitle('');setMessage('');setLinkUrl('');await load()}else setStatus(j.error||'Falha ao enviar.')}
  async function runAutomation(){setAutomationStatus('Verificando aulas, eventos, aniversários e conquistas...');const r=await fetch('/api/notifications/automation',{method:'POST'});const j=await r.json();setAutomationStatus(r.ok?`${j.created} nova(s) notificação(ões) automática(s) criada(s).`:j.error||'Falha ao processar.');if(r.ok)await load()}
  async function saveSettings(){setSavingSettings(true);const r=await fetch('/api/notifications/settings',{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify(settings)});const j=await r.json();setStatus(r.ok?'Regras automáticas salvas.':j.error||'Falha ao salvar.');setSavingSettings(false)}

  const empty=useMemo(()=>!loading&&items.length===0,[loading,items.length]);
  return <AppShell>
    <section className="hero"><div><h1>Comunicação e notificações</h1><div className="muted">Avisos internos da equipe, lembretes de aula, eventos, aniversários e conquistas.</div></div><div className="toolbar"><span className="pill">{unread} não lida(s)</span>{unread>0&&<button className="btn btn-secondary" onClick={()=>mark()}><CheckCheck size={17}/>Marcar todas como lidas</button>}<button className="btn btn-secondary" onClick={()=>load()}><RefreshCw size={17}/>Atualizar</button></div></section>

    {role==='admin'&&<div className="grid grid-2" style={{marginBottom:18}}>
      <form className="card" style={{padding:20}} onSubmit={send}>
        <h2><Send size={19}/> Enviar comunicação</h2>
        <div className="form-stack">
          <input className="input" placeholder="Título" value={title} onChange={e=>setTitle(e.target.value)} required maxLength={120}/>
          <textarea className="input" rows={5} placeholder="Mensagem" value={message} onChange={e=>setMessage(e.target.value)} required maxLength={1500}/>
          <div className="grid grid-2">
            <select className="input" value={kind} onChange={e=>setKind(e.target.value)}><option value="general">Aviso geral</option><option value="class">Aula</option><option value="event">Evento</option><option value="birthday">Aniversário</option><option value="achievement">Conquista</option></select>
            <select className="input" value={audience} onChange={e=>setAudience(e.target.value)}><option value="all">Todos os usuários</option><option value="students">Somente alunos</option><option value="professors">Somente professores</option><option value="user">Um usuário específico</option></select>
          </div>
          {audience==='user'&&<select className="input" value={userId} onChange={e=>setUserId(e.target.value)} required><option value="">Selecione...</option>{users.map(u=><option key={u.id} value={u.id}>{u.name} • {u.role} • @{u.username}</option>)}</select>}
          <input className="input" placeholder="Link interno opcional. Ex.: /aulas" value={linkUrl} onChange={e=>setLinkUrl(e.target.value)}/>
          <button className="btn btn-primary"><Send size={17}/>Enviar agora</button>
          {status&&<div className="notice success">{status}</div>}
        </div>
      </form>

      <div className="card" style={{padding:20}}>
        <h2><Settings2 size={19}/> Regras automáticas</h2>
        <div className="form-stack">
          <label className="setting-row"><span><strong>Lembrete de aula</strong><small className="muted">Para alunos com reserva confirmada.</small></span><input type="checkbox" checked={settings.class_reminders} onChange={e=>setSettings(s=>({...s,class_reminders:e.target.checked}))}/></label>
          <label className="setting-row"><span>Antecedência da aula (minutos)</span><input className="input" style={{maxWidth:120}} type="number" min={15} max={1440} value={settings.class_reminder_minutes} onChange={e=>setSettings(s=>({...s,class_reminder_minutes:Number(e.target.value)}))}/></label>
          <label className="setting-row"><span><strong>Lembrete de eventos</strong><small className="muted">Seminários e competições próximos.</small></span><input type="checkbox" checked={settings.event_reminders} onChange={e=>setSettings(s=>({...s,event_reminders:e.target.checked}))}/></label>
          <label className="setting-row"><span>Antecedência do evento (horas)</span><input className="input" style={{maxWidth:120}} type="number" min={1} max={168} value={settings.event_reminder_hours} onChange={e=>setSettings(s=>({...s,event_reminder_hours:Number(e.target.value)}))}/></label>
          <label className="setting-row"><span><strong>Aniversários</strong></span><input type="checkbox" checked={settings.birthday_messages} onChange={e=>setSettings(s=>({...s,birthday_messages:e.target.checked}))}/></label>
          <label className="setting-row"><span><strong>Conquistas</strong></span><input type="checkbox" checked={settings.achievement_messages} onChange={e=>setSettings(s=>({...s,achievement_messages:e.target.checked}))}/></label>
          <div className="toolbar"><button className="btn btn-secondary" onClick={saveSettings} disabled={savingSettings}>Salvar regras</button><button className="btn btn-primary" onClick={runAutomation}><Clock3 size={17}/>Processar agora</button></div>
          {automationStatus&&<div className="notice success">{automationStatus}</div>}
          <small className="muted">O botão “Processar agora” gera somente avisos que ainda não foram criados. A mesma aula, evento, aniversário ou conquista não é duplicada.</small>
        </div>
      </div>
    </div>}

    <div className="card" style={{padding:20}}>
      <div className="section-heading"><div><h2><Bell size={19}/> Minha caixa de avisos</h2><div className="muted">Cada usuário enxerga apenas as próprias notificações.</div></div></div>
      {loading&&<div className="empty">Carregando notificações...</div>}
      {empty&&<div className="empty"><Bell size={28}/><strong>Nenhuma notificação por enquanto.</strong><span>Os avisos da equipe aparecerão aqui.</span></div>}
      <div className="notification-list">{items.map(n=>{const Icon=kindIcons[n.kind]||Bell;return <article key={n.id} className={`notification-item ${n.read_at?'':'unread'}`}>
        <div className="notification-icon"><Icon size={19}/></div><div className="notification-body"><div className="notification-meta"><span className="pill">{kindLabels[n.kind]||'Aviso'}</span><span className="muted">{new Date(n.created_at).toLocaleString('pt-BR')}</span></div><h3>{n.title}</h3><p>{n.message}</p><div className="toolbar">{n.link_url&&<Link className="btn btn-secondary" href={n.link_url} onClick={()=>!n.read_at&&mark(n.id)}>Abrir</Link>}{!n.read_at&&<button className="btn btn-secondary" onClick={()=>mark(n.id)}><CheckCheck size={16}/>Marcar como lida</button>}</div></div>
      </article>})}</div>
    </div>
  </AppShell>
}
