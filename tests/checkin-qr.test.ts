import {describe,expect,it} from 'vitest';
import {extractCheckinToken} from '@/lib/checkin-qr';

describe('QR do check-in',()=>{
  it('extrai token da URL gerada pelo professor',()=>{
    expect(extractCheckinToken('https://academia.test/check-in/scan?token=abc123456789')).toBe('abc123456789');
  });
  it('aceita token bruto',()=>{
    expect(extractCheckinToken('abc123456789')).toBe('abc123456789');
  });
  it('rejeita conteúdo inválido',()=>{
    expect(extractCheckinToken('texto qualquer')).toBe('');
  });
});
