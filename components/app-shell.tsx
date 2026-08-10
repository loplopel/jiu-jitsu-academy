'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Users, CalendarDays, ScanLine, Trophy, Medal, FileBarChart, Settings, LogOut, Bell, UserRoundCog, Award, UserCircle, GraduationCap, CalendarCheck, House, ChartNoAxesCombined
} from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import type { Role } from '@/lib/types';

type MenuItem = { href:string; label:string; icon:any; mobile?:boolean };
const menu:Record<Role,MenuItem[]> = {
  admin:[
    {href:'/dashboard',label:'Início',icon:House,mobile:true},
    {href:'/alunos',label:'Alunos',icon:Users,mobile:true},
    {href:'/cadastros/professores',label:'Professores',icon:GraduationCap,mobile:true},
    {href:'/aulas',label:'Aulas',icon:CalendarDays,mobile:true},
    {href:'/graduacoes',label:'Graduações',icon:Medal},
    {href:'/ranking',label:'Ranking e conquistas',icon:Award},
    {href:'/eventos',label:'Eventos',icon:Trophy},
    {href:'/relatorios',label:'Relatórios',icon:FileBarChart},
    {href:'/notificacoes',label:'Notificações',icon:Bell},
    {href:'/usuarios',label:'Usuários e acessos',icon:UserRoundCog},
    {href:'/configuracoes',label:'Configurações',icon:Settings},
    {href:'/perfil',label:'Meu perfil',icon:UserCircle},
  ],
  professor:[
    {href:'/professor',label:'Início',icon:House,mobile:true},
    {href:'/aulas',label:'Minhas aulas',icon:CalendarCheck,mobile:true},
    {href:'/alunos',label:'Meus alunos',icon:Users,mobile:true},
    {href:'/check-in',label:'Presença / QR',icon:ScanLine,mobile:true},
    {href:'/ranking',label:'Ranking e conquistas',icon:ChartNoAxesCombined,mobile:true},
    {href:'/graduacoes',label:'Graduações',icon:Medal},
    {href:'/ranking',label:'Ranking e conquistas',icon:Award},
    {href:'/eventos',label:'Eventos',icon:Trophy},
    {href:'/notificacoes',label:'Notificações',icon:Bell},
    {href:'/perfil',label:'Meu perfil',icon:UserCircle},
  ],
  aluno:[
    {href:'/meu-painel',label:'Início',icon:House,mobile:true},
    {href:'/aulas',label:'Agenda',icon:CalendarDays,mobile:true},
    {href:'/check-in/scan',label:'Check-in',icon:ScanLine,mobile:true},
    {href:'/graduacoes',label:'Evolução',icon:Award,mobile:true},
    {href:'/perfil',label:'Perfil',icon:UserCircle,mobile:true},
    {href:'/eventos',label:'Eventos',icon:Trophy},
    {href:'/ranking',label:'Ranking e conquistas',icon:Award},
    {href:'/notificacoes',label:'Notificações',icon:Bell},
  ],
};
const labels:Record<Role,string>={admin:'Administrador Geral',professor:'Professor',aluno:'Aluno'};

export function AppShell({children}:{children:React.ReactNode}){
  const pathname=usePathname(); const router=useRouter();
  const [role,setRole]=useState<Role>('aluno'); const [name,setName]=useState('Usuário'); const [avatar,setAvatar]=useState(''); const [ready,setReady]=useState(false);
  useEffect(()=>{void(async()=>{
    const sb=getSupabaseBrowserClient(); if(!sb){setReady(true);return;}
    const {data:{user}}=await sb.auth.getUser(); if(!user){router.push('/login');return;}
    const {data}=await sb.from('profiles').select('role,name,avatar_url').eq('id',user.id).single();
    if(data?.role)setRole(data.role as Role); if(data?.name)setName(data.name); if(data?.avatar_url)setAvatar(data.avatar_url); setReady(true);
  })()},[router]);
  const items=useMemo(()=>menu[role],[role]);
  const mobileItems=useMemo(()=>items.filter(i=>i.mobile).slice(0,5),[items]);
  async function signOut(){const sb=getSupabaseBrowserClient();await sb?.auth.signOut();router.push('/login')}
  if(!ready)return <div className="empty">Carregando seu painel...</div>;
  return <>
    <aside className="sidebar">
      <Link href={role==='admin'?'/dashboard':role==='professor'?'/professor':'/meu-painel'} className="brand">
        <img src="/logo-conexao-paulista.png" className="logo-brand" alt="Conexão Paulista"/>
        <div>CONEXÃO PAULISTA<br/><span className="brand-sub">JIU-JITSU</span></div>
      </Link>
      <div className="sidebar-role">{labels[role]}</div>
      <nav className="sidebar-nav">{items.map(({href,label,icon:Icon})=><Link key={href} className={`nav-item ${pathname===href?'active':''}`} href={href}><Icon size={17}/>{label}</Link>)}</nav>
      <button className="nav-item nav-logout" onClick={signOut}><LogOut size={17}/>Sair</button>
    </aside>
    <div className="app-main">
      <header className="topbar">
        <div className="topbar-user">{avatar?<img src={avatar} className="topbar-avatar" alt=""/>:<div className="topbar-avatar placeholder">{name.slice(0,1).toUpperCase()}</div>}<div><strong>{name}</strong><div className="muted topbar-sub">{labels[role]} • Conexão Paulista</div></div></div>
        <div className="toolbar"><Link href="/notificacoes" className="btn btn-secondary icon-only" aria-label="Notificações"><Bell size={16}/></Link><Link href="/perfil" className="pill profile-pill">Meu perfil</Link></div>
      </header>
      <main className="content">{children}</main>
      <nav className="mobile-bottom">{mobileItems.map(({href,label,icon:Icon})=><Link key={href} className={`mobile-bottom-item ${pathname===href?'active':''}`} href={href}><Icon size={20}/><span>{label}</span></Link>)}</nav>
    </div>
  </>
}
