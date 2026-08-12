import {describe,it,expect} from 'vitest';
import {canAccessPath,homeForRole} from '@/lib/permissions';
describe('permissões de rota',()=>{
  it('mantém cada perfil no próprio painel',()=>{expect(homeForRole.admin).toBe('/dashboard');expect(homeForRole.professor).toBe('/professor');expect(homeForRole.aluno).toBe('/meu-painel')});
  it('bloqueia aluno em áreas administrativas',()=>{expect(canAccessPath('aluno','/usuarios')).toBe(false);expect(canAccessPath('aluno','/relatorios')).toBe(false);expect(canAccessPath('aluno','/aulas')).toBe(true)});
  it('mantém professor somente nas áreas operacionais',()=>{expect(canAccessPath('professor','/configuracoes')).toBe(false);expect(canAccessPath('professor','/alunos')).toBe(true);expect(canAccessPath('professor','/graduacoes')).toBe(true);expect(canAccessPath('professor','/perfil')).toBe(false)});
  it('remove ranking e eventos de todos os perfis',()=>{for(const role of ['admin','professor','aluno'] as const){expect(canAccessPath(role,'/ranking')).toBe(false);expect(canAccessPath(role,'/eventos')).toBe(false)}});
});
