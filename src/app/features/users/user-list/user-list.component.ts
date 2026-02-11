import { Component, inject, signal, OnInit, computed } from '@angular/core';
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
    <div class="space-y-6">
      <!-- Toolbar -->
      <div class="flex flex-col sm:flex-row justify-between gap-4">
        <div>
           <h2 class="text-2xl font-bold text-slate-800 tracking-tight">Gestión de Usuarios</h2>
           <p class="text-slate-500 text-sm">Administre los accesos y roles de la plataforma</p>
        </div>
        <div class="flex flex-col sm:flex-row gap-3">
          <div class="relative">
             <input [(ngModel)]="searchQuery" (input)="onSearch()" type="text" placeholder="Buscar usuarios..." class="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 w-full sm:w-64 shadow-sm">
             <i class="fas fa-search absolute left-3 top-3 text-slate-400"></i>
          </div>
          <button (click)="openForm()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-medium shadow-sm shadow-blue-200 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 justify-center">
             <i class="fas fa-plus"></i>
             <span>Nuevo Usuario</span>
          </button>
        </div>
      </div>

      <!-- Loading State -->
      @if (userService.loading()) {
         <div class="flex justify-center p-12"><i class="fas fa-spinner fa-spin text-3xl text-blue-500"></i></div>
      } @else if (sortedUsers().length === 0) {
         <div class="text-center p-12 text-slate-500 bg-slate-50 rounded-xl border border-slate-200 dashed">
            <i class="fas fa-search text-3xl mb-3 text-slate-300"></i>
            <p>No se encontraron usuarios</p>
         </div>
      } @else {
      
          <!-- Desktop Table (Hidden on Mobile) -->
          <div class="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-[calc(100vh-14rem)] hidden sm:flex">
            <div class="overflow-auto custom-scroll flex-1">
              <table class="w-full text-left border-collapse relative">
                <thead class="sticky top-0 z-10 shadow-sm">
                  <tr class="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <th class="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" (click)="sort('username')">
                        Usuario @if(sortColumn() === 'username') { <i class="fas" [class.fa-sort-up]="sortOrder() === 'asc'" [class.fa-sort-down]="sortOrder() === 'desc'"></i> }
                    </th>
                    <th class="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" (click)="sort('name')">
                        Nombre @if(sortColumn() === 'name') { <i class="fas" [class.fa-sort-up]="sortOrder() === 'asc'" [class.fa-sort-down]="sortOrder() === 'desc'"></i> }
                    </th>
                    <th class="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" (click)="sort('role')">
                        Rol @if(sortColumn() === 'role') { <i class="fas" [class.fa-sort-up]="sortOrder() === 'asc'" [class.fa-sort-down]="sortOrder() === 'desc'"></i> }
                    </th>
                    <th class="px-6 py-4">Email</th>
                    <th class="px-6 py-4">Último Acceso</th>
                    <th class="px-6 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  @for (user of sortedUsers(); track user.id) {
                    <tr class="hover:bg-slate-50 transition-colors group cursor-pointer" (click)="editUser(user)">
                      <td class="px-6 py-4 font-medium text-slate-900">{{ user.username }}</td>
                      <td class="px-6 py-4 text-slate-600">{{ user.name }}</td>
                      <td class="px-6 py-4">
                        <span 
                          class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border inline-block"
                          [ngClass]="{
                            'bg-purple-50 text-purple-700 border-purple-200': user.role === 'ADMIN',
                            'bg-blue-50 text-blue-700 border-blue-200': user.role === 'TECNICO',
                            'bg-slate-50 text-slate-700 border-slate-200': user.role === 'OPERADOR'
                          }"
                        >
                          {{ user.role }}
                        </span>
                      </td>
                      <td class="px-6 py-4 text-slate-500 text-sm">{{ user.email }}</td>
                      <td class="px-6 py-4 text-slate-500 text-xs">{{ user.lastLogin | date:'short' }}</td>
                      <td class="px-6 py-4 text-right">
                        <button (click)="$event.stopPropagation(); editUser(user)" class="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Editar">
                          <i class="fas fa-pencil-alt"></i>
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>

          <!-- Mobile Cards (Visible only on small screens) -->
          <div class="grid grid-cols-1 gap-4 sm:hidden">
            @for (user of sortedUsers(); track user.id) {
                <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-200 active:scale-[0.98] transition-transform" (click)="editUser(user)">
                   <div class="flex justify-between items-start mb-3">
                      <div>
                         <h3 class="font-bold text-slate-900">{{ user.name }}</h3>
                         <span class="text-xs text-slate-500 font-mono">@{{ user.username }}</span>
                      </div>
                      <span 
                          class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border"
                          [ngClass]="{
                            'bg-purple-50 text-purple-700 border-purple-200': user.role === 'ADMIN',
                            'bg-blue-50 text-blue-700 border-blue-200': user.role === 'TECNICO',
                            'bg-slate-50 text-slate-700 border-slate-200': user.role === 'OPERADOR'
                          }"
                        >
                          {{ user.role }}
                        </span>
                   </div>
                   
                   <div class="text-xs text-slate-500 space-y-1">
                      <div class="flex items-center gap-2">
                         <i class="fas fa-envelope w-4 text-center"></i>
                         <span>{{ user.email }}</span>
                      </div>
                      <div class="flex items-center gap-2">
                         <i class="fas fa-clock w-4 text-center"></i>
                         <span>{{ user.lastLogin | date:'short' }}</span>
                      </div>
                   </div>
                </div>
            }
          </div>

      }
      
      <!-- Drawer -->
      @if (isFormOpen()) {
        <app-drawer [title]="selectedUser() ? 'Editar Usuario' : 'Nuevo Usuario'" (close)="closeForm()">
             <app-user-form 
               [user]="selectedUser()" 
               (close)="closeForm()" 
               (save)="onSave($event)"
             ></app-user-form>
        </app-drawer>
      }
    </div>
  `
})
export class UserListComponent implements OnInit {
  userService = inject(UserService);

  searchQuery = '';

  // Sort State
  sortColumn = signal<string>('name');
  sortOrder = signal<'asc' | 'desc'>('asc');

  isFormOpen = signal(false);
  selectedUser = signal<User | null>(null);

  // 1. Filter
  filteredUsers = computed(() => {
    const q = this.searchQuery.toLowerCase();
    return this.userService.users().filter(u =>
      u.name.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q)
    );
  });

  // 2. Sort
  sortedUsers = computed(() => {
    const users = [...this.filteredUsers()];
    const col = this.sortColumn();
    const order = this.sortOrder();

    return users.sort((a, b) => {
      const valA = (a as any)[col];
      const valB = (b as any)[col];

      if (valA < valB) return order === 'asc' ? -1 : 1;
      if (valA > valB) return order === 'asc' ? 1 : -1;
      return 0;
    });
  });

  ngOnInit() {
    this.userService.loadUsers();
    this.userService.loadUserTypes();
  }

  onSearch() {
    // Computed handles filtering
  }

  sort(column: string) {
    if (this.sortColumn() === column) {
      this.sortOrder.set(this.sortOrder() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortOrder.set('asc');
    }
  }

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

  onSave(formData: any) {
    if (this.selectedUser()) {
      this.userService.updateUser(this.selectedUser()!.id, formData).subscribe({
        next: () => {
          this.closeForm();
          // Implement Toast here normally
        },
        error: (err) => alert('Error al actualizar usuario')
      });
    } else {
      // Implement create logic
      alert('Creación de usuarios no implementada en backend aún');
    }
  }
}
