import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService, User } from '../../../core/services/user.service';
import { UserFormComponent } from '../user-form/user-form.component';
import { DrawerComponent } from '../../../shared/components/drawer/drawer.component';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, FormsModule, UserFormComponent, DrawerComponent],
  template: `
    <div class="flex flex-col h-full gap-4">
      <!-- Toolbar -->
      <div class="flex flex-col lg:flex-row justify-between gap-4 bg-white p-4 rounded border border-slate-200 shadow-sm">
        <div class="flex items-center gap-3">
          <h1 class="text-lg font-bold tracking-tight text-slate-800 uppercase">Gestión de Usuarios</h1>
          <div class="flex-1 max-w-md relative">
            <span class="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
            <input
              [(ngModel)]="searchQuery"
              (input)="onSearchInput()"
              class="w-full pl-9 pr-4 py-1.5 bg-slate-100 border-transparent focus:bg-white focus:border-primary focus:ring-0 rounded text-sm transition-all outline-none"
              placeholder="Buscar por usuario, nombre o email..."
              type="text"
            />
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button (click)="openForm()" class="bg-primary hover:bg-primary/90 text-white px-4 py-1.5 rounded flex items-center gap-2 font-semibold text-xs transition-all shadow-sm uppercase tracking-wide">
            <span class="material-icons text-sm">person_add</span>
            Nuevo Usuario
          </button>
        </div>
      </div>

      <!-- Filters Bar -->
      <div class="bg-white px-4 py-3 border border-slate-200 rounded shadow-sm">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="text-xs font-bold text-slate-400 uppercase mr-1">Filtros:</span>
            <select
              [(ngModel)]="roleFilter"
              (change)="onFilterChange()"
              class="text-xs bg-white border border-slate-300 rounded focus:ring-2 focus:ring-primary focus:border-primary py-1.5 px-2 min-w-[160px] text-slate-700 font-medium"
            >
              <option value="">Rol: Todos</option>
              @for (role of userService.roles(); track role.id) {
                <option [value]="role.id">{{ role.name }}</option>
              }
            </select>
          </div>
          <div class="text-xs text-slate-400">
            {{ userService.pagination().total }} usuarios encontrados
          </div>
        </div>
      </div>

      <!-- Table Container -->
      <div class="bg-white rounded border border-slate-200 shadow-sm flex flex-col flex-1 min-h-0">
        <!-- Loading -->
        @if (userService.loading()) {
          <div class="flex items-center justify-center py-20">
            <span class="material-icons text-primary text-3xl animate-spin">autorenew</span>
          </div>
        } @else if (userService.users().length === 0) {
          <div class="flex flex-col items-center justify-center py-20 text-slate-400">
            <span class="material-icons text-4xl mb-2">person_off</span>
            <p class="text-sm font-medium">No se encontraron usuarios</p>
          </div>
        } @else {
          <!-- Table -->
          <div class="overflow-auto flex-1">
            <table class="w-full text-left border-collapse">
              <thead class="sticky top-0 z-10 bg-slate-50 border-b border-slate-200">
                <tr class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th class="px-4 py-3 cursor-pointer hover:text-primary transition-colors" (click)="sortBy('username')">
                    <div class="flex items-center gap-1">
                      Usuario
                      <span class="material-icons text-xs">
                        {{ sortColumn === 'username' ? (sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more' }}
                      </span>
                    </div>
                  </th>
                  <th class="px-4 py-3 cursor-pointer hover:text-primary transition-colors" (click)="sortBy('name')">
                    <div class="flex items-center gap-1">
                      Nombre
                      <span class="material-icons text-xs">
                        {{ sortColumn === 'name' ? (sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more' }}
                      </span>
                    </div>
                  </th>
                  <th class="px-4 py-3 cursor-pointer hover:text-primary transition-colors" (click)="sortBy('role')">
                    <div class="flex items-center gap-1">
                      Rol
                      <span class="material-icons text-xs">
                        {{ sortColumn === 'role' ? (sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more' }}
                      </span>
                    </div>
                  </th>
                  <th class="px-4 py-3 cursor-pointer hover:text-primary transition-colors" (click)="sortBy('email')">
                    <div class="flex items-center gap-1">
                      Email
                      <span class="material-icons text-xs">
                        {{ sortColumn === 'email' ? (sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more' }}
                      </span>
                    </div>
                  </th>
                  <th class="px-4 py-3 cursor-pointer hover:text-primary transition-colors" (click)="sortBy('lastLogin')">
                    <div class="flex items-center gap-1">
                      Último Acceso
                      <span class="material-icons text-xs">
                        {{ sortColumn === 'lastLogin' ? (sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more' }}
                      </span>
                    </div>
                  </th>
                  <th class="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                @for (user of userService.users(); track user.id) {
                  <tr class="hover:bg-blue-50/30 transition-colors cursor-pointer group" (click)="editUser(user)">
                    <td class="px-4 py-3">
                      <div class="flex items-center gap-2.5">
                        <div class="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs text-white shrink-0"
                          [ngClass]="{
                            'bg-purple-500': user.roleId === 1,
                            'bg-blue-500': user.roleId === 2,
                            'bg-teal-500': user.roleId === 3 || user.roleId === 5,
                            'bg-amber-500': user.roleId === 4,
                            'bg-slate-500': user.roleId === 6 || user.roleId === 7
                          }">
                          {{ user.name?.[0] || '?' }}
                        </div>
                        <div class="flex flex-col">
                          <span class="text-xs font-mono font-medium text-slate-600">{{ user.username }}</span>
                          @if (!user.active) {
                            <span class="text-[9px] text-red-500 font-bold">INACTIVO</span>
                          }
                        </div>
                      </div>
                    </td>
                    <td class="px-4 py-3">
                      <p class="text-sm text-slate-800 font-medium">{{ user.name }}</p>
                      <p class="text-[10px] text-slate-400">{{ user.empresaName || '—' }}</p>
                    </td>
                    <td class="px-4 py-3">
                      <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border"
                        [ngClass]="{
                          'bg-purple-50 text-purple-700 border-purple-200': user.roleId === 1,
                          'bg-blue-50 text-blue-700 border-blue-200': user.roleId === 2,
                          'bg-teal-50 text-teal-700 border-teal-200': user.roleId === 3 || user.roleId === 5,
                          'bg-amber-50 text-amber-700 border-amber-200': user.roleId === 4,
                          'bg-slate-50 text-slate-600 border-slate-200': user.roleId === 6 || user.roleId === 7
                        }">
                        <span class="material-icons text-xs">
                          {{ user.roleId === 1 ? 'admin_panel_settings' : user.roleId === 2 ? 'engineering' : user.roleId === 3 || user.roleId === 5 ? 'supervisor_account' : user.roleId === 4 ? 'support_agent' : 'person' }}
                        </span>
                        {{ user.roleName }}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-xs text-slate-500">{{ user.email || '—' }}</td>
                    <td class="px-4 py-3 text-xs text-slate-400">
                      {{ user.lastLogin ? (user.lastLogin | date:'dd/MM/yyyy HH:mm') : '—' }}
                    </td>
                    <td class="px-4 py-3 text-right">
                      <div class="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button (click)="$event.stopPropagation(); editUser(user)"
                          class="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded transition-all" title="Editar">
                          <span class="material-icons text-base">edit</span>
                        </button>
                        <button (click)="$event.stopPropagation(); confirmDelete(user)"
                          class="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-all" title="Eliminar">
                          <span class="material-icons text-base">delete_outline</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Pagination Footer -->
          <div class="px-4 py-2.5 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500 shrink-0">
            <div class="flex items-center gap-2">
              <span>Filas:</span>
              <select [ngModel]="pageSize" (ngModelChange)="onPageSizeChange($event)"
                class="border border-slate-300 rounded px-1.5 py-0.5 text-xs bg-white focus:ring-1 focus:ring-primary">
                <option [ngValue]="10">10</option>
                <option [ngValue]="20">20</option>
                <option [ngValue]="50">50</option>
              </select>
              <span>|</span>
              <span>{{ (currentPage - 1) * pageSize + 1 }}–{{ Math.min(currentPage * pageSize, userService.pagination().total) }} de {{ userService.pagination().total }}</span>
            </div>
            <div class="flex items-center gap-1">
              <button (click)="prevPage()" [disabled]="currentPage <= 1"
                class="p-1 rounded hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                <span class="material-icons text-base">chevron_left</span>
              </button>
              @for (p of getVisiblePages(); track p) {
                @if (p === '...') {
                  <span class="px-1">...</span>
                } @else {
                  <button (click)="goToPage(+p)"
                    class="w-7 h-7 rounded text-xs font-medium transition-colors"
                    [ngClass]="currentPage === p ? 'bg-primary text-white' : 'hover:bg-slate-200 text-slate-600'">
                    {{ p }}
                  </button>
                }
              }
              <button (click)="nextPage()" [disabled]="currentPage >= userService.pagination().totalPages"
                class="p-1 rounded hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                <span class="material-icons text-base">chevron_right</span>
              </button>
            </div>
          </div>
        }
      </div>

      <!-- Drawer -->
      @if (isFormOpen()) {
        <app-drawer
          [title]="selectedUser() ? 'Editar Usuario' : 'Nuevo Usuario'"
          (close)="closeForm()"
        >
          <app-user-form
            [user]="selectedUser()"
            (close)="closeForm()"
            (save)="onSave($event)"
          ></app-user-form>
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
                <h3 class="text-sm font-bold text-slate-800">Eliminar Usuario</h3>
                <p class="text-xs text-slate-500">Esta acción no se puede deshacer</p>
              </div>
            </div>
            <p class="text-sm text-slate-600 mb-5">
              ¿Estás seguro de que deseas eliminar al usuario <strong>{{ userToDelete()?.name }}</strong> ({{ userToDelete()?.username }})?
            </p>
            <div class="flex justify-end gap-2">
              <button (click)="showDeleteConfirm.set(false)"
                class="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded transition-colors font-medium">
                Cancelar
              </button>
              <button (click)="deleteUser()"
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
export class UserListComponent implements OnInit, OnDestroy {
  userService = inject(UserService);
  Math = Math;
  private filterDebounceTimer: any;

  searchQuery = '';
  roleFilter = '';
  currentPage = 1;
  pageSize = 20;
  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  isFormOpen = signal(false);
  selectedUser = signal<User | null>(null);
  showDeleteConfirm = signal(false);
  userToDelete = signal<User | null>(null);

  ngOnInit() {
    this.loadData();
    this.userService.loadRoles();
    this.userService.loadEmpresas();
  }

  ngOnDestroy() {
    if (this.filterDebounceTimer) clearTimeout(this.filterDebounceTimer);
  }

  loadData() {
    this.userService.fetchUsers({
      page: this.currentPage,
      limit: this.pageSize,
      search: this.searchQuery || undefined,
      role: this.roleFilter || undefined,
      sortBy: this.sortColumn || undefined,
      sortDir: this.sortColumn ? this.sortDirection : undefined
    });
  }

  onSearchInput() {
    if (this.filterDebounceTimer) clearTimeout(this.filterDebounceTimer);
    this.filterDebounceTimer = setTimeout(() => {
      this.currentPage = 1;
      this.loadData();
    }, 400);
  }

  onFilterChange() {
    this.currentPage = 1;
    this.loadData();
  }

  onPageSizeChange(size: number) {
    this.pageSize = size;
    this.currentPage = 1;
    this.loadData();
  }

  sortBy(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.currentPage = 1;
    this.loadData();
  }

  getVisiblePages(): (number | string)[] {
    const totalPages = this.userService.pagination().totalPages;
    const current = this.currentPage;
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (current <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (current >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', current - 1, current, current + 1, '...', totalPages);
      }
    }
    return pages;
  }

  goToPage(page: number) { this.currentPage = page; this.loadData(); }
  nextPage() { if (this.currentPage < this.userService.pagination().totalPages) { this.currentPage++; this.loadData(); } }
  prevPage() { if (this.currentPage > 1) { this.currentPage--; this.loadData(); } }

  openForm() {
    this.selectedUser.set(null);
    this.isFormOpen.set(true);
  }

  editUser(user: User) {
    this.selectedUser.set(user);
    this.isFormOpen.set(true);
  }

  closeForm() {
    this.isFormOpen.set(false);
    this.selectedUser.set(null);
  }

  confirmDelete(user: User) {
    this.userToDelete.set(user);
    this.showDeleteConfirm.set(true);
  }

  deleteUser() {
    const user = this.userToDelete();
    if (!user) return;
    this.userService.deleteUser(user.id).subscribe({
      next: () => {
        this.showDeleteConfirm.set(false);
        this.userToDelete.set(null);
        this.loadData();
      },
      error: () => alert('Error al eliminar usuario')
    });
  }

  onSave(formData: any) {
    if (this.selectedUser()) {
      this.userService.updateUser(this.selectedUser()!.id, formData).subscribe({
        next: () => {
          this.closeForm();
          this.loadData();
        },
        error: () => alert('Error al actualizar usuario')
      });
    } else {
      this.userService.createUser(formData).subscribe({
        next: () => {
          this.closeForm();
          this.loadData();
        },
        error: (err: any) => {
          if (err.status === 409) {
            alert('El usuario ya existe');
          } else {
            alert('Error al crear usuario');
          }
        }
      });
    }
  }
}
