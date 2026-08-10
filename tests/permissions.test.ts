import {describe,it,expect} from 'vitest';
import {canAccessPath,homeForRole} from '@/lib/permissions';
describe('permissões de rota',()=>{
  it('mantém cada perfil no próprio painel',()=>{expect(homeForRole.admin).toBe('/dashboard');expect(homeForRole.professor).toBe('/professor');expect(homeForRole.aluno).toBe('/meu-painel')});
  it('bloqueia aluno em áreas administrativas',()=>{expect(canAccessPath('aluno','/usuarios')).toBe(false);expect(canAccessPath('aluno','/relatorios')).toBe(false);expect(canAccessPath('aluno','/aulas')).toBe(true)});
  it('bloqueia professor nas configurações administrativas',()=>{expect(canAccessPath('professor','/configuracoes')).toBe(false);expect(canAccessPath('professor','/alunos')).toBe(true)});
});
