import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';

interface TicketStats {
  total: number;
  readyToPlan: number;
  released: number;
  closed: number;
  cancelled: number;
}

@Component({
    selector: 'app-main-layout',
    standalone: true,
    imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
    template: `
    <div class="min-h-screen flex bg-background-light font-sans overflow-hidden">
      
      <!-- Sidebar -->
      <aside 
        [class.translate-x-0]="isSidebarOpen()"
        [class.-translate-x-full]="!isSidebarOpen()"
        class="fixed lg:static inset-y-0 left-0 w-64 bg-gradient-to-b from-slate-900 to-slate-800 text-white z-50 transition-transform duration-300 ease-out lg:translate-x-0 flex flex-col shadow-2xl lg:shadow-xl"
      >
        <!-- Header -->
        <div class="px-6 py-5 border-b border-slate-700/50 flex items-center justify-between">
          <div class="flex items-center gap-3 group cursor-pointer">
            <div class="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/25 group-hover:scale-110 group-hover:rotate-3 transition-all">
              <span class="text-lg">S</span>
            </div>
            <div>
              <h1 class="text-lg font-bold tracking-tight">SIAT <span class="text-blue-400">Lite</span></h1>
              <p class="text-[10px] text-slate-500 -mt-0.5">Post-Venta System</p>
            </div>
          </div>
          <button (click)="toggleSidebar()" class="lg:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <!-- Nav -->
        <nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scroll">
          <p class="px-4 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Menú Principal</p>
          
          <a routerLink="/dashboard" routerLinkActive="active-nav-item" [routerLinkActiveOptions]="{exact: true}"
             class="nav-item w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group text-slate-400 hover:text-white hover:bg-slate-700/50">
            <div class="w-8 h-8 rounded-lg bg-slate-800 group-hover:bg-blue-500/20 flex items-center justify-center transition-all group-[.active-nav-item]:bg-blue-500">
              <span class="material-icons text-lg group-[.active-nav-item]:text-white">dashboard</span>
            </div>
            <span class="font-medium">Dashboard</span>
          </a>

          <a routerLink="/tickets" routerLinkActive="active-nav-item"
             class="nav-item w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group text-slate-400 hover:text-white hover:bg-slate-700/50">
            <div class="w-8 h-8 rounded-lg bg-slate-800 group-hover:bg-orange-500/20 flex items-center justify-center transition-all group-[.active-nav-item]:bg-blue-500">
              <span class="material-icons text-lg group-[.active-nav-item]:text-white">confirmation_number</span>
            </div>
            <span class="font-medium">Tickets</span>
            <span class="ml-auto px-2 py-0.5 text-[10px] font-bold bg-orange-500/20 text-orange-400 rounded-full">{{ pendingCount() }}</span>
          </a>

          <a routerLink="/items" routerLinkActive="active-nav-item"
             class="nav-item w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group text-slate-400 hover:text-white hover:bg-slate-700/50">
            <div class="w-8 h-8 rounded-lg bg-slate-800 group-hover:bg-cyan-500/20 flex items-center justify-center transition-all group-[.active-nav-item]:bg-blue-500">
              <span class="material-icons text-lg group-[.active-nav-item]:text-white">inventory_2</span>
            </div>
            <span class="font-medium">Items</span>
          </a>

          @if (isAdmin()) {
            <!-- Administración (collapsible) -->
            <div class="pt-3">
              <p class="px-4 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Administración</p>
            </div>

            <!-- Usuarios & Accesos (grupo con submenú) -->
            <div>
              <button (click)="toggleMenu('admin')" type="button"
                class="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group text-slate-400 hover:text-white hover:bg-slate-700/50"
                [class.text-white]="isMenuActive('admin')" [class.bg-slate-700/30]="isMenuActive('admin')">
                <div class="w-8 h-8 rounded-lg bg-slate-800 group-hover:bg-emerald-500/20 flex items-center justify-center transition-all"
                  [class.!bg-blue-500]="isMenuActive('admin')">
                  <span class="material-icons text-lg" [class.text-white]="isMenuActive('admin')">admin_panel_settings</span>
                </div>
                <span class="font-medium flex-1 text-left">Usuarios & Accesos</span>
                <span class="material-icons text-sm transition-transform duration-200" [class.rotate-180]="openMenus().includes('admin')">expand_more</span>
              </button>

              @if (openMenus().includes('admin')) {
                <div class="ml-6 pl-4 border-l border-slate-700/50 space-y-0.5 mt-1 mb-1">
                  <a routerLink="/users" routerLinkActive="sub-active" [routerLinkActiveOptions]="{exact: true}"
                     class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all text-slate-500 hover:text-white hover:bg-slate-700/40">
                    <span class="material-icons text-base">people</span>
                    <span>Usuarios</span>
                  </a>
                  <a routerLink="/users/roles" routerLinkActive="sub-active"
                     class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all text-slate-500 hover:text-white hover:bg-slate-700/40">
                    <span class="material-icons text-base">shield</span>
                    <span>Roles</span>
                  </a>
                  <a routerLink="/empresas" routerLinkActive="sub-active"
                     class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all text-slate-500 hover:text-white hover:bg-slate-700/40">
                    <span class="material-icons text-base">business</span>
                    <span>Empresas</span>
                  </a>
                </div>
              }
            </div>
          }
        </nav>

        <!-- User Footer -->
        <div class="p-4 border-t border-slate-700/50 bg-slate-900/30 backdrop-blur-sm">
          <div class="flex items-center gap-3 mb-3 p-2 rounded-xl hover:bg-slate-700/30 transition-all cursor-pointer group">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center font-bold text-white text-sm shadow-inner ring-2 ring-slate-600 group-hover:ring-blue-500/50 transition-all">
              {{ authService.currentUser()?.name?.[0] }}
            </div>
            <div class="flex-1 min-w-0">
               <p class="text-sm font-semibold truncate text-white">{{ authService.currentUser()?.name }}</p>
               <p class="text-[10px] text-slate-400 truncate uppercase tracking-wide flex items-center gap-1">
                 <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                 {{ authService.currentUser()?.role }}
               </p>
            </div>
          </div>
          <button (click)="authService.logout()" class="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800/50 text-slate-400 rounded-xl text-sm font-medium hover:bg-red-500/10 hover:text-red-400 transition-all border border-slate-700/50 hover:border-red-500/30 group">
            <span class="material-icons text-base">logout</span>
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="flex-1 h-screen overflow-hidden flex flex-col relative w-full">
        <!-- Header -->
        <header class="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30 shadow-sm shrink-0">
          <div class="flex items-center gap-4">
            <button (click)="toggleSidebar()" class="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-all hover:scale-105 active:scale-95">
              <span class="material-icons">menu</span>
            </button>
            
            <!-- Breadcrumb could go here -->
            <div class="hidden sm:flex items-center gap-2 text-sm">
              <span class="material-icons text-slate-400 text-base">home</span>
              <span class="text-slate-300">/</span>
              <span class="text-slate-600 font-medium">{{ getCurrentSection() }}</span>
            </div>
          </div>
          
          <div class="flex items-center gap-4">
            <!-- Notifications -->
            <button class="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all">
              <span class="material-icons">notifications</span>
              <span class="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            </button>
            
            <!-- Status -->
            <div class="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-full border border-emerald-100">
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span class="text-xs font-semibold text-emerald-700">Conectado</span>
            </div>
          </div>
        </header>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-background-light custom-scroll">
          <router-outlet></router-outlet>
        </div>
      </main>

      <!-- Mobile Overlay -->
      @if (isSidebarOpen()) {
        <div (click)="toggleSidebar()" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden animate-fade-in"></div>
      }
    </div>
  `,
  styles: [`
    .active-nav-item {
      background: linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.05) 100%);
      color: white;
      border-left: 3px solid #3b82f6;
    }
    .active-nav-item .w-8 {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%) !important;
    }
    .active-nav-item .material-icons {
      color: white !important;
    }
    .sub-active {
      color: white !important;
      background: rgba(59, 130, 246, 0.1);
    }
    .sub-active .material-icons {
      color: #60a5fa !important;
    }
  `]
})
export class MainLayoutComponent implements OnInit, OnDestroy {
    private http = inject(HttpClient);
    private router = inject(Router);
    authService = inject(AuthService);
    isAdmin = this.authService.isAdmin;
    isSidebarOpen = signal(false);
    pendingCount = signal(0);
    openMenus = signal<string[]>(['admin']);
    private refreshInterval: any;

    ngOnInit() {
        this.loadPendingCount();
        // Actualizar cada 60 segundos
        this.refreshInterval = setInterval(() => this.loadPendingCount(), 60000);
    }

    ngOnDestroy() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
    }

    private loadPendingCount() {
        this.http.get<TicketStats>(`${environment.apiUrl}/tickets/stats`).subscribe({
            next: (stats) => {
                this.pendingCount.set(stats.readyToPlan);
            },
            error: (err) => console.error('Error loading pending count:', err)
        });
    }

    toggleSidebar() {
        this.isSidebarOpen.update(v => !v);
    }

    toggleMenu(menu: string) {
        this.openMenus.update(menus => 
            menus.includes(menu) ? menus.filter(m => m !== menu) : [...menus, menu]
        );
    }

    isMenuActive(menu: string): boolean {
        const path = window.location.pathname;
        if (menu === 'admin') return path.includes('/users') || path.includes('/empresas');
        return false;
    }

    getCurrentSection(): string {
        const path = window.location.pathname;
        if (path.includes('dashboard')) return 'Dashboard';
        if (path.includes('tickets')) return 'Tickets';
        if (path.includes('users')) return 'Usuarios';
        return 'Inicio';
    }
}
