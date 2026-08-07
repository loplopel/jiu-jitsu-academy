'use client';
import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

type InstallPromptEvent = Event & { prompt:()=>Promise<void>; userChoice:Promise<{outcome:'accepted'|'dismissed'}> };

export function PwaRegister(){
  const [prompt,setPrompt]=useState<InstallPromptEvent|null>(null);
  const [show,setShow]=useState(false);
  useEffect(()=>{
    if (
      'serviceWorker' in navigator &&
      window.location.hostname !== 'localhost' &&
      window.location.hostname !== '127.0.0.1'
    ) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
    const handler=(e:Event)=>{e.preventDefault();setPrompt(e as InstallPromptEvent);setShow(true)};
    window.addEventListener('beforeinstallprompt',handler);
    return()=>window.removeEventListener('beforeinstallprompt',handler);
  },[]);
  if(!show||!prompt) return null;
  return <div className="install-banner"><div><strong>Instalar Conexão Paulista</strong><span>Use como aplicativo no celular, com acesso pela tela inicial.</span></div><div className="toolbar"><button className="btn btn-primary" onClick={async()=>{await prompt.prompt();const choice=await prompt.userChoice;if(choice.outcome==='accepted')setShow(false)}}><Download size={15}/> Instalar</button><button className="btn btn-secondary" aria-label="Fechar" onClick={()=>setShow(false)}><X size={15}/></button></div></div>
}
