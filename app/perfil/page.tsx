'use client';
import {useEffect,useState} from 'react';
import {AppShell} from '@/components/app-shell';
import {getSupabaseBrowserClient} from '@/lib/supabase-browser';
import type {Role} from '@/lib/types';

const ageRows=[
  ['Pré Mirim','4 e 5 anos','Branca, Cinza'],['Mirim','6 e 7 anos','Branca, Cinza'],['Infantil A','8 e 9 anos','Branca, Cinza, Amarela, Laranja, Verde'],['Infantil B','10 e 11 anos','Branca, Cinza, Amarela, Laranja, Verde'],['Infanto A','12 e 13 anos','Branca, Cinza, Amarela, Laranja, Verde'],['Infanto B','14 e 15 anos','Branca, Cinza, Amarela, Laranja, Verde'],['Juvenil','16 e 17 anos','Branca, Azul e Roxa'],['Adulto','18 até 29 anos','Branca, Azul, Roxa, Marrom e Preta'],['Master 1','30 até 35 anos','Branca, Azul, Roxa, Marrom e Preta'],['Master 2','36 até 40 anos','Branca, Azul, Roxa, Marrom e Preta'],['Master 3','41 até 45 anos','Branca, Azul, Roxa, Marrom e Preta'],['Master 4','46 até 50 anos','Branca, Azul, Roxa, Marrom e Preta'],['Master 5','51 até 55 anos','Branca, Azul, Roxa, Marrom e Preta'],['Master 6','Acima de 56 anos','Branca, Azul, Roxa, Marrom e Preta'],
];
const male=[['Galo','53,50','57,50'],['Pluma','59,00','64,00'],['Pena','64,00','70,00'],['Leve','69,00','76,00'],['Médio','74,30','82,30'],['Meio-pesado','79,30','88,30'],['Pesado','84,30','94,30'],['Super-pesado','89,50','100,50'],['Pesadíssimo','Acima de 89,50','Acima de 100,50']];
const female=[['Galo','44,00','48,50'],['Pluma','48,00','53,50'],['Pena','52,00','58,50'],['Leve','56,00','64,00'],['Médio','60,00','69,00'],['Meio-pesado','64,00','74,00'],['Pesado','68,00','79,30'],['Super-pesado','72,50','84,30'],['Pesadíssimo','Acima de 72,50','Acima de 84,30']];

