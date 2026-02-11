import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TicketService, Ticket } from '../../../core/services/ticket.service';
import { TicketFormComponent } from '../ticket-form/ticket-form.component';
import { DrawerComponent } from '../../../shared/components/drawer/drawer.component';

@Component({
  selector: 'app-ticket-list',
  standalone: true,
  imports: [CommonModule, FormsModule, TicketFormComponent, DrawerComponent],
  template: `
    <div class="space-y-6 page-enter">
      <!-- Toolbar -->
      <div class="flex flex-col lg:flex-row justify-between gap-4">
        <div class="animate-fade-in">
           <h2 class="text-2xl font-bold text-slate-800 tracking-tight">Tickets de Servicio</h2>
           <p class="text-slate-500 text-sm">Gestión de órdenes de trabajo y visitas técnicas</p>
        </div>
        <div class="flex flex-col sm:flex-row gap-3 animate-slide-right">
          <!-- Status Filter -->
          <div class="relative">
             <i class="fas fa-filter absolute left-3 top-3.5 text-slate-400 z-10 text-xs"></i>
             <select [(ngModel)]="statusFilter" (change)="onFilterChange()" class="input input-with-icon pl-9 pr-8 py-2.5 w-full sm:w-44 appearance-none cursor-pointer font-medium">
                <option value="">Todos los estados</option>
                <option value="Ready to plan">Ready to plan</option>
                <option value="Released">Released</option>
                <option value="Closed">Closed</option>
                <option value="Cancelled">Cancelled</option>
             </select>
             <i class="fas fa-chevron-down absolute right-3 top-4 text-slate-400 pointer-events-none text-[10px]"></i>
          </div>

          <!-- Search -->
          <div class="relative flex-1 sm:w-72">
             <input 
                [(ngModel)]="searchQuery" 
                (input)="onSearchInput()" 
                type="text" 
                placeholder="Buscar ticket, cliente..." 
                class="input input-with-icon pl-10 pr-4 py-2.5 w-full"
             >
             <i class="fas fa-search absolute left-3 top-3 text-slate-400"></i>
             @if (searchQuery) {
               <button (click)="clearSearch()" class="absolute right-3 top-2.5 p-1 text-slate-400 hover:text-slate-600 transition-colors">
                 <i class="fas fa-times text-xs"></i>
               </button>
             }
          </div>

          <button (click)="openForm()" class="btn btn-primary whitespace-nowrap">
             <i class="fas fa-plus"></i>
             <span class="hidden sm:inline">Nuevo Ticket</span>
          </button>
        </div>
      </div>

      <!-- Content -->
      <div class="flex flex-col h-[calc(100vh-14rem)]">
          
          <!-- Loading State with Skeleton -->
          @if (ticketService.loading()) {
             <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex-1 hidden md:block">
               <!-- Skeleton Header -->
               <div class="px-6 py-4 bg-slate-50 border-b border-slate-200 flex gap-4">
                 @for (i of [1,2,3,4,5,6]; track i) {
                   <div class="skeleton skeleton-text flex-1"></div>
                 }
               </div>
               <!-- Skeleton Rows -->
               @for (i of [1,2,3,4,5,6,7,8]; track i) {
                 <div class="px-6 py-4 border-b border-slate-100 flex gap-4 stagger-{{i}}">
                   <div class="skeleton h-4 w-24"></div>
                   <div class="skeleton h-4 w-20"></div>
                   <div class="skeleton h-4 w-32"></div>
                   <div class="skeleton h-4 flex-1"></div>
                   <div class="skeleton h-4 w-16"></div>
                 </div>
               }
             </div>
             
             <!-- Mobile Skeleton -->
             <div class="flex flex-col gap-4 md:hidden">
               @for (i of [1,2,3,4]; track i) {
                 <div class="skeleton skeleton-card animate-fade-in" [style.animation-delay.ms]="i * 100"></div>
               }
             </div>
          } @else if (ticketService.tickets().length === 0) {
             <div class="empty-state flex-1 m-4 animate-scale-in">
                <div class="empty-state-icon">
                    <i class="fas fa-inbox"></i>
                </div>
                <p class="font-semibold text-slate-600 text-lg">No se encontraron tickets</p>
                <p class="text-sm text-slate-400 mt-1">Intenta ajustar los filtros de búsqueda</p>
                <button (click)="clearFilters()" class="btn btn-secondary mt-4">
                  <i class="fas fa-refresh"></i>
                  Limpiar filtros
                </button>
             </div>
          } @else {
             
             <!-- Desktop Table -->
             <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hidden md:flex flex-col flex-1 animate-fade-in">
                <div class="flex-1 overflow-auto custom-scroll">
                  <table class="w-full text-left border-collapse">
                    <thead class="sticky top-0 z-10">
                      <tr class="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                        <th class="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors group" (click)="sortBy('Ticket')">
                            <div class="flex items-center gap-2">
                              Ticket 
                              <i class="fas text-slate-300 group-hover:text-blue-500 transition-colors"
                                 [class.fa-sort]="sortColumn !== 'Ticket'"
                                 [class.fa-sort-up]="sortColumn === 'Ticket' && sortDirection === 'asc'"
                                 [class.fa-sort-down]="sortColumn === 'Ticket' && sortDirection === 'desc'"
                                 [class.text-blue-500]="sortColumn === 'Ticket'"></i>
                            </div>
                        </th>
                        <th class="px-6 py-4">Estado</th>
                        <th class="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors group" (click)="sortBy('FechaVisita')">
                            <div class="flex items-center gap-2">
                              Fecha Visita
                              <i class="fas text-slate-300 group-hover:text-blue-500 transition-colors"
                                 [class.fa-sort]="sortColumn !== 'FechaVisita'"
                                 [class.fa-sort-up]="sortColumn === 'FechaVisita' && sortDirection === 'asc'"
                                 [class.fa-sort-down]="sortColumn === 'FechaVisita' && sortDirection === 'desc'"
                                 [class.text-blue-500]="sortColumn === 'FechaVisita'"></i>
                            </div>
                        </th>
                        <th class="px-6 py-4">Cliente</th>
                        <th class="px-6 py-4">Equipo</th>
                        <th class="px-6 py-4 text-center">Visita</th>
                        <th class="px-6 py-4 text-center">Trabajo</th>
                        <th class="px-6 py-4 text-right sticky right-0 bg-slate-50 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.05)]">Acciones</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                      @for (ticket of ticketService.tickets(); track ticket.id; let i = $index) {
                        <tr class="table-row table-row-clickable group" 
                            [style.animation-delay.ms]="i * 30"
                            style="animation: fadeInUp 0.3s ease-out forwards; opacity: 0;"
                            (click)="editTicket(ticket)">
                          <td class="px-6 py-3 font-medium text-blue-600 font-mono text-xs">
                            <span class="hover:underline">{{ ticket.Ticket }}</span>
                          </td>
                          <td class="px-6 py-3">
                            <span 
                              class="badge whitespace-nowrap"
                              [ngClass]="{
                                'badge-warning': ticket.Estado === 'Ready to plan',
                                'badge-info': ticket.Estado === 'Released',
                                'badge-success': ticket.Estado === 'Closed',
                                'badge-neutral': ticket.Estado === 'Cancelled'
                              }"
                            >
                              <span class="w-1.5 h-1.5 rounded-full" 
                                  [ngClass]="{
                                    'bg-orange-500': ticket.Estado === 'Ready to plan',
                                    'bg-blue-500': ticket.Estado === 'Released',
                                    'bg-emerald-500': ticket.Estado === 'Closed',
                                    'bg-slate-500': ticket.Estado === 'Cancelled'
                                  }"
                              ></span>
                              {{ ticket.Estado }}
                            </span>
                          </td>
                          <td class="px-6 py-3 text-slate-500 text-xs whitespace-nowrap">{{ ticket.FechaVisita | date:'shortDate' }}</td>
                          <td class="px-6 py-3 text-slate-700 font-medium text-sm max-w-[200px] truncate" [title]="ticket.NombreCliente">{{ ticket.NombreCliente }}</td>
                          <td class="px-6 py-3 text-slate-500 text-sm max-w-[150px] truncate" [title]="ticket.NombreEquipo">{{ ticket.NombreEquipo }}</td>
                          
                          <!-- Boolean Checks -->
                          <td class="px-6 py-3 text-center">
                            @if(ticket.VisitaRealizada) {
                                <div class="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100">
                                  <i class="fas fa-check text-emerald-600 text-xs"></i>
                                </div>
                            } @else {
                                <div class="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-100">
                                  <i class="fas fa-minus text-slate-400 text-xs"></i>
                                </div>
                            }
                          </td>
                           <td class="px-6 py-3 text-center">
                            @if(ticket.TrabajoRealizado) {
                                <div class="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100">
                                  <i class="fas fa-check text-emerald-600 text-xs"></i>
                                </div>
                            } @else {
                                <div class="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-100">
                                  <i class="fas fa-minus text-slate-400 text-xs"></i>
                                </div>
                            }
                          </td>
        
                          <td class="px-6 py-3 text-right sticky right-0 bg-white group-hover:bg-blue-50/50 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.05)] transition-colors">
                            <button (click)="$event.stopPropagation(); editTicket(ticket)" class="btn btn-ghost p-2 text-slate-400 hover:text-blue-600" title="Editar">
                              <i class="fas fa-pencil-alt"></i>
                            </button>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
                
                <!-- Pagination Footer -->
                <div class="px-6 py-4 bg-gradient-to-r from-slate-50 to-white border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3 text-sm text-slate-500 shrink-0">
                    <div class="flex items-center gap-3">
                      <span class="text-slate-600">
                        Mostrando <span class="font-semibold text-slate-800">{{ (currentPage - 1) * pageSize + 1 }}</span> - 
                        <span class="font-semibold text-slate-800">{{ Math.min(currentPage * pageSize, ticketService.pagination().total) }}</span> de 
                        <span class="font-semibold text-slate-800">{{ ticketService.pagination().total }}</span>
                      </span>
                    </div>
                    <div class="flex items-center gap-1">
                        <button [disabled]="currentPage === 1" (click)="prevPage()" class="btn btn-ghost p-2 disabled:opacity-50">
                            <i class="fas fa-chevron-left text-xs"></i>
                        </button>
                        
                        <!-- Page Numbers -->
                        @for (page of getVisiblePages(); track page) {
                          @if (page === '...') {
                            <span class="px-2 text-slate-400">...</span>
                          } @else {
                            <button 
                              (click)="goToPage(+page)" 
                              class="w-8 h-8 rounded-lg text-sm font-medium transition-all"
                              [class.bg-blue-600]="currentPage === page"
                              [class.text-white]="currentPage === page"
                              [class.hover:bg-slate-100]="currentPage !== page"
                              [class.text-slate-600]="currentPage !== page"
                            >
                              {{ page }}
                            </button>
                          }
                        }
                        
                        <button [disabled]="currentPage >= ticketService.pagination().totalPages" (click)="nextPage()" class="btn btn-ghost p-2 disabled:opacity-50">
                            <i class="fas fa-chevron-right text-xs"></i>
                        </button>
                    </div>
                </div>
             </div>

             <!-- Mobile Cards -->
             <div class="flex flex-col gap-4 md:hidden overflow-y-auto pb-20">
                @for (ticket of ticketService.tickets(); track ticket.id) {
                    <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 active:scale-[0.98] transition-transform" (click)="editTicket(ticket)">
                       <!-- Header Card -->
                       <div class="flex justify-between items-start mb-4 pb-3 border-b border-slate-50">
                          <div>
                             <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Ticket ID</span>
                             <span class="font-mono text-blue-600 font-bold">{{ ticket.Ticket }}</span>
                          </div>
                          <span 
                              class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border whitespace-nowrap"
                              [ngClass]="{
                                'bg-orange-50 text-orange-700 border-orange-200': ticket.Estado === 'Ready to plan',
                                'bg-blue-50 text-blue-700 border-blue-200': ticket.Estado === 'Released',
                                'bg-emerald-50 text-emerald-700 border-emerald-200': ticket.Estado === 'Closed',
                                'bg-slate-100 text-slate-600 border-slate-300': ticket.Estado === 'Cancelled'
                              }"
                            >
                              {{ ticket.Estado }}
                            </span>
                       </div>

                       <!-- Info Grid -->
                       <div class="grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
                          <div class="col-span-2">
                             <div class="flex items-start gap-2 text-slate-700">
                                <i class="fas fa-user-circle mt-0.5 text-slate-400"></i>
                                <span class="font-medium line-clamp-1">{{ ticket.NombreCliente }}</span>
                             </div>
                          </div>
                          <div class="col-span-2">
                             <div class="flex items-start gap-2 text-slate-600">
                                <i class="fas fa-cube mt-0.5 text-slate-400"></i>
                                <span class="text-xs line-clamp-1">{{ ticket.NombreEquipo }}</span>
                             </div>
                          </div>
                          
                          <div class="flex items-center gap-2 mt-2">
                             <i class="fas fa-calendar-alt text-slate-400 text-xs"></i>
                             <span class="text-xs text-slate-500">{{ ticket.FechaVisita | date:'shortDate' }}</span>
                          </div>

                          <div class="flex justify-end gap-3 mt-2">
                             <div class="flex items-center gap-1.5" [class.opacity-40]="!ticket.VisitaRealizada">
                                <i class="fas fa-walking text-xs" [class.text-emerald-500]="ticket.VisitaRealizada" [class.text-slate-400]="!ticket.VisitaRealizada"></i>
                                <span class="text-[10px] font-bold uppercase text-slate-500">Visita</span>
                             </div>
                             <div class="flex items-center gap-1.5" [class.opacity-40]="!ticket.TrabajoRealizado">
                                <i class="fas fa-tools text-xs" [class.text-emerald-500]="ticket.TrabajoRealizado" [class.text-slate-400]="!ticket.TrabajoRealizado"></i>
                                <span class="text-[10px] font-bold uppercase text-slate-500">Trabajo</span>
                             </div>
                          </div>
                       </div>
                    </div>
                }
             </div>
          }
      </div>
      
      <!-- Drawer -->
      @if (isFormOpen()) {
        <app-drawer [title]="selectedTicket() ? 'Detalle de Ticket' : 'Nuevo Ticket'" (close)="closeForm()">
             <app-ticket-form 
               [ticket]="selectedTicket()" 
               (close)="closeForm()" 
               (save)="onSave($event)"
             ></app-ticket-form>
        </app-drawer>
      }
    </div>
  `
})
export class TicketListComponent implements OnInit {
  ticketService = inject(TicketService);
  Math = Math; // Expose Math to template

