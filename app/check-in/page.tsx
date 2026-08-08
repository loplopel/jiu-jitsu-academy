'use client';
import {Suspense,useCallback,useEffect,useState} from 'react';
import {useSearchParams} from 'next/navigation';
import QRCode from 'qrcode';
import {AppShell} from '@/components/app-shell';
import {QrCode,RefreshCw,MapPin,ShieldCheck,Users} from 'lucide-react';

function CheckInContent(){
  const sp=useSearchParams();const classId=sp.get('class')||'';
  const[token,setToken]=useState(''),[src,setSrc]=useState(''),[seconds,setSeconds]=useState(30),[error,setError]=useState(''),[classTitle,setClassTitle]=useState('Aula'),[renewing,setRenewing]=useState(false),[uses,setUses]=useState(0);
  const renew=useCallback(async()=>{
    if(!classId){setError('Abra uma aula e acesse o QR por ela.');return}
    setRenewing(true);setError('');
    const res=await fetch(`/api/classes/${classId}/qr`,{method:'POST'});const data=await res.json();setRenewing(false);
    if(!res.ok){setError(data.error||'Não foi possível gerar o QR.');setToken('');setSrc('');return}
    setToken(data.token);setSeconds(data.ttl||30);setClassTitle(data.classTitle||'Aula');
  },[classId]);
  useEffect(()=>{void renew()},[renew]);
  useEffect(()=>{if(!token)return;QRCode.toDataURL(`${location.origin}/check-in/scan?token=${encodeURIComponent(token)}`,{width:320,margin:2,errorCorrectionLevel:'M'}).then(setSrc)},[token]);
  useEffect(()=>{if(!token)return;const i=setInterval(()=>setSeconds(s=>{if(s<=1){void renew();return 30}return s-1}),1000);return()=>clearInterval(i)},[renew,token]);
  useEffect(()=>{if(!token||!classId)return;const i=setInterval(async()=>{try{const r=await fetch(`/api/classes/${classId}/qr?token=${encodeURIComponent(token)}`,{cache:'no-store'});if(!r.ok)return;const j=await r.json();if(j.used){setUses(v=>v+1);void renew()}}catch{}},1000);return()=>clearInterval(i)},[token,classId,renew]);
  return <AppShell><section className="hero"><h1>QR da aula</h1><div className="muted">{classTitle} • código exclusivo, uso único e renovação automática em até 30 segundos.</div></section>{error?<div className="notice error">{error}</div>:<div className="grid grid-2"><div className="card qr-card"><span className="pill"><QrCode size={14}/> QR DINÂMICO</span>{src&&<img src={src} alt="QR Code da aula" width={320} height={320} className="qr-image"/>}<h3>{renewing?'Gerando novo código...':`Expira em ${seconds}s`}</h3><div className="progress"><span style={{width:`${seconds/30*100}%`}}/></div><div className="qr-use-counter"><Users size={16}/> {uses} check-in(s) confirmados nesta tela</div><button className="btn btn-secondary" style={{marginTop:14}} onClick={()=>void renew()} disabled={renewing}><RefreshCw size={15}/> Renovar agora</button></div><div className="card" style={{padding:24}}><h2>Como funciona</h2><p><ShieldCheck size={17} style={{verticalAlign:'middle'}}/> Cada QR pode confirmar apenas uma presença. Após o uso, um novo código aparece automaticamente.</p><p><RefreshCw size={17} style={{verticalAlign:'middle'}}/> Se ninguém usar, o código expira e é renovado em 30 segundos.</p><p><MapPin size={17} style={{verticalAlign:'middle'}}/> IP, dispositivo e localização são registrados quando a localização é autorizada.</p><p className="muted">O QR só pode ser gerado durante o horário da aula. A presença duplicada do mesmo aluno é bloqueada.</p></div></div>}</AppShell>
}
export default function Page(){return <Suspense fallback={<div className="empty">Carregando QR...</div>}><CheckInContent/></Suspense>}
