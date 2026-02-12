import { Component, inject, signal, OnInit, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { DrawerComponent } from '../../../shared/components/drawer/drawer.component';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

interface Item {
    id: number;
    codigoSAP: string;
    codigoExterno: string;
    nombre: string;
    categoria: string;
    unidadMedida: string;
    tipo: string;
    estado: string;
    garantia: string | null;
    sector: string | null;
    descuento: number | null;
    estadoEnCatalogo: string | null;
    fechaCreacion: string | null;
    fechaModificacion: string | null;
}

interface ItemStats {
    total: number;
    activos: number;
    inactivos: number;
    piezas: number;
    servicios: number;
    catalogo: number;
    categorias: number;
    sectores: number;
}

interface ItemFilters {
    categorias: string[];
    tipos: string[];
    estados: string[];
    sectores: string[];
}

@Component({
    selector: 'app-item-list',
    standalone: true,
    imports: [CommonModule, FormsModule, DrawerComponent],
    template: `
    <div class="flex flex-col h-full gap-4">
      <!-- KPI Cards (responsive: 2 cols mobile, 4 desktop) -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div class="bg-white rounded-xl border border-slate-200 p-3 md:p-4 shadow-sm">
          <div class="flex items-center gap-2 md:gap-3">
            <div class="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <span class="material-icons text-primary text-lg md:text-xl">inventory_2</span>
            </div>
            <div>
              <p class="text-xl md:text-2xl font-bold text-slate-800">{{ stats()?.total | number }}</p>
              <p class="text-[10px] md:text-[11px] text-slate-400 font-medium">Total Items</p>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-xl border border-slate-200 p-3 md:p-4 shadow-sm">
          <div class="flex items-center gap-2 md:gap-3">
            <div class="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <span class="material-icons text-emerald-600 text-lg md:text-xl">check_circle</span>
            </div>
            <div>
              <p class="text-xl md:text-2xl font-bold text-slate-800">{{ stats()?.activos | number }}</p>
              <p class="text-[10px] md:text-[11px] text-slate-400 font-medium">Activos</p>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-xl border border-slate-200 p-3 md:p-4 shadow-sm">
          <div class="flex items-center gap-2 md:gap-3">
            <div class="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <span class="material-icons text-amber-600 text-lg md:text-xl">category</span>
            </div>
            <div>
              <p class="text-xl md:text-2xl font-bold text-slate-800">{{ stats()?.categorias }}</p>
              <p class="text-[10px] md:text-[11px] text-slate-400 font-medium">Categorías</p>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-xl border border-slate-200 p-3 md:p-4 shadow-sm">
          <div class="flex items-center gap-2 md:gap-3">
            <div class="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <span class="material-icons text-blue-600 text-lg md:text-xl">handyman</span>
            </div>
            <div>
              <p class="text-xl md:text-2xl font-bold text-slate-800">{{ stats()?.servicios }}</p>
              <p class="text-[10px] md:text-[11px] text-slate-400 font-medium">Servicios</p>
            </div>
          </div>
        </div>
      </div>

      <!-- ==================== DESKTOP VIEW ==================== -->
      <div class="hidden md:flex flex-col flex-1 min-h-0 gap-4">
        <!-- Toolbar -->
        <div class="flex flex-col lg:flex-row justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div class="flex items-center gap-3 flex-1">
            <h1 class="text-lg font-bold tracking-tight text-slate-800 flex items-center gap-2">
              <span class="material-icons text-primary">inventory_2</span>
              Catálogo de Items
            </h1>
            <div class="flex-1 max-w-md relative">
              <span class="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
              <input [(ngModel)]="searchQuery" (input)="onSearchInput()"
                class="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg text-sm transition-all outline-none text-slate-800" 
                placeholder="Buscar por código, nombre o categoría..." type="text" />
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button (click)="loadItems()" class="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all" title="Actualizar">
              <span class="material-icons text-xl">refresh</span>
            </button>
            <button (click)="openForm()" class="px-4 py-2 bg-primary hover:bg-primary/90 text-white font-bold text-xs uppercase tracking-wide rounded-lg shadow-sm transition-all flex items-center gap-1.5">
              <span class="material-icons text-sm">add</span> Nuevo Item
            </button>
          </div>
        </div>

        <!-- Filters Bar -->
        <div class="bg-white px-4 py-3 border border-slate-200 rounded-xl shadow-sm">
          <div class="flex flex-wrap items-center gap-3">
            <span class="text-xs font-bold text-slate-400 uppercase mr-1 flex items-center gap-1">
              <span class="material-icons text-sm">filter_list</span> Filtros:
            </span>
            <select [(ngModel)]="categoriaFilter" (change)="onFilterChange()"
              class="text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary py-2 px-3 min-w-[180px] text-slate-700 font-medium">
              <option value="">Categoría: Todas</option>
              @for (cat of filters()?.categorias || []; track cat) { <option [value]="cat">{{ cat }}</option> }
            </select>
            <select [(ngModel)]="tipoFilter" (change)="onFilterChange()"
              class="text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary py-2 px-3 min-w-[120px] text-slate-700 font-medium">
              <option value="">Tipo: Todos</option>
              @for (u of filters()?.tipos || []; track u) { <option [value]="u">{{ u }}</option> }
            </select>
            <select [(ngModel)]="estadoFilter" (change)="onFilterChange()"
              class="text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary py-2 px-3 min-w-[120px] text-slate-700 font-medium">
              <option value="">Estado: Todos</option>
              @for (e of filters()?.estados || []; track e) { <option [value]="e">{{ e }}</option> }
            </select>
            <select [(ngModel)]="sectorFilter" (change)="onFilterChange()"
              class="text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary py-2 px-3 min-w-[100px] text-slate-700 font-medium">
              <option value="">Sector: Todos</option>
              @for (s of filters()?.sectores || []; track s) { <option [value]="s">{{ s }}</option> }
            </select>
            @if (hasActiveFilters()) {
              <button (click)="clearFilters()" class="text-xs text-red-500 hover:text-red-600 font-medium flex items-center gap-1 px-2 py-1 hover:bg-red-50 rounded-lg transition-all">
                <span class="material-icons text-sm">close</span> Limpiar
              </button>
            }
            <div class="ml-auto text-xs text-slate-400 font-medium">{{ totalItems() | number }} items encontrados</div>
          </div>
        </div>

        <!-- Desktop Table -->
        <div class="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div class="overflow-x-auto flex-1">
            <table class="w-full">
              <thead class="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                <tr>
                  @for (col of columns; track col.key) {
                    <th (click)="toggleSort(col.key)"
                      class="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider cursor-pointer select-none hover:bg-slate-100 transition-colors"
                      [class.text-primary]="sortBy() === col.key" [class.text-slate-400]="sortBy() !== col.key">
                      <div class="flex items-center gap-1">{{ col.label }}
                        @if (sortBy() === col.key) { <span class="material-icons text-xs">{{ sortDir() === 'asc' ? 'arrow_upward' : 'arrow_downward' }}</span> }
                      </div>
                    </th>
                  }
                  <th class="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 w-16"></th>
                </tr>
              </thead>
              <tbody>
                @if (loading()) {
                  <tr><td [attr.colspan]="columns.length + 1" class="text-center py-20">
                    <div class="flex flex-col items-center gap-2 text-slate-400">
                      <span class="material-icons animate-spin text-3xl text-primary">progress_activity</span>
                      <span class="text-sm">Cargando items...</span>
                    </div>
                  </td></tr>
                } @else if (items().length === 0) {
                  <tr><td [attr.colspan]="columns.length + 1" class="text-center py-20">
                    <div class="flex flex-col items-center gap-2 text-slate-400">
                      <span class="material-icons text-4xl">inventory_2</span>
                      <span class="text-sm font-medium">No se encontraron items</span>
                    </div>
                  </td></tr>
                } @else {
                  @for (item of items(); track item.id) {
                    <tr (click)="openDetail(item)" class="border-b border-slate-100 hover:bg-blue-50/40 transition-colors cursor-pointer group">
                      <td class="px-4 py-3"><span class="text-xs font-mono font-bold text-primary bg-primary/5 px-2 py-0.5 rounded">{{ item.codigoSAP }}</span></td>
                      <td class="px-4 py-3"><span class="text-xs font-mono text-slate-600">{{ item.codigoExterno || '—' }}</span></td>
                      <td class="px-4 py-3"><span class="text-sm font-medium text-slate-800 truncate block max-w-[300px]" [title]="item.nombre">{{ item.nombre }}</span></td>
                      <td class="px-4 py-3"><span class="text-xs text-slate-500 truncate block max-w-[200px]" [title]="item.categoria">{{ item.categoria || '—' }}</span></td>
                      <td class="px-4 py-3">
                        <span class="text-xs px-2 py-0.5 rounded-full font-medium" [class]="item.tipo === 'Pieza' ? 'bg-blue-50 text-blue-700' : item.tipo === 'Servicio' ? 'bg-purple-50 text-purple-700' : 'bg-amber-50 text-amber-700'">{{ item.tipo || '—' }}</span>
                      </td>
                      <td class="px-4 py-3">
                        <div class="flex items-center gap-1.5">
                          <span class="w-1.5 h-1.5 rounded-full" [class]="item.estado === 'Activo' ? 'bg-emerald-500' : 'bg-red-400'"></span>
                          <span class="text-xs font-medium" [class]="item.estado === 'Activo' ? 'text-emerald-700' : 'text-red-500'">{{ item.estado || '—' }}</span>
                        </div>
                      </td>
                      <td class="px-4 py-3"><span class="text-xs text-slate-500">{{ item.sector || '—' }}</span></td>
                      <td class="px-4 py-3 text-right">
                        <button class="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-primary rounded transition-all">
                          <span class="material-icons text-lg">chevron_right</span>
                        </button>
                      </td>
                    </tr>
                  }
                }
              </tbody>
            </table>
          </div>
          <!-- Desktop Pagination -->
          <div class="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50/50">
            <div class="flex items-center gap-2">
              <span class="text-xs text-slate-500">Filas por página:</span>
              <select [(ngModel)]="pageSize" (change)="onPageSizeChange()" class="text-xs border border-slate-200 rounded-lg py-1 px-2 bg-white text-slate-700">
                <option [value]="10">10</option><option [value]="25">25</option><option [value]="50">50</option><option [value]="100">100</option>
              </select>
            </div>
            <div class="flex items-center gap-1">
              <span class="text-xs text-slate-500 mr-2">{{ ((currentPage() - 1) * pageSize) + 1 }}–{{ currentPage() * pageSize > totalItems() ? totalItems() : currentPage() * pageSize }} de {{ totalItems() | number }}</span>
              <button (click)="goToPage(1)" [disabled]="currentPage() <= 1" class="p-1 rounded hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"><span class="material-icons text-lg text-slate-500">first_page</span></button>
              <button (click)="goToPage(currentPage() - 1)" [disabled]="currentPage() <= 1" class="p-1 rounded hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"><span class="material-icons text-lg text-slate-500">chevron_left</span></button>
              <span class="text-xs font-bold text-slate-700 px-2">{{ currentPage() }}</span>
              <button (click)="goToPage(currentPage() + 1)" [disabled]="currentPage() >= totalPages()" class="p-1 rounded hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"><span class="material-icons text-lg text-slate-500">chevron_right</span></button>
              <button (click)="goToPage(totalPages())" [disabled]="currentPage() >= totalPages()" class="p-1 rounded hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"><span class="material-icons text-lg text-slate-500">last_page</span></button>
            </div>
          </div>
        </div>
      </div>

      <!-- ==================== MOBILE VIEW ==================== -->
      <div class="flex md:hidden flex-col flex-1 min-h-0 relative">
        <!-- Mobile Header -->
        <header class="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-100 px-4 pt-3 pb-2">
          <div class="flex items-center justify-between mb-2">
            <h1 class="text-lg font-bold tracking-tight text-slate-800 flex items-center gap-2">
              <span class="material-icons text-primary text-xl">inventory_2</span> Items
            </h1>
            <div class="flex items-center space-x-1">
              <button (click)="mobileSearchOpen.set(!mobileSearchOpen())" class="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
                <span class="material-icons text-xl">search</span>
              </button>
              <button (click)="mobileFilterOpen.set(!mobileFilterOpen())" class="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors relative">
                <span class="material-icons text-xl">tune</span>
                @if (hasActiveFilters()) { <span class="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full border-2 border-white"></span> }
              </button>
            </div>
          </div>
          @if (mobileSearchOpen()) {
            <div class="mb-2">
              <div class="relative">
                <span class="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                <input [(ngModel)]="searchQuery" (input)="onSearchInput()"
                  class="w-full pl-10 pr-10 py-2.5 bg-slate-100 border-transparent focus:bg-white focus:border-primary focus:ring-0 rounded-xl text-sm transition-all outline-none"
                  placeholder="Buscar items..." type="text" />
                @if (searchQuery) {
                  <button (click)="searchQuery = ''; onSearchInput()" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"><span class="material-icons text-lg">close</span></button>
                }
              </div>
            </div>
          }
          <!-- Quick Type Filter Pills -->
          <div class="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
            <button (click)="tipoFilter = ''; onFilterChange()" class="px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors"
              [class.bg-primary]="!tipoFilter" [class.text-white]="!tipoFilter" [class.bg-slate-100]="tipoFilter" [class.text-slate-600]="tipoFilter">Todos</button>
            <button (click)="tipoFilter = 'Pieza'; onFilterChange()" class="px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors"
              [class.bg-primary]="tipoFilter === 'Pieza'" [class.text-white]="tipoFilter === 'Pieza'" [class.bg-slate-100]="tipoFilter !== 'Pieza'" [class.text-slate-600]="tipoFilter !== 'Pieza'">Piezas</button>
            <button (click)="tipoFilter = 'Servicio'; onFilterChange()" class="px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors"
              [class.bg-primary]="tipoFilter === 'Servicio'" [class.text-white]="tipoFilter === 'Servicio'" [class.bg-slate-100]="tipoFilter !== 'Servicio'" [class.text-slate-600]="tipoFilter !== 'Servicio'">Servicios</button>
            <button (click)="estadoFilter = estadoFilter === 'Activo' ? '' : 'Activo'; onFilterChange()" class="px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors"
              [class.bg-emerald-500]="estadoFilter === 'Activo'" [class.text-white]="estadoFilter === 'Activo'" [class.bg-slate-100]="estadoFilter !== 'Activo'" [class.text-slate-600]="estadoFilter !== 'Activo'">Activos</button>
          </div>
        </header>

        <!-- Mobile Item Cards -->
        <main class="flex-1 overflow-y-auto px-4 py-3 space-y-3 hide-scrollbar pb-24">
          @if (loading()) {
            <div class="flex justify-center items-center py-12"><div class="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div></div>
          } @else if (items().length === 0) {
            <div class="flex flex-col items-center justify-center py-12 text-center">
              <span class="material-icons text-5xl text-slate-300 mb-3">inventory_2</span>
              <p class="font-semibold text-slate-600">No se encontraron items</p>
              <button (click)="clearFilters()" class="mt-3 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-medium">Limpiar filtros</button>
            </div>
          } @else {
            @for (item of items(); track item.id) {
              <div (click)="openDetail(item)" class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm active:scale-[0.98] transition-transform cursor-pointer">
                <div class="flex justify-between items-start mb-2">
                  <div class="flex-1 min-w-0">
                    <span class="text-[10px] font-mono font-bold text-primary bg-primary/5 px-1.5 py-0.5 rounded">{{ item.codigoSAP }}</span>
                    <h3 class="text-sm font-bold text-slate-800 truncate mt-1">{{ item.nombre }}</h3>
                    <p class="text-xs text-slate-400 truncate mt-0.5">{{ item.categoria || 'Sin categoría' }}</p>
                  </div>
                  <span class="ml-2 shrink-0 px-2 py-0.5 text-[10px] font-bold rounded-full"
                    [class]="item.tipo === 'Pieza' ? 'bg-blue-50 text-blue-700' : item.tipo === 'Servicio' ? 'bg-purple-50 text-purple-700' : 'bg-amber-50 text-amber-700'">
                    {{ item.tipo }}
                  </span>
                </div>
                <div class="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
                  <div class="flex items-center gap-1.5">
                    <span class="w-1.5 h-1.5 rounded-full" [class]="item.estado === 'Activo' ? 'bg-emerald-500' : 'bg-red-400'"></span>
                    <span class="text-xs font-medium" [class]="item.estado === 'Activo' ? 'text-emerald-700' : 'text-red-500'">{{ item.estado }}</span>
                  </div>
                  @if (item.sector) { <span class="text-xs text-slate-400">{{ item.sector }}</span> }
                  <span class="material-icons text-slate-300 text-lg">chevron_right</span>
                </div>
              </div>
            }
            <!-- Mobile Pagination -->
            @if (totalPages() > 1) {
              <div class="flex items-center justify-center gap-3 py-4">
                <button [disabled]="currentPage() <= 1" (click)="goToPage(currentPage() - 1)"
                  class="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-medium disabled:opacity-40 flex items-center gap-1">
                  <span class="material-icons text-base">chevron_left</span> Anterior
                </button>
                <span class="text-xs text-slate-500 font-medium">{{ currentPage() }} / {{ totalPages() }}</span>
                <button [disabled]="currentPage() >= totalPages()" (click)="goToPage(currentPage() + 1)"
                  class="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-medium disabled:opacity-40 flex items-center gap-1">
                  Siguiente <span class="material-icons text-base">chevron_right</span>
                </button>
              </div>
            }
          }
        </main>

        <!-- FAB -->
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
                  <label class="block text-sm font-semibold mb-2 text-slate-700">Categoría</label>
                  <select [(ngModel)]="categoriaFilter" class="w-full bg-slate-100 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary">
                    <option value="">Todas las Categorías</option>
                    @for (cat of filters()?.categorias || []; track cat) { <option [value]="cat">{{ cat }}</option> }
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-semibold mb-2 text-slate-700">Estado</label>
                  <select [(ngModel)]="estadoFilter" class="w-full bg-slate-100 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary">
                    <option value="">Todos los Estados</option>
                    @for (e of filters()?.estados || []; track e) { <option [value]="e">{{ e }}</option> }
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-semibold mb-2 text-slate-700">Sector</label>
                  <select [(ngModel)]="sectorFilter" class="w-full bg-slate-100 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary">
                    <option value="">Todos los Sectores</option>
                    @for (s of filters()?.sectores || []; track s) { <option [value]="s">{{ s }}</option> }
                  </select>
                </div>
                <div class="flex gap-3 pt-2">
                  <button (click)="clearFilters(); mobileFilterOpen.set(false)" class="flex-1 py-3.5 bg-slate-100 text-slate-600 font-semibold rounded-xl">Limpiar</button>
                  <button (click)="onFilterChange(); mobileFilterOpen.set(false)" class="flex-[2] py-3.5 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20">Aplicar Filtros</button>
                </div>
              </div>
            </div>
          </div>
        }
      </div>

      <!-- Detail Drawer -->
      @if (detailDrawerOpen()) {
        <app-drawer (close)="detailDrawerOpen.set(false)" title="Detalle del Item">
          @if (selectedItem()) {
          <div class="flex flex-col h-full">
            <div class="flex-1 overflow-y-auto p-6 space-y-5">

              <!-- Header Card -->
              <div class="px-4 py-4 rounded-lg border border-slate-200 bg-gradient-to-r"
                [ngClass]="selectedItem()!.tipo === 'Servicio' ? 'from-purple-50 to-white' : selectedItem()!.tipo === 'Catálogo' ? 'from-amber-50 to-white' : 'from-blue-50 to-white'">
                <div class="flex items-center gap-4">
                  <div class="w-14 h-14 rounded-xl flex items-center justify-center text-white shadow-md"
                    [ngClass]="selectedItem()!.tipo === 'Servicio' ? 'bg-purple-500' : selectedItem()!.tipo === 'Catálogo' ? 'bg-amber-500' : 'bg-primary'">
                    <span class="material-icons text-2xl">{{ selectedItem()!.tipo === 'Servicio' ? 'handyman' : selectedItem()!.tipo === 'Catálogo' ? 'menu_book' : 'inventory_2' }}</span>
                  </div>
                  <div class="flex-1 min-w-0">
                    <h2 class="text-base font-bold text-slate-800 truncate" [title]="selectedItem()!.nombre">{{ selectedItem()!.nombre }}</h2>
                    <div class="flex items-center gap-3 mt-1 flex-wrap">
                      <span class="text-[10px] font-mono text-slate-400">ID: {{ selectedItem()!.id }}</span>
                      <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold"
                        [ngClass]="selectedItem()!.tipo === 'Servicio' ? 'bg-purple-100 text-purple-700' : selectedItem()!.tipo === 'Catálogo' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'">
                        {{ selectedItem()!.tipo }}
                      </span>
                      <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold"
                        [ngClass]="selectedItem()!.estado === 'Activo' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'">
                        {{ selectedItem()!.estado }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Identificación -->
              <section class="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <div class="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                  <span class="material-icons text-primary text-base">qr_code_2</span>
                  <h3 class="text-xs font-bold text-slate-600 uppercase tracking-wider">Identificación</h3>
                </div>
                <div class="p-4 grid grid-cols-2 gap-4">
                  <div>
                    <label class="text-[10px] font-bold text-slate-400 uppercase">Código SAP</label>
                    <p class="text-sm text-slate-800 font-mono font-medium mt-0.5">{{ selectedItem()!.codigoSAP }}</p>
                  </div>
                  <div>
                    <label class="text-[10px] font-bold text-slate-400 uppercase">Código Externo</label>
                    <p class="text-sm font-mono mt-0.5" [ngClass]="selectedItem()!.codigoExterno ? 'text-slate-800' : 'text-slate-400'">{{ selectedItem()!.codigoExterno || 'No asignado' }}</p>
                  </div>
                </div>
              </section>

              <!-- Datos Generales -->
              <section class="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <div class="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                  <span class="material-icons text-primary text-base">info</span>
                  <h3 class="text-xs font-bold text-slate-600 uppercase tracking-wider">Datos Generales</h3>
                </div>
                <div class="p-4 space-y-4">
                  <div>
                    <label class="text-[10px] font-bold text-slate-400 uppercase">Nombre</label>
                    <p class="text-sm text-slate-800 font-medium mt-0.5">{{ selectedItem()!.nombre }}</p>
                  </div>
                  <div>
                    <label class="text-[10px] font-bold text-slate-400 uppercase">Categoría</label>
                    <p class="text-sm mt-0.5" [ngClass]="selectedItem()!.categoria ? 'text-slate-800 font-medium' : 'text-slate-400'">{{ selectedItem()!.categoria || 'Sin categoría' }}</p>
                  </div>
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="text-[10px] font-bold text-slate-400 uppercase">Unidad de Medida</label>
                      <p class="text-sm text-slate-800 font-medium mt-0.5">{{ selectedItem()!.unidadMedida || '—' }}</p>
                    </div>
                    <div>
                      <label class="text-[10px] font-bold text-slate-400 uppercase">Sector</label>
                      <p class="text-sm mt-0.5" [ngClass]="selectedItem()!.sector ? 'text-slate-800 font-medium' : 'text-slate-400'">{{ selectedItem()!.sector || 'No asignado' }}</p>
                    </div>
                  </div>
                </div>
              </section>

              <!-- Catálogo y Comercial -->
              @if (selectedItem()!.garantia || selectedItem()!.descuento || selectedItem()!.estadoEnCatalogo) {
                <section class="bg-white border border-slate-200 rounded-lg overflow-hidden">
                  <div class="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                    <span class="material-icons text-amber-500 text-base">sell</span>
                    <h3 class="text-xs font-bold text-slate-600 uppercase tracking-wider">Catálogo y Comercial</h3>
                  </div>
                  <div class="p-4 grid grid-cols-2 gap-4">
                    @if (selectedItem()!.estadoEnCatalogo) {
                      <div>
                        <label class="text-[10px] font-bold text-slate-400 uppercase">Estado en Catálogo</label>
                        <p class="text-sm font-medium mt-0.5 flex items-center gap-1.5">
                          <span class="w-1.5 h-1.5 rounded-full"
                            [ngClass]="selectedItem()!.estadoEnCatalogo === 'Disponible' ? 'bg-emerald-500' : selectedItem()!.estadoEnCatalogo === 'Descontinuado' ? 'bg-red-400' : 'bg-slate-400'"></span>
                          {{ selectedItem()!.estadoEnCatalogo }}
                        </p>
                      </div>
                    }
                    @if (selectedItem()!.descuento) {
                      <div>
                        <label class="text-[10px] font-bold text-slate-400 uppercase">Descuento</label>
                        <p class="text-sm text-slate-800 font-medium mt-0.5">{{ selectedItem()!.descuento }}%</p>
                      </div>
                    }
                    @if (selectedItem()!.garantia) {
                      <div class="col-span-2">
                        <label class="text-[10px] font-bold text-slate-400 uppercase">Garantía</label>
                        <p class="text-sm text-slate-800 font-medium mt-0.5">{{ selectedItem()!.garantia }}</p>
                      </div>
                    }
                  </div>
                </section>
              }

              <!-- Fechas -->
              <section class="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <div class="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                  <span class="material-icons text-slate-400 text-base">schedule</span>
                  <h3 class="text-xs font-bold text-slate-600 uppercase tracking-wider">Fechas</h3>
                </div>
                <div class="p-4 grid grid-cols-2 gap-4">
                  <div>
                    <label class="text-[10px] font-bold text-slate-400 uppercase">Fecha de Creación</label>
                    <p class="text-sm text-slate-800 mt-0.5">{{ selectedItem()!.fechaCreacion | date:'dd/MM/yyyy HH:mm' }}</p>
                  </div>
                  <div>
                    <label class="text-[10px] font-bold text-slate-400 uppercase">Última Modificación</label>
                    <p class="text-sm mt-0.5" [ngClass]="selectedItem()!.fechaModificacion ? 'text-slate-800' : 'text-slate-400'">{{ selectedItem()!.fechaModificacion ? (selectedItem()!.fechaModificacion | date:'dd/MM/yyyy HH:mm') : 'Sin modificaciones' }}</p>
                  </div>
                </div>
              </section>
            </div>

            <!-- Footer -->
            <div class="px-6 py-3 border-t border-slate-200 bg-white flex items-center justify-between shrink-0">
              <button (click)="detailDrawerOpen.set(false)"
                class="px-4 py-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded text-sm font-medium transition-colors">
                Cerrar
              </button>
              <div class="flex items-center gap-2">
                <button (click)="detailDrawerOpen.set(false); confirmDelete(selectedItem()!)"
                  class="px-4 py-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded text-sm font-medium transition-colors flex items-center gap-1.5">
                  <span class="material-icons text-sm">delete_outline</span>
                  Eliminar
                </button>
                <button (click)="detailDrawerOpen.set(false); editItem(selectedItem()!)"
                  class="px-5 py-2 bg-primary hover:bg-primary/90 text-white font-bold text-xs uppercase tracking-wide rounded shadow-sm transition-all flex items-center gap-1.5">
                  <span class="material-icons text-sm">edit</span>
                  Editar
                </button>
              </div>
            </div>
          </div>
        }
      </app-drawer>
      }

      <!-- Form Drawer -->
      @if (isFormOpen()) {
        <app-drawer [title]="formItem() ? 'Editar Item' : 'Nuevo Item'" (close)="closeForm()">
          <div class="flex flex-col h-full">
            <div class="flex-1 overflow-y-auto p-6 space-y-5">

              @if (formItem()) {
                <div class="px-4 py-3 bg-primary/5 border border-primary/10 rounded-lg flex items-center gap-3">
                  <div class="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white text-sm"
                    [ngClass]="formItem()!.tipo === 'Servicio' ? 'bg-purple-500' : formItem()!.tipo === 'Catálogo' ? 'bg-amber-500' : 'bg-primary'">
                    <span class="material-icons text-lg">{{ formItem()!.tipo === 'Servicio' ? 'handyman' : formItem()!.tipo === 'Catálogo' ? 'menu_book' : 'inventory_2' }}</span>
                  </div>
                  <div>
                    <p class="text-sm font-bold text-slate-800">{{ formItem()!.nombre }}</p>
                    <div class="flex gap-3 mt-0.5">
                      <span class="text-[10px] text-slate-400 font-mono">ID: {{ formItem()!.id }}</span>
                      <span class="text-[10px] text-slate-400 font-mono">SAP: {{ formItem()!.codigoSAP }}</span>
                    </div>
                  </div>
                </div>
              }

              <!-- Identificación -->
              <section class="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <div class="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                  <span class="material-icons text-primary text-base">qr_code_2</span>
                  <h3 class="text-xs font-bold text-slate-600 uppercase tracking-wider">Identificación</h3>
                </div>
                <div class="p-4 space-y-3">
                  <div class="grid grid-cols-2 gap-3">
                    <div>
                      <label class="text-[10px] font-bold text-slate-400 uppercase">Código SAP *</label>
                      <input [(ngModel)]="formData.codigoSAP"
                        class="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded text-sm text-slate-800 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all font-mono"
                        placeholder="ej: 10002987">
                    </div>
                    <div>
                      <label class="text-[10px] font-bold text-slate-400 uppercase">Código Externo</label>
                      <input [(ngModel)]="formData.codigoExterno"
                        class="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded text-sm text-slate-800 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all font-mono"
                        placeholder="ej: 8300002493">
                    </div>
                  </div>
                </div>
              </section>

              <!-- Datos Generales -->
              <section class="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <div class="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                  <span class="material-icons text-primary text-base">info</span>
                  <h3 class="text-xs font-bold text-slate-600 uppercase tracking-wider">Datos Generales</h3>
                </div>
                <div class="p-4 space-y-3">
                  <div>
                    <label class="text-[10px] font-bold text-slate-400 uppercase">Nombre *</label>
                    <input [(ngModel)]="formData.nombre"
                      class="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded text-sm text-slate-800 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
                      placeholder="ej: RETAINING RING">
                  </div>
                  <div>
                    <label class="text-[10px] font-bold text-slate-400 uppercase">Categoría</label>
                    <input [(ngModel)]="formData.categoria"
                      class="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded text-sm text-slate-800 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
                      placeholder="ej: M-MANTENIMIENTO - HERRAMIENTAS Y ACC">
                  </div>
                  <div class="grid grid-cols-2 gap-3">
                    <div>
                      <label class="text-[10px] font-bold text-slate-400 uppercase">Tipo</label>
                      <select [(ngModel)]="formData.tipo"
                        class="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded text-sm text-slate-800 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all">
                        <option value="Pieza">Pieza</option>
                        <option value="Servicio">Servicio</option>
                        <option value="Catálogo">Catálogo</option>
                      </select>
                    </div>
                    <div>
                      <label class="text-[10px] font-bold text-slate-400 uppercase">Unidad de Medida</label>
                      <input [(ngModel)]="formData.unidadMedida"
                        class="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded text-sm text-slate-800 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
                        placeholder="ej: Unidad">
                    </div>
                  </div>
                  <div>
                    <label class="text-[10px] font-bold text-slate-400 uppercase">Sector</label>
                    <select [(ngModel)]="formData.sector"
                      class="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded text-sm text-slate-800 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all">
                      <option value="">Sin sector</option>
                      <option value="SE">SE</option>
                      <option value="EM">EM</option>
                    </select>
                  </div>
                  @if (formItem()) {
                    <div class="flex items-center gap-3 pt-2 border-t border-slate-100">
                      <label class="text-[10px] font-bold text-slate-400 uppercase">Estado</label>
                      <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" [(ngModel)]="formData.activo" class="sr-only peer">
                        <div class="w-9 h-5 bg-slate-300 peer-focus:ring-2 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
                        <span class="ml-2 text-xs font-medium" [ngClass]="formData.activo ? 'text-green-600' : 'text-red-500'">
                          {{ formData.activo ? 'Activo' : 'Inactivo' }}
                        </span>
                      </label>
                    </div>
                  }
                </div>
              </section>

              <!-- Catálogo y Comercial -->
              <section class="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <div class="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                  <span class="material-icons text-amber-500 text-base">sell</span>
                  <h3 class="text-xs font-bold text-slate-600 uppercase tracking-wider">Catálogo y Comercial</h3>
                </div>
                <div class="p-4 space-y-3">
                  <div class="grid grid-cols-2 gap-3">
                    <div>
                      <label class="text-[10px] font-bold text-slate-400 uppercase">Estado en Catálogo</label>
                      <select [(ngModel)]="formData.estadoEnCatalogo"
                        class="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded text-sm text-slate-800 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all">
                        <option value="">Sin estado</option>
                        <option value="Disponible">Disponible</option>
                        <option value="No Disponible">No Disponible</option>
                        <option value="Descontinuado">Descontinuado</option>
                      </select>
                    </div>
                    <div>
                      <label class="text-[10px] font-bold text-slate-400 uppercase">Descuento (%)</label>
                      <input [(ngModel)]="formData.descuento" type="number" min="0" max="100" step="0.01"
                        class="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded text-sm text-slate-800 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
                        placeholder="0.00">
                    </div>
                  </div>
                  <div>
                    <label class="text-[10px] font-bold text-slate-400 uppercase">Garantía</label>
                    <input [(ngModel)]="formData.garantia"
                      class="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded text-sm text-slate-800 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
                      placeholder="ej: 12 meses">
                  </div>
                </div>
              </section>

              <!-- Info del Sistema (modo edición) -->
              @if (formItem()) {
                <section class="bg-white border border-slate-200 rounded-lg overflow-hidden">
                  <div class="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                    <span class="material-icons text-slate-400 text-base">schedule</span>
                    <h3 class="text-xs font-bold text-slate-600 uppercase tracking-wider">Info del Sistema</h3>
                  </div>
                  <div class="p-4 grid grid-cols-2 gap-3">
                    <div>
                      <label class="text-[10px] font-bold text-slate-400 uppercase">Creación</label>
                      <p class="text-xs text-slate-600 mt-0.5">{{ formItem()!.fechaCreacion | date:'dd/MM/yyyy HH:mm' }}</p>
                    </div>
                    <div>
                      <label class="text-[10px] font-bold text-slate-400 uppercase">Última Modificación</label>
                      <p class="text-xs text-slate-600 mt-0.5">{{ formItem()!.fechaModificacion ? (formItem()!.fechaModificacion | date:'dd/MM/yyyy HH:mm') : 'Sin modificaciones' }}</p>
                    </div>
                  </div>
                </section>
              }
            </div>

            <div class="px-6 py-3 border-t border-slate-200 bg-white flex items-center justify-between shrink-0">
              <button (click)="closeForm()"
                class="px-4 py-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded text-sm font-medium transition-colors">
                Cancelar
              </button>
              <button (click)="onSave()" [disabled]="saving()"
                class="px-5 py-2 bg-primary hover:bg-primary/90 text-white font-bold text-xs uppercase tracking-wide rounded shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50">
                <span class="material-icons text-sm">{{ saving() ? 'progress_activity' : 'save' }}</span>
                {{ formItem() ? 'Guardar Cambios' : 'Crear Item' }}
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
                <h3 class="text-sm font-bold text-slate-800">Eliminar Item</h3>
                <p class="text-xs text-slate-500">Esta acción no se puede deshacer</p>
              </div>
            </div>
            <p class="text-sm text-slate-600 mb-5">
              ¿Eliminar <strong>{{ itemToDelete()?.nombre }}</strong>?
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
              <button (click)="deleteItem()"
                class="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded font-bold transition-colors flex items-center gap-1.5">
                <span class="material-icons text-sm">delete</span>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .hide-scrollbar::-webkit-scrollbar { display: none }
    .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none }
    @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
    .animate-slide-up { animation: slide-up 0.3s ease-out; }
  `]
})
export class ItemListComponent implements OnInit, OnDestroy {
    private http = inject(HttpClient);
    private apiUrl = environment.apiUrl;
    private destroy$ = new Subject<void>();
    private searchSubject = new Subject<string>();

