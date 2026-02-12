import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService, Role } from '../../../core/services/user.service';
import { DrawerComponent } from '../../../shared/components/drawer/drawer.component';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-role-list',
  standalone: true,
  imports: [CommonModule, FormsModule, DrawerComponent],
  template: `
    <div class="flex flex-col h-full gap-4">
      <!-- Toolbar - Desktop -->
      <div class="hidden md:flex flex-col lg:flex-row justify-between gap-4 bg-white p-4 rounded border border-slate-200 shadow-sm">
        <div class="flex items-center gap-3">
          <h1 class="text-lg font-bold tracking-tight text-slate-800 uppercase">Gestión de Roles</h1>
          <span class="text-xs text-slate-400">{{ roles().length }} roles</span>
        </div>
        <div class="flex items-center gap-2">
          <button (click)="openForm()" class="bg-primary hover:bg-primary/90 text-white px-4 py-1.5 rounded flex items-center gap-2 font-semibold text-xs transition-all shadow-sm uppercase tracking-wide">
            <span class="material-icons text-sm">add</span> Nuevo Rol
          </button>
        </div>
      </div>

      <!-- Toolbar - Mobile -->
      <header class="flex md:hidden items-center justify-between bg-white/90 backdrop-blur-md border-b border-slate-100 px-4 py-3 rounded-xl">
        <h1 class="text-lg font-bold tracking-tight text-slate-800 flex items-center gap-2">
          <span class="material-icons text-primary text-xl">shield</span> Roles
        </h1>
        <span class="text-xs text-slate-400 font-medium">{{ roles().length }} roles</span>
      </header>

      <!-- Roles Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        @for (role of roles(); track role.id) {
          <div class="bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md transition-all group cursor-pointer"
            (click)="editRole(role)">
            <div class="p-5">
              <div class="flex items-start justify-between mb-3">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white text-sm"
                    [ngClass]="getRoleColor(role.id)">
                    <span class="material-icons text-lg">{{ getRoleIcon(role.id) }}</span>
                  </div>
                  <div>
                    <h3 class="text-sm font-bold text-slate-800">{{ role.name }}</h3>
                    <span class="text-[10px] font-mono text-slate-400">ID: {{ role.id }}</span>
                  </div>
                </div>
                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold"
                  [ngClass]="role.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'">
                  {{ role.active ? 'ACTIVO' : 'INACTIVO' }}
                </span>
              </div>
              <p class="text-xs text-slate-500 leading-relaxed mb-3">{{ role.description || 'Sin descripción' }}</p>
              <div class="flex items-center justify-between border-t border-slate-100 pt-3">
                <span class="text-[10px] text-slate-400">
                  {{ role.createdAt ? 'Creado: ' + (role.createdAt | date:'dd/MM/yyyy') : '' }}
                </span>
                <div class="flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  <button (click)="$event.stopPropagation(); editRole(role)"
                    class="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded transition-all" title="Editar">
                    <span class="material-icons text-base">edit</span>
                  </button>
                  <button (click)="$event.stopPropagation(); confirmDelete(role)"
                    class="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-all" title="Eliminar">
                    <span class="material-icons text-base">delete_outline</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        }
      </div>

      @if (roles().length === 0 && !loading()) {
        <div class="flex flex-col items-center justify-center py-20 text-slate-400 bg-white rounded border border-slate-200">
          <span class="material-icons text-4xl mb-2">shield</span>
          <p class="text-sm font-medium">No hay roles definidos</p>
        </div>
      }

      @if (loading()) {
        <div class="flex items-center justify-center py-20">
          <span class="material-icons text-primary text-3xl animate-spin">autorenew</span>
        </div>
      }

      <!-- FAB Mobile -->
      <button (click)="openForm()" class="fixed bottom-20 right-5 md:hidden w-14 h-14 bg-primary text-white rounded-full shadow-lg shadow-primary/40 flex items-center justify-center hover:scale-105 transition-transform active:scale-95 z-30">
        <span class="material-icons text-3xl">add</span>
      </button>

      <!-- Drawer Form -->
      @if (isFormOpen()) {
        <app-drawer
          [title]="selectedRole() ? 'Editar Rol' : 'Nuevo Rol'"
          (close)="closeForm()"
        >
          <div class="flex flex-col h-full">
            <div class="flex-1 overflow-y-auto p-6 space-y-5">

              @if (selectedRole()) {
                <div class="px-4 py-3 bg-primary/5 border border-primary/10 rounded-lg flex items-center gap-3">
                  <div class="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white text-sm"
                    [ngClass]="getRoleColor(selectedRole()!.id)">
                    <span class="material-icons text-lg">{{ getRoleIcon(selectedRole()!.id) }}</span>
                  </div>
                  <div>
                    <p class="text-sm font-bold text-slate-800">{{ selectedRole()!.name }}</p>
                    <p class="text-[10px] text-slate-400 font-mono">ID: {{ selectedRole()!.id }}</p>
                  </div>
                </div>
              }

              <section class="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <div class="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                  <span class="material-icons text-primary text-base">badge</span>
                  <h3 class="text-xs font-bold text-slate-600 uppercase tracking-wider">Información del Rol</h3>
                </div>
                <div class="p-4 space-y-3">
                  <div>
                    <label class="text-[10px] font-bold text-slate-400 uppercase">Nombre del Rol *</label>
                    <input [(ngModel)]="formData.name"
                      class="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded text-sm text-slate-800 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all uppercase"
                      placeholder="ej: SUPERVISOR_VENTAS">
                    <p class="text-[10px] text-slate-400 mt-1">Se guardará en mayúsculas, sin espacios</p>
                  </div>
                  <div>
                    <label class="text-[10px] font-bold text-slate-400 uppercase">Descripción</label>
                    <textarea [(ngModel)]="formData.description" rows="3"
                      class="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded text-sm text-slate-800 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all resize-none"
                      placeholder="Descripción del rol y sus permisos..."></textarea>
                  </div>
                  @if (selectedRole()) {
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
            </div>

            <div class="px-6 py-3 border-t border-slate-200 bg-white flex items-center justify-between shrink-0">
              <button (click)="closeForm()"
                class="px-4 py-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded text-sm font-medium transition-colors">
                Cancelar
              </button>
              <button (click)="onSave()"
                class="px-5 py-2 bg-primary hover:bg-primary/90 text-white font-bold text-xs uppercase tracking-wide rounded shadow-sm transition-all flex items-center gap-1.5">
                <span class="material-icons text-sm">save</span>
                {{ selectedRole() ? 'Guardar Cambios' : 'Crear Rol' }}
              </button>
            </div>
          </div>
        </app-drawer>
      }

      <!-- Delete Confirmation -->
      @if (showDeleteConfirm()) {
        <div class="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center" (click)="showDeleteConfirm.set(false)">
          <div class="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full mx-4" (click)="$event.stopPropagation()">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <span class="material-icons text-red-600">warning</span>
              </div>
              <div>
                <h3 class="text-sm font-bold text-slate-800">Eliminar Rol</h3>
                <p class="text-xs text-slate-500">Esta acción no se puede deshacer</p>
              </div>
            </div>
            <p class="text-sm text-slate-600 mb-5">
              ¿Estás seguro de que deseas eliminar el rol <strong>{{ roleToDelete()?.name }}</strong>?
            </p>
            @if (deleteError()) {
              <div class="mb-4 p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-center gap-2">
                <span class="material-icons text-sm">error</span>
                {{ deleteError() }}
              </div>
            }
            <div class="flex justify-end gap-2">
              <button (click)="showDeleteConfirm.set(false); deleteError.set('')"
                class="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded transition-colors font-medium">
                Cancelar
              </button>
              <button (click)="deleteRole()"
                class="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded font-bold transition-colors flex items-center gap-1.5">
                <span class="material-icons text-sm">delete</span>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class RoleListComponent implements OnInit {
  private http = inject(HttpClient);
  userService = inject(UserService);

  roles = signal<Role[]>([]);
  loading = signal(false);
  isFormOpen = signal(false);
  selectedRole = signal<Role | null>(null);
  showDeleteConfirm = signal(false);
  roleToDelete = signal<Role | null>(null);
  deleteError = signal('');

  formData = { name: '', description: '', active: true };

  ngOnInit() {
    this.loadRoles();
  }

  loadRoles() {
    this.loading.set(true);
    this.http.get<Role[]>(`${environment.apiUrl}/roles?all=true`)
      .subscribe({
        next: (roles) => { this.roles.set(roles); this.loading.set(false); },
        error: () => this.loading.set(false)
      });
  }

  openForm() {
    this.selectedRole.set(null);
    this.formData = { name: '', description: '', active: true };
    this.isFormOpen.set(true);
  }

  editRole(role: Role) {
    this.selectedRole.set(role);
    this.formData = { name: role.name, description: role.description || '', active: role.active };
    this.isFormOpen.set(true);
  }

  closeForm() {
    this.isFormOpen.set(false);
    this.selectedRole.set(null);
  }

  onSave() {
    if (!this.formData.name.trim()) return alert('El nombre del rol es requerido');

    if (this.selectedRole()) {
      this.http.put(`${environment.apiUrl}/roles/${this.selectedRole()!.id}`, this.formData)
        .subscribe({
          next: () => { this.closeForm(); this.loadRoles(); this.userService.loadRoles(); },
          error: () => alert('Error al actualizar rol')
        });
    } else {
      this.http.post(`${environment.apiUrl}/roles`, this.formData)
        .subscribe({
          next: () => { this.closeForm(); this.loadRoles(); this.userService.loadRoles(); },
          error: (err: any) => {
            if (err.status === 409) alert('El rol ya existe');
            else alert('Error al crear rol');
          }
        });
    }
  }

  confirmDelete(role: Role) {
    this.roleToDelete.set(role);
    this.deleteError.set('');
    this.showDeleteConfirm.set(true);
  }

  deleteRole() {
    const role = this.roleToDelete();
    if (!role) return;
    this.http.delete(`${environment.apiUrl}/roles/${role.id}`)
      .subscribe({
        next: () => {
          this.showDeleteConfirm.set(false);
          this.roleToDelete.set(null);
          this.deleteError.set('');
          this.loadRoles();
          this.userService.loadRoles();
        },
        error: (err: any) => {
          this.deleteError.set(err.error?.error || 'Error al eliminar rol');
        }
      });
  }

  getRoleColor(id: number): string {
    const colors: Record<number, string> = {
      1: 'bg-purple-500', 2: 'bg-blue-500', 3: 'bg-teal-500',
      4: 'bg-amber-500', 5: 'bg-teal-500', 6: 'bg-slate-500', 7: 'bg-slate-400'
    };
    return colors[id] || 'bg-primary';
  }

  getRoleIcon(id: number): string {
    const icons: Record<number, string> = {
      1: 'admin_panel_settings', 2: 'engineering', 3: 'supervisor_account',
      4: 'support_agent', 5: 'supervisor_account', 6: 'person', 7: 'visibility'
    };
    return icons[id] || 'shield';
  }
}
