'use client';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import QRCode from 'qrcode';
import { AppShell } from '@/components/app-shell';
import { QrCode,RefreshCw,MapPin,ShieldCheck } from 'lucide-react';

function CheckInContent(){
 const sp=useSearchParams(); const classId=sp.get('class')||'a1';
 const[token,setToken]=useState(''); const[src,setSrc]=useState(''); const[seconds,setSeconds]=useState(30); const[mode,setMode]=useState<'secure'|'demo'>('secure');
 const renew=useCallback(async()=>{try{const res=await fetch(`/api/classes/${classId}/qr`,{method:'POST'});if(!res.ok)throw new Error();const data=await res.json();setToken(data.token);setSeconds(data.ttl||30);setMode('secure')}catch{setToken(`DEMO-${crypto.randomUUID()}`);setSeconds(30);setMode('demo')}},[classId]);
 useEffect(()=>{renew()},[renew]);
 useEffect(()=>{if(!token)return;QRCode.toDataURL(`${location.origin}/check-in/scan?token=${encodeURIComponent(token)}`,{width:300,margin:2}).then(setSrc)},[token]);
 useEffect(()=>{const i=setInterval(()=>setSeconds(s=>{if(s<=1){renew();return 30}return s-1}),1000);return()=>clearInterval(i)},[renew]);
 return <AppShell><section className="hero"><h1>Check-in por QR Code</h1><div className="muted">Código dinâmico, exclusivo da aula e renovado automaticamente a cada 30 segundos.</div></section><div className="grid grid-2"><div className="card" style={{padding:26,textAlign:'center'}}><span className="pill"><QrCode size={14}/> {mode==='secure'?'QR SEGURO':'MODO DEMONSTRAÇÃO'}</span><h2>Aula selecionada</h2>{src&&<img src={src} alt="QR Code da aula" width={300} height={300} style={{background:'#fff',borderRadius:16,maxWidth:'100%'}}/>}<h3>Expira em {seconds}s</h3><div className="progress"><span style={{width:`${seconds/30*100}%`}}/></div><button className="btn btn-secondary" style={{marginTop:18}} onClick={renew}><RefreshCw size={15}/> Renovar agora</button></div><div className="card" style={{padding:24}}><h2>Segurança do check-in</h2><p><ShieldCheck size={17} style={{verticalAlign:'middle'}}/> Token aleatório armazenado apenas como hash.</p><p><RefreshCw size={17} style={{verticalAlign:'middle'}}/> Expiração máxima de 30 segundos e uso único.</p><p><MapPin size={17} style={{verticalAlign:'middle'}}/> Geolocalização registrada quando autorizada.</p><p className="muted">Com Supabase configurado, o QR é criado e validado exclusivamente no servidor. O modo demonstração serve somente para visualizar a interface antes da configuração.</p></div></div></AppShell>
}
export default function Page(){return <Suspense fallback={<div className="empty">Carregando QR...</div>}><CheckInContent/></Suspense>}
