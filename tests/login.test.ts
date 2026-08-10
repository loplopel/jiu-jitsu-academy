import {describe,it,expect} from 'vitest';import {normalizeLogin,isValidLogin} from '@/lib/login';
describe('login próprio',()=>{it('normaliza login',()=>{expect(normalizeLogin('  João.Silva  ')).toBe('joao.silva')});it('valida formato',()=>{expect(isValidLogin('rodrigo')).toBe(true);expect(isValidLogin('a')).toBe(false)})});
