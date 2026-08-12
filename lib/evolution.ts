import {calculateIEA,ieaStatus} from './iea';

export type AttendanceLike={student_id:string;checked_in_at:string};
export type EventLike={student_id:string;events?:{event_type?:string}|null};
export type GraduationLike={student_id:string;graduation_date:string};
export type StudentLike={id:string;start_date?:string|null;last_graduation_date?:string|null;degrees?:number|null;belts?:{name?:string;minimum_months?:number;sort_order?:number}|null};

const clamp=(n:number)=>Math.max(0,Math.min(100,n));
const daysBetween=(a:Date,b:Date)=>Math.max(0,Math.floor((b.getTime()-a.getTime())/86400000));
const monthsBetween=(a:Date,b:Date)=>Math.max(0,(b.getFullYear()-a.getFullYear())*12+b.getMonth()-a.getMonth());

function weeklyStreak(dates:Date[],now:Date){
  const weekKey=(d:Date)=>{const x=new Date(d);x.setHours(0,0,0,0);const day=(x.getDay()+6)%7;x.setDate(x.getDate()-day);return x.toISOString().slice(0,10)};
  const weeks=new Set(dates.map(weekKey));
  let cursor=new Date(now);let streak=0;
  for(let i=0;i<52;i++){const key=weekKey(cursor);if(weeks.has(key))streak++;else if(i>0)break;cursor.setDate(cursor.getDate()-7)}
  return streak;
}

export function buildEvolution(student:StudentLike,attendance:AttendanceLike[],events:EventLike[],graduations:GraduationLike[],now=new Date()){
  const mine=attendance.filter(a=>a.student_id===student.id).map(a=>new Date(a.checked_in_at)).sort((a,b)=>a.getTime()-b.getTime());
  const d30=new Date(now);d30.setDate(d30.getDate()-30);const d60=new Date(now);d60.setDate(d60.getDate()-60);const d90=new Date(now);d90.setDate(d90.getDate()-90);
  const count30=mine.filter(d=>d>=d30).length,count60=mine.filter(d=>d>=d60).length,count90=mine.filter(d=>d>=d90).length;
  const activeWeeks=new Set(mine.filter(d=>d>=d60).map(d=>{const x=new Date(d);const day=(x.getDay()+6)%7;x.setDate(x.getDate()-day);return x.toISOString().slice(0,10)})).size;
  const streakWeeks=weeklyStreak(mine,now);
  const start=student.start_date?new Date(student.start_date):now;const trainingMonths=monthsBetween(start,now);
  const lastGrad=student.last_graduation_date?new Date(student.last_graduation_date):start;const monthsInBelt=monthsBetween(lastGrad,now);
  const minimumMonths=Number(student.belts?.minimum_months||0);
  const eventMine=events.filter(e=>e.student_id===student.id);const eventCount=eventMine.length;const competitionCount=eventMine.filter(e=>e.events?.event_type==='campeonato').length;
  const graduationCount=graduations.filter(g=>g.student_id===student.id).length;
  const frequency=clamp(count90/24*100);
  const attendanceScore=clamp(activeWeeks/8*100);
  const streakScore=clamp(streakWeeks/8*100);
  const trainingScore=clamp(trainingMonths/24*100);
  const eventScore=clamp(eventCount/4*100);
  const competitionScore=clamp(competitionCount/3*100);
  const degreeProgress=clamp(Number(student.degrees||0)/4*100);
  const timeProgress=minimumMonths>0?clamp(monthsInBelt/minimumMonths*100):clamp(monthsInBelt/12*100);
  const graduationProgress=clamp(degreeProgress*.55+timeProgress*.45);
  const score=calculateIEA({frequency,attendance:attendanceScore,streak:streakScore,trainingMonths:trainingScore,events:eventScore,competitions:competitionScore,graduationProgress});
  const lastTraining=mine.length?mine[mine.length-1]:null;const daysAbsent=lastTraining?daysBetween(lastTraining,now):null;
  const risk=daysAbsent===null?'sem_historico':daysAbsent>=30?'alto':daysAbsent>=14?'atencao':'normal';

  const attendanceSinceGraduation=mine.filter(d=>d>=lastGrad).length;
  const currentDegrees=Math.max(0,Math.min(4,Number(student.degrees||0)));
  const beltEligible=currentDegrees>=4;
  const degreeEligible=!beltEligible&&attendanceSinceGraduation>=70;
  const classesToNextDegree=beltEligible?0:Math.max(0,70-attendanceSinceGraduation);

  return {
    score,status:ieaStatus(score),attendance30:count30,attendance60:count60,attendance90:count90,totalAttendance:mine.length,streakWeeks,trainingMonths,monthsInBelt,eventCount,competitionCount,graduationCount,lastTrainingAt:lastTraining?.toISOString()||null,daysAbsent,risk,
    attendanceSinceGraduation,classesToNextDegree,degreeEligible,beltEligible,
    components:{frequency,attendance:attendanceScore,streak:streakScore,trainingTime:trainingScore,events:eventScore,competitions:competitionScore,graduation:graduationProgress}
  };
}
