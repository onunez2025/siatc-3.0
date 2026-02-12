import { Component, EventEmitter, Input, Output, inject, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { User, UserService } from '../../../core/services/user.service';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="flex flex-col h-full">
      <!-- Scrollable Content -->
      <div class="flex-1 overflow-y-auto">

        <!-- Hero Header (edit mode) -->
        @if (user) {
          <div class="px-6 py-4 border-b border-slate-200 bg-primary/5">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm text-white"
                [ngClass]="{
                  'bg-purple-500': user.roleId === 1,
                  'bg-blue-500': user.roleId === 2,
                  'bg-teal-500': user.roleId === 3 || user.roleId === 5,
                  'bg-amber-500': user.roleId === 4,
                  'bg-slate-500': user.roleId === 6 || user.roleId === 7
                }">
                {{ user.name?.[0] || '?' }}
              </div>
              <div>
                <p class="text-lg font-black text-slate-800 tracking-tight">{{ user.name }}</p>
                <div class="flex items-center gap-2">
                  <p class="text-xs text-slate-400 font-mono">{{ user.username }}</p>
                  @if (!user.active) {
                    <span class="text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold">INACTIVO</span>
                  }
                </div>
              </div>
            </div>
          </div>
        }

        <div class="p-6 space-y-5">

          <!-- Información de Cuenta -->
          <section class="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div class="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
              <span class="material-icons text-primary text-base">account_circle</span>
              <h3 class="text-xs font-bold text-slate-600 uppercase tracking-wider">Información de Cuenta</h3>
            </div>
            <div class="p-4 grid grid-cols-2 gap-x-4 gap-y-3">
              <div class="col-span-2">
                <label class="text-[10px] font-bold text-slate-400 uppercase">Usuario (Username)</label>
                <input [(ngModel)]="formData.username" [disabled]="!!user"
                  class="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded text-sm text-slate-800 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                  placeholder="ej: jperez">
              </div>
              <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase">Nombre</label>
                <input [(ngModel)]="formData.firstName"
                  class="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded text-sm text-slate-800 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
                  placeholder="Nombre">
              </div>
              <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase">Apellido</label>
                <input [(ngModel)]="formData.lastName"
                  class="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded text-sm text-slate-800 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
                  placeholder="Apellido">
              </div>
              <div class="col-span-2">
                <label class="text-[10px] font-bold text-slate-400 uppercase">Correo Electrónico</label>
                <input [(ngModel)]="formData.email" type="email"
                  class="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded text-sm text-slate-800 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
                  placeholder="correo&#64;empresa.com">
              </div>
            </div>
          </section>

          <!-- Rol y Empresa -->
          <section class="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div class="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
              <span class="material-icons text-primary text-base">shield</span>
              <h3 class="text-xs font-bold text-slate-600 uppercase tracking-wider">Rol y Empresa</h3>
            </div>
            <div class="p-4 space-y-4">
              <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase">Rol</label>
                <div class="relative mt-1">
                  <select [(ngModel)]="formData.roleId"
                    class="w-full px-3 py-2 bg-white border border-slate-200 rounded text-sm text-slate-800 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all appearance-none pr-8">
                    @for (role of userService.roles(); track role.id) {
                      <option [value]="role.id">{{ role.name }}</option>
                    }
                  </select>
                  <span class="material-icons absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-base">expand_more</span>
                </div>
                <!-- Rol description -->
                @if (getSelectedRoleDesc()) {
                  <p class="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1">
                    <span class="material-icons text-xs">info</span>
                    {{ getSelectedRoleDesc() }}
                  </p>
                }
              </div>

              <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase">Empresa</label>
                <div class="relative mt-1">
                  <select [(ngModel)]="formData.empresaId"
                    class="w-full px-3 py-2 bg-white border border-slate-200 rounded text-sm text-slate-800 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all appearance-none pr-8">
                    @for (empresa of userService.empresas(); track empresa.id) {
                      <option [value]="empresa.id">{{ empresa.name }} ({{ empresa.type }})</option>
                    }
                  </select>
                  <span class="material-icons absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-base">expand_more</span>
                </div>
              </div>

              <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase">Código Técnico (FSM)</label>
                <input [(ngModel)]="formData.codigoTecnico"
                  class="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded text-sm text-slate-800 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
                  placeholder="Solo para técnicos de campo">
                <p class="text-[10px] text-slate-400 mt-1 italic">Vincular con código de técnico en SAP FSM</p>
              </div>

              @if (user) {
                <div class="flex items-center gap-3 pt-2 border-t border-slate-100">
                  <label class="text-[10px] font-bold text-slate-400 uppercase">Estado</label>
                  <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" [(ngModel)]="formData.active" class="sr-only peer">
                    <div class="w-9 h-5 bg-slate-300 peer-focus:ring-2 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
                    <span class="ml-2 text-xs font-medium" [ngClass]="formData.active ? 'text-green-600' : 'text-red-500'">
                      {{ formData.active ? 'Activo' : 'Inactivo' }}
                    </span>
                  </label>
                </div>
              }
            </div>
          </section>

          <!-- Seguridad -->
          <section class="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div class="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
              <span class="material-icons text-primary text-base">lock</span>
              <h3 class="text-xs font-bold text-slate-600 uppercase tracking-wider">Seguridad</h3>
            </div>
            <div class="p-4">
              <label class="text-[10px] font-bold text-slate-400 uppercase">
                Contraseña {{ user ? '(dejar vacío para mantener)' : '*' }}
              </label>
              <div class="relative mt-1">
                <input [(ngModel)]="formData.password" [type]="showPassword ? 'text' : 'password'"
                  class="w-full px-3 py-2 bg-white border border-slate-200 rounded text-sm text-slate-800 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all pr-10"
                  placeholder="••••••••">
                <button (click)="showPassword = !showPassword" type="button"
                  class="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                  <span class="material-icons text-base">{{ showPassword ? 'visibility_off' : 'visibility' }}</span>
                </button>
              </div>
              @if (user) {
                <p class="text-[10px] text-slate-400 mt-2 italic flex items-center gap-1">
                  <span class="material-icons text-xs">info</span>
                  Dejar en blanco para mantener la contraseña actual
                </p>
              }
            </div>
          </section>

          <!-- Info Adicional (solo edición) -->
          @if (user) {
            <section class="bg-white border border-slate-200 rounded-lg overflow-hidden">
              <div class="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                <span class="material-icons text-primary text-base">schedule</span>
                <h3 class="text-xs font-bold text-slate-600 uppercase tracking-wider">Información del Sistema</h3>
              </div>
              <div class="p-4 grid grid-cols-2 gap-x-4 gap-y-3">
                <div>
                  <span class="text-[10px] font-bold text-slate-400 uppercase">ID</span>
                  <p class="text-sm text-slate-600 mt-0.5 font-mono">{{ user.id }}</p>
                </div>
                <div>
                  <span class="text-[10px] font-bold text-slate-400 uppercase">Último Acceso</span>
                  <p class="text-sm text-slate-600 mt-0.5">{{ user.lastLogin ? (user.lastLogin | date:'dd/MM/yyyy HH:mm') : '—' }}</p>
                </div>
                <div>
                  <span class="text-[10px] font-bold text-slate-400 uppercase">Fecha Creación</span>
                  <p class="text-sm text-slate-600 mt-0.5">{{ user.createdAt ? (user.createdAt | date:'dd/MM/yyyy HH:mm') : '—' }}</p>
                </div>
                <div>
                  <span class="text-[10px] font-bold text-slate-400 uppercase">Empresa</span>
                  <p class="text-sm text-slate-600 mt-0.5">{{ user.empresaName || '—' }}</p>
                </div>
              </div>
            </section>
          }

        </div>
      </div>

      <!-- Footer Actions -->
      <div class="px-6 py-3 border-t border-slate-200 bg-white flex items-center justify-between shrink-0">
        <button (click)="close.emit()"
          class="px-4 py-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded text-sm font-medium transition-colors">
          Cancelar
        </button>
        <button (click)="onSubmit()"
          class="px-5 py-2 bg-primary hover:bg-primary/90 text-white font-bold text-xs uppercase tracking-wide rounded shadow-sm transition-all flex items-center gap-1.5">
          <span class="material-icons text-sm">save</span>
          {{ user ? 'Guardar Cambios' : 'Crear Usuario' }}
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
  showPassword = false;

  formData: any = {
    username: '',
    firstName: '',
    lastName: '',
    email: '',
    roleId: 7,
    empresaId: 1,
    codigoTecnico: '',
    active: true,
    password: ''
  };

  ngOnChanges(changes: SimpleChanges) {
    this.showPassword = false;
    if (changes['user'] && this.user) {
      this.formData = {
        username: this.user.username,
        firstName: this.user.firstName,
        lastName: this.user.lastName,
        email: this.user.email,
        roleId: this.user.roleId,
        empresaId: this.user.empresaId,
        codigoTecnico: this.user.codigoTecnico || '',
        active: this.user.active,
        password: ''
      };
    } else if (changes['user'] && !this.user) {
      this.formData = {
        username: '',
        firstName: '',
        lastName: '',
        email: '',
        roleId: 7,
        empresaId: 1,
        codigoTecnico: '',
        active: true,
        password: ''
      };
    }
  }

  getSelectedRoleDesc(): string {
    const role = this.userService.roles().find(r => r.id == this.formData.roleId);
    return role?.description || '';
  }

  onSubmit() {
    this.save.emit(this.formData);
  }
}