  searchQuery = '';
  statusFilter = '';
  currentPage = 1;
  pageSize = 20;
  
  // Sorting
  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  isFormOpen = signal(false);
  selectedTicket = signal<Ticket | null>(null);

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.ticketService.loadTickets({
      page: this.currentPage,
      limit: this.pageSize,
      search: this.searchQuery,
      status: this.statusFilter
    });
  }

  // Debounced search on input
  onSearchInput() {
    this.currentPage = 1;
    this.ticketService.searchTickets({
      page: this.currentPage,
      limit: this.pageSize,
      search: this.searchQuery,
      status: this.statusFilter
    });
  }

  onSearch() {
    this.currentPage = 1;
    this.loadData();
  }

  onFilterChange() {
    this.currentPage = 1;
    this.loadData();
  }

  clearSearch() {
    this.searchQuery = '';
    this.currentPage = 1;
    this.loadData();
  }

  clearFilters() {
    this.searchQuery = '';
    this.statusFilter = '';
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
    // Sorting would be done server-side in production
  }

  getVisiblePages(): (number | string)[] {
    const totalPages = this.ticketService.pagination().totalPages;
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

  goToPage(page: number) {
    this.currentPage = page;
    this.loadData();
  }

  nextPage() {
    if (this.currentPage < this.ticketService.pagination().totalPages) {
      this.currentPage++;
      this.loadData();
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadData();
    }
  }

  openForm() {
    this.selectedTicket.set(null);
    this.isFormOpen.set(true);
  }

  editTicket(ticket: Ticket) {
    this.selectedTicket.set(ticket);
    this.isFormOpen.set(true);
  }

  closeForm() {
    this.isFormOpen.set(false);
    this.selectedTicket.set(null);
  }

  onSave(formData: any) {
    if (this.selectedTicket()) {
      this.ticketService.updateTicket(this.selectedTicket()!.Ticket, formData).subscribe({
        next: () => {
          this.closeForm();
        },
        error: (err) => alert('Error al actualizar ticket')
      });
    } else {
      this.ticketService.createTicket(formData).subscribe({
        next: () => {
          this.closeForm();
        },
        error: (err) => alert('Error al crear ticket')
      });
    }
  }
}
