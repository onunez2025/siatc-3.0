import { Component, input, output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Ticket, TicketService } from '../services/ticket.service';
import { TranslatePipe } from '../pipes/translate.pipe';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-ticket-detail',
  standalone: true,
  imports: [CommonModule, TranslatePipe, FormsModule],
  template: `
    <div class="fixed inset-0 bg-slate-900 bg-opacity-75 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
      <div class="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        
        <!-- Header -->
        <div class="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-slate-50">
          <div>
            <h2 class="text-xl font-bold text-slate-800 flex items-center gap-2">
              <span class="text-slate-800 border-r border-slate-300 pr-3 mr-1">GRUPO SOLE</span> {{ 'TICKET_DETAIL' | translate }}
            </h2>
            <p class="text-sm text-slate-500 font-mono mt-1">
              ID: {{ ticket().Ticket }} 
              <span class="mx-2 text-slate-300">|</span> 
              FSM: {{ ticket().LlamadaFSM || 'N/A' }}
            </p>
          </div>
          <button (click)="onClose.emit()" class="text-gray-400 hover:text-gray-600 transition-colors bg-white p-2 rounded-full shadow-sm border border-gray-200">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Scrollable Content -->
        <div class="p-6 overflow-y-auto custom-scroll flex-1 bg-gray-50/50">
          
          <!-- Status Banner -->
          <div class="mb-6 p-4 rounded-lg flex justify-between items-center shadow-sm border"
               [class.bg-amber-50]="ticket().Estado === 'Ready to plan'"
               [class.border-amber-100]="ticket().Estado === 'Ready to plan'"
               [class.text-amber-700]="ticket().Estado === 'Ready to plan'"
               [class.bg-blue-50]="ticket().Estado === 'Reprogramado'"
               [class.border-blue-100]="ticket().Estado === 'Reprogramado'"
               [class.text-blue-700]="ticket().Estado === 'Reprogramado'"
               [class.bg-emerald-50]="ticket().Estado === 'Closed'"
               [class.border-emerald-100]="ticket().Estado === 'Closed'"
               [class.text-emerald-700]="ticket().Estado === 'Closed'"
               [class.bg-red-50]="ticket().Estado === 'Cancelled' || ticket().Estado === 'Rechazado por service'"
               [class.border-red-100]="ticket().Estado === 'Cancelled' || ticket().Estado === 'Rechazado por service'"
               [class.text-red-700]="ticket().Estado === 'Cancelled' || ticket().Estado === 'Rechazado por service'">
            <div class="flex items-center gap-3">
              <span class="font-bold text-lg uppercase tracking-wide">{{ ticket().Estado }}</span>
              <span class="text-sm opacity-75 border-l border-current pl-3">
                {{ 'MODIFIED' | translate }}: {{ ticket().FechaUltimaModificacion | date:'dd/MM/yyyy HH:mm' }}
              </span>
            </div>
            <div class="flex items-center gap-4">
              <div class="text-sm font-medium bg-white bg-opacity-60 px-3 py-1 rounded">
                {{ 'VISIT_DATE' | translate }}: {{ ticket().FechaVisita | date:'dd/MM/yyyy' }}
              </div>
              @if (!ticket().Motivo_Cancelacion && ticket().Estado !== 'Closed' && ticket().Estado !== 'Cancelled') {
                <button (click)="isCancelling.set(true)" class="bg-red-600 text-white px-4 py-1 rounded text-xs font-bold hover:bg-red-700 transition-colors shadow-sm uppercase tracking-wider">
                  {{ 'CANCEL_SERVICE' | translate }}
                </button>
              }
            </div>
          </div>

          <!-- Cancellation Overlay Form -->
          @if (isCancelling()) {
            <div class="bg-red-50 border-2 border-red-200 rounded-xl p-6 mb-8 animate-enter shadow-lg relative overflow-hidden">
               <div class="absolute top-0 right-0 w-32 h-32 bg-red-100 -mr-16 -mt-16 rounded-full opacity-50"></div>
               <h4 class="text-red-800 font-black uppercase tracking-tighter text-lg mb-4 flex items-center gap-2">
                 <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                 {{ 'CANCEL_SERVICE' | translate }}
               </h4>
               <p class="text-sm text-red-600 mb-6 font-medium">{{ 'CANCEL_PROMPT' | translate }}</p>
               
               <div class="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                 <div>
                   <label class="block text-[10px] font-bold text-red-700 uppercase mb-1.5 tracking-widest">{{ 'CANCEL_REASON' | translate }}</label>
                   <select 
                    [(ngModel)]="cancelMotivo"
                    class="w-full px-4 py-3 rounded-xl border-2 border-red-100 focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none transition-all text-sm appearance-none bg-white"
                   >
                    <option value="" disabled selected>Seleccione un motivo...</option>
                    @for (reason of cancellationReasons(); track reason.id) {
                      <option [value]="reason.name">{{ reason.name }}</option>
                    }
                   </select>
                 </div>
                 <div class="flex flex-col justify-between">
                   <div>
                     <label class="block text-[10px] font-bold text-red-700 uppercase mb-1.5 tracking-widest">{{ 'AUTHORIZER' | translate }}</label>
                     <input 
                      [(ngModel)]="cancelAutorizador"
                      type="text" 
                      class="w-full px-4 py-3 rounded-xl border-2 border-red-100 focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none transition-all text-sm"
                      placeholder="Nombre del supervisor..."
                     >
                   </div>
                   <div class="flex gap-3 mt-6">
                     <button (click)="isCancelling.set(false)" class="flex-1 px-4 py-3 rounded-xl border-2 border-red-200 text-red-700 font-bold text-xs uppercase hover:bg-white transition-all">
                       {{ 'CANCEL' | translate }}
                     </button>
                     <button (click)="confirmCancel()" class="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white font-bold text-xs uppercase hover:bg-red-700 transition-all shadow-lg hover:shadow-red-600/20 active:scale-95">
                       {{ 'CONFIRM_CANCEL' | translate }}
                     </button>
                   </div>
                 </div>
               </div>
            </div>
          }

          <!-- Existing Cancellation Info -->
          @if (ticket().Motivo_Cancelacion) {
            <div class="bg-white border-2 border-red-100 rounded-xl p-6 mb-8 shadow-sm relative overflow-hidden">
               <div class="absolute top-0 right-0 p-4 opacity-5 rotate-12">
                 <svg class="w-24 h-24" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" /></svg>
               </div>
               <h3 class="text-xs font-black text-red-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                 <div class="w-1 h-3 bg-red-600 rounded-full"></div>
                 {{ 'CANCELLATION_INFO' | translate }}
               </h3>
               <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 <div>
                   <span class="text-slate-400 block text-[10px] uppercase font-bold tracking-tighter mb-1">{{ 'CANCEL_REASON' | translate }}</span>
                   <p class="text-sm text-slate-800 font-medium">{{ ticket().Motivo_Cancelacion }}</p>
                 </div>
                 <div>
                   <span class="text-slate-400 block text-[10px] uppercase font-bold tracking-tighter mb-1">{{ 'AUTHORIZER' | translate }}</span>
                   <p class="text-sm text-slate-800 font-medium">{{ ticket().Autorizador_Cancelacion }}</p>
                 </div>
                 <div>
                   <span class="text-slate-400 block text-[10px] uppercase font-bold tracking-tighter mb-1">{{ 'VISIT_DATE' | translate }}</span>
                   <p class="text-sm text-slate-800 font-medium">{{ ticket().FechaCancelacion | date:'dd/MM/yyyy HH:mm' }}</p>
                 </div>
               </div>
            </div>
          }

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            <!-- Section: Client Info -->
            <div class="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
              <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 border-b pb-2 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" /></svg>
                {{ 'CLIENT' | translate }}
              </h3>
              <div class="space-y-3 text-sm">
                <div><span class="text-gray-400 block text-[10px] uppercase">{{ 'NAME' | translate }}</span> <span class="font-medium text-slate-800">{{ ticket().NombreCliente }}</span></div>
                <div><span class="text-gray-400 block text-[10px] uppercase">{{ 'CLIENT_ID' | translate }}</span> <span class="font-mono text-slate-600">{{ ticket().IdCliente }}</span></div>
                <div><span class="text-gray-400 block text-[10px] uppercase">{{ 'EMAIL' | translate }}</span> <a href="mailto:{{ticket().Email}}" class="text-blue-600 hover:underline">{{ ticket().Email }}</a></div>
                <div class="grid grid-cols-2 gap-2">
                   <div><span class="text-gray-400 block text-[10px] uppercase">{{ 'CELLPHONE' | translate }}</span> {{ ticket().Celular1 }}</div>
                   <div><span class="text-gray-400 block text-[10px] uppercase">{{ 'PHONE' | translate }}</span> {{ ticket().Telefono1 }}</div>
                </div>
              </div>
            </div>

            <!-- Section: Location -->
            <div class="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
              <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 border-b pb-2 flex items-center gap-2">
                 <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" /></svg>
                 {{ 'LOCATION' | translate }}
              </h3>
              <div class="space-y-3 text-sm">
                <div>
                  <span class="text-gray-400 block text-[10px] uppercase">{{ 'ADDRESS' | translate }}</span> 
                  <span class="font-medium text-slate-800">{{ ticket().Calle }} #{{ ticket().NumeroCalle }}</span>
                </div>
                <div>
                  <span class="text-gray-400 block text-[10px] uppercase">{{ 'ZONA_CITY' | translate }}</span> 
                  <span class="text-slate-700">{{ ticket().Distrito }}, {{ ticket().Ciudad }}</span>
                  <span class="block text-xs text-slate-500">{{ ticket().Pais }} - {{ ticket().CodigoPostal }}</span>
                </div>
                <div>
                  <span class="text-gray-400 block text-[10px] uppercase">{{ 'REFERENCE' | translate }}</span> 
                  <span class="italic text-gray-600">{{ ticket().Referencia || ('NO_REFERENCE' | translate) }}</span>
                </div>
                <div class="grid grid-cols-2 gap-2 mt-2">
                  <div class="bg-slate-50 p-2 rounded text-xs border border-slate-100">
                    <span class="font-bold text-slate-500">Lat:</span> {{ ticket().Latitud }}
                  </div>
                  <div class="bg-slate-50 p-2 rounded text-xs border border-slate-100">
                    <span class="font-bold text-slate-500">Lon:</span> {{ ticket().Longitud }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Section: Technician -->
            <div class="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
              <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 border-b pb-2 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" /></svg>
                {{ 'TECHNICIAN' | translate }}
              </h3>
              <div class="space-y-3 text-sm">
                <div class="flex items-center gap-3 mb-2">
                  <div class="w-12 h-12 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                    {{ (ticket().NombreTecnico || '').charAt(0) }}{{ (ticket().ApellidoTecnico || '').charAt(0) }}
                  </div>
                  <div>
                     <p class="font-bold text-slate-800">{{ ticket().NombreTecnico }} {{ ticket().ApellidoTecnico }}</p>
                     <p class="text-xs text-slate-500 font-mono">{{ ticket().CodigoTecnico }}</p>
                  </div>
                </div>
                <div class="bg-slate-50 rounded p-2 text-xs">
                   <span class="text-gray-400 block uppercase mb-1">Check Out</span> 
                   {{ ticket().CheckOut ? (ticket().CheckOut | date:'dd/MM/yyyy HH:mm') : ('NONE' | translate) }}
                </div>
                <div>
                  <span class="text-gray-400 block text-[10px] uppercase mb-1">{{ 'SERVICE_TYPE' | translate }}</span> 
                  <span class="font-semibold text-slate-900 bg-slate-100 px-2 py-1 rounded inline-block">{{ ticket().TipoServicio || ticket().IdServicio }}</span>
                </div>
              </div>
            </div>

             <!-- Section: Equipment -->
            <div class="bg-white p-5 rounded-lg border border-gray-200 shadow-sm md:col-span-2 lg:col-span-1">
              <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 border-b pb-2 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M7 2a1 1 0 00-1 1v1H2a1 1 0 010 2h1v12a2 2 0 002 2h10a2 2 0 002-2V6h1a1 1 0 110 2h-1V3a1 1 0 00-1-1H7zM4 6V3h12v3H4zm1 12V8h10v10H5z" clip-rule="evenodd" /></svg>
                {{ 'EQUIPMENT' | translate }}
              </h3>
              <div class="space-y-3 text-sm">
                <div>
                  <span class="text-gray-400 block text-[10px] uppercase">{{ 'PRODUCT' | translate }}</span> 
                  <span class="font-medium text-slate-800">{{ ticket().NombreEquipo }}</span>
                  <span class="block text-xs text-slate-400 font-mono">{{ ticket().IdServicio }}</span>
                </div>
                <div class="grid grid-cols-2 gap-2">
                  <div>
                    <span class="text-gray-400 block text-[10px] uppercase">{{ 'EXTERNAL_CODE' | translate }}</span> 
                    <span class="font-mono text-xs">{{ ticket().CodigoExternoEquipo || '-' }}</span>
                  </div>
                  <div>
                    <span class="text-gray-400 block text-[10px] uppercase">{{ 'INTERNAL_ID' | translate }}</span> 
                    <span class="font-mono text-xs">{{ ticket().IdEquipo || '-' }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Section: Execution Details -->
            <div class="bg-white p-5 rounded-lg border border-gray-200 shadow-sm md:col-span-2 lg:col-span-2">
              <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 border-b pb-2 font-mono">{{ 'EXECUTION' | translate }}</h3>
              <div class="grid grid-cols-3 gap-4 mb-6">
                 <div class="text-center p-3 rounded-lg border transition-all" 
                      [class.bg-emerald-50]="ticket().VisitaRealizada" [class.border-emerald-200]="ticket().VisitaRealizada"
                      [class.bg-slate-50]="!ticket().VisitaRealizada" [class.border-slate-100]="!ticket().VisitaRealizada">
                    <span class="block text-[10px] uppercase tracking-wider text-slate-500 mb-1">{{ 'VISIT_MADE' | translate }}</span>
                    <span class="font-bold text-lg" [class.text-emerald-700]="ticket().VisitaRealizada" [class.text-slate-400]="!ticket().VisitaRealizada">
                      {{ ticket().VisitaRealizada ? 'SI' : 'NO' }}
                    </span>
                 </div>
                 <div class="text-center p-3 rounded-lg border transition-all" 
                      [class.bg-emerald-50]="ticket().TrabajoRealizado" [class.border-emerald-200]="ticket().TrabajoRealizado"
                      [class.bg-slate-50]="!ticket().TrabajoRealizado" [class.border-slate-100]="!ticket().TrabajoRealizado">
                    <span class="block text-[10px] uppercase tracking-wider text-slate-500 mb-1">{{ 'WORK_MADE' | translate }}</span>
                    <span class="font-bold text-lg" [class.text-emerald-700]="ticket().TrabajoRealizado" [class.text-slate-400]="!ticket().TrabajoRealizado">
                      {{ ticket().TrabajoRealizado ? 'SI' : 'NO' }}
                    </span>
                 </div>
                 <div class="text-center p-3 rounded-lg border transition-all" 
                      [class.bg-red-50]="ticket().SolicitaNuevaVisita" [class.border-red-200]="ticket().SolicitaNuevaVisita"
                      [class.bg-slate-50]="!ticket().SolicitaNuevaVisita" [class.border-slate-100]="!ticket().SolicitaNuevaVisita">
                    <span class="block text-[10px] uppercase tracking-wider text-slate-500 mb-1">{{ 'NEW_VISIT' | translate }}</span>
                    <span class="font-bold text-lg" [class.text-red-700]="ticket().SolicitaNuevaVisita" [class.text-slate-400]="!ticket().SolicitaNuevaVisita">
                      {{ ticket().SolicitaNuevaVisita ? 'SI' : 'NO' }}
                    </span>
                 </div>
              </div>
              
              @if (ticket().SolicitaNuevaVisita) {
                <div class="bg-red-50 p-4 rounded-lg mb-4 text-sm border border-red-100 flex items-start gap-3">
                   <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-red-500 mt-0.5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" /></svg>
                   <div>
                     <span class="font-bold text-red-800 block text-xs uppercase mb-1">{{ 'REASON_NEW_VISIT' | translate }}:</span>
                     {{ ticket().MotivoNuevaVisita }}
                   </div>
                </div>
              }

              <div class="grid md:grid-cols-2 gap-4">
                <div class="bg-slate-50 p-3 rounded border border-slate-100">
                   <span class="text-[10px] font-bold text-slate-400 uppercase block mb-2">{{ 'PROG_COMMENT' | translate }}</span>
                   <p class="text-sm text-slate-700 italic">"{{ ticket().ComentarioProgramador || ('NONE' | translate) }}"</p>
                </div>
                <div class="bg-slate-50 p-3 rounded border border-slate-100">
                   <span class="text-[10px] font-bold text-slate-400 uppercase block mb-2">{{ 'TECH_COMMENT' | translate }}</span>
                   <p class="text-sm text-slate-700 italic">"{{ ticket().ComentarioTecnico || ('NO_RESULTS' | translate) }}"</p>
                </div>
              </div>
            </div>

          </div>
        </div>

        <!-- Footer Actions -->
        <div class="px-6 py-4 bg-white border-t border-gray-200 flex justify-end gap-3 z-10">
          <button (click)="onClose.emit()" class="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors text-sm">
            {{ 'CLOSE' | translate }}
          </button>
          <button class="px-5 py-2.5 bg-slate-800 text-white rounded-lg hover:bg-slate-900 font-medium shadow-lg hover:shadow-xl transition-all flex items-center gap-2 text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            {{ 'EXPORT_PDF' | translate }}
          </button>
        </div>

      </div>
    </div>
  `,
  styles: [`
    @keyframes enter {
      from { opacity: 0; transform: translateY(-20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-enter {
      animation: enter 0.3s ease-out forwards;
    }
  `]
})
export class TicketDetailComponent {
  ticket = input.required<Ticket>();
  onClose = output<void>();

  ticketService = inject(TicketService);

  isCancelling = signal(false);
  cancelMotivo = '';
  cancelAutorizador = '';
  cancellationReasons = signal<{ id: string, name: string }[]>([]);

  constructor() {
    this.loadReasons();
  }

  async loadReasons() {
    try {
      const reasons = await this.ticketService.getCancellationReasons();
      this.cancellationReasons.set(reasons);
    } catch (e) {
      console.error('Failed to load cancellation reasons', e);
    }
  }

  async confirmCancel() {
    if (!this.cancelMotivo || !this.cancelAutorizador) {
      alert('Por favor complete todos los campos');
      return;
    }

    try {
      await this.ticketService.cancelTicket(this.ticket().Ticket, {
        motivo: this.cancelMotivo,
        autorizador: this.cancelAutorizador
      });
      this.isCancelling.set(false);
      this.onClose.emit();
    } catch (error) {
      alert('Error al cancelar el servicio');
    }
  }
}