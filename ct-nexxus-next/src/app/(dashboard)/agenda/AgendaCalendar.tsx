"use client"

import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'

interface Props {
  initialEvents: any[]
}

export function AgendaCalendar({ initialEvents }: Props) {
  return (
    <div className="w-full">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        }}
        locale="pt-br"
        buttonText={{
          today: 'Hoje',
          month: 'Mês',
          week: 'Semana',
          day: 'Dia'
        }}
        allDaySlot={false}
        slotMinTime="06:00:00"
        slotMaxTime="23:00:00"
        events={initialEvents}
        eventContent={(arg) => {
          const { title, extendedProps } = arg.event
          return (
            <div className="p-1.5 overflow-hidden flex flex-col gap-1 h-full cursor-pointer hover:bg-black/5 rounded transition-colors group">
              <div className="font-bold text-[11px] uppercase tracking-wide leading-tight line-clamp-2">
                {title}
              </div>
              
              {extendedProps?.isCustom && extendedProps?.telefone && (
                <div className="text-[10px] opacity-90 truncate bg-white/20 px-1 py-0.5 rounded w-fit mt-auto">
                  <i className="bi bi-telephone-fill mr-1"></i>
                  {extendedProps.telefone}
                </div>
              )}

              {extendedProps?.alunosList && extendedProps.alunosList.length > 0 && (
                <div className="mt-1 flex-1 overflow-hidden">
                  <div className="text-[9px] font-medium opacity-80 mb-0.5 border-b border-white/20 pb-0.5">Alunos:</div>
                  <div className="flex flex-col gap-0.5">
                    {extendedProps.alunosList.slice(0, 5).map((aluno: any, i: number) => (
                      <div key={i} className="text-[10px] truncate leading-tight opacity-95 flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-white/60 shrink-0"></span>
                        {aluno.nome.split(' ')[0]} {aluno.nome.split(' ')[1] ? aluno.nome.split(' ')[1][0] + '.' : ''}
                      </div>
                    ))}
                    {extendedProps.alunosList.length > 5 && (
                      <div className="text-[9px] italic opacity-80 mt-0.5">
                        +{extendedProps.alunosList.length - 5} mais...
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        }}
        height="auto"
      />
      <style jsx global>{`
        .fc {
          font-family: inherit;
          --fc-border-color: #e2e8f0;
          --fc-button-bg-color: #ffffff;
          --fc-button-border-color: #cbd5e1;
          --fc-button-text-color: #475569;
          --fc-button-hover-bg-color: #f8fafc;
          --fc-button-hover-border-color: #94a3b8;
          --fc-button-active-bg-color: #eff6ff;
          --fc-button-active-border-color: #3b82f6;
          --fc-today-bg-color: #f0fdf4;
        }
        .fc-theme-standard td, .fc-theme-standard th {
          border-color: var(--fc-border-color);
        }
        .fc-col-header-cell-cushion {
          color: #334155;
          font-weight: 800;
          text-transform: uppercase;
          font-size: 0.8rem;
          padding: 8px 4px !important;
          text-decoration: none !important;
        }
        .fc-timegrid-slot-label-cushion {
          color: #64748b;
          font-weight: 600;
          font-size: 0.75rem;
        }
        .fc-event {
          border-radius: 6px;
          border: none;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          overflow: hidden;
        }
        .fc-v-event {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          border: 1px solid rgba(255,255,255,0.1);
        }
        .fc-button {
          font-weight: 600 !important;
          text-transform: capitalize !important;
          border-radius: 8px !important;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05) !important;
          transition: all 0.2s ease !important;
        }
        .fc-button-primary:not(:disabled).fc-button-active, .fc-button-primary:not(:disabled):active {
          background-color: var(--fc-button-active-bg-color) !important;
          border-color: var(--fc-button-active-border-color) !important;
          color: #1d4ed8 !important;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.05) !important;
        }
        .fc-button-primary {
          color: var(--fc-button-text-color) !important;
          background-color: var(--fc-button-bg-color) !important;
          border-color: var(--fc-button-border-color) !important;
        }
        .fc-button-primary:hover {
          background-color: var(--fc-button-hover-bg-color) !important;
          border-color: var(--fc-button-hover-border-color) !important;
          color: #1e293b !important;
        }
        .fc .fc-toolbar-title {
          font-size: 1.75rem;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.025em;
        }
        .fc-timegrid-now-indicator-line {
          border-color: #ef4444;
          border-width: 2px;
        }
        .fc-timegrid-now-indicator-arrow {
          border-color: #ef4444;
          border-width: 6px;
        }
      `}</style>
    </div>
  )
}
