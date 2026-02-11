import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-drawer',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
      <!-- Backdrop -->
      <div 
        class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300" 
        (click)="close.emit()"
        [class.opacity-0]="closing"
        [class.opacity-100]="!closing">
      </div>

      <!-- Drawer Panel -->
      <div 
        class="relative w-full max-w-md bg-white shadow-2xl flex flex-col h-full transform transition-transform duration-300 ease-out"
        [class.translate-x-full]="closing"
        [class.translate-x-0]="!closing">
            
         <!-- Header -->
         <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
            <h2 class="text-lg font-bold text-slate-800">{{ title }}</h2>
            <button (click)="onClose()" class="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-200 transition-colors">
               <i class="fas fa-times text-xl"></i>
            </button>
         </div>

         <!-- Content -->
         <div class="flex-1 overflow-y-auto custom-scroll p-6">
            <ng-content></ng-content>
         </div>

         <!-- Footer (Optional) -->
         <div class="px-6 py-4 border-t border-slate-100 bg-slate-50 shrink-0 flex justify-end gap-3">
            <ng-content select="[footer]"></ng-content>
         </div>
      </div>
    </div>
  `,
    styles: [`
    :host { display: block; }
  `]
})
export class DrawerComponent {
    @Input() title = 'Detalle';
    @Output() close = new EventEmitter<void>();

    closing = false;

    onClose() {
        this.closing = true;
        // Wait for animation
        setTimeout(() => {
            this.close.emit();
            this.closing = false;
        }, 300);
    }
}
