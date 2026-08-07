'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard,Users,CalendarDays,ScanLine,CreditCard,Trophy,Medal,FileBarChart,Settings,LogOut,Bell,UserRoundCog,Award,Database,UserCircle } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import type { Role } from '@/lib/types';

const allItems=[
 ['/dashboard','Dashboard',LayoutDashboard,['admin']],['/cadastros','Cadastros',Database,['admin']],['/professor','Dashboard Professor',LayoutDashboard,['professor','admin']],['/meu-painel','Meu Painel',LayoutDashboard,['aluno']],['/perfil','Meu Perfil',UserCircle,['admin','professor','aluno']],['/alunos','Alunos',Users,['admin','professor']],['/aulas','Aulas',CalendarDays,['admin','professor','aluno']],['/check-in','Check-in / QR',ScanLine,['admin','professor']],['/financeiro','Financeiro',CreditCard,['admin']],['/graduacoes','Graduações',Medal,['admin','professor','aluno']],['/eventos','Eventos',Trophy,['admin','professor','aluno']],['/ranking','Ranking',Award,['admin','professor','aluno']],['/notificacoes','Notificações',Bell,['admin','professor','aluno']],['/relatorios','Relatórios',FileBarChart,['admin']],['/usuarios','Usuários',UserRoundCog,['admin']],['/configuracoes','Configurações',Settings,['admin']]
] as const;
const labels:Record<Role,string>={admin:'Administrador Geral',professor:'Professor',aluno:'Aluno'};

export function AppShell({children}:{children:React.ReactNode}){
  const pathname=usePathname(); const router=useRouter();
  const [role,setRole]=useState<Role>('aluno'); const [name,setName]=useState('Usuário'); const [ready,setReady]=useState(false);
  useEffect(()=>{void(async()=>{const sb=getSupabaseBrowserClient();if(!sb){setReady(true);return;}const {data:{user}}=await sb.auth.getUser();if(!user){router.push('/login');return;}const {data}=await sb.from('profiles').select('role,name').eq('id',user.id).single();if(data?.role)setRole(data.role as Role);if(data?.name)setName(data.name);setReady(true)})()},[router]);
  const items=useMemo(()=>allItems.filter(item=>(item[3] as readonly string[]).includes(role)),[role]);
  async function signOut(){const sb=getSupabaseBrowserClient();await sb?.auth.signOut();router.push('/login')}
  if(!ready)return <div className="empty">Carregando academia...</div>;
  return <><aside className="sidebar"><div className="brand"><img src="/logo-conexao-paulista.png" className="logo-brand" alt="Conexão Paulista"/><div>CONEXÃO PAULISTA<br/><span style={{fontSize:12,color:'#fb923c'}}>JIU-JITSU</span></div></div><nav className="sidebar-nav">{items.map(([href,label,Icon])=><Link key={href} className={`nav-item ${pathname===href?'active':''}`} href={href}><Icon size={17}/>{label}</Link>)}</nav><button className="nav-item" onClick={signOut} style={{width:'100%',background:'transparent',border:0,cursor:'pointer',marginTop:18}}><LogOut size={17}/>Sair</button></aside><div className="app-main"><header className="topbar"><div><strong>{name}</strong><div className="muted" style={{fontSize:12}}>Conexão Paulista Jiu-Jitsu</div></div><div className="toolbar"><button className="btn btn-secondary" aria-label="Notificações"><Bell size={16}/></button><span className="pill">{labels[role]}</span></div></header><main className="content">{children}</main><nav className="mobile-bottom">{items.slice(0,5).map(([href,label,Icon])=><Link key={href} className={`mobile-bottom-item ${pathname===href?'active':''}`} href={href}><Icon size={19}/><span>{label.replace('Dashboard Professor','Painel').replace('Meu Painel','Painel').replace('Meu Perfil','Perfil')}</span></Link>)}</nav></div></>
}
