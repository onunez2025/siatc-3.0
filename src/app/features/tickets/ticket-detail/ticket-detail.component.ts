import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Ticket } from '../../../core/services/ticket.service';

@Component({
  selector: 'app-ticket-detail',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (ticket) {
      <div class="flex flex-col h-full">
        <!-- Scrollable Content -->
        <div class="flex-1 overflow-y-auto">

          <!-- Hero Header -->
          <div class="px-4 md:px-6 py-5 border-b border-slate-200" [ngClass]="statusHeaderClass">
            <div class="flex items-center justify-between mb-3">
              <span class="text-xl md:text-2xl font-black text-slate-800 tracking-tight">#{{ ticket.Ticket }}</span>
              <span class="px-3 py-1 rounded text-[11px] font-bold uppercase tracking-wider" [ngClass]="statusBadgeClass">
                {{ ticket.Estado }}
              </span>
            </div>
            <p class="text-sm text-slate-500">{{ ticket.Asunto || ticket.subject }}</p>
            <div class="flex items-center gap-4 mt-3 text-xs text-slate-400">
              <span class="flex items-center gap-1">
                <span class="material-icons text-sm">event</span>
                {{ ticket.FechaVisita | date:'dd MMM yyyy, HH:mm' }}
              </span>
              <span class="flex items-center gap-1">
                <span class="material-icons text-sm">call</span>
                {{ ticket.LlamadaFSM || '—' }}
              </span>
            </div>
          </div>

          <!-- Sections -->
          <div class="p-4 md:p-6 space-y-4 md:space-y-5">

            <!-- Cliente -->
            <section class="bg-white border border-slate-200 rounded-lg overflow-hidden">
              <div class="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                <span class="material-icons text-primary text-base">person</span>
                <h3 class="text-xs font-bold text-slate-600 uppercase tracking-wider">Cliente</h3>
              </div>
              <div class="p-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                <div class="sm:col-span-2">
                  <span class="text-[10px] font-bold text-slate-400 uppercase">Nombre</span>
                  <p class="text-sm font-semibold text-slate-800 mt-0.5">{{ ticket.NombreCliente }}</p>
                </div>
                <div>
                  <span class="text-[10px] font-bold text-slate-400 uppercase">ID Cliente</span>
                  <p class="text-sm text-slate-600 mt-0.5 font-mono">{{ ticket.IdCliente }}</p>
                </div>
                <div>
                  <span class="text-[10px] font-bold text-slate-400 uppercase">Cod. Externo</span>
                  <p class="text-sm text-slate-600 mt-0.5 font-mono">{{ ticket.CodigoExternoCliente }}</p>
                </div>
                <div>
                  <span class="text-[10px] font-bold text-slate-400 uppercase">Email</span>
                  <p class="text-sm text-slate-600 mt-0.5">{{ ticket.Email || '—' }}</p>
                </div>
                <div>
                  <span class="text-[10px] font-bold text-slate-400 uppercase">Celular</span>
                  <p class="text-sm text-slate-600 mt-0.5">{{ ticket.Celular1 || '—' }}</p>
                </div>
              </div>
            </section>

            <!-- Ubicación -->
            <section class="bg-white border border-slate-200 rounded-lg overflow-hidden">
              <div class="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                <span class="material-icons text-primary text-base">location_on</span>
                <h3 class="text-xs font-bold text-slate-600 uppercase tracking-wider">Ubicación</h3>
              </div>
              <div class="p-4 grid grid-cols-2 gap-x-6 gap-y-3">
                <div class="col-span-2">
                  <span class="text-[10px] font-bold text-slate-400 uppercase">Dirección</span>
                  <p class="text-sm text-slate-700 mt-0.5">{{ ticket.Calle }} {{ ticket.NumeroCalle }}</p>
                </div>
                <div>
                  <span class="text-[10px] font-bold text-slate-400 uppercase">Distrito</span>
                  <p class="text-sm text-slate-600 mt-0.5">{{ ticket.Distrito }}</p>
                </div>
                <div>
                  <span class="text-[10px] font-bold text-slate-400 uppercase">Ciudad</span>
                  <p class="text-sm text-slate-600 mt-0.5">{{ ticket.Ciudad }}</p>
                </div>
                <div>
                  <span class="text-[10px] font-bold text-slate-400 uppercase">Referencia</span>
                  <p class="text-sm text-slate-600 mt-0.5">{{ ticket.Referencia || '—' }}</p>
                </div>
                <div>
                  <span class="text-[10px] font-bold text-slate-400 uppercase">Cod. Postal</span>
                  <p class="text-sm text-slate-600 mt-0.5">{{ ticket.CodigoPostal || '—' }}</p>
                </div>
                @if (ticket.Latitud && ticket.Longitud) {
                  <div class="col-span-2 mt-1">
                    <a 
                      [href]="'https://www.google.com/maps?q=' + ticket.Latitud + ',' + ticket.Longitud" 
                      target="_blank"
                      class="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-medium"
                    >
                      <span class="material-icons text-sm">map</span>
                      Ver en Google Maps
                    </a>
                  </div>
                }
              </div>
            </section>

            <!-- Equipo -->
            <section class="bg-white border border-slate-200 rounded-lg overflow-hidden">
              <div class="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                <span class="material-icons text-primary text-base">precision_manufacturing</span>
                <h3 class="text-xs font-bold text-slate-600 uppercase tracking-wider">Equipo</h3>
              </div>
              <div class="p-4 grid grid-cols-2 gap-x-6 gap-y-3">
                <div class="col-span-2">
                  <span class="text-[10px] font-bold text-slate-400 uppercase">Nombre Equipo</span>
                  <p class="text-sm font-semibold text-slate-800 mt-0.5">{{ ticket.NombreEquipo }}</p>
                </div>
                <div>
                  <span class="text-[10px] font-bold text-slate-400 uppercase">ID Equipo</span>
                  <p class="text-sm text-slate-600 mt-0.5 font-mono">{{ ticket.IdEquipo }}</p>
                </div>
                <div>
                  <span class="text-[10px] font-bold text-slate-400 uppercase">Cod. Externo</span>
                  <p class="text-sm text-slate-600 mt-0.5 font-mono">{{ ticket.CodigoExternoEquipo }}</p>
                </div>
                <div>
                  <span class="text-[10px] font-bold text-slate-400 uppercase">Tipo Servicio</span>
                  <p class="text-sm text-slate-600 mt-0.5">{{ ticket.IdServicio }}</p>
                </div>
                <div>
                  <span class="text-[10px] font-bold text-slate-400 uppercase">Empresa</span>
                  <p class="text-sm text-slate-600 mt-0.5">{{ ticket.IDEmpresa }}</p>
                </div>
              </div>
            </section>

            <!-- Técnico -->
            <section class="bg-white border border-slate-200 rounded-lg overflow-hidden">
              <div class="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                <span class="material-icons text-primary text-base">engineering</span>
                <h3 class="text-xs font-bold text-slate-600 uppercase tracking-wider">Técnico Asignado</h3>
              </div>
              <div class="p-4 grid grid-cols-2 gap-x-6 gap-y-3">
                <div class="col-span-2">
                  <span class="text-[10px] font-bold text-slate-400 uppercase">Nombre</span>
                  <p class="text-sm font-semibold text-slate-800 mt-0.5">{{ ticket.NombreTecnico }} {{ ticket.ApellidoTecnico }}</p>
                </div>
                <div>
                  <span class="text-[10px] font-bold text-slate-400 uppercase">Código</span>
                  <p class="text-sm text-slate-600 mt-0.5 font-mono">{{ ticket.CodigoTecnico || '—' }}</p>
                </div>
              </div>
            </section>

            <!-- Ejecución -->
            <section class="bg-white border border-slate-200 rounded-lg overflow-hidden">
              <div class="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                <span class="material-icons text-primary text-base">task_alt</span>
                <h3 class="text-xs font-bold text-slate-600 uppercase tracking-wider">Ejecución</h3>
              </div>
              <div class="p-4 space-y-3">
                <div class="flex items-center gap-6">
                  <div class="flex items-center gap-2">
                    @if (ticket.VisitaRealizada) {
                      <div class="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                        <span class="material-icons text-green-600 text-sm">check</span>
                      </div>
                      <span class="text-xs font-medium text-green-700">Visita Realizada</span>
                    } @else {
                      <div class="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center">
                        <span class="material-icons text-slate-400 text-sm">remove</span>
                      </div>
                      <span class="text-xs font-medium text-slate-500">Visita Pendiente</span>
                    }
                  </div>
                  <div class="flex items-center gap-2">
                    @if (ticket.TrabajoRealizado) {
                      <div class="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                        <span class="material-icons text-green-600 text-sm">check</span>
                      </div>
                      <span class="text-xs font-medium text-green-700">Trabajo Realizado</span>
                    } @else {
                      <div class="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center">
                        <span class="material-icons text-slate-400 text-sm">remove</span>
                      </div>
                      <span class="text-xs font-medium text-slate-500">Trabajo Pendiente</span>
                    }
                  </div>
                </div>

                @if (ticket.SolicitaNuevaVisita) {
                  <div class="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded">
                    <span class="material-icons text-amber-600 text-sm">warning</span>
                    <span class="text-xs font-medium text-amber-700">Solicita Nueva Visita</span>
                    @if (ticket.MotivoNuevaVisita) {
                      <span class="text-xs text-amber-600 ml-1">— {{ ticket.MotivoNuevaVisita }}</span>
                    }
                  </div>
                }

                <div class="grid grid-cols-2 gap-x-6 gap-y-3 pt-2">
                  <div>
                    <span class="text-[10px] font-bold text-slate-400 uppercase">Check-Out</span>
                    <p class="text-sm text-slate-600 mt-0.5">{{ ticket.CheckOut ? (ticket.CheckOut | date:'dd/MM/yyyy HH:mm') : '—' }}</p>
                  </div>
                  <div>
                    <span class="text-[10px] font-bold text-slate-400 uppercase">Últ. Modificación</span>
                    <p class="text-sm text-slate-600 mt-0.5">{{ ticket.FechaUltimaModificacion ? (ticket.FechaUltimaModificacion | date:'dd/MM/yyyy HH:mm') : '—' }}</p>
                  </div>
                </div>

                @if (ticket.ComentarioTecnico) {
                  <div class="pt-2">
                    <span class="text-[10px] font-bold text-slate-400 uppercase">Comentario Técnico</span>
                    <p class="text-sm text-slate-700 mt-1 bg-slate-50 p-3 rounded border border-slate-100 leading-relaxed">{{ ticket.ComentarioTecnico }}</p>
                  </div>
                }

                @if (ticket.ComentarioProgramador) {
                  <div class="pt-1">
                    <span class="text-[10px] font-bold text-slate-400 uppercase">Comentario Programador</span>
                    <p class="text-sm text-slate-700 mt-1 bg-slate-50 p-3 rounded border border-slate-100 leading-relaxed">{{ ticket.ComentarioProgramador }}</p>
                  </div>
                }
              </div>
            </section>

            <!-- Cancelación (solo si aplica) -->
            @if (ticket.Motivo_Cancelacion) {
              <section class="bg-white border border-red-200 rounded-lg overflow-hidden">
                <div class="px-4 py-2.5 bg-red-50 border-b border-red-200 flex items-center gap-2">
                  <span class="material-icons text-red-500 text-base">cancel</span>
                  <h3 class="text-xs font-bold text-red-600 uppercase tracking-wider">Cancelación</h3>
                </div>
                <div class="p-4 grid grid-cols-2 gap-x-6 gap-y-3">
                  <div class="col-span-2">
                    <span class="text-[10px] font-bold text-slate-400 uppercase">Motivo</span>
                    <p class="text-sm text-red-700 mt-0.5 font-medium">{{ ticket.Motivo_Cancelacion }}</p>
                  </div>
                  <div>
                    <span class="text-[10px] font-bold text-slate-400 uppercase">Autorizador</span>
                    <p class="text-sm text-slate-600 mt-0.5">{{ ticket.Autorizador_Cancelacion || '—' }}</p>
                  </div>
                  <div>
                    <span class="text-[10px] font-bold text-slate-400 uppercase">Fecha</span>
                    <p class="text-sm text-slate-600 mt-0.5">{{ ticket.FechaCancelacion ? (ticket.FechaCancelacion | date:'dd/MM/yyyy HH:mm') : '—' }}</p>
                  </div>
                </div>
              </section>
            }

            <!-- Meta Info -->
            <section class="bg-white border border-slate-200 rounded-lg overflow-hidden">
              <div class="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                <span class="material-icons text-primary text-base">info</span>
                <h3 class="text-xs font-bold text-slate-600 uppercase tracking-wider">Información Adicional</h3>
              </div>
              <div class="p-4 grid grid-cols-2 gap-x-6 gap-y-3">
                <div>
                  <span class="text-[10px] font-bold text-slate-400 uppercase">Cod. Motivo Incidente</span>
                  <p class="text-sm text-slate-600 mt-0.5">{{ ticket.CodMotivoIncidente || '—' }}</p>
                </div>
                <div>
                  <span class="text-[10px] font-bold text-slate-400 uppercase">Modificación IT</span>
                  <p class="text-sm text-slate-600 mt-0.5">{{ ticket.FechaModificacionIT ? (ticket.FechaModificacionIT | date:'dd/MM/yyyy HH:mm') : '—' }}</p>
                </div>
                <div>
                  <span class="text-[10px] font-bold text-slate-400 uppercase">Última Sincronización</span>
                  <p class="text-sm text-slate-600 mt-0.5">{{ ticket.LastSync ? (ticket.LastSync | date:'dd/MM/yyyy HH:mm') : '—' }}</p>
                </div>
              </div>
            </section>

          </div>
        </div>

        <!-- Footer Actions (sticky on mobile) -->
        <div class="px-4 md:px-6 py-3 border-t border-slate-200 bg-white flex items-center justify-between shrink-0 sticky bottom-0">
          <button 
            (click)="close.emit()" 
            class="px-4 py-2.5 md:py-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl md:rounded text-sm font-medium transition-colors"
          >
            Cerrar
          </button>
          <button 
            (click)="edit.emit(ticket)" 
            class="px-5 py-2.5 md:py-2 bg-primary hover:bg-primary/90 text-white font-bold text-xs uppercase tracking-wide rounded-xl md:rounded shadow-sm transition-all flex items-center gap-1.5"
          >
            <span class="material-icons text-sm">edit</span>
            Editar Ticket
          </button>
        </div>
      </div>
    }
  `
})
export class TicketDetailComponent implements OnChanges {
  @Input() ticket: Ticket | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() edit = new EventEmitter<Ticket>();

  statusBadgeClass = '';
  statusHeaderClass = '';

  ngOnChanges(changes: SimpleChanges) {
    if (changes['ticket'] && this.ticket) {
      this.updateStatusClasses();
    }
  }

  private updateStatusClasses() {
    const estado = this.ticket?.Estado || '';
    switch (estado) {
      case 'Released':
        this.statusBadgeClass = 'bg-blue-50 text-blue-700 border border-blue-200';
        this.statusHeaderClass = 'bg-blue-50/30';
        break;
      case 'Ready to plan':
        this.statusBadgeClass = 'bg-amber-50 text-amber-700 border border-amber-200';
        this.statusHeaderClass = 'bg-amber-50/30';
        break;
      case 'Closed':
        this.statusBadgeClass = 'bg-green-50 text-green-700 border border-green-200';
        this.statusHeaderClass = 'bg-green-50/30';
        break;
      case 'Cancelled':
        this.statusBadgeClass = 'bg-red-50 text-red-700 border border-red-200';
        this.statusHeaderClass = 'bg-red-50/30';
        break;
      default:
        this.statusBadgeClass = 'bg-slate-50 text-slate-700 border border-slate-200';
        this.statusHeaderClass = '';
    }
  }
}
