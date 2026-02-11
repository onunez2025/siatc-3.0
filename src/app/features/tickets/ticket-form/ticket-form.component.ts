import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Ticket } from '../../../core/services/ticket.service';

@Component({
   selector: 'app-ticket-form',
   standalone: true,
   imports: [CommonModule, FormsModule],
   template: `
    <div class="h-full flex flex-col bg-slate-50">
        <!-- Body -->
        <div class="flex-1 overflow-y-auto custom-scroll p-6 space-y-6">

          <!-- Section: Basic Info -->
          <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
             <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-50 pb-2">Información General</h4>
             <div class="grid grid-cols-1 gap-4">
                 <div>
                    <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">ID Ticket</label>
                    <input [value]="ticket?.Ticket" disabled class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-500 cursor-not-allowed">
                 </div>

                 <div>
                     <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Estado</label>
                     <div class="relative">
                        <select [(ngModel)]="formData.Estado" class="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none">
                            <option value="Ready to plan">Ready to plan</option>
                            <option value="Released">Released</option>
                            <option value="Closed">Closed</option>
                            <option value="Cancelled">Cancelled</option>
                        </select>
                        <i class="fas fa-chevron-down absolute right-4 top-4 text-slate-400 pointer-events-none text-xs"></i>
                     </div>
                 </div>
                 
                 <div>
                    <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Fecha Visita</label>
                    <input [(ngModel)]="formData.FechaVisita" type="datetime-local" class="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all">
                 </div>
             </div>
          </div>

          <!-- Section: Customer -->
          <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
             <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-50 pb-2">Cliente y Equipo</h4>
             <div class="grid grid-cols-1 gap-4">
                 <div>
                    <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nombre Cliente</label>
                    <input [(ngModel)]="formData.NombreCliente" class="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all">
                 </div>
                 <div>
                    <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Dirección</label>
                    <input [(ngModel)]="formData.Direccion" class="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all">
                 </div>
                 <div>
                    <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Equipo</label>
                    <input [(ngModel)]="formData.NombreEquipo" class="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all">
                 </div>
             </div>
          </div>

          <!-- Section: Execution -->
          <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
             <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-50 pb-2">Ejecución</h4>
             
             <div class="flex flex-col gap-3 mb-4">
                 <label class="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer">
                    <input [(ngModel)]="formData.VisitaRealizada" type="checkbox" class="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500">
                    <span class="text-sm font-medium text-slate-700">Visita Realizada</span>
                 </label>

                 <label class="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer">
                    <input [(ngModel)]="formData.TrabajoRealizado" type="checkbox" class="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500">
                    <span class="text-sm font-medium text-slate-700">Trabajo Realizado</span>
                 </label>
             </div>

             <div>
                <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Causa Técnica</label>
                <textarea [(ngModel)]="formData.CausaTecnica" rows="3" class="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none" placeholder="Describa la causa técnica..."></textarea>
             </div>
          </div>

        </div>

        <!-- Footer -->
        <div class="p-4 border-t border-slate-200 bg-white flex justify-end gap-3 shrink-0">
           <button (click)="close.emit()" class="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition-colors">Cancelar</button>
           <button (click)="onSubmit()" class="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all hover:scale-105 active:scale-95">
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
      } else {
         this.formData = {
            Estado: 'Ready to plan',
            VisitaRealizada: false,
            TrabajoRealizado: false
         };
      }
   }

   onSubmit() {
      this.save.emit(this.formData);
   }
}