    // Data
    items = signal<Item[]>([]);
    stats = signal<ItemStats | null>(null);
    filters = signal<ItemFilters | null>(null);

    // State
    loading = signal(false);
    currentPage = signal(1);
    totalItems = signal(0);
    totalPages = signal(1);
    pageSize = 25;

    // Sorting
    sortBy = signal('Nombre');
    sortDir = signal<'asc' | 'desc'>('asc');

    // Filters
    searchQuery = '';
    categoriaFilter = '';
    tipoFilter = '';
    estadoFilter = '';
    sectorFilter = '';

    // Drawer
    detailDrawerOpen = signal(false);
    selectedItem = signal<Item | null>(null);

    // Form
    isFormOpen = signal(false);
    formItem = signal<Item | null>(null);
    saving = signal(false);
    formData = {
        codigoSAP: '', codigoExterno: '', nombre: '', categoria: '',
        unidadMedida: 'Unidad', tipo: 'Pieza', estado: 'Activo', activo: true,
        sector: '', garantia: '', descuento: 0, estadoEnCatalogo: ''
    };

    // Mobile
    mobileSearchOpen = signal(false);
    mobileFilterOpen = signal(false);

    // Delete
    showDeleteConfirm = signal(false);
    itemToDelete = signal<Item | null>(null);
    deleteError = signal('');

