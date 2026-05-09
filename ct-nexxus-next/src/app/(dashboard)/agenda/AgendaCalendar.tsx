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
          return (
            <div className="p-1 overflow-hidden">
              <div className="font-bold text-xs truncate">{arg.event.title}</div>
              {arg.event.extendedProps?.telefone && (
                <div className="text-[10px] opacity-80 truncate">{arg.event.extendedProps.telefone}</div>
              )}
            </div>
          )
        }}
        height="auto"
      />
      <style jsx global>{`
        .fc-theme-standard td, .fc-theme-standard th {
          border-color: #e2e8f0;
        }
        .fc-col-header-cell-cushion {
          color: #475569;
          font-weight: 700;
          text-decoration: none;
        }
        .fc-timegrid-slot-label-cushion {
          color: #64748b;
        }
        .fc-event {
          border-radius: 6px;
          border: none;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
        .fc-v-event {
          background-color: #3b82f6; /* blue-500 */
        }
        .fc-button-primary {
          background-color: #2563eb !important;
          border-color: #2563eb !important;
        }
        .fc-button-primary:hover {
          background-color: #1d4ed8 !important;
        }
        .fc-button-primary:disabled {
          background-color: #93c5fd !important;
        }
        .fc .fc-toolbar-title {
          font-size: 1.5rem;
          font-weight: 800;
          color: #1e293b;
        }
      `}</style>
    </div>
  )
}
