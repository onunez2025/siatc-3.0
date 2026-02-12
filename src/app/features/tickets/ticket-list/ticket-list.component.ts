import { Component, inject, signal, OnInit, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TicketService, Ticket } from '../../../core/services/ticket.service';
import { TicketFormComponent } from '../ticket-form/ticket-form.component';
import { TicketDetailComponent } from '../ticket-detail/ticket-detail.component';
import { DrawerComponent } from '../../../shared/components/drawer/drawer.component';

@Component({
  selector: 'app-ticket-list',
  standalone: true,
  imports: [CommonModule, FormsModule, TicketFormComponent, TicketDetailComponent, DrawerComponent],
  template: `
    <div class="flex flex-col h-full gap-4">
      <!-- Toolbar -->
      <div class="flex flex-col lg:flex-row justify-between gap-4 bg-white p-4 rounded border border-slate-200 shadow-sm">
        <div class="flex items-center gap-3">
          <h1 class="text-lg font-bold tracking-tight text-slate-800 uppercase">Ticket List</h1>
          <div class="flex-1 max-w-md relative">
            <span class="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
            <input 
              [(ngModel)]="searchQuery"
              (input)="onSearchInput()"
              class="w-full pl-9 pr-4 py-1.5 bg-slate-100 border-transparent focus:bg-white focus:border-primary focus:ring-0 rounded text-sm transition-all outline-none" 
              placeholder="Search tickets by ID, client or subject..." 
              type="text"
            />
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button (click)="openForm()" class="bg-primary hover:bg-primary/90 text-white px-4 py-1.5 rounded flex items-center gap-2 font-semibold text-xs transition-all shadow-sm uppercase tracking-wide">
            <span class="material-icons text-sm">add</span>
            Create Ticket
          </button>
        </div>
      </div>

      <!-- Filters Bar -->
      <div class="bg-white px-4 py-3 border border-slate-200 rounded shadow-sm">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="text-xs font-bold text-slate-400 uppercase mr-1">Filtros:</span>
            
            <!-- Estado -->
            <select 
              [(ngModel)]="statusFilter"
              (change)="onFilterChange()"
              class="text-xs bg-white border border-slate-300 rounded focus:ring-2 focus:ring-primary focus:border-primary py-1.5 px-2 min-w-[120px] text-slate-700 font-medium"
            >
              <option value="">Estado: Todos</option>
              <option value="Ready to plan">Ready to plan</option>
              <option value="Released">Released</option>
              <option value="Closed">Closed</option>
              <option value="Cancelled">Cancelled</option>
            </select>

            <!-- Técnico -->
            <input 
              [(ngModel)]="tecnicoFilter"
              (ngModelChange)="onTextFilterChange()"
              placeholder="Técnico..."
              class="text-xs bg-white border border-slate-300 rounded focus:ring-2 focus:ring-primary focus:border-primary py-1.5 px-2 w-[130px] text-slate-700 font-medium"
            />

            <!-- Cliente -->
            <input 
              [(ngModel)]="clienteFilter"
              (ngModelChange)="onTextFilterChange()"
              placeholder="Cliente..."
              class="text-xs bg-white border border-slate-300 rounded focus:ring-2 focus:ring-primary focus:border-primary py-1.5 px-2 w-[130px] text-slate-700 font-medium"
            />

            <!-- Empresa -->
            <input 
              [(ngModel)]="empresaFilter"
              (ngModelChange)="onTextFilterChange()"
              placeholder="Empresa..."
              class="text-xs bg-white border border-slate-300 rounded focus:ring-2 focus:ring-primary focus:border-primary py-1.5 px-2 w-[130px] text-slate-700 font-medium"
            />

            <!-- Fecha Desde -->
            <div class="flex items-center gap-1">
              <span class="text-[10px] text-slate-400 font-bold">Desde:</span>
              <input 
                type="date"
                [(ngModel)]="fechaDesde"
                (change)="onFilterChange()"
                class="text-xs bg-white border border-slate-300 rounded focus:ring-2 focus:ring-primary focus:border-primary py-1.5 px-2 text-slate-700 font-medium"
              />
            </div>

            <!-- Fecha Hasta -->
            <div class="flex items-center gap-1">
              <span class="text-[10px] text-slate-400 font-bold">Hasta:</span>
              <input 
                type="date"
                [(ngModel)]="fechaHasta"
                (change)="onFilterChange()"
                class="text-xs bg-white border border-slate-300 rounded focus:ring-2 focus:ring-primary focus:border-primary py-1.5 px-2 text-slate-700 font-medium"
              />
            </div>

            <!-- Reset Button -->
            <button 
              (click)="clearFilters()"
              class="text-[10px] text-slate-500 hover:text-primary font-bold px-3 py-1.5 uppercase tracking-tighter border border-slate-200 rounded hover:bg-slate-50 transition-colors"
            >
              <span class="material-icons text-xs align-text-bottom mr-0.5">refresh</span>
              Reset
            </button>
          </div>
          <div class="flex items-center gap-1 border-l border-slate-200 pl-4">
            <button class="p-1.5 text-slate-400 hover:text-primary transition-colors" title="Export CSV">
              <span class="material-icons text-lg">file_download</span>
            </button>
            <button class="p-1.5 text-slate-400 hover:text-primary transition-colors" title="Print">
              <span class="material-icons text-lg">print</span>
            </button>
            <button class="p-1.5 text-slate-400 hover:text-primary transition-colors" title="Column Settings">
              <span class="material-icons text-lg">view_column</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Content -->
      <div class="flex flex-col flex-1 min-h-0">
        
        <!-- Loading State -->
        @if (ticketService.loading()) {
          <div class="bg-white border border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden rounded">
            <div class="p-8 flex justify-center items-center">
              <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          </div>
        } @else if (ticketService.tickets().length === 0) {
          <div class="bg-white border border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden rounded items-center justify-center p-8">
            <span class="material-icons text-6xl text-slate-300 mb-4">inbox</span>
            <p class="font-semibold text-slate-700 text-lg">No se encontraron tickets</p>
            <p class="text-sm text-slate-400 mt-1">Intenta ajustar los filtros de búsqueda</p>
            <button (click)="clearFilters()" class="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded text-sm font-medium">
              Limpiar filtros
            </button>
          </div>
        } @else {
          
          <!-- Tickets Table -->
          <div class="bg-white border border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden rounded">
            <div class="overflow-x-auto flex-1">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                    <th class="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider w-10 text-center">
                      <input class="rounded-sm border-slate-300 text-primary focus:ring-primary h-3.5 w-3.5" type="checkbox" />
                    </th>
                    <th class="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider w-28 cursor-pointer hover:bg-slate-100 select-none" (click)="sortBy('Ticket')">
                      <span class="inline-flex items-center gap-1">Ticket
                      @if (sortColumn === 'Ticket') {
                        <span class="material-icons text-xs">{{ sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward' }}</span>
                      } @else {
                        <span class="material-icons text-xs text-slate-300">unfold_more</span>
                      }
                      </span>
                    </th>
                    <th class="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 select-none" (click)="sortBy('NombreCliente')">
                      <span class="inline-flex items-center gap-1">Cliente
                      @if (sortColumn === 'NombreCliente') {
                        <span class="material-icons text-xs">{{ sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward' }}</span>
                      } @else {
                        <span class="material-icons text-xs text-slate-300">unfold_more</span>
                      }
                      </span>
                    </th>
                    <th class="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 select-none" (click)="sortBy('NombreEquipo')">
                      <span class="inline-flex items-center gap-1">Equipo
                      @if (sortColumn === 'NombreEquipo') {
                        <span class="material-icons text-xs">{{ sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward' }}</span>
                      } @else {
                        <span class="material-icons text-xs text-slate-300">unfold_more</span>
                      }
                      </span>
                    </th>
                    <th class="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center cursor-pointer hover:bg-slate-100 select-none" (click)="sortBy('Estado')">
                      <span class="inline-flex items-center gap-1">Estado
                      @if (sortColumn === 'Estado') {
                        <span class="material-icons text-xs">{{ sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward' }}</span>
                      } @else {
                        <span class="material-icons text-xs text-slate-300">unfold_more</span>
                      }
                      </span>
                    </th>
                    <th class="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 select-none" (click)="sortBy('NombreTecnico')">
                      <span class="inline-flex items-center gap-1">Técnico
                      @if (sortColumn === 'NombreTecnico') {
                        <span class="material-icons text-xs">{{ sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward' }}</span>
                      } @else {
                        <span class="material-icons text-xs text-slate-300">unfold_more</span>
                      }
                      </span>
                    </th>
                    <th class="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Visita</th>
                    <th class="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right cursor-pointer hover:bg-slate-100 select-none" (click)="sortBy('FechaVisita')">
                      <span class="inline-flex items-center gap-1">Fecha
                      @if (sortColumn === 'FechaVisita') {
                        <span class="material-icons text-xs">{{ sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward' }}</span>
                      } @else {
                        <span class="material-icons text-xs text-slate-300">unfold_more</span>
                      }
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  @for (ticket of ticketService.tickets(); track ticket.id) {
                    <tr class="hover:bg-slate-50/80 transition-colors group cursor-pointer" (click)="editTicket(ticket)">
                      <td class="px-4 py-2.5 text-center" (click)="$event.stopPropagation()">
                        <input class="rounded-sm border-slate-300 text-primary focus:ring-primary h-3.5 w-3.5" type="checkbox" />
                      </td>
                      <td class="px-4 py-2.5">
                        <span class="text-primary font-bold text-sm cursor-pointer hover:underline">
                          #{{ ticket.Ticket }}
                        </span>
                      </td>
                      <td class="px-4 py-2.5">
                        <div class="flex flex-col">
                          <span class="text-xs font-bold text-slate-800">{{ ticket.NombreCliente }}</span>
                          <span class="text-[10px] text-slate-500 uppercase">{{ ticket.Distrito }}{{ ticket.Ciudad ? ', ' + ticket.Ciudad : '' }}</span>
                        </div>
                      </td>
                      <td class="px-4 py-2.5">
                        <p class="text-xs text-slate-600 line-clamp-1" [title]="ticket.NombreEquipo">
                          {{ ticket.NombreEquipo }}
                        </p>
                      </td>
                      <td class="px-4 py-2.5 text-center">
                        @if (ticket.Estado === 'Released') {
                          <span class="inline-flex items-center px-2 py-0.5 rounded border border-blue-200 bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-tight">
                            Released
                          </span>
                        } @else if (ticket.Estado === 'Ready to plan') {
                          <span class="inline-flex items-center px-2 py-0.5 rounded border border-amber-200 bg-amber-50 text-amber-700 text-[10px] font-bold uppercase tracking-tight">
                            Ready to plan
                          </span>
                        } @else if (ticket.Estado === 'Closed') {
                          <span class="inline-flex items-center px-2 py-0.5 rounded border border-green-200 bg-green-50 text-green-700 text-[10px] font-bold uppercase tracking-tight">
                            Closed
                          </span>
                        } @else if (ticket.Estado === 'Cancelled') {
                          <span class="inline-flex items-center px-2 py-0.5 rounded border border-red-200 bg-red-50 text-red-700 text-[10px] font-bold uppercase tracking-tight">
                            Cancelled
                          </span>
                        } @else {
                          <span class="inline-flex items-center px-2 py-0.5 rounded border border-slate-200 bg-slate-50 text-slate-700 text-[10px] font-bold uppercase tracking-tight">
                            {{ ticket.Estado }}
                          </span>
                        }
                      </td>
                      <td class="px-4 py-2.5">
                        <span class="text-xs text-slate-600">{{ ticket.NombreTecnico }} {{ ticket.ApellidoTecnico }}</span>
                      </td>
                      <td class="px-4 py-2.5 text-center">
                        @if(ticket.VisitaRealizada) {
                          <div class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-100">
                            <span class="material-icons text-green-600" style="font-size: 14px;">check</span>
                          </div>
                        } @else {
                          <div class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-100">
                            <span class="material-icons text-slate-400" style="font-size: 14px;">remove</span>
                          </div>
                        }
                      </td>
                      <td class="px-4 py-2.5 text-right whitespace-nowrap">
                        <span class="text-xs text-slate-500 font-medium">{{ ticket.FechaVisita | date:'dd/MM/yyyy' }}</span>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
            
            <!-- Pagination Footer -->
            <footer class="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
              <div class="flex items-center gap-6 text-[11px] font-medium text-slate-500">
                <p>
                  Results: <span class="font-bold text-slate-900">{{ (currentPage - 1) * pageSize + 1 }} - {{ Math.min(currentPage * pageSize, ticketService.pagination().total) }}</span> of 
                  <span class="font-bold text-slate-900">{{ ticketService.pagination().total }}</span>
                </p>
                <div class="flex items-center gap-1.5">
                  <span class="text-[10px] uppercase">Rows:</span>
                  <select 
                    [ngModel]="pageSize"
                    (ngModelChange)="onPageSizeChange($event)"
                    class="bg-white border border-slate-300 rounded py-0.5 px-1.5 text-[11px] focus:ring-primary focus:border-primary"
                  >
                    <option [ngValue]="10">10</option>
                    <option [ngValue]="20">20</option>
                    <option [ngValue]="50">50</option>
                    <option [ngValue]="100">100</option>
                  </select>
                </div>
              </div>
              <div class="flex items-center gap-1">
                <button 
                  [disabled]="currentPage === 1"
                  (click)="prevPage()"
                  class="w-7 h-7 flex items-center justify-center rounded border border-slate-200 text-slate-400 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span class="material-icons text-base">chevron_left</span>
                </button>
                
                @for (page of getVisiblePages(); track page) {
                  @if (page === '...') {
                    <span class="px-1 text-slate-400 text-[10px]">•••</span>
                  } @else {
                    <button 
                      (click)="goToPage(+page)"
                      [class.bg-primary]="currentPage === page"
                      [class.text-white]="currentPage === page"
                      [class.font-bold]="currentPage === page"
                      [class.text-slate-600]="currentPage !== page"
                      [class.hover:bg-slate-100]="currentPage !== page"
                      class="w-7 h-7 flex items-center justify-center rounded text-xs font-medium"
                    >
                      {{ page }}
                    </button>
                  }
                }
                
                <button 
                  [disabled]="currentPage >= ticketService.pagination().totalPages"
                  (click)="nextPage()"
                  class="w-7 h-7 flex items-center justify-center rounded border border-slate-200 text-slate-400 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span class="material-icons text-base">chevron_right</span>
                </button>
              </div>
            </footer>
          </div>
        }
      </div>
    </div>
    
    <!-- Drawer -->
    @if (isFormOpen()) {
      <app-drawer 
        [title]="drawerMode() === 'detail' ? 'Detalle de Ticket #' + selectedTicket()?.Ticket : (selectedTicket() ? 'Editar Ticket' : 'Nuevo Ticket')" 
        (close)="closeForm()"
      >
        @if (drawerMode() === 'detail' && selectedTicket()) {
          <app-ticket-detail
            [ticket]="selectedTicket()"
            (close)="closeForm()"
            (edit)="switchToEdit($event)"
          ></app-ticket-detail>
        } @else {
          <app-ticket-form 
            [ticket]="selectedTicket()" 
            (close)="closeForm()" 
            (save)="onSave($event)"
          ></app-ticket-form>
        }
      </app-drawer>
    }
  `
})
export class TicketListComponent implements OnInit, OnDestroy {
  ticketService = inject(TicketService);
  Math = Math; // Expose Math to template
  private filterDebounceTimer: any;
  private initialized = false;

