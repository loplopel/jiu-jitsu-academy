import Link from 'next/link';
import {AppShell} from '@/components/app-shell';
import {Users,Clock3,Tags,Award} from 'lucide-react';

const cards=[
  {title:'Professores',desc:'Perfis, contato, situação e permissões.',href:'/cadastros/professores',Icon:Users},
  {title:'Horários',desc:'Grade semanal, professor e limite de alunos.',href:'/cadastros/horarios',Icon:Clock3},
  {title:'Categorias',desc:'Peso, idade, sexo e grupos competitivos.',href:'/cadastros/categorias',Icon:Tags},
  {title:'Graduações',desc:'Faixas, graus e tempo mínimo.',href:'/cadastros/graduacoes',Icon:Award},
];

export default function Page(){return <AppShell>
  <section className="hero"><h1>Cadastros administrativos</h1><div className="muted">Professores, horários, categorias e parâmetros esportivos da equipe.</div></section>
  <div className="grid grid-3">{cards.map(({title,desc,href,Icon})=><div className="card stat cadastro-card" key={title}>
    <span className="pill"><Icon size={14}/> CADASTRO</span><h2>{title}</h2><p className="muted">{desc}</p>
    <Link className="btn btn-secondary cadastro-link" href={href}>Gerenciar</Link>
  </div>)}</div>
</AppShell>}
