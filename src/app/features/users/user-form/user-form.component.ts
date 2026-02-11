import { Component, EventEmitter, Input, Output, inject, effect, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { User, UserService } from '../../../core/services/user.service';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="h-full flex flex-col bg-slate-50">
        <!-- Body -->
        <div class="flex-1 overflow-y-auto custom-scroll p-6 space-y-5">
          
          <div class="grid grid-cols-1 gap-5">
             <div>
                <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nombre Completo</label>
                <input [(ngModel)]="formData.name" placeholder="Ej. Juan Perez" class="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm">
             </div>

             <div>
                <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Correo Electrónico</label>
                <input [(ngModel)]="formData.email" type="email" placeholder="juan@empresa.com" class="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm">
             </div>

             <div>
                <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Usuario (ID)</label>
                <input [(ngModel)]="formData.username" [disabled]="!!user" class="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm disabled:opacity-60 disabled:bg-slate-100 disabled:cursor-not-allowed">
             </div>

             <div>
                <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Rol</label>
                <div class="relative">
                   <select [(ngModel)]="formData.typeId" class="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm appearance-none cursor-pointer">
                      @for (type of userService.userTypes(); track type.id) {
                        <option [value]="type.id">{{ type.name }}</option>
                      }
                   </select>
                   <i class="fas fa-chevron-down absolute right-4 top-4 text-slate-400 pointer-events-none text-xs"></i>
                </div>
             </div>

             <div class="border-t border-slate-200 pt-5 mt-2">
                <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Contraseña {{ user ? '(Opcional)' : '*' }}</label>
                <input [(ngModel)]="formData.password" type="password" placeholder="••••••••" class="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm">
                @if(user) {
                    <p class="text-[10px] text-slate-400 mt-1 italic">Dejar en blanco para mantener la contraseña actual.</p>
                }
             </div>
          </div>

        </div>

        <!-- Footer -->
        <div class="p-4 border-t border-slate-200 bg-white flex justify-end gap-3 shrink-0">
           <button (click)="close.emit()" class="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition-colors">Cancelar</button>
           <button (click)="onSubmit()" class="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all hover:scale-105 active:scale-95">
             Guardar Cambios
           </button>
        </div>
    </div>
  `
})
export class UserFormComponent implements OnChanges {
  @Input() user: User | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<any>();

  userService = inject(UserService);

  formData = {
    username: '',
    name: '',
    email: '',
    typeId: '', // Should map to role ID
    password: ''
  };

  ngOnChanges(changes: SimpleChanges) {
    if (changes['user'] && this.user) {
      this.formData = {
        username: this.user.username,
        name: this.user.name,
        email: this.user.email,
        typeId: this.mapRoleToTypeId(this.user.role),
        password: ''
      };
    } else if (changes['user'] && !this.user) {
      this.formData = {
        username: '',
        name: '',
        email: '',
        typeId: '3', // Default Operator
        password: ''
      };
    }
  }

  // Helper: In real app, user object should have typeId. 
  // For now we guess based on role string or need to update UserService to fetch full details
  mapRoleToTypeId(role: string): string {
    if (role === 'ADMIN') return '1';
    if (role === 'TECNICO') return '2';
    return '3'; // OPERADOR
  }

  onSubmit() {
    this.save.emit(this.formData);
  }
}
