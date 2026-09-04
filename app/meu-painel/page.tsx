'use client';

import Link from 'next/link';
import {useEffect,useMemo,useState} from 'react';
import {AppShell} from '@/components/app-shell';
import {
  CalendarDays,
  ScanLine,
  Award,
  UserCircle,
  Clock,
  Users,
  CheckCircle2,
  TrendingUp,
  CalendarCheck,
  GraduationCap,
  ChevronRight,
  ChevronLeft,
  X,
} from 'lucide-react';

type Dashboard={
  profile:{
    name:string;
    avatar_url?:string|null;
  };

  student:{
    start_date?:string|null;
    degrees:number;
    weight?:number|null;
    belt:string;
    category:string;
    professor:string;
  };

  evolution:{
    score:number;
    status:string;
    totalAttendance:number;
    streakWeeks:number;
    attendanceSinceGraduation:number;
    classesToNextDegree:number;
    degreeEligible:boolean;
    beltEligible:boolean;
    isBlackBelt:boolean;
  };

  attendance:{
    total:number;
    month:number;
    year:number;
    months:number[];

    /*
     * Dias exatos em que o aluno teve presença.
     * Exemplo:
     * ["2026-08-12","2026-08-17","2026-08-26"]
     */
    days:string[];

    recent:{
      checked_in_at:string;
      title:string;
    }[];

    yearLabel:number;
  };

  upcoming:{
    id:string;
    title:string;
    starts_at:string;
    ends_at:string;
    capacity:number;
    reservations:number;
    my_reservation_status?:string|null;
    professor_name:string;
  }[];
};

const monthNames=[
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
];

