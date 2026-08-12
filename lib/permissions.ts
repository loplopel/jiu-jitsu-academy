import type { Role } from './types';

export const permissions: Record<Role,string[]> = {
  admin:['dashboard:view','professors:manage','students:manage','schedules:manage','graduations:view','categories:manage','reports:export','notifications:send','users:manage','permissions:manage'],
  professor:['dashboard:view','students:create','students:view','classes:manage','classes:capacity','reservations:view','qr:generate','attendance:confirm','notes:manage','stats:view','graduations:view','graduations:manage'],
  aluno:['classes:view','reservations:manage','qr:scan','history:view','frequency:view','evolution:view','graduation:view','notifications:view','profile:weight'],
};

export function can(role:Role,permission:string){return permissions[role].includes(permission)}

export const homeForRole: Record<Role,string> = {
  admin:'/dashboard',
  professor:'/professor',
  aluno:'/meu-painel',
};

const pageRules: Array<{prefix:string;roles:Role[]}> = [
  {prefix:'/dashboard',roles:['admin']},
  {prefix:'/usuarios',roles:['admin']},
  {prefix:'/configuracoes',roles:['admin']},
  {prefix:'/relatorios',roles:['admin']},
  {prefix:'/cadastros',roles:['admin']},
  {prefix:'/professor',roles:['professor','admin']},
  {prefix:'/alunos',roles:['admin','professor']},
  {prefix:'/check-in/scan',roles:['aluno']},
  {prefix:'/check-in',roles:['admin','professor']},
  {prefix:'/meu-painel',roles:['aluno']},
  {prefix:'/aulas',roles:['admin','professor','aluno']},
  {prefix:'/graduacoes',roles:['admin','professor','aluno']},
  {prefix:'/notificacoes',roles:['admin','aluno']},
  {prefix:'/perfil',roles:['admin','aluno']},
];

export function canAccessPath(role:Role,pathname:string){
  if(pathname==='/ranking'||pathname.startsWith('/ranking/')||pathname==='/eventos'||pathname.startsWith('/eventos/')) return false;
  const rule=pageRules.find(({prefix})=>pathname===prefix||pathname.startsWith(`${prefix}/`));
  return rule ? rule.roles.includes(role) : true;
}
