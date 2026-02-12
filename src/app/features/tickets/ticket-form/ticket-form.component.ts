import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Ticket } from '../../../core/services/ticket.service';

@Component({
   selector: 'app-ticket-form',
   standalone: true,
   imports: [CommonModule, FormsModule],
   template: `
    <div class="flex flex-col h-full">
      <!-- Scrollable Content -->
      <div class="flex-1 overflow-y-auto">

        <!-- Hero Header (edit mode) -->
        @if (ticket) {
          <div class="px-4 md:px-6 py-4 border-b border-slate-200 bg-primary/5">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <span class="material-icons text-primary text-lg">edit_note</span>
              </div>
              <div>
                <p class="text-lg font-black text-slate-800 tracking-tight">#{{ ticket.Ticket }}</p>
                <p class="text-xs text-slate-400">Editando ticket</p>
              </div>
            </div>
          </div>
        }

        <div class="p-4 md:p-6 space-y-4 md:space-y-5">

          <!-- InformaciÃ³n General -->
          <section class="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div class="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
              <span class="material-icons text-primary text-base">info</span>
              <h3 class="text-xs font-bold text-slate-600 uppercase tracking-wider">InformaciÃ³n General</h3>
            </div>
            <div class="p-4 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
              @if (ticket) {
                <div>
                  <label class="text-[10px] font-bold text-slate-400 uppercase">ID Ticket</label>
                  <input [value]="ticket.Ticket" disabled
                    class="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-sm font-mono text-slate-400 cursor-not-allowed">
                </div>
              }
              <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase">Estado</label>
                <div class="relative mt-1">
                  <select [(ngModel)]="formData.Estado"
                    class="w-full px-3 py-2 bg-white border border-slate-200 rounded text-sm text-slate-800 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all appearance-none pr-8 text-slate-800">
                    <option value="Ready to plan">Ready to plan</option>
                    <option value="Released">Released</option>
                    <option value="Closed">Closed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                  <span class="material-icons absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-base">expand_more</span>
                </div>
              </div>
              <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase">Llamada FSM</label>
                <input [(ngModel)]="formData.LlamadaFSM"
                  class="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded text-sm text-slate-800 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
                  placeholder="â€”">
              </div>
              <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase">Fecha Visita</label>
                <input [(ngModel)]="formData.FechaVisita" type="datetime-local"
                  class="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded text-sm text-slate-800 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all">
              </div>
              <div class="sm:col-span-2">
                <label class="text-[10px] font-bold text-slate-400 uppercase">Tipo Servicio</label>
                <input [(ngModel)]="formData.IdServicio"
                  class="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded text-sm text-slate-800 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
                  placeholder="ID del tipo de servicio">
              </div>
            </div>
          </section>

          <!-- Cliente -->
          <section class="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div class="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
              <span class="material-icons text-primary text-base">person</span>
              <h3 class="text-xs font-bold text-slate-600 uppercase tracking-wider">Cliente</h3>
            </div>
            <div class="p-4 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
              <div class="sm:col-span-2">
                <label class="text-[10px] font-bold text-slate-400 uppercase">Nombre Cliente</label>
                <input [(ngModel)]="formData.NombreCliente"
                  class="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded text-sm text-slate-800 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
                  placeholder="Nombre del cliente">
              </div>
              <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase">ID Cliente</label>
                <input [(ngModel)]="formData.IdCliente"
                  class="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded text-sm text-slate-800 font-mono focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
                  placeholder="â€”">
              </div>
              <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase">Cod. Externo</label>
                <input [(ngModel)]="formData.CodigoExternoCliente"
                  class="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded text-sm text-slate-800 font-mono focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
                  placeholder="â€”">
              </div>
              <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase">Email</label>
                <input [(ngModel)]="formData.Email" type="email"
                  class="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded text-sm text-slate-800 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
                  placeholder="email@ejemplo.com">
              </div>
              <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase">Celular</label>
                <input [(ngModel)]="formData.Celular1"
                  class="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded text-sm text-slate-800 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
                  placeholder="â€”">
              </div>
            </div>
          </section>

          <!-- UbicaciÃ³n -->
          <section class="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div class="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
              <span class="material-icons text-primary text-base">location_on</span>
              <h3 class="text-xs font-bold text-slate-600 uppercase tracking-wider">UbicaciÃ³n</h3>
            </div>
            <div class="p-4 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
              <div class="sm:col-span-2">
                <label class="text-[10px] font-bold text-slate-400 uppercase">DirecciÃ³n</label>
                <input [(ngModel)]="formData.Calle"
                  class="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded text-sm text-slate-800 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
                  placeholder="Calle">
              </div>
              <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase">NÃºmero</label>
                <input [(ngModel)]="formData.NumeroCalle"
                  class="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded text-sm text-slate-800 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
                  placeholder="â€”">
              </div>
              <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase">Distrito</label>
                <input [(ngModel)]="formData.Distrito"
                  class="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded text-sm text-slate-800 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
                  placeholder="â€”">
              </div>
              <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase">Ciudad</label>
                <input [(ngModel)]="formData.Ciudad"
                  class="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded text-sm text-slate-800 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
                  placeholder="â€”">
              </div>
              <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase">Cod. Postal</label>
                <input [(ngModel)]="formData.CodigoPostal"
                  class="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded text-sm text-slate-800 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
                  placeholder="â€”">
              </div>
              <div class="sm:col-span-2">
                <label class="text-[10px] font-bold text-slate-400 uppercase">Referencia</label>
                <input [(ngModel)]="formData.Referencia"
                  class="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded text-sm text-slate-800 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
                  placeholder="Referencia de ubicaciÃ³n">
              </div>
            </div>
          </section>

          <!-- Equipo -->
          <section class="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div class="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
              <span class="material-icons text-primary text-base">precision_manufacturing</span>
              <h3 class="text-xs font-bold text-slate-600 uppercase tracking-wider">Equipo</h3>
            </div>
            <div class="p-4 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
              <div class="sm:col-span-2">
                <label class="text-[10px] font-bold text-slate-400 uppercase">Nombre Equipo</label>
                <input [(ngModel)]="formData.NombreEquipo"
                  class="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded text-sm text-slate-800 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
                  placeholder="Nombre del equipo">
              </div>
              <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase">ID Equipo</label>
                <input [(ngModel)]="formData.IdEquipo"
                  class="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded text-sm text-slate-800 font-mono focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
                  placeholder="â€”">
              </div>
              <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase">Cod. Externo</label>
                <input [(ngModel)]="formData.CodigoExternoEquipo"
                  class="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded text-sm text-slate-800 font-mono focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
                  placeholder="â€”">
              </div>
              <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase">Empresa</label>
                <input [(ngModel)]="formData.IDEmpresa"
                  class="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded text-sm text-slate-800 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
                  placeholder="â€”">
              </div>
            </div>
          </section>

          <!-- TÃ©cnico Asignado -->
          <section class="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div class="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
              <span class="material-icons text-primary text-base">engineering</span>
              <h3 class="text-xs font-bold text-slate-600 uppercase tracking-wider">TÃ©cnico Asignado</h3>
            </div>
            <div class="p-4 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
              <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase">Nombre</label>
                <input [(ngModel)]="formData.NombreTecnico"
                  class="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded text-sm text-slate-800 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
                  placeholder="Nombre del tÃ©cnico">
              </div>
              <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase">Apellido</label>
                <input [(ngModel)]="formData.ApellidoTecnico"
                  class="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded text-sm text-slate-800 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
                  placeholder="Apellido del tÃ©cnico">
              </div>
              <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase">CÃ³digo</label>
                <input [(ngModel)]="formData.CodigoTecnico"
                  class="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded text-sm text-slate-800 font-mono focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
                  placeholder="â€”">
              </div>
            </div>
          </section>

          <!-- EjecuciÃ³n -->
          <section class="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div class="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
              <span class="material-icons text-primary text-base">task_alt</span>
              <h3 class="text-xs font-bold text-slate-600 uppercase tracking-wider">EjecuciÃ³n</h3>
            </div>
            <div class="p-4 space-y-3">
              <!-- Checkboxes -->
              <div class="flex flex-col gap-2">
                <label class="flex items-center gap-3 px-3 py-2.5 rounded border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer group">
                  <input [(ngModel)]="formData.VisitaRealizada" type="checkbox"
                    class="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary/30">
                  <div class="flex items-center gap-2">
                    <span class="material-icons text-base" [ngClass]="formData.VisitaRealizada ? 'text-green-600' : 'text-slate-300'">
                      {{ formData.VisitaRealizada ? 'check_circle' : 'radio_button_unchecked' }}
                    </span>
                    <span class="text-sm font-medium text-slate-700">Visita Realizada</span>
                  </div>
                </label>

                <label class="flex items-center gap-3 px-3 py-2.5 rounded border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer group">
                  <input [(ngModel)]="formData.TrabajoRealizado" type="checkbox"
                    class="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary/30">
                  <div class="flex items-center gap-2">
                    <span class="material-icons text-base" [ngClass]="formData.TrabajoRealizado ? 'text-green-600' : 'text-slate-300'">
                      {{ formData.TrabajoRealizado ? 'check_circle' : 'radio_button_unchecked' }}
                    </span>
                    <span class="text-sm font-medium text-slate-700">Trabajo Realizado</span>
                  </div>
                </label>

                <label class="flex items-center gap-3 px-3 py-2.5 rounded border border-amber-200 bg-amber-50/50 hover:bg-amber-50 transition-colors cursor-pointer">
                  <input [(ngModel)]="formData.SolicitaNuevaVisita" type="checkbox"
                    class="w-4 h-4 rounded border-amber-300 text-amber-600 focus:ring-amber-300">
                  <div class="flex items-center gap-2">
                    <span class="material-icons text-base text-amber-500">replay</span>
                    <span class="text-sm font-medium text-amber-700">Solicita Nueva Visita</span>
                  </div>
                </label>
              </div>

              @if (formData.SolicitaNuevaVisita) {
                <div>
                  <label class="text-[10px] font-bold text-slate-400 uppercase">Motivo Nueva Visita</label>
                  <input [(ngModel)]="formData.MotivoNuevaVisita"
                    class="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded text-sm text-slate-800 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
                    placeholder="Describa el motivo...">
                </div>
              }

              <!-- Textareas -->
              <div class="pt-1">
                <label class="text-[10px] font-bold text-slate-400 uppercase">Comentario TÃ©cnico</label>
                <textarea [(ngModel)]="formData.ComentarioTecnico" rows="3"
                  class="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded text-sm text-slate-800 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all resize-none leading-relaxed text-slate-800"
                  placeholder="Observaciones del tÃ©cnico..."></textarea>
              </div>

              <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase">Comentario Programador</label>
                <textarea [(ngModel)]="formData.ComentarioProgramador" rows="3"
                  class="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded text-sm text-slate-800 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all resize-none leading-relaxed text-slate-800"
                  placeholder="Notas de programaciÃ³n..."></textarea>
              </div>

              <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase">Causa TÃ©cnica</label>
                <textarea [(ngModel)]="formData.CausaTecnica" rows="2"
                  class="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded text-sm text-slate-800 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all resize-none leading-relaxed text-slate-800"
                  placeholder="Describa la causa tÃ©cnica..."></textarea>
              </div>
            </div>
          </section>

          <!-- CancelaciÃ³n (solo en ediciÃ³n y si estado es Cancelled) -->
          @if (formData.Estado === 'Cancelled') {
            <section class="bg-white border border-red-200 rounded-lg overflow-hidden">
              <div class="px-4 py-2.5 bg-red-50 border-b border-red-200 flex items-center gap-2">
                <span class="material-icons text-red-500 text-base">cancel</span>
                <h3 class="text-xs font-bold text-red-600 uppercase tracking-wider">CancelaciÃ³n</h3>
              </div>
              <div class="p-4 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                <div class="sm:col-span-2">
                  <label class="text-[10px] font-bold text-slate-400 uppercase">Motivo</label>
                  <input [(ngModel)]="formData.Motivo_Cancelacion"
                    class="mt-1 w-full px-3 py-2 bg-white border border-red-200 rounded text-sm text-slate-800 focus:ring-2 focus:ring-red-200 focus:border-red-400 outline-none transition-all"
                    placeholder="Motivo de cancelaciÃ³n">
                </div>
                <div>
                  <label class="text-[10px] font-bold text-slate-400 uppercase">Autorizador</label>
                  <input [(ngModel)]="formData.Autorizador_Cancelacion"
                    class="mt-1 w-full px-3 py-2 bg-white border border-red-200 rounded text-sm text-slate-800 focus:ring-2 focus:ring-red-200 focus:border-red-400 outline-none transition-all"
                    placeholder="â€”">
                </div>
                <div>
                  <label class="text-[10px] font-bold text-slate-400 uppercase">Fecha</label>
                  <input [(ngModel)]="formData.FechaCancelacion" type="datetime-local"
                    class="mt-1 w-full px-3 py-2 bg-white border border-red-200 rounded text-sm text-slate-800 focus:ring-2 focus:ring-red-200 focus:border-red-400 outline-none transition-all">
                </div>
              </div>
            </section>
          }

        </div>
      </div>

      <!-- Footer Actions (sticky on mobile) -->
      <div class="px-4 md:px-6 py-3 border-t border-slate-200 bg-white flex items-center justify-between shrink-0 sticky bottom-0">
        <button (click)="close.emit()"
          class="px-4 py-2.5 md:py-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl md:rounded text-sm font-medium transition-colors">
          Cancelar
        </button>
        <button (click)="onSubmit()"
          class="px-5 py-2.5 md:py-2 bg-primary hover:bg-primary/90 text-white font-bold text-xs uppercase tracking-wide rounded-xl md:rounded shadow-sm transition-all flex items-center gap-1.5">
          <span class="material-icons text-sm">save</span>
          Guardar Ticket
        </button>
      </div>
    </div>
  `
})
export class TicketFormComponent implements OnChanges {
   @Input() ticket: Ticket | null = null;
   @Output() close = new EventEmitter<void>();
   @Output() save = new EventEmitter<any>();

   formData: any = {};

   ngOnChanges(changes: SimpleChanges) {
      if (changes['ticket'] && this.ticket) {
         this.formData = { ...this.ticket };
         // Ensure date format for input datetime-local
         if (this.formData.FechaVisita) {
            const date = new Date(this.formData.FechaVisita);
            this.formData.FechaVisita = date.toISOString().slice(0, 16);
         }
         if (this.formData.FechaCancelacion) {
            const date = new Date(this.formData.FechaCancelacion);
            this.formData.FechaCancelacion = date.toISOString().slice(0, 16);
         }
      } else {
         this.formData = {
            Estado: 'Ready to plan',
            VisitaRealizada: false,
            TrabajoRealizado: false,
            SolicitaNuevaVisita: false
         };
      }
   }

   onSubmit() {
      this.save.emit(this.formData);
   }
}
