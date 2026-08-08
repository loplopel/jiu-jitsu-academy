'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';

export default function UpdatePassword(){
  const [password,setPassword]=useState('');
  const [confirm,setConfirm]=useState('');
  const [error,setError]=useState('');
  const [ready,setReady]=useState(false);
  const [checking,setChecking]=useState(true);
  const router=useRouter();

  useEffect(()=>{
    let mounted=true;
    async function prepare(){
      const sb=getSupabaseBrowserClient();
      if(!sb){if(mounted){setError('Configure o Supabase primeiro.');setChecking(false);}return;}

      const params=new URLSearchParams(window.location.search);
      const urlError=params.get('error_description')||params.get('error');
      const errorCode=params.get('error_code');
      if(urlError||errorCode){
        if(mounted){
          setError('Este link expirou ou já foi utilizado. Solicite um novo link para criar sua senha.');
          setChecking(false);
        }
        return;
      }

      const code=params.get('code');
      if(code){
        const {error:exchangeError}=await sb.auth.exchangeCodeForSession(code);
        if(exchangeError){
          if(mounted){setError('Este link expirou ou já foi utilizado. Solicite um novo link para criar sua senha.');setChecking(false);}
          return;
        }
        if(mounted){setReady(true);setChecking(false);}
        return;
      }

      // Alguns fluxos do Supabase restauram a sessão automaticamente pelo hash/cookie.
      const {data:{session}}=await sb.auth.getSession();
      if(!mounted)return;
      if(session)setReady(true);
      else setError('Este link expirou ou já foi utilizado. Solicite um novo link para criar sua senha.');
      setChecking(false);
    }
    void prepare();
    return()=>{mounted=false};
  },[]);

  async function save(ev:React.FormEvent){
    ev.preventDefault();
    setError('');
    if(password.length<8){setError('Use pelo menos 8 caracteres.');return;}
    if(password!==confirm){setError('As senhas não coincidem.');return;}
    const sb=getSupabaseBrowserClient();
    if(!sb){setError('Configure o Supabase primeiro.');return;}
    const {error:updateError}=await sb.auth.updateUser({password});
    if(updateError){
      setError(updateError.message==='Auth session missing!'?'Sua sessão de recuperação expirou. Solicite um novo link.':updateError.message);
      return;
    }
    await sb.auth.signOut();
    router.push('/login?password=updated');
  }

  return <main className="auth-panel" style={{minHeight:'100vh'}}>
    <div className="card auth-box">
      <h2>Criar nova senha</h2>
      {checking&&<div className="notice">Validando seu link...</div>}
      {!checking&&error&&<>
        <div className="notice error">{error}</div>
        <div className="form-stack" style={{marginTop:14}}>
          <Link className="btn btn-primary" href="/forgot-password">Enviar novo link</Link>
          <Link href="/login" style={{textAlign:'center',fontSize:13}}>Voltar ao login</Link>
        </div>
      </>}
      {!checking&&ready&&<form className="form-stack" onSubmit={save}>
        <input className="input" type="password" placeholder="Nova senha" value={password} onChange={e=>setPassword(e.target.value)} required/>
        <input className="input" type="password" placeholder="Confirmar nova senha" value={confirm} onChange={e=>setConfirm(e.target.value)} required/>
        {error&&<div className="notice error">{error}</div>}
        <button className="btn btn-primary">Salvar nova senha</button>
      </form>}
    </div>
  </main>
}
