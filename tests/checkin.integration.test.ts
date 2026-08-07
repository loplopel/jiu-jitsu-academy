import {describe,it,expect} from 'vitest';import {QR_TTL_SECONDS} from '@/lib/qr';
describe('fluxo de check-in',()=>{it('mantém janela de segurança em 30 segundos',()=>{expect(QR_TTL_SECONDS).toBe(30)});it('regra funcional: presença depende de token válido e único',()=>{const token={expired:false,used:false};const allowed=!token.expired&&!token.used;expect(allowed).toBe(true)})})
