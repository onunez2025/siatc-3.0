import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';

interface DashboardData {
    date: string;
    ticketsToday: { total: number; readyToPlan: number; released: number; closed: number; cancelled: number; };
    ticketsWeek: { total: number; closed: number; cancelled: number; };
    statusDistribution: { status: string; count: number; }[];
    topEmpresas: { empresa: string; count: number; }[];
    users: { total: number; active: number; rolesUsed: number; };
    empresas: { total: number; propias: number; cas: number; active: number; };
    trend: { date: string; total: number; closed: number; }[];
}

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, RouterLink],
    template: `
    <div class="flex flex-col gap-4">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded border border-slate-200 shadow-sm">
        <div>
          <h1 class="text-lg font-bold tracking-tight text-slate-800 uppercase">Dashboard</h1>
          <p class="text-xs text-slate-400 mt-0.5">{{ data().date | date:'EEEE, dd MMMM yyyy' }} &middot; Actualizado: {{ lastUpdate }}</p>
        </div>
        <button (click)="loadDashboard()"
          class="px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10 rounded border border-primary/20 flex items-center gap-1.5 transition-colors">
          <span class="material-icons text-sm" [class.animate-spin]="loading()">autorenew</span>
          Actualizar
        </button>
      </div>

      <!-- KPI Cards Row 1: Tickets Hoy -->
      <div class="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div class="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between mb-2">
            <div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <span class="material-icons text-primary">confirmation_number</span>
            </div>
            <span class="text-[10px] font-bold text-slate-400 uppercase">Hoy</span>
          </div>
          <p class="text-2xl font-bold text-slate-800">{{ data().ticketsToday.total | number }}</p>
          <p class="text-[10px] text-slate-400 uppercase font-bold mt-1">Total Tickets</p>
        </div>
        <div class="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between mb-2">
            <div class="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <span class="material-icons text-orange-500">schedule</span>
            </div>
            <span class="text-[10px] font-bold text-orange-500">{{ getPct(data().ticketsToday.readyToPlan) }}%</span>
          </div>
          <p class="text-2xl font-bold text-orange-600">{{ data().ticketsToday.readyToPlan | number }}</p>
          <p class="text-[10px] text-slate-400 uppercase font-bold mt-1">Por Planificar</p>
        </div>
        <div class="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between mb-2">
            <div class="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <span class="material-icons text-blue-500">play_circle</span>
            </div>
            <span class="text-[10px] font-bold text-blue-500">{{ getPct(data().ticketsToday.released) }}%</span>
          </div>
          <p class="text-2xl font-bold text-blue-600">{{ data().ticketsToday.released | number }}</p>
          <p class="text-[10px] text-slate-400 uppercase font-bold mt-1">Liberados</p>
        </div>
        <div class="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between mb-2">
            <div class="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <span class="material-icons text-green-500">check_circle</span>
            </div>
            <span class="text-[10px] font-bold text-green-600">{{ getPct(data().ticketsToday.closed) }}%</span>
          </div>
          <p class="text-2xl font-bold text-green-600">{{ data().ticketsToday.closed | number }}</p>
          <p class="text-[10px] text-slate-400 uppercase font-bold mt-1">Cerrados</p>
        </div>
        <div class="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between mb-2">
            <div class="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <span class="material-icons text-red-400">cancel</span>
            </div>
            <span class="text-[10px] font-bold text-red-400">{{ getPct(data().ticketsToday.cancelled) }}%</span>
          </div>
          <p class="text-2xl font-bold text-red-500">{{ data().ticketsToday.cancelled | number }}</p>
          <p class="text-[10px] text-slate-400 uppercase font-bold mt-1">Cancelados</p>
        </div>
      </div>

      <!-- Main Content Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">

        <!-- Col 1-2: Charts -->
        <div class="lg:col-span-2 space-y-4">

          <!-- Status Bar Chart -->
          <div class="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
            <div class="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="material-icons text-primary text-base">bar_chart</span>
                <h3 class="text-xs font-bold text-slate-600 uppercase tracking-wider">Distribución por Estado (Hoy)</h3>
              </div>
              <span class="text-[10px] text-slate-400 font-mono">{{ data().date | date:'dd/MM/yyyy' }}</span>
            </div>
            <div class="p-5 space-y-3">
              @for (item of data().statusDistribution; track item.status) {
                <div class="flex items-center gap-3 group/bar relative cursor-pointer">
                  <div class="w-28 text-xs text-slate-600 font-medium truncate" [title]="item.status">{{ item.status }}</div>
                  <div class="flex-1 h-7 bg-slate-100 rounded overflow-hidden relative">
                    <div class="h-full rounded transition-all duration-700 ease-out group-hover/bar:brightness-110"
                      [ngClass]="getStatusBarColor(item.status)"
                      [style.width.%]="getStatusPct(item.count)">
                    </div>
                  </div>
                  <div class="w-12 text-right text-xs font-bold text-slate-700">{{ item.count }}</div>
                  <!-- Tooltip -->
                  <div class="absolute left-32 -top-12 z-50 opacity-0 group-hover/bar:opacity-100 pointer-events-none transition-opacity duration-200">
                    <div class="bg-slate-800 text-white text-[11px] rounded-lg px-3 py-2 shadow-lg whitespace-nowrap">
                      <p class="font-bold">{{ item.status }}</p>
                      <p>{{ item.count | number }} tickets &middot; {{ getStatusPctOfTotal(item.count) }}% del total</p>
                      <div class="absolute left-6 -bottom-1 w-2 h-2 bg-slate-800 rotate-45"></div>
                    </div>
                  </div>
                </div>
              }
              @if (data().statusDistribution.length === 0 && !loading()) {
                <p class="text-center text-sm text-slate-400 py-8">Sin tickets hoy</p>
              }
            </div>
          </div>

          <!-- Trend: últimos 7 días -->
          <div class="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
            <div class="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
              <span class="material-icons text-primary text-base">trending_up</span>
              <h3 class="text-xs font-bold text-slate-600 uppercase tracking-wider">Tendencia Últimos 7 Días</h3>
            </div>
            <div class="p-5">
              <!-- Mini bar chart -->
              <div class="flex items-end gap-2 h-32">
                @for (day of data().trend; track day.date) {
                  <div class="flex-1 flex flex-col items-center gap-1 group/trend relative cursor-pointer">
                    <span class="text-[9px] font-bold text-slate-600">{{ day.total }}</span>
                    <div class="w-full flex flex-col gap-0.5 group-hover/trend:brightness-110 transition-all" style="height: 100px">
                      <div class="w-full bg-green-400 rounded-t transition-all duration-500"
                        [style.height.px]="getTrendBarHeight(day.closed, day.total)"></div>
                      <div class="w-full bg-primary/70 rounded-b transition-all duration-500 flex-1"
                        [style.height.px]="getTrendBarHeight(day.total - day.closed, day.total)"></div>
                    </div>
                    <span class="text-[9px] text-slate-400">{{ day.date | date:'EEE' }}</span>
                    <!-- Tooltip -->
                    <div class="absolute -top-24 left-1/2 -translate-x-1/2 z-50 opacity-0 group-hover/trend:opacity-100 pointer-events-none transition-opacity duration-200">
                      <div class="bg-slate-800 text-white text-[11px] rounded-lg px-3 py-2 shadow-lg whitespace-nowrap">
                        <p class="font-bold">{{ day.date | date:'EEE dd MMM' }}</p>
                        <div class="flex items-center gap-1.5 mt-0.5"><span class="w-2 h-2 rounded-sm bg-green-400"></span> Cerrados: {{ day.closed | number }}</div>
                        <div class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-sm bg-primary/70"></span> Otros: {{ day.total - day.closed | number }}</div>
                        <div class="mt-0.5 text-slate-300">Tasa cierre: {{ day.total === 0 ? 0 : ((day.closed / day.total) * 100).toFixed(0) }}%</div>
                        <div class="absolute left-1/2 -translate-x-1/2 -bottom-1 w-2 h-2 bg-slate-800 rotate-45"></div>
                      </div>
                    </div>
                  </div>
                }
              </div>
              <div class="flex items-center justify-center gap-5 mt-3 pt-3 border-t border-slate-100">
                <span class="flex items-center gap-1.5 text-[10px] text-slate-500">
                  <span class="w-3 h-2 rounded bg-primary/70"></span> Total
                </span>
                <span class="flex items-center gap-1.5 text-[10px] text-slate-500">
                  <span class="w-3 h-2 rounded bg-green-400"></span> Cerrados
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Col 3: Side panels -->
        <div class="space-y-4">

          <!-- Tasa de cierre -->
          <div class="bg-white border border-slate-200 rounded-lg p-5">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-xs font-bold text-slate-600 uppercase tracking-wider">Tasa de Cierre</h3>
              <span class="text-2xl font-bold" [ngClass]="closeRate() >= 70 ? 'text-green-600' : closeRate() >= 40 ? 'text-orange-500' : 'text-red-500'">
                {{ closeRate() }}%
              </span>
            </div>
            <div class="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
              <div class="h-full rounded-full transition-all duration-700"
                [ngClass]="closeRate() >= 70 ? 'bg-green-500' : closeRate() >= 40 ? 'bg-orange-400' : 'bg-red-400'"
                [style.width.%]="closeRate()"></div>
            </div>
            <p class="text-[10px] text-slate-400 mt-2">Tickets cerrados del total de hoy</p>
          </div>

          <!-- Semana -->
          <div class="bg-white border border-slate-200 rounded-lg p-5">
            <div class="flex items-center gap-2 mb-3">
              <span class="material-icons text-primary text-base">date_range</span>
              <h3 class="text-xs font-bold text-slate-600 uppercase tracking-wider">Resumen Semanal</h3>
            </div>
            <div class="grid grid-cols-3 gap-3">
              <div class="text-center p-2 bg-slate-50 rounded-lg">
                <p class="text-lg font-bold text-slate-800">{{ data().ticketsWeek.total | number }}</p>
                <p class="text-[10px] text-slate-400 uppercase font-bold">Total</p>
              </div>
              <div class="text-center p-2 bg-green-50 rounded-lg">
                <p class="text-lg font-bold text-green-600">{{ data().ticketsWeek.closed | number }}</p>
                <p class="text-[10px] text-slate-400 uppercase font-bold">Cerrados</p>
              </div>
              <div class="text-center p-2 bg-red-50 rounded-lg">
                <p class="text-lg font-bold text-red-500">{{ data().ticketsWeek.cancelled | number }}</p>
                <p class="text-[10px] text-slate-400 uppercase font-bold">Cancelados</p>
              </div>
            </div>
          </div>

          <!-- Top Empresas -->
          <div class="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
            <div class="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
              <span class="material-icons text-primary text-base">business</span>
              <h3 class="text-xs font-bold text-slate-600 uppercase tracking-wider">Top Empresas Hoy</h3>
            </div>
            <div class="divide-y divide-slate-100">
              @for (emp of data().topEmpresas; track emp.empresa; let i = $index) {
                <div class="px-4 py-2.5 flex items-center justify-between">
                  <div class="flex items-center gap-2.5">
                    <span class="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center">{{ i + 1 }}</span>
                    <span class="text-xs text-slate-700 font-medium truncate max-w-[140px]">{{ emp.empresa }}</span>
                  </div>
                  <span class="text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">{{ emp.count }}</span>
                </div>
              }
              @if (data().topEmpresas.length === 0) {
                <p class="text-center text-xs text-slate-400 py-6">Sin datos</p>
              }
            </div>
          </div>

          <!-- Users & Empresas quick stats -->
          <div class="grid grid-cols-2 gap-3">
            <a routerLink="/users" class="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer group">
              <div class="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <span class="material-icons text-purple-500 text-lg">people</span>
              </div>
              <p class="text-xl font-bold text-slate-800">{{ data().users.active }}</p>
              <p class="text-[10px] text-slate-400 uppercase font-bold">Usuarios Activos</p>
              <p class="text-[10px] text-slate-400">de {{ data().users.total }} total</p>
            </a>
            <a routerLink="/empresas" class="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer group">
              <div class="w-9 h-9 rounded-lg bg-teal-100 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <span class="material-icons text-teal-500 text-lg">business</span>
              </div>
              <p class="text-xl font-bold text-slate-800">{{ data().empresas.active }}</p>
              <p class="text-[10px] text-slate-400 uppercase font-bold">Empresas Activas</p>
              <p class="text-[10px] text-slate-400">{{ data().empresas.propias }} propias · {{ data().empresas.cas }} CAS</p>
            </a>
          </div>

          <!-- Quick Actions -->
          <div class="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
            <div class="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
              <span class="material-icons text-primary text-base">bolt</span>
              <h3 class="text-xs font-bold text-slate-600 uppercase tracking-wider">Acciones Rápidas</h3>
            </div>
            <div class="p-3 space-y-1">
              <a routerLink="/tickets" class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors group">
                <div class="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                  <span class="material-icons text-primary text-sm group-hover:text-white">list_alt</span>
                </div>
                <div class="flex-1">
                  <p class="text-xs font-semibold text-slate-700">Ver Tickets</p>
                  <p class="text-[10px] text-slate-400">Lista completa de tickets</p>
                </div>
                <span class="material-icons text-slate-300 text-sm group-hover:translate-x-0.5 transition-transform">chevron_right</span>
              </a>
              <a routerLink="/users" class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors group">
                <div class="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center group-hover:bg-purple-500 transition-colors">
                  <span class="material-icons text-purple-500 text-sm group-hover:text-white">person_add</span>
                </div>
                <div class="flex-1">
                  <p class="text-xs font-semibold text-slate-700">Gestionar Usuarios</p>
                  <p class="text-[10px] text-slate-400">{{ data().users.total }} registrados</p>
                </div>
                <span class="material-icons text-slate-300 text-sm group-hover:translate-x-0.5 transition-transform">chevron_right</span>
              </a>
              <a routerLink="/users/roles" class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors group">
                <div class="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center group-hover:bg-amber-500 transition-colors">
                  <span class="material-icons text-amber-500 text-sm group-hover:text-white">shield</span>
                </div>
                <div class="flex-1">
                  <p class="text-xs font-semibold text-slate-700">Roles y Permisos</p>
                  <p class="text-[10px] text-slate-400">{{ data().users.rolesUsed }} roles en uso</p>
                </div>
                <span class="material-icons text-slate-300 text-sm group-hover:translate-x-0.5 transition-transform">chevron_right</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit {
    private http = inject(HttpClient);

    loading = signal(false);
    lastUpdate = '';
    data = signal<DashboardData>({
        date: new Date().toISOString().split('T')[0],
        ticketsToday: { total: 0, readyToPlan: 0, released: 0, closed: 0, cancelled: 0 },
        ticketsWeek: { total: 0, closed: 0, cancelled: 0 },
        statusDistribution: [],
        topEmpresas: [],
        users: { total: 0, active: 0, rolesUsed: 0 },
        empresas: { total: 0, propias: 0, cas: 0, active: 0 },
        trend: []
    });

    closeRate = computed(() => {
        const t = this.data().ticketsToday;
        return t.total === 0 ? 0 : Math.round((t.closed / t.total) * 100);
    });

    ngOnInit() {
        this.loadDashboard();
    }

    loadDashboard() {
        this.loading.set(true);
        this.http.get<DashboardData>(`${environment.apiUrl}/dashboard`).subscribe({
            next: (d) => {
                this.data.set(d);
                this.lastUpdate = new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
                this.loading.set(false);
            },
            error: () => this.loading.set(false)
        });
    }

    getPct(value: number): number {
        const total = this.data().ticketsToday.total;
        return total === 0 ? 0 : Math.round((value / total) * 100);
    }

    getStatusPct(count: number): number {
        const max = Math.max(...this.data().statusDistribution.map(s => s.count), 1);
        return Math.round((count / max) * 100);
    }

    getStatusPctOfTotal(count: number): number {
        const total = this.data().ticketsToday.total;
        return total === 0 ? 0 : Math.round((count / total) * 100);
    }

    getStatusBarColor(status: string): string {
        const colors: Record<string, string> = {
            'Ready to plan': 'bg-orange-400',
            'Released': 'bg-blue-400',
            'Closed': 'bg-green-500',
            'Cancelled': 'bg-red-400',
            'Rechazado por service': 'bg-slate-400',
            'Reprogramado': 'bg-amber-400'
        };
        return colors[status] || 'bg-slate-300';
    }

    getTrendBarHeight(value: number, max: number): number {
        if (max === 0) return 2;
        const maxAll = Math.max(...this.data().trend.map(d => d.total), 1);
        return Math.max(2, Math.round((value / maxAll) * 90));
    }
}
