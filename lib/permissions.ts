import type { Role } from './types';
export const permissions: Record<Role,string[]> = {
  admin:['dashboard:view','professors:manage','students:manage','schedules:manage','graduations:manage','categories:manage','plans:manage','fees:manage','events:manage','reports:export','notifications:send','users:manage','permissions:manage'],
  professor:['dashboard:view','students:create','students:view','classes:manage','classes:capacity','reservations:view','qr:generate','attendance:confirm','notes:manage','stats:view'],
  aluno:['profile:edit','classes:view','reservations:manage','qr:scan','history:view','frequency:view','evolution:view','graduation:view','notifications:view']
};
export function can(role:Role,permission:string){return permissions[role].includes(permission)}
