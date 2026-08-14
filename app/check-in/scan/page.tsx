'use client';

import {Suspense,useCallback,useEffect,useRef,useState} from 'react';
import {useSearchParams} from 'next/navigation';
import Link from 'next/link';
import {Camera,CheckCircle2,ExternalLink,ImageIcon,LogIn,RefreshCw,ScanLine,XCircle} from 'lucide-react';
import {extractCheckinToken} from '@/lib/checkin-qr';

type ScreenState='starting'|'camera'|'validating'|'ok'|'error'|'login'|'unsupported';

declare global{interface Window{jsQR?:any;__jsQrLoading?:Promise<any>}}

function loadJsQr(){
  if(typeof window==='undefined')return Promise.reject(new Error('browser only'));
  if(window.jsQR)return Promise.resolve(window.jsQR);
  if(window.__jsQrLoading)return window.__jsQrLoading;
  window.__jsQrLoading=new Promise((resolve,reject)=>{
    const existing=document.querySelector('script[data-jsqr="1"]') as HTMLScriptElement|null;
    if(existing){existing.addEventListener('load',()=>resolve(window.jsQR));existing.addEventListener('error',reject);return}
    const script=document.createElement('script');
    script.src='https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js';
    script.async=true;script.dataset.jsqr='1';
    script.onload=()=>window.jsQR?resolve(window.jsQR):reject(new Error('jsQR indisponível'));
    script.onerror=()=>reject(new Error('Falha ao carregar leitor QR'));
    document.head.appendChild(script);
  });
  return window.__jsQrLoading;
}

