export type IEAInput={frequency:number;streak:number;trainingMonths:number;events:number;competitions:number;graduationProgress:number;attendance:number};
const clamp=(n:number)=>Math.max(0,Math.min(100,n));
export function calculateIEA(i:IEAInput){const score=clamp(i.frequency)*.30+clamp(i.attendance)*.20+clamp(i.streak)*.15+clamp(i.trainingMonths)*.10+clamp(i.events)*.10+clamp(i.competitions)*.05+clamp(i.graduationProgress)*.10;return Math.round(score*10)/10}
export function ieaStatus(v:number){if(v>=80)return 'Excelente evolução';if(v>=60)return 'Boa evolução';if(v>=40)return 'Em desenvolvimento';return 'Atenção'}
