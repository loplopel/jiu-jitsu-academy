export type Role='admin'|'professor'|'aluno';
export type Belt='Branca'|'Azul'|'Roxa'|'Marrom'|'Preta';
export type Profile={id:string;role:Role;name:string;email:string;avatar_url?:string|null};
export type ClassSession={id:string;title:string;starts_at:string;ends_at:string;capacity:number;status:'open'|'closed'|'cancelled';professor_name?:string;reservations?:number};
export type Student={id:string;name:string;email:string;phone?:string;cpf?:string;belt:Belt;degrees:number;status:'ativo'|'inativo'|'bloqueado';plan?:string};
