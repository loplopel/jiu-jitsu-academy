'use client';
import {useEffect,useState} from 'react';
import {AppShell} from '@/components/app-shell';
import {getSupabaseBrowserClient} from '@/lib/supabase-browser';

export default function Page(){
 const[name,setName]=useState(''); const[phone,setPhone]=useState(''); const[email,setEmail]=useState(''); const[msg,setMsg]=useState('');
 useEffect(()=>{void(async()=>{const sb=getSupabaseBrowserClient();if(!sb)return;const {data:{user}}=await sb.auth.getUser();if(!user)return;setEmail(user.email||'');const {data}=await sb.from('profiles').select('name,phone').eq('id',user.id).single();setName(data?.name||'');setPhone(data?.phone||'')})()},[]);
 async function save(e:React.FormEvent){e.preventDefault();const sb=getSupabaseBrowserClient();if(!sb){setMsg('Configure o Supabase para salvar.');return;}const {data:{user}}=await sb.auth.getUser();if(!user)return;const {error}=await sb.from('profiles').update({name,phone}).eq('id',user.id);setMsg(error?error.message:'Perfil atualizado com sucesso.');}
 return <AppShell><section className="hero"><h1>Meu perfil</h1><div className="muted">Atualize seus dados pessoais de acesso e contato.</div></section><form className="card" style={{padding:22,maxWidth:720}} onSubmit={save}><div className="form-stack"><div><label className="label">Nome</label><input className="input" value={name} onChange={e=>setName(e.target.value)}/></div><div><label className="label">E-mail</label><input className="input" value={email} disabled/></div><div><label className="label">Telefone</label><input className="input" value={phone} onChange={e=>setPhone(e.target.value)}/></div><button className="btn btn-primary">Salvar alterações</button>{msg&&<div className="notice success">{msg}</div>}</div></form></AppShell>
}
