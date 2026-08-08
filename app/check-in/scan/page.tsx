'use client';
import {Suspense,useEffect,useState} from 'react';
import {useSearchParams} from 'next/navigation';
import Link from 'next/link';
import {CheckCircle2,XCircle,LogIn,CalendarDays} from 'lucide-react';
function ScanContent(){
  const sp=useSearchParams();const[state,setState]=useState<'loading'|'ok'|'error'|'login'>('loading');const[msg,setMsg]=useState('Validando presença...');const[token,setToken]=useState('');
  useEffect(()=>{const t=sp.get('token')||'';setToken(t);if(!t){setState('error');setMsg('QR Code inválido.');return}let done=false;async function send(lat?:number,lng?:number){if(done)return;done=true;try{const r=await fetch('/api/check-in',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({token:t,lat,lng})});const j=await r.json();if(r.ok){setState('ok');setMsg(j.message||'Presença confirmada!')}else if(r.status===401){setState('login');setMsg('Entre na sua conta de aluno e escaneie o QR novamente.')}else{setState('error');setMsg(j.error||'Não foi possível confirmar.')}}catch{setState('error');setMsg('Falha de conexão.')}}if(navigator.geolocation){navigator.geolocation.getCurrentPosition(pos=>void send(pos.coords.latitude,pos.coords.longitude),()=>void send(),{timeout:3500,maximumAge:0,enableHighAccuracy:true})}else void send()},[sp]);
  return <main className="auth-panel" style={{minHeight:'100vh'}}><div className="card auth-box scan-result">{state==='ok'?<CheckCircle2 size={76} className="scan-ok"/>:state==='error'?<XCircle size={76} className="scan-error"/>:state==='login'?<LogIn size={76} className="scan-warn"/>:<img src="/logo-conexao-paulista.png" className="logo-login" alt="Conexão Paulista"/>}<h2>{msg}</h2><p className="muted">Conexão Paulista Jiu-Jitsu</p>{state==='login'&&<Link className="btn btn-primary" href={`/login?next=${encodeURIComponent(`/check-in/scan?token=${token}`)}`}><LogIn size={16}/> Fazer login</Link>}{state==='ok'&&<Link className="btn btn-secondary" href="/meu-painel"><CalendarDays size={16}/> Ir para meu painel</Link>}</div></main>
}
export default function Scan(){return <Suspense fallback={<div className="empty">Validando...</div>}><ScanContent/></Suspense>}
