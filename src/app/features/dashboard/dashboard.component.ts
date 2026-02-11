import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface DashboardStats {
    total: number;
    readyToPlan: number;
    released: number;
    closed: number;
    cancelled: number;
    date: string;
}

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="space-y-6 page-enter">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 class="text-2xl font-bold text-slate-800 tracking-tight">Dashboard</h2>
          <p class="text-slate-500 text-sm mt-1">Tickets programados para hoy: {{ stats().date | date:'fullDate' }}</p>
        </div>
        <div class="flex items-center gap-3">
          <button (click)="loadStats()" class="btn btn-ghost p-2" [class.animate-spin]="loading()" title="Actualizar">
            <i class="fas fa-sync-alt text-slate-500"></i>
          </button>
          <div class="flex items-center gap-2 text-sm bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span class="text-slate-600 font-medium">Actualizado: <span class="text-slate-800">{{ lastUpdate }}</span></span>
          </div>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Total Tickets -->
        <div class="card card-interactive p-5 group animate-fade-in stagger-1">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-sm font-medium text-slate-500 mb-1">Total Hoy</p>
              @if (loading()) {
                <div class="skeleton h-8 w-20"></div>
              } @else {
                <p class="text-3xl font-bold text-slate-800">{{ stats().total | number }}</p>
              }
              <div class="flex items-center gap-1 mt-2">
                <span class="text-blue-600 text-xs font-semibold flex items-center gap-0.5">
                  <i class="fas fa-calendar-day text-[10px]"></i> Fecha visita hoy
                </span>
              </div>
            </div>
            <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform">
              <i class="fas fa-ticket-alt text-white text-lg"></i>
            </div>
          </div>
        </div>

        <!-- Ready to Plan -->
        <div class="card card-interactive p-5 group animate-fade-in stagger-2">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-sm font-medium text-slate-500 mb-1">Por Planificar</p>
              @if (loading()) {
                <div class="skeleton h-8 w-16"></div>
              } @else {
                <p class="text-3xl font-bold text-orange-600">{{ stats().readyToPlan | number }}</p>
              }
              <div class="flex items-center gap-1 mt-2">
                <span class="text-orange-600 text-xs font-semibold">Requieren atención</span>
              </div>
            </div>
            <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-200 group-hover:scale-110 transition-transform">
              <i class="fas fa-clock text-white text-lg"></i>
            </div>
          </div>
        </div>

        <!-- En Progreso -->
        <div class="card card-interactive p-5 group animate-fade-in stagger-3">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-sm font-medium text-slate-500 mb-1">Liberados</p>
              @if (loading()) {
                <div class="skeleton h-8 w-16"></div>
              } @else {
                <p class="text-3xl font-bold text-blue-600">{{ stats().released | number }}</p>
              }
              <div class="flex items-center gap-1 mt-2">
                <span class="text-blue-600 text-xs font-semibold flex items-center gap-0.5">
                  <i class="fas fa-play text-[10px]"></i> En ejecución
                </span>
              </div>
            </div>
            <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform">
              <i class="fas fa-spinner text-white text-lg"></i>
            </div>
          </div>
        </div>

        <!-- Completados -->
        <div class="card card-interactive p-5 group animate-fade-in stagger-4">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-sm font-medium text-slate-500 mb-1">Cerrados</p>
              @if (loading()) {
                <div class="skeleton h-8 w-16"></div>
              } @else {
                <p class="text-3xl font-bold text-emerald-600">{{ stats().closed | number }}</p>
              }
              <div class="flex items-center gap-1 mt-2">
                <span class="text-emerald-600 text-xs font-semibold flex items-center gap-0.5">
                  <i class="fas fa-check text-[10px]"></i> Completados
                </span>
              </div>
            </div>
            <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-200 group-hover:scale-110 transition-transform">
              <i class="fas fa-check-circle text-white text-lg"></i>
            </div>
          </div>
        </div>
      </div>

      <!-- Charts Row -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Chart Principal -->
        <div class="lg:col-span-2 card p-6 animate-fade-in stagger-5">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-lg font-bold text-slate-800">Tickets por Estado (Hoy)</h3>
            <span class="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-medium">
              {{ stats().date | date:'dd/MM/yyyy' }}
            </span>
          </div>
          
          <!-- Simple Visual Chart Representation -->
          <div class="space-y-4">
            <div class="flex items-center gap-4">
              <div class="w-24 text-sm text-slate-600 font-medium">Por planificar</div>
              <div class="flex-1 h-8 bg-slate-100 rounded-full overflow-hidden">
                <div class="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all duration-1000 ease-out" 
                     [style.width.%]="getPercentage(stats().readyToPlan)"></div>
              </div>
              <div class="w-16 text-right text-sm font-bold text-slate-700">{{ stats().readyToPlan | number }}</div>
            </div>
            <div class="flex items-center gap-4">
              <div class="w-24 text-sm text-slate-600 font-medium">Liberados</div>
              <div class="flex-1 h-8 bg-slate-100 rounded-full overflow-hidden">
                <div class="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full transition-all duration-1000 ease-out" 
                     [style.width.%]="getPercentage(stats().released)"></div>
              </div>
              <div class="w-16 text-right text-sm font-bold text-slate-700">{{ stats().released | number }}</div>
            </div>
            <div class="flex items-center gap-4">
              <div class="w-24 text-sm text-slate-600 font-medium">Cerrados</div>
              <div class="flex-1 h-8 bg-slate-100 rounded-full overflow-hidden">
                <div class="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-1000 ease-out" 
                     [style.width.%]="getPercentage(stats().closed)"></div>
              </div>
              <div class="w-16 text-right text-sm font-bold text-slate-700">{{ stats().closed | number }}</div>
            </div>
            <div class="flex items-center gap-4">
              <div class="w-24 text-sm text-slate-600 font-medium">Cancelados</div>
              <div class="flex-1 h-8 bg-slate-100 rounded-full overflow-hidden">
                <div class="h-full bg-gradient-to-r from-slate-400 to-slate-500 rounded-full transition-all duration-1000 ease-out" 
                     [style.width.%]="getPercentage(stats().cancelled)"></div>
              </div>
              <div class="w-16 text-right text-sm font-bold text-slate-700">{{ stats().cancelled | number }}</div>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="card p-6 animate-fade-in stagger-6">
          <h3 class="text-lg font-bold text-slate-800 mb-4">Acciones Rápidas</h3>
          
          <div class="space-y-3">
            <a href="/tickets" class="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group cursor-pointer">
              <div class="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-500 transition-colors">
                <i class="fas fa-plus text-blue-600 group-hover:text-white transition-colors"></i>
              </div>
              <div>
                <p class="text-sm font-semibold text-slate-700">Nuevo Ticket</p>
                <p class="text-xs text-slate-400">Crear orden de servicio</p>
              </div>
              <i class="fas fa-chevron-right text-slate-300 ml-auto group-hover:translate-x-1 transition-transform"></i>
            </a>

            <a href="/tickets" class="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group cursor-pointer">
              <div class="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center group-hover:bg-orange-500 transition-colors">
                <i class="fas fa-list text-orange-600 group-hover:text-white transition-colors"></i>
              </div>
              <div>
                <p class="text-sm font-semibold text-slate-700">Ver Pendientes</p>
                <p class="text-xs text-slate-400">{{ stats().readyToPlan | number }} tickets por planificar</p>
              </div>
              <i class="fas fa-chevron-right text-slate-300 ml-auto group-hover:translate-x-1 transition-transform"></i>
            </a>

            <div class="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group cursor-pointer">
              <div class="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-500 transition-colors">
                <i class="fas fa-chart-line text-emerald-600 group-hover:text-white transition-colors"></i>
              </div>
              <div>
                <p class="text-sm font-semibold text-slate-700">Reportes</p>
                <p class="text-xs text-slate-400">Análisis y estadísticas</p>
              </div>
              <i class="fas fa-chevron-right text-slate-300 ml-auto group-hover:translate-x-1 transition-transform"></i>
            </div>
          </div>

          <!-- Performance Indicator -->
          <div class="mt-6 p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-slate-600">Tasa de Cierre</span>
              <span class="text-lg font-bold text-emerald-600">{{ getCloseRate() }}%</span>
            </div>
            <div class="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div class="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-1000" 
                   [style.width.%]="getCloseRate()"></div>
            </div>
            <p class="text-xs text-slate-400 mt-2">Tickets cerrados del total de hoy</p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit {
    private http = inject(HttpClient);
    private apiUrl = environment.apiUrl;
    
    loading = signal(true);
    lastUpdate = '';
    stats = signal<DashboardStats>({
        total: 0,
        readyToPlan: 0,
        released: 0,
        closed: 0,
        cancelled: 0,
        date: new Date().toISOString().split('T')[0]
    });

    ngOnInit() {
        this.loadStats();
    }

    loadStats() {
        this.loading.set(true);
        
        this.http.get<DashboardStats>(`${this.apiUrl}/tickets/stats`).subscribe({
            next: (data) => {
                this.stats.set(data);
                this.lastUpdate = new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
                this.loading.set(false);
            },
            error: (err) => {
                console.error('Error loading stats:', err);
                this.loading.set(false);
            }
        });
    }

    getPercentage(value: number): number {
        const total = this.stats().total;
        if (total === 0) return 0;
        return Math.round((value / total) * 100);
    }

    getCloseRate(): number {
        const total = this.stats().total;
        if (total === 0) return 0;
        return Math.round((this.stats().closed / total) * 100);
    }
}
