export type IEAInput={frequency:number;streak:number;trainingMonths:number;events:number;competitions:number;graduationProgress:number;attendance:number};
const clamp=(n:number)=>Math.max(0,Math.min(100,n));
export function calculateIEA(i:IEAInput){const score=clamp(i.frequency)*.25+clamp(i.attendance)*.2+clamp(i.streak)*.12+clamp(i.trainingMonths)*.12+clamp(i.events)*.08+clamp(i.competitions)*.08+clamp(i.graduationProgress)*.15;return Math.round(score*10)/10}
export function ieaStatus(v:number){if(v>=80)return 'Apto para avaliação';if(v>=60)return 'Evolução consistente';if(v>=40)return 'Acompanhar';return 'Risco de evasão'}
