import {describe,it,expect} from 'vitest';
import {buildEvolution} from '@/lib/evolution';

describe('regra de graduação por aulas',()=>{
  it('libera um grau ao completar 70 aulas desde a última graduação',()=>{
    const now=new Date('2026-08-12T12:00:00Z');
    const attendance=Array.from({length:70},(_,i)=>({student_id:'s1',checked_in_at:new Date(Date.UTC(2026,4,1+i)).toISOString()}));
    const evo=buildEvolution({id:'s1',start_date:'2026-04-01',degrees:2,belts:{name:'Azul',minimum_months:0,sort_order:2}},attendance,[],[],now);
    expect(evo.degreeEligible).toBe(true);
    expect(evo.classesToNextDegree).toBe(0);
  });

  it('após o 4º grau sinaliza troca de faixa',()=>{
    const evo=buildEvolution({id:'s1',start_date:'2025-01-01',degrees:4,belts:{name:'Azul',minimum_months:0,sort_order:2}},[],[],[],new Date('2026-08-12T12:00:00Z'));
    expect(evo.beltEligible).toBe(true);
    expect(evo.degreeEligible).toBe(false);
  });
  it('faixa preta mantém presença mas não usa a regra de 70 aulas',()=>{
    const now=new Date('2026-08-12T12:00:00Z');
    const attendance=Array.from({length:140},(_,i)=>({student_id:'s1',checked_in_at:new Date(Date.UTC(2026,0,1+i)).toISOString()}));
    const evo=buildEvolution({id:'s1',start_date:'2025-01-01',degrees:4,belts:{name:'Preta',minimum_months:0,sort_order:5}},attendance,[],[],now);
    expect(evo.totalAttendance).toBe(140);
    expect(evo.isBlackBelt).toBe(true);
    expect(evo.degreeEligible).toBe(false);
    expect(evo.classesToNextDegree).toBe(0);
  });

});