    columns = [
        { key: 'CodigoSAP', label: 'Código SAP' },
        { key: 'CodigoExterno', label: 'Código Externo' },
        { key: 'Nombre', label: 'Nombre' },
        { key: 'Categoria', label: 'Categoría' },
        { key: 'Tipo', label: 'Tipo' },
        { key: 'Estado', label: 'Estado' },
        { key: 'Sector', label: 'Sector' }
    ];

    hasActiveFilters = computed(() => 
        !!this.searchQuery || !!this.categoriaFilter || !!this.tipoFilter || !!this.estadoFilter || !!this.sectorFilter
    );

    ngOnInit() {
        this.searchSubject.pipe(
            debounceTime(400),
            distinctUntilChanged(),
            takeUntil(this.destroy$)
        ).subscribe(() => {
            this.currentPage.set(1);
            this.loadItems();
        });

        this.loadItems();
        this.loadStats();
        this.loadFilters();
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    loadItems() {
        this.loading.set(true);
        let params = new HttpParams()
            .set('page', this.currentPage().toString())
            .set('limit', this.pageSize.toString())
            .set('sortBy', this.sortBy())
            .set('sortDir', this.sortDir());

        if (this.searchQuery) params = params.set('search', this.searchQuery);
        if (this.categoriaFilter) params = params.set('categoria', this.categoriaFilter);
        if (this.tipoFilter) params = params.set('tipo', this.tipoFilter);
        if (this.estadoFilter) params = params.set('estado', this.estadoFilter);
        if (this.sectorFilter) params = params.set('sector', this.sectorFilter);

        this.http.get<{ data: Item[], pagination: any }>(`${this.apiUrl}/items`, { params }).subscribe({
            next: (res) => {
                this.items.set(res.data);
                this.totalItems.set(res.pagination.total);
                this.totalPages.set(res.pagination.totalPages);
                this.loading.set(false);
            },
            error: () => this.loading.set(false)
        });
    }

    loadStats() {
        this.http.get<ItemStats>(`${this.apiUrl}/items/stats`).subscribe({
            next: (s) => this.stats.set(s)
        });
    }

    loadFilters() {
        this.http.get<ItemFilters>(`${this.apiUrl}/items/filters`).subscribe({
            next: (f) => this.filters.set(f)
        });
    }

    onSearchInput() {
        this.searchSubject.next(this.searchQuery);
    }

    onFilterChange() {
        this.currentPage.set(1);
        this.loadItems();
    }

    clearFilters() {
        this.searchQuery = '';
        this.categoriaFilter = '';
        this.tipoFilter = '';
        this.estadoFilter = '';
        this.sectorFilter = '';
        this.currentPage.set(1);
        this.loadItems();
    }

    toggleSort(col: string) {
        if (this.sortBy() === col) {
            this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
        } else {
            this.sortBy.set(col);
            this.sortDir.set('asc');
        }
        this.loadItems();
    }

    goToPage(page: number) {
        if (page < 1 || page > this.totalPages()) return;
        this.currentPage.set(page);
        this.loadItems();
    }

    onPageSizeChange() {
        this.pageSize = +this.pageSize;
        this.currentPage.set(1);
        this.loadItems();
    }

    openDetail(item: Item) {
        this.selectedItem.set(item);
        this.detailDrawerOpen.set(true);
    }

    // --- Form CRUD ---
    openForm() {
        this.formItem.set(null);
        this.formData = {
            codigoSAP: '', codigoExterno: '', nombre: '', categoria: '',
            unidadMedida: 'Unidad', tipo: 'Pieza', estado: 'Activo', activo: true,
            sector: '', garantia: '', descuento: 0, estadoEnCatalogo: ''
        };
        this.isFormOpen.set(true);
    }

    editItem(item: Item) {
        this.formItem.set(item);
        this.formData = {
            codigoSAP: item.codigoSAP || '',
            codigoExterno: item.codigoExterno || '',
            nombre: item.nombre || '',
            categoria: item.categoria || '',
            unidadMedida: item.unidadMedida || 'Unidad',
            tipo: item.tipo || 'Pieza',
            estado: item.estado || 'Activo',
            activo: item.estado === 'Activo',
            sector: item.sector || '',
            garantia: item.garantia || '',
            descuento: item.descuento || 0,
            estadoEnCatalogo: item.estadoEnCatalogo || ''
        };
        this.isFormOpen.set(true);
    }

    closeForm() {
        this.isFormOpen.set(false);
        this.formItem.set(null);
    }

    onSave() {
        if (!this.formData.codigoSAP.trim()) return alert('El Código SAP es requerido');
        if (!this.formData.nombre.trim()) return alert('El Nombre es requerido');

        this.saving.set(true);
        const payload = {
            codigoSAP: this.formData.codigoSAP.trim(),
            codigoExterno: this.formData.codigoExterno.trim() || null,
            nombre: this.formData.nombre.trim(),
            categoria: this.formData.categoria.trim() || null,
            unidadMedida: this.formData.unidadMedida.trim() || 'Unidad',
            tipo: this.formData.tipo,
            estado: this.formData.activo ? 'Activo' : 'Inactivo',
            sector: this.formData.sector || null,
            garantia: this.formData.garantia.trim() || null,
            descuento: this.formData.descuento || null,
            estadoEnCatalogo: this.formData.estadoEnCatalogo || null
        };

        if (this.formItem()) {
            this.http.put(`${this.apiUrl}/items/${this.formItem()!.id}`, payload)
                .subscribe({
                    next: () => { this.saving.set(false); this.closeForm(); this.loadItems(); this.loadStats(); this.loadFilters(); },
                    error: (err: any) => {
                        this.saving.set(false);
                        alert(err.error?.error || 'Error al actualizar item');
                    }
                });
        } else {
            this.http.post(`${this.apiUrl}/items`, payload)
                .subscribe({
                    next: () => { this.saving.set(false); this.closeForm(); this.loadItems(); this.loadStats(); this.loadFilters(); },
                    error: (err: any) => {
                        this.saving.set(false);
                        if (err.status === 409) alert('Ya existe un item con ese Código SAP');
                        else alert(err.error?.error || 'Error al crear item');
                    }
                });
        }
    }

    confirmDelete(item: Item) {
        this.itemToDelete.set(item);
        this.deleteError.set('');
        this.showDeleteConfirm.set(true);
    }

    deleteItem() {
        const item = this.itemToDelete();
        if (!item) return;
        this.http.delete(`${this.apiUrl}/items/${item.id}`)
            .subscribe({
                next: () => {
                    this.showDeleteConfirm.set(false);
                    this.itemToDelete.set(null);
                    this.deleteError.set('');
                    this.loadItems();
                    this.loadStats();
                    this.loadFilters();
                },
                error: (err: any) => {
                    this.deleteError.set(err.error?.error || 'Error al eliminar item');
                }
            });
    }
}