  searchQuery = '';
  statusFilter = '';
  tecnicoFilter = '';
  clienteFilter = '';
  empresaFilter = '';
  fechaDesde = '';
  fechaHasta = '';
  currentPage = 1;
  pageSize = 20;
  
  // Sorting
  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  isFormOpen = signal(false);
  selectedTicket = signal<Ticket | null>(null);
  drawerMode = signal<'detail' | 'form'>('detail');

  ngOnInit() {
    this.loadData();
    // Mark as initialized after first load to prevent spurious filter events
    setTimeout(() => this.initialized = true, 100);
  }

  ngOnDestroy() {
    clearTimeout(this.filterDebounceTimer);
  }

  loadData() {
    this.ticketService.loadTickets({
      page: this.currentPage,
      limit: this.pageSize,
      search: this.searchQuery,
      status: this.statusFilter,
      tecnico: this.tecnicoFilter,
      cliente: this.clienteFilter,
      empresa: this.empresaFilter,
      fechaDesde: this.fechaDesde,
      fechaHasta: this.fechaHasta,
      sortBy: this.sortColumn || undefined,
      sortDir: this.sortColumn ? this.sortDirection : undefined
    });
  }

  // Debounced search on input
  onSearchInput() {
    this.currentPage = 1;
    this.ticketService.searchTickets({
      page: this.currentPage,
      limit: this.pageSize,
      search: this.searchQuery,
      status: this.statusFilter,
      tecnico: this.tecnicoFilter,
      cliente: this.clienteFilter,
      empresa: this.empresaFilter,
      fechaDesde: this.fechaDesde,
      fechaHasta: this.fechaHasta,
      sortBy: this.sortColumn || undefined,
      sortDir: this.sortColumn ? this.sortDirection : undefined
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

  onPageSizeChange(newSize: number) {
    this.pageSize = newSize;
    this.currentPage = 1;
    this.loadData();
  }

  // Debounced version for text inputs
  onTextFilterChange() {
    if (!this.initialized) return;
    clearTimeout(this.filterDebounceTimer);
    this.filterDebounceTimer = setTimeout(() => {
      this.currentPage = 1;
      this.loadData();
    }, 400);
  }

  clearSearch() {
    this.searchQuery = '';
    this.currentPage = 1;
    this.loadData();
  }

  clearFilters() {
    this.searchQuery = '';
    this.statusFilter = '';
    this.tecnicoFilter = '';
    this.clienteFilter = '';
    this.empresaFilter = '';
    this.fechaDesde = '';
    this.fechaHasta = '';
    this.currentPage = 1;
    this.sortColumn = '';
    this.sortDirection = 'asc';
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
    this.drawerMode.set('form');
    this.isFormOpen.set(true);
  }

  editTicket(ticket: Ticket) {
    this.selectedTicket.set(ticket);
    this.drawerMode.set('detail');
    this.isFormOpen.set(true);
  }

  switchToEdit(ticket: Ticket) {
    this.selectedTicket.set(ticket);
    this.drawerMode.set('form');
  }

  closeForm() {
    this.isFormOpen.set(false);
    this.selectedTicket.set(null);
    this.drawerMode.set('detail');
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