function ScanContent(){
  const sp=useSearchParams();
  const videoRef=useRef<HTMLVideoElement|null>(null);
  const canvasRef=useRef<HTMLCanvasElement|null>(null);
  const fileRef=useRef<HTMLInputElement|null>(null);
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

  const processRaw=useCallback((raw:string)=>{
    const found=extractCheckinToken(raw,window.location.origin);
    if(found){void submitToken(found);return true}
    setMsg('QR lido, mas ele não pertence ao check-in da academia.');
    return false;
  },[submitToken]);

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

    try{
      const stream=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:'environment'},width:{ideal:1280},height:{ideal:720}}});
      streamRef.current=stream;
      const video=videoRef.current;
      if(!video){stopCamera();return}
      video.srcObject=stream;
      await video.play();
      setState('camera');

      const Detector=(window as any).BarcodeDetector;
      let detector:any=null;
      let jsQR:any=null;
      if(Detector){
        try{
          if(typeof Detector.getSupportedFormats==='function'){
            const formats=await Detector.getSupportedFormats();
            if(Array.isArray(formats)&&formats.includes('qr_code'))detector=new Detector({formats:['qr_code']});
          }else detector=new Detector({formats:['qr_code']});
        }catch{}
      }
      if(!detector){
        setMsg('Câmera aberta. Preparando leitor compatível com iPhone...');
        try{jsQR=await loadJsQr();setMsg('Aponte a câmera para o QR da aula.')}catch{setMsg('Câmera aberta. Se a leitura não ocorrer, use o botão “Câmera/foto do iPhone”.')}
      }else setMsg('Aponte a câmera para o QR da aula.');

      let lastAttempt=0;
      const scan=async(now:number)=>{
        if(!streamRef.current||busyRef.current)return;
        if(now-lastAttempt>180&&video.readyState>=2){
          lastAttempt=now;
          try{
            let raw='';
            if(detector){
              const codes=await detector.detect(video);raw=String(codes?.[0]?.rawValue||'');
            }else if(jsQR&&video.videoWidth&&video.videoHeight){
              const canvas=canvasRef.current;
              if(canvas){
                const maxW=720,scale=Math.min(1,maxW/video.videoWidth);
                canvas.width=Math.max(1,Math.round(video.videoWidth*scale));canvas.height=Math.max(1,Math.round(video.videoHeight*scale));
                const ctx=canvas.getContext('2d',{willReadFrequently:true});
                if(ctx){ctx.drawImage(video,0,0,canvas.width,canvas.height);const image=ctx.getImageData(0,0,canvas.width,canvas.height);const code=jsQR(image.data,image.width,image.height,{inversionAttempts:'attemptBoth'});raw=String(code?.data||'')}
              }
            }
            if(raw&&processRaw(raw))return;
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
      else setMsg('Não foi possível abrir a câmera. Use o botão “Câmera/foto do iPhone” ou tente novamente.');
    }
  },[processRaw,stopCamera]);

  const scanFile=useCallback(async(file:File)=>{
    stopCamera();setState('validating');setMsg('Lendo o QR da imagem...');
    try{
      const jsQR=await loadJsQr();
      const bitmap=await createImageBitmap(file);
      const canvas=canvasRef.current;if(!canvas)throw new Error('canvas');
      const max=1400,scale=Math.min(1,max/Math.max(bitmap.width,bitmap.height));canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
      const ctx=canvas.getContext('2d',{willReadFrequently:true});if(!ctx)throw new Error('ctx');
      ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();
      const image=ctx.getImageData(0,0,canvas.width,canvas.height);const code=jsQR(image.data,image.width,image.height,{inversionAttempts:'attemptBoth'});
      if(!code?.data){setState('error');setMsg('Não encontramos um QR Code nesta imagem. Tente novamente aproximando mais a câmera.');return}
      if(!processRaw(String(code.data))){setState('error')}
    }catch{setState('error');setMsg('Não foi possível ler essa imagem. Tente novamente ou use a câmera padrão do iPhone para abrir o link do QR.')}
  },[processRaw,stopCamera]);

  useEffect(()=>{
    const direct=sp.get('token')||'';
    if(direct){void submitToken(direct)}else{void startCamera()}
    return()=>stopCamera();
  },[sp,startCamera,stopCamera,submitToken]);

  const retry=()=>void startCamera();

  return <main className="auth-panel" style={{minHeight:'100dvh',padding:'18px'}}>
    <div className="card auth-box scan-result" style={{width:'min(94vw,520px)',maxWidth:520}}>
      <canvas ref={canvasRef} style={{display:'none'}}/>
      <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{display:'none'}} onChange={e=>{const f=e.target.files?.[0];if(f)void scanFile(f);e.currentTarget.value=''}}/>

      {(state==='starting'||state==='camera')&&<>
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,marginBottom:12}}><ScanLine size={20}/><strong>Check-in por QR Code</strong></div>
        <div style={{position:'relative',width:'100%',aspectRatio:'3 / 4',maxHeight:'58vh',overflow:'hidden',borderRadius:18,background:'#05070b',border:'1px solid var(--border)'}}>
          <video ref={videoRef} playsInline muted autoPlay style={{width:'100%',height:'100%',objectFit:'cover'}}/>
          <div style={{position:'absolute',inset:'18%',border:'3px solid #ff7a1a',borderRadius:22,boxShadow:'0 0 0 999px rgba(0,0,0,.28)',pointerEvents:'none'}}/>
          {state==='starting'&&<div style={{position:'absolute',inset:0,display:'grid',placeItems:'center',background:'rgba(5,7,11,.76)'}}><Camera size={58}/></div>}
        </div>
        <h3 style={{marginTop:16}}>{msg}</h3>
        <p className="muted">Mantenha o QR dentro do quadrado. A leitura é automática.</p>
        <button className="btn btn-secondary" onClick={()=>fileRef.current?.click()}><ImageIcon size={17}/> Câmera/foto do iPhone</button>
      </>}

      {state==='validating'&&<><RefreshCw size={70} className="scan-warn"/><h2>{msg}</h2><p className="muted">Aguarde alguns segundos.</p></>}
      {state==='ok'&&<><CheckCircle2 size={76} className="scan-ok"/><h2>{msg}</h2><p className="muted">Conexão Paulista Jiu-Jitsu</p><Link className="btn btn-primary" href="/meu-painel">Voltar ao meu painel</Link></>}
      {state==='login'&&<><LogIn size={76} className="scan-warn"/><h2>{msg}</h2><p className="muted">Conexão Paulista Jiu-Jitsu</p><Link className="btn btn-primary" href={`/login?next=${encodeURIComponent(token?`/check-in/scan?token=${token}`:'/check-in/scan')}`}><LogIn size={16}/> Fazer login</Link></>}
      {state==='error'&&<><XCircle size={76} className="scan-error"/><h2>{msg}</h2><p className="muted">Se o QR tiver expirado, use o código novo exibido pelo professor.</p><div className="toolbar" style={{justifyContent:'center'}}><button className="btn btn-primary" onClick={retry}><Camera size={17}/> Abrir câmera novamente</button><button className="btn btn-secondary" onClick={()=>fileRef.current?.click()}><ImageIcon size={17}/> Câmera/foto do iPhone</button></div></>}
      {state==='unsupported'&&<><Camera size={76} className="scan-warn"/><h2>{msg}</h2><p className="muted">No iPhone, use o botão abaixo: ele abre a câmera nativa para fotografar o QR e o app faz a leitura da imagem.</p><button className="btn btn-primary" onClick={()=>fileRef.current?.click()}><ImageIcon size={17}/> Câmera/foto do iPhone</button><div className="notice" style={{marginTop:14}}>Outra opção é usar a câmera padrão do iPhone para apontar para o QR do professor e tocar no link exibido.</div><button className="btn btn-secondary" onClick={retry}><RefreshCw size={17}/> Tentar câmera interna</button><Link className="btn btn-secondary" href="/meu-painel"><ExternalLink size={17}/> Voltar ao painel</Link></>}
    </div>
  </main>;
}

export default function Scan(){return <Suspense fallback={<div className="empty">Abrindo câmera...</div>}><ScanContent/></Suspense>}
