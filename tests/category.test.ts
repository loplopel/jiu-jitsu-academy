import {describe,it,expect} from 'vitest';
import {competitionCategory,allowedBelts} from '@/lib/competition-category';
const ref=new Date('2026-08-11T12:00:00');
describe('categorias esportivas',()=>{
  it('classifica Master 2 masculino leve',()=>expect(competitionCategory('1988-01-01','Masculino',75,ref).label).toBe('Master 2 - Leve'));
  it('classifica Juvenil feminino pena',()=>expect(competitionCategory('2009-01-01','Feminino',50,ref).label).toBe('Juvenil - Pena'));
  it('usa somente faixa etaria quando a tabela infantil nao traz peso',()=>expect(competitionCategory('2016-01-01','Masculino',35,ref).label).toBe('Infantil B'));
  it('limita faixas por idade',()=>expect(allowedBelts(16)).toEqual(['Branca','Azul','Roxa']));
});
