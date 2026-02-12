import { Component, inject, signal, OnInit, computed, OnDestroy, HostListener } from '@angular/core';
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

      <!-- ==================== DESKTOP VIEW ==================== -->
      <div class="hidden md:flex flex-col h-full gap-4">
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
              <select [(ngModel)]="statusFilter" (change)="onFilterChange()"
                class="text-xs bg-white border border-slate-300 rounded focus:ring-2 focus:ring-primary focus:border-primary py-1.5 px-2 min-w-[120px] text-slate-700 font-medium">
                <option value="">Estado: Todos</option>
                <option value="Ready to plan">Ready to plan</option>
                <option value="Released">Released</option>
                <option value="Closed">Closed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
              <input [(ngModel)]="tecnicoFilter" (ngModelChange)="onTextFilterChange()" placeholder="Técnico..."
                class="text-xs bg-white border border-slate-300 rounded focus:ring-2 focus:ring-primary focus:border-primary py-1.5 px-2 w-[130px] text-slate-700 font-medium" />
              <input [(ngModel)]="clienteFilter" (ngModelChange)="onTextFilterChange()" placeholder="Cliente..."
                class="text-xs bg-white border border-slate-300 rounded focus:ring-2 focus:ring-primary focus:border-primary py-1.5 px-2 w-[130px] text-slate-700 font-medium" />
              <input [(ngModel)]="dniFilter" (ngModelChange)="onTextFilterChange()" placeholder="DNI / Cod. Ext..."
                class="text-xs bg-white border border-slate-300 rounded focus:ring-2 focus:ring-primary focus:border-primary py-1.5 px-2 w-[120px] text-slate-700 font-medium" />
              <input [(ngModel)]="telefonoFilter" (ngModelChange)="onTextFilterChange()" placeholder="Teléfono..."
                class="text-xs bg-white border border-slate-300 rounded focus:ring-2 focus:ring-primary focus:border-primary py-1.5 px-2 w-[110px] text-slate-700 font-medium" />
              <input [(ngModel)]="distritoFilter" (ngModelChange)="onTextFilterChange()" placeholder="Distrito..."
                class="text-xs bg-white border border-slate-300 rounded focus:ring-2 focus:ring-primary focus:border-primary py-1.5 px-2 w-[110px] text-slate-700 font-medium" />
              <input [(ngModel)]="codigoPostalFilter" (ngModelChange)="onTextFilterChange()" placeholder="Cód. Postal..."
                class="text-xs bg-white border border-slate-300 rounded focus:ring-2 focus:ring-primary focus:border-primary py-1.5 px-2 w-[100px] text-slate-700 font-medium" />
              <input [(ngModel)]="empresaFilter" (ngModelChange)="onTextFilterChange()" placeholder="Empresa..."
                class="text-xs bg-white border border-slate-300 rounded focus:ring-2 focus:ring-primary focus:border-primary py-1.5 px-2 w-[130px] text-slate-700 font-medium" />
              <div class="flex items-center gap-1">
                <span class="text-[10px] text-slate-400 font-bold">Desde:</span>
                <input type="date" [(ngModel)]="fechaDesde" (change)="onFilterChange()"
                  class="text-xs bg-white border border-slate-300 rounded focus:ring-2 focus:ring-primary focus:border-primary py-1.5 px-2 text-slate-700 font-medium" />
              </div>
              <div class="flex items-center gap-1">
                <span class="text-[10px] text-slate-400 font-bold">Hasta:</span>
                <input type="date" [(ngModel)]="fechaHasta" (change)="onFilterChange()"
                  class="text-xs bg-white border border-slate-300 rounded focus:ring-2 focus:ring-primary focus:border-primary py-1.5 px-2 text-slate-700 font-medium" />
              </div>
              <button (click)="clearFilters()"
                class="text-[10px] text-slate-500 hover:text-primary font-bold px-3 py-1.5 uppercase tracking-tighter border border-slate-200 rounded hover:bg-slate-50 transition-colors">
                <span class="material-icons text-xs align-text-bottom mr-0.5">refresh</span> Reset
              </button>
            </div>
            <div class="flex items-center gap-1 border-l border-slate-200 pl-4">
              <button class="p-1.5 text-slate-400 hover:text-primary transition-colors" title="Export CSV">
                <span class="material-icons text-lg">file_download</span>
              </button>
              <button class="p-1.5 text-slate-400 hover:text-primary transition-colors" title="Print">
                <span class="material-icons text-lg">print</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Desktop Table Content -->
        <div class="flex flex-col flex-1 min-h-0">
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
              <button (click)="clearFilters()" class="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded text-sm font-medium">Limpiar filtros</button>
            </div>
          } @else {
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
                        @if (sortColumn === 'Ticket') { <span class="material-icons text-xs">{{ sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward' }}</span> }
                        @else { <span class="material-icons text-xs text-slate-300">unfold_more</span> }
                        </span>
                      </th>
                      <th class="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 select-none" (click)="sortBy('NombreCliente')">
                        <span class="inline-flex items-center gap-1">Cliente
                        @if (sortColumn === 'NombreCliente') { <span class="material-icons text-xs">{{ sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward' }}</span> }
                        @else { <span class="material-icons text-xs text-slate-300">unfold_more</span> }
                        </span>
                      </th>
                      <th class="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 select-none" (click)="sortBy('NombreEquipo')">
                        <span class="inline-flex items-center gap-1">Equipo
                        @if (sortColumn === 'NombreEquipo') { <span class="material-icons text-xs">{{ sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward' }}</span> }
                        @else { <span class="material-icons text-xs text-slate-300">unfold_more</span> }
                        </span>
                      </th>
                      <th class="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center cursor-pointer hover:bg-slate-100 select-none" (click)="sortBy('Estado')">
                        <span class="inline-flex items-center gap-1">Estado
                        @if (sortColumn === 'Estado') { <span class="material-icons text-xs">{{ sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward' }}</span> }
                        @else { <span class="material-icons text-xs text-slate-300">unfold_more</span> }
                        </span>
                      </th>
                      <th class="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 select-none" (click)="sortBy('NombreTecnico')">
                        <span class="inline-flex items-center gap-1">Técnico
                        @if (sortColumn === 'NombreTecnico') { <span class="material-icons text-xs">{{ sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward' }}</span> }
                        @else { <span class="material-icons text-xs text-slate-300">unfold_more</span> }
                        </span>
                      </th>
                      <th class="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Visita</th>
                      <th class="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right cursor-pointer hover:bg-slate-100 select-none" (click)="sortBy('FechaVisita')">
                        <span class="inline-flex items-center gap-1">Fecha
                        @if (sortColumn === 'FechaVisita') { <span class="material-icons text-xs">{{ sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward' }}</span> }
                        @else { <span class="material-icons text-xs text-slate-300">unfold_more</span> }
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
                          <span class="text-primary font-bold text-sm cursor-pointer hover:underline">#{{ ticket.Ticket }}</span>
                        </td>
                        <td class="px-4 py-2.5">
                          <div class="flex flex-col">
                            <span class="text-xs font-bold text-slate-800">{{ ticket.NombreCliente }}</span>
                            <span class="text-[10px] text-slate-500 uppercase">{{ ticket.Distrito }}{{ ticket.Ciudad ? ', ' + ticket.Ciudad : '' }}</span>
                          </div>
                        </td>
                        <td class="px-4 py-2.5">
                          <p class="text-xs text-slate-600 line-clamp-1" [title]="ticket.NombreEquipo">{{ ticket.NombreEquipo }}</p>
                        </td>
                        <td class="px-4 py-2.5 text-center">
                          <span class="inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-tight" [ngClass]="getStatusClass(ticket.Estado)">
                            {{ ticket.Estado }}
                          </span>
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
                  <p>Results: <span class="font-bold text-slate-900">{{ (currentPage - 1) * pageSize + 1 }} - {{ Math.min(currentPage * pageSize, ticketService.pagination().total) }}</span> of <span class="font-bold text-slate-900">{{ ticketService.pagination().total }}</span></p>
                  <div class="flex items-center gap-1.5">
                    <span class="text-[10px] uppercase">Rows:</span>
                    <select [ngModel]="pageSize" (ngModelChange)="onPageSizeChange($event)"
                      class="bg-white border border-slate-300 rounded py-0.5 px-1.5 text-[11px] focus:ring-primary focus:border-primary">
                      <option [ngValue]="10">10</option>
                      <option [ngValue]="20">20</option>
                      <option [ngValue]="50">50</option>
                      <option [ngValue]="100">100</option>
                    </select>
                  </div>
                </div>
                <div class="flex items-center gap-1">
                  <button [disabled]="currentPage === 1" (click)="prevPage()"
                    class="w-7 h-7 flex items-center justify-center rounded border border-slate-200 text-slate-400 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed">
                    <span class="material-icons text-base">chevron_left</span>
                  </button>
                  @for (page of getVisiblePages(); track page) {
                    @if (page === '...') {
                      <span class="px-1 text-slate-400 text-[10px]">•••</span>
                    } @else {
                      <button (click)="goToPage(+page)"
                        [class.bg-primary]="currentPage === page" [class.text-white]="currentPage === page" [class.font-bold]="currentPage === page"
                        [class.text-slate-600]="currentPage !== page" [class.hover:bg-slate-100]="currentPage !== page"
                        class="w-7 h-7 flex items-center justify-center rounded text-xs font-medium">{{ page }}</button>
                    }
                  }
                  <button [disabled]="currentPage >= ticketService.pagination().totalPages" (click)="nextPage()"
                    class="w-7 h-7 flex items-center justify-center rounded border border-slate-200 text-slate-400 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed">
                    <span class="material-icons text-base">chevron_right</span>
                  </button>
                </div>
              </footer>
            </div>
          }
        </div>
      </div>

      <!-- ==================== MOBILE VIEW ==================== -->
      <div class="flex md:hidden flex-col h-full relative">

        <!-- Mobile Header -->
        <header class="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-100 px-4 pt-4 pb-3">
          <div class="flex items-center justify-between mb-3">
            <h1 class="text-xl font-bold tracking-tight text-slate-800">Tickets</h1>
            <div class="flex items-center space-x-1">
              <button (click)="mobileSearchOpen.set(!mobileSearchOpen())" class="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
                <span class="material-icons text-xl">search</span>
              </button>
              <button (click)="mobileFilterOpen.set(!mobileFilterOpen())" class="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors relative">
                <span class="material-icons text-xl">tune</span>
                @if (hasActiveFilters()) {
                  <span class="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full border-2 border-white"></span>
                }
              </button>
            </div>
          </div>

          <!-- Mobile Search (collapsible) -->
          @if (mobileSearchOpen()) {
            <div class="mb-3">
              <div class="relative">
                <span class="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                <input [(ngModel)]="searchQuery" (input)="onSearchInput()"
                  class="w-full pl-10 pr-10 py-2.5 bg-slate-100 border-transparent focus:bg-white focus:border-primary focus:ring-0 rounded-xl text-sm transition-all outline-none"
                  placeholder="Buscar por ID, cliente o asunto..." type="text" />
                @if (searchQuery) {
                  <button (click)="searchQuery = ''; onSearchInput()" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <span class="material-icons text-lg">close</span>
                  </button>
                }
              </div>
            </div>
          }

          <!-- Quick Filter Tabs -->
          <div class="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
            <button (click)="setMobileStatusFilter('')"
              class="px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors"
              [class.bg-primary]="statusFilter === ''" [class.text-white]="statusFilter === ''"
              [class.bg-slate-100]="statusFilter !== ''" [class.text-slate-600]="statusFilter !== ''">
              Todos
            </button>
            <button (click)="setMobileStatusFilter('Ready to plan')"
              class="px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors"
              [class.bg-primary]="statusFilter === 'Ready to plan'" [class.text-white]="statusFilter === 'Ready to plan'"
              [class.bg-slate-100]="statusFilter !== 'Ready to plan'" [class.text-slate-600]="statusFilter !== 'Ready to plan'">
              Pendientes
            </button>
            <button (click)="setMobileStatusFilter('Released')"
              class="px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors"
              [class.bg-primary]="statusFilter === 'Released'" [class.text-white]="statusFilter === 'Released'"
              [class.bg-slate-100]="statusFilter !== 'Released'" [class.text-slate-600]="statusFilter !== 'Released'">
              En Progreso
            </button>
            <button (click)="setMobileStatusFilter('Closed')"
              class="px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors"
              [class.bg-primary]="statusFilter === 'Closed'" [class.text-white]="statusFilter === 'Closed'"
              [class.bg-slate-100]="statusFilter !== 'Closed'" [class.text-slate-600]="statusFilter !== 'Closed'">
              Cerrados
            </button>
          </div>
        </header>

        <!-- Mobile Ticket Cards -->
        <main class="flex-1 overflow-y-auto px-4 py-3 space-y-3 hide-scrollbar pb-24">
          @if (ticketService.loading()) {
            <div class="flex justify-center items-center py-12">
              <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            </div>
          } @else if (ticketService.tickets().length === 0) {
            <div class="flex flex-col items-center justify-center py-12 text-center">
              <span class="material-icons text-5xl text-slate-300 mb-3">inbox</span>
              <p class="font-semibold text-slate-600">No se encontraron tickets</p>
              <p class="text-sm text-slate-400 mt-1">Intenta ajustar los filtros</p>
              <button (click)="clearFilters()" class="mt-3 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-medium">Limpiar filtros</button>
            </div>
          } @else {
            @for (ticket of ticketService.tickets(); track ticket.id) {
              <!-- Ticket Card (Stitch mobile style) -->
              <div (click)="editTicket(ticket)" class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm active:scale-[0.98] transition-transform cursor-pointer">
                <div class="flex justify-between items-start mb-2">
                  <div class="flex-1 min-w-0">
                    <span class="text-xs font-bold text-slate-400 tracking-wider">#{{ ticket.Ticket }}</span>
                    <h3 class="text-base font-bold text-slate-800 truncate">{{ ticket.NombreCliente }}</h3>
                    <p class="text-xs text-slate-500 truncate mt-0.5">{{ ticket.NombreEquipo }}</p>
                  </div>
                  <span class="ml-2 shrink-0 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded" [ngClass]="getMobilePriorityClass(ticket)">
                    {{ ticket.Estado === 'Ready to plan' ? 'Pendiente' : ticket.Estado }}
                  </span>
                </div>

                <div class="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
                  <div class="flex items-center space-x-2 text-slate-400">
                    <span class="material-icons text-sm">schedule</span>
                    <span class="text-xs">{{ ticket.FechaVisita | date:'dd MMM yyyy' }}</span>
                  </div>
                  <span class="px-2.5 py-1 text-xs font-semibold rounded-full border" [ngClass]="getMobileStatusBadge(ticket.Estado)">
                    {{ getMobileStatusLabel(ticket.Estado) }}
                  </span>
                </div>

                @if (ticket.NombreTecnico) {
                  <div class="flex items-center gap-2 mt-2.5 text-slate-500">
                    <span class="material-icons text-sm">engineering</span>
                    <span class="text-xs">{{ ticket.NombreTecnico }} {{ ticket.ApellidoTecnico }}</span>
                  </div>
                }
              </div>
            }

            <!-- Mobile Load More / Pagination -->
            @if (ticketService.pagination().totalPages > 1) {
              <div class="flex items-center justify-center gap-3 py-4">
                <button [disabled]="currentPage === 1" (click)="prevPage()"
                  class="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1">
                  <span class="material-icons text-base">chevron_left</span> Anterior
                </button>
                <span class="text-xs text-slate-500 font-medium">{{ currentPage }} / {{ ticketService.pagination().totalPages }}</span>
                <button [disabled]="currentPage >= ticketService.pagination().totalPages" (click)="nextPage()"
                  class="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1">
                  Siguiente <span class="material-icons text-base">chevron_right</span>
                </button>
              </div>
            }
          }
        </main>

        <!-- Mobile FAB -->
        <button (click)="openForm()" class="fixed bottom-20 right-5 md:hidden w-14 h-14 bg-primary text-white rounded-full shadow-lg shadow-primary/40 flex items-center justify-center hover:scale-105 transition-transform active:scale-95 z-30">
          <span class="material-icons text-3xl">add</span>
        </button>

        <!-- Mobile Filter Bottom Sheet -->
        @if (mobileFilterOpen()) {
          <div (click)="mobileFilterOpen.set(false)" class="fixed inset-0 bg-black/40 z-40 md:hidden"></div>
          <div class="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 md:hidden max-h-[75vh] overflow-y-auto animate-slide-up">
            <div class="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-3 mb-4"></div>
            <div class="px-6 pb-8">
              <h2 class="text-lg font-bold mb-5">Filtros</h2>

              <div class="space-y-5">
                <div>
                  <label class="block text-sm font-semibold mb-2 text-slate-700">Estado</label>
                  <select [(ngModel)]="statusFilter"
                    class="w-full bg-slate-100 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary">
                    <option value="">Todos los Estados</option>
                    <option value="Ready to plan">Ready to plan</option>
                    <option value="Released">Released</option>
                    <option value="Closed">Closed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-semibold mb-2 text-slate-700">Técnico</label>
                  <input [(ngModel)]="tecnicoFilter" placeholder="Nombre del técnico..."
                    class="w-full bg-slate-100 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary" />
                </div>

                <div>
                  <label class="block text-sm font-semibold mb-2 text-slate-700">Cliente</label>
                  <input [(ngModel)]="clienteFilter" placeholder="Nombre del cliente..."
                    class="w-full bg-slate-100 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary" />
                </div>

                <div>
                  <label class="block text-sm font-semibold mb-2 text-slate-700">DNI / Cód. Externo</label>
                  <input [(ngModel)]="dniFilter" placeholder="DNI o código externo..."
                    class="w-full bg-slate-100 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary" />
                </div>

                <div>
                  <label class="block text-sm font-semibold mb-2 text-slate-700">Teléfono</label>
                  <input [(ngModel)]="telefonoFilter" placeholder="Teléfono o celular..."
                    class="w-full bg-slate-100 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary" />
                </div>

                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block text-sm font-semibold mb-2 text-slate-700">Distrito</label>
                    <input [(ngModel)]="distritoFilter" placeholder="Distrito..."
                      class="w-full bg-slate-100 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary" />
                  </div>
                  <div>
                    <label class="block text-sm font-semibold mb-2 text-slate-700">Cód. Postal</label>
                    <input [(ngModel)]="codigoPostalFilter" placeholder="Código postal..."
                      class="w-full bg-slate-100 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary" />
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block text-sm font-semibold mb-2 text-slate-700">Desde</label>
                    <input type="date" [(ngModel)]="fechaDesde"
                      class="w-full bg-slate-100 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary" />
                  </div>
                  <div>
                    <label class="block text-sm font-semibold mb-2 text-slate-700">Hasta</label>
                    <input type="date" [(ngModel)]="fechaHasta"
                      class="w-full bg-slate-100 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary" />
                  </div>
                </div>

                <div class="flex gap-3 pt-2">
                  <button (click)="clearFilters(); mobileFilterOpen.set(false)"
                    class="flex-1 py-3.5 bg-slate-100 text-slate-600 font-semibold rounded-xl">
                    Limpiar
                  </button>
                  <button (click)="onFilterChange(); mobileFilterOpen.set(false)"
                    class="flex-[2] py-3.5 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20">
                    Aplicar Filtros
                  </button>
                </div>
              </div>
            </div>
          </div>
        }
      </div>
    </div>

    <!-- Drawer (shared for both views) -->
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
  `,
  styles: [`
    .hide-scrollbar::-webkit-scrollbar { display: none; }
    .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    @keyframes slide-up {
      from { transform: translateY(100%); }
      to { transform: translateY(0); }
    }
    .animate-slide-up { animation: slide-up 0.3s ease-out; }
  `]
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
  dniFilter = '';
  telefonoFilter = '';
  distritoFilter = '';
  codigoPostalFilter = '';
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

  // Mobile-specific signals
  mobileSearchOpen = signal(false);
  mobileFilterOpen = signal(false);

  hasActiveFilters(): boolean {
    return !!(this.statusFilter || this.tecnicoFilter || this.clienteFilter || this.empresaFilter || this.dniFilter || this.telefonoFilter || this.distritoFilter || this.codigoPostalFilter || this.fechaDesde || this.fechaHasta);
  }

  setMobileStatusFilter(status: string) {
    this.statusFilter = status;
    this.currentPage = 1;
    this.loadData();
  }

  getStatusClass(estado: string): string {
    switch (estado) {
      case 'Released': return 'border-blue-200 bg-blue-50 text-blue-700';
      case 'Ready to plan': return 'border-amber-200 bg-amber-50 text-amber-700';
      case 'Closed': return 'border-green-200 bg-green-50 text-green-700';
      case 'Cancelled': return 'border-red-200 bg-red-50 text-red-700';
      default: return 'border-slate-200 bg-slate-50 text-slate-700';
    }
  }

  getMobilePriorityClass(ticket: Ticket): string {
    switch (ticket.Estado) {
      case 'Released': return 'bg-blue-100 text-blue-700';
      case 'Ready to plan': return 'bg-amber-100 text-amber-700';
      case 'Closed': return 'bg-green-100 text-green-700';
      case 'Cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  }

  getMobileStatusBadge(estado: string): string {
    switch (estado) {
      case 'Released': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Ready to plan': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Closed': return 'bg-green-50 text-green-700 border-green-200';
      case 'Cancelled': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  }

  getMobileStatusLabel(estado: string): string {
    switch (estado) {
      case 'Released': return 'En Progreso';
      case 'Ready to plan': return 'Pendiente';
      case 'Closed': return 'Cerrado';
      case 'Cancelled': return 'Cancelado';
      default: return estado;
    }
  }

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
      dni: this.dniFilter,
      telefono: this.telefonoFilter,
      distrito: this.distritoFilter,
      codigoPostal: this.codigoPostalFilter,
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
      dni: this.dniFilter,
      telefono: this.telefonoFilter,
      distrito: this.distritoFilter,
      codigoPostal: this.codigoPostalFilter,
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
    this.dniFilter = '';
    this.telefonoFilter = '';
    this.distritoFilter = '';
    this.codigoPostalFilter = '';
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
