'use client';

import {Suspense,useCallback,useEffect,useRef,useState} from 'react';
import {useSearchParams} from 'next/navigation';
import Link from 'next/link';
import {Camera,CheckCircle2,ExternalLink,LogIn,RefreshCw,ScanLine,XCircle} from 'lucide-react';
import {extractCheckinToken} from '@/lib/checkin-qr';

type ScreenState='starting'|'camera'|'validating'|'ok'|'error'|'login'|'unsupported';

function ScanContent(){
  const sp=useSearchParams();
  const videoRef=useRef<HTMLVideoElement|null>(null);
  const streamRef=useRef<MediaStream|null>(null);
  const frameRef=useRef<number|null>(null);
  const busyRef=useRef(false);
  const[state,setState]=useState<ScreenState>('starting');
  const[msg,setMsg]=useState('Abrindo a câmera...');
  const[token,setToken]=useState('');

  const stopCamera=useCallback(()=>{
    if(frameRef.current!=null){cancelAnimationFrame(frameRef.current);frameRef.current=null}
    streamRef.current?.getTracks().forEach(track=>track.stop());
    streamRef.current=null;
    if(videoRef.current)videoRef.current.srcObject=null;
  },[]);

  const submitToken=useCallback(async(t:string)=>{
    if(busyRef.current)return;
    busyRef.current=true;
    stopCamera();
    setToken(t);
    setState('validating');
    setMsg('Validando sua presença...');

    async function send(lat?:number,lng?:number){
      try{
        const r=await fetch('/api/check-in',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({token:t,lat,lng})});
        const j=await r.json().catch(()=>({}));
        if(r.ok){setState('ok');setMsg(j.message||'Presença confirmada com sucesso!')}
        else if(r.status===401){setState('login');setMsg('Entre na sua conta de aluno e depois escaneie o QR novamente.')}
        else{setState('error');setMsg(j.error||'Não foi possível confirmar o check-in.')}
      }catch{
        setState('error');setMsg('Falha de conexão. Confira sua internet e tente novamente.');
      }finally{busyRef.current=false}
    }

    if(navigator.geolocation){
      navigator.geolocation.getCurrentPosition(
        pos=>void send(pos.coords.latitude,pos.coords.longitude),
        ()=>void send(),
        {timeout:3500,maximumAge:0,enableHighAccuracy:true},
      );
    }else void send();
  },[stopCamera]);

  const startCamera=useCallback(async()=>{
    busyRef.current=false;
    stopCamera();
    setState('starting');
    setMsg('Abrindo a câmera...');

    if(!navigator.mediaDevices?.getUserMedia){
      setState('unsupported');
      setMsg('Este navegador não permite abrir a câmera por esta tela.');
      return;
    }

    const Detector=(window as any).BarcodeDetector;
    if(!Detector){
      setState('unsupported');
      setMsg('A leitura QR interna não está disponível neste navegador.');
      return;
    }

    try{
      if(typeof Detector.getSupportedFormats==='function'){
        const formats=await Detector.getSupportedFormats();
        if(Array.isArray(formats)&&!formats.includes('qr_code')){
          setState('unsupported');setMsg('Este navegador não oferece leitura de QR pela câmera.');return;
        }
      }

      const stream=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:'environment'},width:{ideal:1280},height:{ideal:720}}});
      streamRef.current=stream;
      const video=videoRef.current;
      if(!video){stopCamera();return}
      video.srcObject=stream;
      await video.play();
      setState('camera');
      setMsg('Aponte a câmera para o QR da aula.');

      const detector=new Detector({formats:['qr_code']});
      let lastAttempt=0;
      const scan=async(now:number)=>{
        if(!streamRef.current||busyRef.current)return;
        if(now-lastAttempt>180&&video.readyState>=2){
          lastAttempt=now;
          try{
            const codes=await detector.detect(video);
            const raw=String(codes?.[0]?.rawValue||'');
            if(raw){
              const found=extractCheckinToken(raw,window.location.origin);
              if(found){void submitToken(found);return}
              setMsg('QR lido, mas ele não pertence ao check-in da academia.');
            }
          }catch{}
        }
        frameRef.current=requestAnimationFrame(scan);
      };
      frameRef.current=requestAnimationFrame(scan);
    }catch(error:any){
      stopCamera();
      setState('error');
      if(error?.name==='NotAllowedError'||error?.name==='PermissionDeniedError')setMsg('Permissão da câmera negada. Autorize a câmera para este app e tente novamente.');
      else if(error?.name==='NotFoundError')setMsg('Nenhuma câmera disponível foi encontrada neste aparelho.');
      else setMsg('Não foi possível abrir a câmera. Tente novamente.');
    }
  },[stopCamera,submitToken]);

  useEffect(()=>{
    const direct=sp.get('token')||'';
    if(direct){void submitToken(direct)}else{void startCamera()}
    return()=>stopCamera();
  },[sp,startCamera,stopCamera,submitToken]);

  const retry=()=>void startCamera();

  return <main className="auth-panel" style={{minHeight:'100dvh',padding:'18px'}}>
    <div className="card auth-box scan-result" style={{width:'min(94vw,520px)',maxWidth:520}}>
      {(state==='starting'||state==='camera')&&<>
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,marginBottom:12}}><ScanLine size={20}/><strong>Check-in por QR Code</strong></div>
        <div style={{position:'relative',width:'100%',aspectRatio:'3 / 4',maxHeight:'58vh',overflow:'hidden',borderRadius:18,background:'#05070b',border:'1px solid var(--border)'}}>
          <video ref={videoRef} playsInline muted autoPlay style={{width:'100%',height:'100%',objectFit:'cover'}}/>
          <div style={{position:'absolute',inset:'18%',border:'3px solid #ff7a1a',borderRadius:22,boxShadow:'0 0 0 999px rgba(0,0,0,.28)',pointerEvents:'none'}}/>
          {state==='starting'&&<div style={{position:'absolute',inset:0,display:'grid',placeItems:'center',background:'rgba(5,7,11,.76)'}}><Camera size={58}/></div>}
        </div>
        <h3 style={{marginTop:16}}>{msg}</h3>
        <p className="muted">Mantenha o QR dentro do quadrado. A leitura é automática.</p>
      </>}

      {state==='validating'&&<><RefreshCw size={70} className="scan-warn"/><h2>{msg}</h2><p className="muted">Aguarde alguns segundos.</p></>}
      {state==='ok'&&<><CheckCircle2 size={76} className="scan-ok"/><h2>{msg}</h2><p className="muted">Conexão Paulista Jiu-Jitsu</p><Link className="btn btn-primary" href="/meu-painel">Voltar ao meu painel</Link></>}
      {state==='login'&&<><LogIn size={76} className="scan-warn"/><h2>{msg}</h2><p className="muted">Conexão Paulista Jiu-Jitsu</p><Link className="btn btn-primary" href={`/login?next=${encodeURIComponent(token?`/check-in/scan?token=${token}`:'/check-in/scan')}`}><LogIn size={16}/> Fazer login</Link></>}
      {state==='error'&&<><XCircle size={76} className="scan-error"/><h2>{msg}</h2><p className="muted">Se o QR tiver expirado, aponte para o código novo exibido pelo professor.</p><button className="btn btn-primary" onClick={retry}><Camera size={17}/> Abrir câmera novamente</button></>}
      {state==='unsupported'&&<><Camera size={76} className="scan-warn"/><h2>{msg}</h2><p className="muted">Use a câmera padrão do celular para apontar para o QR do professor e toque no link exibido. O link abrirá este app e confirmará a presença normalmente.</p><div className="notice" style={{marginTop:14}}>No Android/Chrome compatível, a câmera abre diretamente pelo botão Check-in. Em navegadores sem leitor QR interno, a câmera do próprio aparelho continua sendo a alternativa.</div><button className="btn btn-secondary" onClick={retry}><RefreshCw size={17}/> Tentar novamente</button><Link className="btn btn-primary" href="/meu-painel"><ExternalLink size={17}/> Voltar ao painel</Link></>}
    </div>
  </main>;
}

export default function Scan(){return <Suspense fallback={<div className="empty">Abrindo câmera...</div>}><ScanContent/></Suspense>}
