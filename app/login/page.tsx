'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, LockKeyhole } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';

export default function LoginPage(){
 const router=useRouter(); const [email,setEmail]=useState(''); const [password,setPassword]=useState(''); const [error,setError]=useState(''); const [loading,setLoading]=useState(false);
 async function submit(e:React.FormEvent){e.preventDefault();setLoading(true);setError(''); const sb=getSupabaseBrowserClient(); if(!sb){setError('Configure as variáveis do Supabase no arquivo .env.local.');setLoading(false);return;} const {error}=await sb.auth.signInWithPassword({email,password}); if(error){setError('E-mail ou senha inválidos.');setLoading(false);return;} router.push('/dashboard'); router.refresh();}
 return <main className="auth-shell"><section className="auth-art"><span className="pill">GESTÃO • PERFORMANCE • EVOLUÇÃO</span><h1>Seu dojo inteiro em uma única plataforma.</h1><p className="muted">Aulas, presença por QR Code, mensalidades, graduações, eventos, rankings e inteligência esportiva.</p></section><section className="auth-panel"><div className="card auth-box"><div className="brand"><div className="brand-mark"><ShieldCheck size={23}/></div><div>JIU-JITSU<br/>ACADEMY</div></div><div style={{margin:'30px 0 20px'}}><h2 style={{marginBottom:6}}>Bem-vindo de volta</h2><div className="muted">Entre com seu usuário para acessar o sistema.</div></div><form className="form-stack" onSubmit={submit}><div><label className="label">E-mail</label><input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} required/></div><div><label className="label">Senha</label><input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} required/></div>{error&&<div className="notice error">{error}</div>}<button className="btn btn-primary" disabled={loading}>{loading?'Entrando...':'Entrar no sistema'}</button><Link href="/forgot-password" style={{textAlign:'center',fontSize:13,color:'#d9ad55'}}><LockKeyhole size={13} style={{verticalAlign:'middle',marginRight:5}}/>Esqueci minha senha</Link></form></div></section></main>
}