type StudentView={name:string;belt:string;degrees:number;category:string;weight:number|string;start_date?:string;professor:string;sex?:string};
export default function Page(){
  const[role,setRole]=useState<Role>('aluno');const[name,setName]=useState('');const[phone,setPhone]=useState('');const[username,setUsername]=useState('');const[contact,setContact]=useState('');const[msg,setMsg]=useState('');const[student,setStudent]=useState<StudentView>({name:'',belt:'-',degrees:0,category:'-',weight:'',professor:'-'});const[saving,setSaving]=useState(false);
  async function load(){const sb=getSupabaseBrowserClient();if(!sb)return;const {data:{user}}=await sb.auth.getUser();if(!user)return;const {data}=await sb.from('profiles').select('name,phone,username,contact_email,role').eq('id',user.id).single();const r=(data?.role||'aluno') as Role;setRole(r);setName(data?.name||'');setPhone(data?.phone||'');setUsername(data?.username||'');setContact(data?.contact_email||'');if(r==='aluno'){const {data:s}=await sb.from('students').select('weight,sex,degrees,start_date,belts(name),categories(name),responsible:profiles!students_responsible_professor_id_fkey(name)').eq('id',user.id).single();const belt=Array.isArray(s?.belts)?s?.belts[0]:s?.belts;const category=Array.isArray(s?.categories)?s?.categories[0]:s?.categories;const responsible=Array.isArray((s as any)?.responsible)?(s as any).responsible[0]:(s as any)?.responsible;setStudent({name:data?.name||'',weight:s?.weight??'',sex:s?.sex||'',degrees:Number(s?.degrees||0),start_date:s?.start_date||'',belt:(belt as any)?.name||'-',category:(category as any)?.name||'-',professor:responsible?.name||'-'})}}
  useEffect(()=>{void load()},[]);
  async function saveAdmin(e:React.FormEvent){e.preventDefault();const sb=getSupabaseBrowserClient();if(!sb){setMsg('Configure o Supabase para salvar.');return;}const {data:{user}}=await sb.auth.getUser();if(!user)return;const {error}=await sb.from('profiles').update({name,phone}).eq('id',user.id);setMsg(error?error.message:'Perfil atualizado com sucesso.')}
  async function saveWeight(e:React.FormEvent){e.preventDefault();setSaving(true);setMsg('Salvando peso...');const r=await fetch('/api/profile/student-weight',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({weight:Number(student.weight)})});const j=await r.json();if(r.ok){setMsg('Peso e categoria atualizados com sucesso.');setStudent(s=>({...s,weight:j.weight,category:j.category||s.category}))}else setMsg(j.error||'Falha ao atualizar peso.');setSaving(false)}

  if(role==='aluno')return <AppShell>
    <section className="hero"><h1>Meu perfil</h1><div className="muted">Seus dados esportivos são administrados pela equipe. Você pode atualizar somente o seu peso.</div></section>
    <form className="card student-profile-card" onSubmit={saveWeight}>
      <div className="grid grid-2">
        <div><label className="label">Nome</label><div className="readonly-field">{student.name||'-'}</div></div>
        <div><label className="label">Faixa</label><div className="readonly-field">{student.belt} • {student.degrees} grau(s)</div></div>
        <div><label className="label">Categoria</label><div className="readonly-field">{student.category}</div></div>
        <div><label className="label">Professor responsável</label><div className="readonly-field">{student.professor}</div></div>
        <div><label className="label">Data de início</label><div className="readonly-field">{student.start_date?new Date(student.start_date+'T12:00:00').toLocaleDateString('pt-BR'):'-'}</div></div>
        <div><label className="label">Peso (kg)</label><input className="input" type="number" min="20" max="300" step="0.1" value={student.weight} onChange={e=>setStudent(s=>({...s,weight:e.target.value}))} required/></div>
      </div>
      <div className="toolbar" style={{marginTop:16}}><button className="btn btn-primary" disabled={saving}>{saving?'Salvando...':'Atualizar meu peso'}</button></div>
      {msg&&<div className={msg.includes('sucesso')?'notice success':'notice error'} style={{marginTop:14}}>{msg}</div>}
    </form>

    <section className="profile-reference-section"><div className="section-title"><div><h2>Tabela de peso • com kimono</h2><p className="muted">Referência usada para a categoria de Juvenil, Adulto e Master.</p></div></div><div className="grid grid-2 weight-reference-grid"><WeightTable title="Masculino" rows={male} active={student.sex?.toLowerCase().startsWith('m')?student.category.split(' - ').pop():''}/><WeightTable title="Feminino" rows={female} active={student.sex?.toLowerCase().startsWith('f')?student.category.split(' - ').pop():''}/></div></section>
    <section className="card profile-age-table"><div className="section-title"><div><h2>Categorias por idade e faixas</h2><p className="muted">Referência etária usada no cadastro esportivo.</p></div></div><div className="table-wrap"><table className="table"><thead><tr><th>Categoria</th><th>Idades</th><th>Faixas</th></tr></thead><tbody>{ageRows.map(r=><tr key={r[0]}><td><strong>{r[0]}</strong></td><td>{r[1]}</td><td>{r[2]}</td></tr>)}</tbody></table></div></section>
  </AppShell>;

  return <AppShell><section className="hero"><h1>Meu perfil</h1><div className="muted">Seus dados de administrador. Login e senha são administrados pela academia.</div></section><form className="card" style={{padding:22,maxWidth:720}} onSubmit={saveAdmin}><div className="form-stack"><div><label className="label">Nome</label><input className="input" value={name} onChange={e=>setName(e.target.value)}/></div><div><label className="label">Login</label><input className="input" value={username} disabled/></div>{contact&&<div><label className="label">E-mail de contato</label><input className="input" value={contact} disabled/></div>}<div><label className="label">Telefone</label><input className="input" value={phone} onChange={e=>setPhone(e.target.value)}/></div><div className="notice">Para trocar login ou senha, use Usuários e acessos.</div><button className="btn btn-primary">Salvar alterações</button>{msg&&<div className="notice success">{msg}</div>}</div></form></AppShell>;
}

function WeightTable({title,rows,active}:{title:string;rows:string[][];active?:string}){return <div className="card weight-table-card"><h3>{title}</h3><div className="table-wrap"><table className="table"><thead><tr><th>Categoria</th><th>Juvenil</th><th>Adulto e Master</th></tr></thead><tbody>{rows.map(r=><tr key={r[0]} className={active===r[0]?'current-weight-row':''}><td><strong>{r[0]}{active===r[0]?<span className="current-category-tag">Sua categoria</span>:null}</strong></td><td>{r[1]}</td><td>{r[2]}</td></tr>)}</tbody></table></div></div>}