const fullMonthNames=[
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

const weekDays=['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

function pad(value:number){
  return String(value).padStart(2,'0');
}

function dateKey(year:number,month:number,day:number){
  return `${year}-${pad(month+1)}-${pad(day)}`;
}

export default function Page(){

  const[data,setData]=useState<Dashboard|null>(null);
  const[loading,setLoading]=useState(true);
  const[msg,setMsg]=useState('');
  const[busy,setBusy]=useState('');

  /*
   * Mês atualmente aberto no calendário.
   * Começa no mês atual.
   */
  const[currentCalendarMonth,setCurrentCalendarMonth]=useState(
    new Date().getMonth()
  );

  const[calendarOpen,setCalendarOpen]=useState(false);

  async function load(){

    setLoading(true);

    try{

      const r=await fetch(
        '/api/student/dashboard',
        {cache:'no-store'}
      );

      const j=await r.json();

      if(r.ok){

        setData(j);

      }else{

        setMsg(
          j.error||
          'Falha ao carregar seu painel.'
        );

      }

    }catch{

      setMsg(
        'Não foi possível carregar seu painel.'
      );

    }finally{

      setLoading(false);

    }

  }

  useEffect(()=>{

    void load();

  },[]);

  const next=data?.upcoming?.[0]||null;

  const progress=useMemo(()=>{

    if(!data)return 0;

    if(data.evolution.isBlackBelt)return 0;
    if(data.evolution.beltEligible)return 100;

    return Math.min(
      100,
      Math.round(
        (
          data.evolution.attendanceSinceGraduation/
          70
        )*100
      )
    );

  },[data]);

  async function reserve(
    classId:string,
    cancel=false
  ){

    setBusy(classId);

    try{

      const r=await fetch(
        '/api/reservations',
        {
          method:cancel?'DELETE':'POST',
          headers:{
            'content-type':'application/json'
          },
          body:JSON.stringify({
            class_id:classId
          })
        }
      );

      const j=await r.json();

      setMsg(
        r.ok
          ?(
            cancel
              ?'Reserva cancelada.'
              :'Aula reservada com sucesso.'
          )
          :(
            j.error||
            'Falha ao atualizar reserva.'
          )
      );

      if(r.ok){

        await load();

      }

    }catch{

      setMsg(
        'Falha ao atualizar reserva.'
      );

    }finally{

      setBusy('');

    }

  }

  /*
   * Abre o calendário no mês selecionado.
   */
  function openCalendar(month:number){

    setCurrentCalendarMonth(month);
    setCalendarOpen(true);

  }

  /*
   * Presenças do mês atualmente aberto.
   */
  const currentMonthAttendance=useMemo(()=>{

    if(!data)return 0;

    return data.attendance.days.filter(
      value=>{
        const parts=value.split('-');

        return (
          Number(parts[0])===
            data.attendance.yearLabel&&
          Number(parts[1])===
            currentCalendarMonth+1
        );
      }
    ).length;

  },[data,currentCalendarMonth]);

  /*
   * Gera os dias do calendário.
   */
  const calendarDays=useMemo(()=>{

    if(!data)return [];

    const year=data.attendance.yearLabel;

    const firstDay=
      new Date(
        year,
        currentCalendarMonth,
        1
      ).getDay();

    const totalDays=
      new Date(
        year,
        currentCalendarMonth+1,
        0
      ).getDate();

    const previousMonthTotal=
      new Date(
        year,
        currentCalendarMonth,
        0
      ).getDate();

    const cells:{
      day:number;
      currentMonth:boolean;
      key:string;
    }[]=[];

    /*
     * Dias do mês anterior.
     */
    for(
      let i=firstDay-1;
      i>=0;
      i--
    ){

      const day=
        previousMonthTotal-i;

      cells.push({
        day,
        currentMonth:false,
        key:`prev-${day}-${i}`
      });

    }

    /*
     * Dias do mês atual.
     */
    for(
      let day=1;
      day<=totalDays;
      day++
    ){

      cells.push({
        day,
        currentMonth:true,
        key:`current-${day}`
      });

    }

    /*
     * Completa a última semana.
     */
    let nextDay=1;

    while(cells.length%7!==0){

      cells.push({
        day:nextDay,
        currentMonth:false,
        key:`next-${nextDay}`
      });

      nextDay++;

    }

    return cells;

  },[data,currentCalendarMonth]);

  /*
   * Verifica se um determinado dia teve check-in.
   */
  function hasAttendance(day:number){

    if(!data)return false;

    const key=dateKey(
      data.attendance.yearLabel,
      currentCalendarMonth,
      day
    );

    return data.attendance.days.includes(key);

  }

  /*
   * Navegação entre meses.
   */
  function previousMonth(){

    setCurrentCalendarMonth(
      month=>Math.max(0,month-1)
    );

  }

  function nextMonth(){

    setCurrentCalendarMonth(
      month=>Math.min(11,month+1)
    );

  }

  if(loading){

    return (
      <AppShell>

        <div className="student-dashboard-skeleton">

          <div/>
          <div/>
          <div/>

        </div>

      </AppShell>
    );

  }

  if(!data){

    return (
      <AppShell>

        <div className="empty-state">

          {msg||
            'Não foi possível carregar seu painel.'
          }

        </div>

      </AppShell>
    );

  }

  return (
    <AppShell>

      <section className="student-welcome student-welcome-v2">

        <div>

          <span className="eyebrow">

            OLÁ,{' '}
            {data.profile.name
              .split(' ')[0]
              .toUpperCase()}

          </span>

          <h1>
            Seu treino, sua faixa,
            seu progresso.
          </h1>

          <p>
            A próxima aula e o caminho
            para a próxima graduação ficam aqui.
          </p>

        </div>

        <div className="student-belt-summary">

          <span>Faixa atual</span>

          <strong>
            {data.student.belt}
          </strong>

          <small>
            {data.student.degrees} grau(s)
            {' • '}
            {data.student.category}
          </small>

        </div>

      </section>

      {msg&&(

        <div
          className={
            msg.includes('sucesso')||
            msg.includes('cancelada')
              ?'notice success'
              :'notice'
          }
          style={{marginBottom:14}}
        >
          {msg}
        </div>

      )}

      {next?(
        <section className="card student-next-class student-next-class-v2">

          <div className="split">

            <span className="pill">
              PRÓXIMA AULA
            </span>

            <span className="muted">

              {new Date(
                next.starts_at
              ).toLocaleDateString(
                'pt-BR',
                {
                  weekday:'long',
                  day:'2-digit',
                  month:'short'
                }
              )}

            </span>

          </div>

          <h2>
            {next.title}
          </h2>

          <div className="next-class-meta">

            <span>

              <Clock size={16}/>

              {new Date(
                next.starts_at
              ).toLocaleTimeString(
                'pt-BR',
                {
                  hour:'2-digit',
                  minute:'2-digit'
                }
              )}

            </span>

            <span>

              <Users size={16}/>

              {next.reservations}/
              {next.capacity}
              {' '}vagas ocupadas

            </span>

            <span>

              <GraduationCap size={16}/>

              {next.professor_name}

            </span>

          </div>

          <div className="toolbar">

            {next.my_reservation_status==='reserved'?

              <button
                className="btn btn-secondary"
                disabled={busy===next.id}
                onClick={()=>
                  void reserve(
                    next.id,
                    true
                  )
                }
              >
                Cancelar reserva
              </button>

              :

              <button
                className="btn btn-primary"
                disabled={
                  busy===next.id||
                  next.reservations>=
                    next.capacity
                }
                onClick={()=>
                  void reserve(next.id)
                }
              >

                <CalendarDays size={16}/>

                {next.reservations>=
                  next.capacity
                  ?'Aula lotada'
                  :'Reservar aula'
                }

              </button>

            }

            <Link
              href="/check-in/scan"
              className="btn btn-secondary"
            >

              <ScanLine size={16}/>

              Check-in

            </Link>

          </div>

        </section>

      ):(

        <div className="empty-state">

          Ainda não há uma próxima aula aberta.
          A agenda aparecerá aqui assim que
          o professor publicar.

        </div>

      )}

      <section
        className={
          `card graduation-progress-card ${
            data.evolution.degreeEligible||
            data.evolution.beltEligible||
            data.evolution.isBlackBelt
              ?'ready'
              :''
          }`
        }
      >

        <div className="graduation-progress-head">

          <div>

            <span className="eyebrow">
              PROGRESSO DE GRADUAÇÃO
            </span>

            <h2>

              {data.evolution.isBlackBelt
                ?'Faixa preta'
                :data.evolution.beltEligible
                  ?'Apto à avaliação para troca de faixa'
                  :data.evolution.degreeEligible
                    ?'Apto ao próximo grau'
                    :`${data.evolution.attendanceSinceGraduation} / 70 aulas`
              }

            </h2>

            <p>

              {data.evolution.isBlackBelt
                ?'Sua frequência continua sendo contabilizada. Os graus da faixa preta são definidos pela Federação e registrados pelo professor.'
                :data.evolution.beltEligible
                  ?'Você concluiu os 4 graus. A troca de faixa depende da avaliação do professor.'
                  :data.evolution.degreeEligible
                    ?`Você completou 70 aulas. O ${Math.min(4,data.student.degrees+1)}º grau já pode ser avaliado pelo professor.`
                    :`Faltam ${data.evolution.classesToNextDegree} treinos para liberar o próximo grau.`
              }

            </p>

          </div>

          <div className="graduation-circle">

            <strong>
              {data.evolution.isBlackBelt?'—':`${progress}%`}
            </strong>

            <span>
              {data.evolution.isBlackBelt?'Graduação externa':`${data.student.degrees}/4 graus`}
            </span>

          </div>

        </div>

        <div className="progress-track graduation-progress-track">

          <span
            style={{
              width:`${progress}%`
            }}
          />

        </div>

        <div className="graduation-progress-foot">

          <span>

            <Award size={15}/>

            Faixa {data.student.belt}

          </span>

          <span>

            <CalendarCheck size={15}/>

            {data.evolution.totalAttendance}
            {' '}treinos totais

          </span>

          <span>

            <TrendingUp size={15}/>

            {data.evolution.streakWeeks}
            {' '}semana(s) de sequência

          </span>

        </div>

      </section>

      <div className="grid grid-4 student-stats student-stats-v2">

        <div className="card stat">

          <span className="muted">
            Treinos no mês
          </span>

          <strong>
            {data.attendance.month}
          </strong>

          <small>

            {new Date().toLocaleDateString(
              'pt-BR',
              {month:'long'}
            )}

          </small>

        </div>

        <div className="card stat">

          <span className="muted">
            Treinos no ano
          </span>

          <strong>
            {data.attendance.year}
          </strong>

          <small>
            {data.attendance.yearLabel}
          </small>

        </div>

        <div className="card stat">

          <span className="muted">
            Sequência
          </span>

          <strong>
            {data.evolution.streakWeeks}
          </strong>

          <small>
            semana(s)
          </small>

        </div>

        <div className="card stat">

          <span className="muted">
            IEA atual
          </span>

          <strong>
            {Number(
              data.evolution.score||0
            ).toFixed(0)}
          </strong>

          <small>
            {data.evolution.status}
          </small>

        </div>

      </div>

      {/* FREQUÊNCIA */}

      <section className="card attendance-history-card">

        <div className="section-title">

          <div>

            <h2>
              Minha frequência em{' '}
              {data.attendance.yearLabel}
            </h2>

            <p className="muted">
              Toque em um mês para ver
              os dias em que você treinou.
            </p>

          </div>

          <Link
            href="/graduacoes"
            className="btn btn-secondary"
          >

            Ver evolução

            <ChevronRight size={15}/>

          </Link>

        </div>

        <div className="student-month-grid">

          {monthNames.map(
            (month,index)=>{

              const count=
                data.attendance.months[index]||0;

              return (

                <button
                  key={month}
                  type="button"
                  className={
                    `student-month-button ${
                      count>0
                        ?'has-training'
                        :''
                    }`
                  }
                  onClick={()=>
                    openCalendar(index)
                  }
                  aria-label={
                    `Ver frequência de ${fullMonthNames[index]}`
                  }
                >

                  <span>
                    {month}
                  </span>

                  <strong>
                    {count}
                  </strong>

                </button>

              );

            }
          )}

        </div>

        {data.attendance.recent.length>0&&(

          <div className="recent-training-list">

            <h3>
              Últimos treinos
            </h3>

            {data.attendance.recent
              .slice(0,5)
              .map(
                (row,index)=>(

                  <div
                    key={
                      `${row.checked_in_at}-${index}`
                    }
                  >

                    <CalendarCheck size={15}/>

                    <div>

                      <strong>
                        {row.title}
                      </strong>

                      <span>

                        {new Date(
                          row.checked_in_at
                        ).toLocaleDateString(
                          'pt-BR',
                          {
                            weekday:'short',
                            day:'2-digit',
                            month:'short'
                          }
                        )}

                        {' • '}

                        {new Date(
                          row.checked_in_at
                        ).toLocaleTimeString(
                          'pt-BR',
                          {
                            hour:'2-digit',
                            minute:'2-digit'
                          }
                        )}

                      </span>

                    </div>

                  </div>

                )
              )
            }

          </div>

        )}

      </section>

      {/* CALENDÁRIO */}

      {calendarOpen&&(

        <div
          className="attendance-calendar-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Calendário de frequência"
          onMouseDown={event=>{

            if(
              event.target===
              event.currentTarget
            ){

              setCalendarOpen(false);

            }

          }}
        >

          <div className="attendance-calendar-modal">

            <div className="attendance-calendar-header">

              <div>

                <span className="eyebrow">
                  MINHA FREQUÊNCIA
                </span>

                <h2>
                  {fullMonthNames[
                    currentCalendarMonth
                  ]}{' '}
                  {data.attendance.yearLabel}
                </h2>

                <p className="muted">

                  {currentMonthAttendance}
                  {' '}
                  {currentMonthAttendance===1
                    ?'treino realizado'
                    :'treinos realizados'
                  }

                </p>

              </div>

              <button
                type="button"
                className="attendance-calendar-close"
                onClick={()=>
                  setCalendarOpen(false)
                }
                aria-label="Fechar calendário"
              >

                <X size={20}/>

              </button>

            </div>

            <div className="attendance-calendar-navigation">

              <button
                type="button"
                className="attendance-calendar-nav"
                onClick={previousMonth}
                disabled={currentCalendarMonth===0}
                aria-label="Mês anterior"
              >

                <ChevronLeft size={18}/>

              </button>

              <strong>
                {fullMonthNames[
                  currentCalendarMonth
                ]}
              </strong>

              <button
                type="button"
                className="attendance-calendar-nav"
                onClick={nextMonth}
                disabled={currentCalendarMonth===11}
                aria-label="Próximo mês"
              >

                <ChevronRight size={18}/>

              </button>

            </div>

            <div className="attendance-calendar-weekdays">

              {weekDays.map(day=>(

                <span key={day}>
                  {day}
                </span>

              ))}

            </div>

            <div className="attendance-calendar-grid">

              {calendarDays.map(cell=>{

                const trained=
                  cell.currentMonth&&
                  hasAttendance(cell.day);

                return (

                  <div
                    key={cell.key}
                    className={
                      `attendance-calendar-day ${
                        cell.currentMonth
                          ?''
                          :'outside'
                      } ${
                        trained
                          ?'trained'
                          :''
                      }`
                    }
                  >

                    <span className="attendance-calendar-number">

                      {cell.day}

                    </span>

                    {trained&&(
                      <span
                        className="attendance-calendar-marker"
                        aria-label="Treino realizado"
                      />
                    )}

                  </div>

                );

              })}

            </div>

            <div className="attendance-calendar-legend">

              <span>

                <span className="attendance-calendar-legend-marker">
                  <span className="attendance-calendar-marker" />
                </span>

                Treino realizado

              </span>

              <span className="muted">
                Presença confirmada
              </span>

            </div>

          </div>

        </div>

      )}

      <section className="student-shortcuts student-shortcuts-v2">

        <Link
          href="/aulas"
          className="student-shortcut"
        >

          <CalendarDays/>

          <span>
            Agenda
          </span>

          <small>
            Próximas aulas e reservas
          </small>

        </Link>

        <Link
          href="/check-in/scan"
          className="student-shortcut"
        >

          <ScanLine/>

          <span>
            Check-in
          </span>

          <small>
            Confirmar presença
          </small>

        </Link>

        <Link
          href="/graduacoes"
          className="student-shortcut"
        >

          <Award/>

          <span>
            Evolução
          </span>

          <small>
            Faixa, graus e IEA
          </small>

        </Link>

        <Link
          href="/perfil"
          className="student-shortcut"
        >

          <UserCircle/>

          <span>
            Perfil
          </span>

          <small>
            Peso e categoria
          </small>

        </Link>

      </section>

      {!data.attendance.total&&(

        <div className="onboarding-tip">

          <CheckCircle2 size={18}/>

          <div>

            <strong>
              Seu histórico começa no primeiro check-in.
            </strong>

            <span>
              Depois disso, frequência, sequência
              e progresso de graduação serão
              alimentados automaticamente.
            </span>

          </div>

        </div>

      )}

    </AppShell>
  );

}