import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService, Empresa } from '../../../core/services/user.service';
import { DrawerComponent } from '../../../shared/components/drawer/drawer.component';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-empresa-list',
  standalone: true,
  imports: [CommonModule, FormsModule, DrawerComponent],
  template: `
    <div class="flex flex-col h-full gap-4">
      <!-- Stats Row (responsive: 2 cols mobile, 4 desktop) -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div class="bg-white border border-slate-200 rounded-lg p-3 md:p-4 flex items-center gap-2 md:gap-3">
          <div class="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-primary/10 flex items-center justify-center"><span class="material-icons text-primary text-lg md:text-xl">business</span></div>
          <div><p class="text-lg md:text-xl font-bold text-slate-800">{{ empresas().length }}</p><p class="text-[10px] text-slate-400 uppercase font-bold">Total</p></div>
        </div>
        <div class="bg-white border border-slate-200 rounded-lg p-3 md:p-4 flex items-center gap-2 md:gap-3">
          <div class="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-purple-100 flex items-center justify-center"><span class="material-icons text-purple-600 text-lg md:text-xl">apartment</span></div>
          <div><p class="text-lg md:text-xl font-bold text-slate-800">{{ countByType('PROPIA') }}</p><p class="text-[10px] text-slate-400 uppercase font-bold">Propias</p></div>
        </div>
        <div class="bg-white border border-slate-200 rounded-lg p-3 md:p-4 flex items-center gap-2 md:gap-3">
          <div class="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-teal-100 flex items-center justify-center"><span class="material-icons text-teal-600 text-lg md:text-xl">handshake</span></div>
          <div><p class="text-lg md:text-xl font-bold text-slate-800">{{ countByType('CAS') }}</p><p class="text-[10px] text-slate-400 uppercase font-bold">CAS</p></div>
        </div>
        <div class="bg-white border border-slate-200 rounded-lg p-3 md:p-4 flex items-center gap-2 md:gap-3">
          <div class="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-green-100 flex items-center justify-center"><span class="material-icons text-green-600 text-lg md:text-xl">people</span></div>
          <div><p class="text-lg md:text-xl font-bold text-slate-800">{{ totalUsers() }}</p><p class="text-[10px] text-slate-400 uppercase font-bold">Usuarios</p></div>
        </div>
      </div>

      <!-- ==================== DESKTOP VIEW ==================== -->
      <div class="hidden md:flex flex-col flex-1 min-h-0 gap-4">
        <!-- Toolbar -->
        <div class="flex flex-col lg:flex-row justify-between gap-4 bg-white p-4 rounded border border-slate-200 shadow-sm">
          <div class="flex items-center gap-3">
            <h1 class="text-lg font-bold tracking-tight text-slate-800 uppercase">Gestión de Empresas</h1>
            <span class="text-xs text-slate-400">{{ empresas().length }} empresas</span>
          </div>
          <div class="flex items-center gap-2">
            <label class="flex items-center gap-2 text-xs text-slate-500 cursor-pointer select-none">
              <input type="checkbox" [(ngModel)]="showInactive" (ngModelChange)="loadEmpresas()" class="rounded border-slate-300 text-primary focus:ring-primary/30"> Mostrar inactivas
            </label>
            <button (click)="openForm()" class="bg-primary hover:bg-primary/90 text-white px-4 py-1.5 rounded flex items-center gap-2 font-semibold text-xs transition-all shadow-sm uppercase tracking-wide">
              <span class="material-icons text-sm">add</span> Nueva Empresa
            </button>
          </div>
        </div>

        <!-- Desktop Table -->
        <div class="bg-white border border-slate-200 rounded shadow-sm overflow-hidden flex-1">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-slate-200 bg-slate-50">
                  <th class="px-4 py-2.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Empresa</th>
                  <th class="px-4 py-2.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tipo</th>
                  <th class="px-4 py-2.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Código FSM</th>
                  <th class="px-4 py-2.5 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">Usuarios</th>
                  <th class="px-4 py-2.5 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estado</th>
                  <th class="px-4 py-2.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Creación</th>
                  <th class="px-4 py-2.5 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                @for (emp of empresas(); track emp.id) {
                  <tr class="hover:bg-slate-50/50 transition-colors group cursor-pointer" (click)="viewDetail(emp)">
                    <td class="px-4 py-3">
                      <div class="flex items-center gap-3">
                        <div class="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-white text-xs shrink-0" [ngClass]="emp.type === 'PROPIA' ? 'bg-purple-500' : 'bg-teal-500'">
                          <span class="material-icons text-base">{{ emp.type === 'PROPIA' ? 'apartment' : 'handshake' }}</span>
                        </div>
                        <div><p class="text-sm font-semibold text-slate-800">{{ emp.name }}</p><p class="text-[10px] text-slate-400 font-mono">ID: {{ emp.id }}</p></div>
                      </div>
                    </td>
                    <td class="px-4 py-3"><span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold" [ngClass]="emp.type === 'PROPIA' ? 'bg-purple-100 text-purple-700' : 'bg-teal-100 text-teal-700'">{{ emp.type }}</span></td>
                    <td class="px-4 py-3 text-xs text-slate-600 font-mono">{{ emp.codigoFSM || '—' }}</td>
                    <td class="px-4 py-3 text-center"><span class="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 rounded text-xs font-semibold text-slate-600"><span class="material-icons text-xs">people</span> {{ emp.userCount || 0 }}</span></td>
                    <td class="px-4 py-3 text-center"><span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold" [ngClass]="emp.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'">{{ emp.active ? 'ACTIVO' : 'INACTIVO' }}</span></td>
                    <td class="px-4 py-3 text-xs text-slate-500">{{ emp.createdAt | date:'dd/MM/yyyy' }}</td>
                    <td class="px-4 py-3 text-right">
                      <div class="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button (click)="$event.stopPropagation(); viewDetail(emp)" class="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded transition-all" title="Ver detalle"><span class="material-icons text-base">visibility</span></button>
                        <button (click)="$event.stopPropagation(); editEmpresa(emp)" class="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded transition-all" title="Editar"><span class="material-icons text-base">edit</span></button>
                        <button (click)="$event.stopPropagation(); confirmDelete(emp)" class="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-all" title="Eliminar"><span class="material-icons text-base">delete_outline</span></button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          @if (empresas().length === 0 && !loading()) {
            <div class="flex flex-col items-center justify-center py-20 text-slate-400"><span class="material-icons text-4xl mb-2">business</span><p class="text-sm font-medium">No hay empresas registradas</p></div>
          }
          @if (loading()) {
            <div class="flex items-center justify-center py-20"><span class="material-icons text-primary text-3xl animate-spin">autorenew</span></div>
          }
        </div>
      </div>

      <!-- ==================== MOBILE VIEW ==================== -->
      <div class="flex md:hidden flex-col flex-1 min-h-0 relative">
        <!-- Mobile Header -->
        <header class="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-100 px-4 pt-3 pb-2">
          <div class="flex items-center justify-between mb-1">
            <h1 class="text-lg font-bold tracking-tight text-slate-800 flex items-center gap-2">
              <span class="material-icons text-primary text-xl">business</span> Empresas
            </h1>
            <div class="flex items-center space-x-1">
              <button (click)="mobileFilterOpen.set(!mobileFilterOpen())" class="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors relative">
                <span class="material-icons text-xl">tune</span>
                @if (showInactive) { <span class="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full border-2 border-white"></span> }
              </button>
            </div>
          </div>
          <p class="text-xs text-slate-400 font-medium">{{ empresas().length }} empresas</p>
        </header>

        <!-- Mobile Empresa Cards -->
        <main class="flex-1 overflow-y-auto px-4 py-3 space-y-3 hide-scrollbar pb-24">
          @if (loading()) {
            <div class="flex justify-center items-center py-12"><div class="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div></div>
          } @else if (empresas().length === 0) {
            <div class="flex flex-col items-center justify-center py-12 text-center">
              <span class="material-icons text-5xl text-slate-300 mb-3">business</span>
              <p class="font-semibold text-slate-600">No hay empresas registradas</p>
            </div>
          } @else {
            @for (emp of empresas(); track emp.id) {
              <div (click)="viewDetail(emp)" class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm active:scale-[0.98] transition-transform cursor-pointer">
                <div class="flex items-start gap-3">
                  <div class="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0" [ngClass]="emp.type === 'PROPIA' ? 'bg-purple-500' : 'bg-teal-500'">
                    <span class="material-icons text-lg">{{ emp.type === 'PROPIA' ? 'apartment' : 'handshake' }}</span>
                  </div>
                  <div class="flex-1 min-w-0">
                    <h3 class="text-sm font-bold text-slate-800 truncate">{{ emp.name }}</h3>
                    <p class="text-[10px] text-slate-400 font-mono">ID: {{ emp.id }}</p>
                  </div>
                  <span class="material-icons text-slate-300 text-lg shrink-0">chevron_right</span>
                </div>
                <div class="flex items-center flex-wrap gap-2 mt-3 pt-3 border-t border-slate-50">
                  <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold" [ngClass]="emp.type === 'PROPIA' ? 'bg-purple-50 text-purple-700' : 'bg-teal-50 text-teal-700'">{{ emp.type }}</span>
                  @if (emp.codigoFSM) { <span class="text-[10px] text-slate-400 font-mono">FSM: {{ emp.codigoFSM }}</span> }
                  <span class="inline-flex items-center gap-0.5 px-2 py-0.5 bg-slate-100 rounded-full text-[10px] font-semibold text-slate-600"><span class="material-icons text-[10px]">people</span> {{ emp.userCount || 0 }}</span>
                  <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ml-auto" [ngClass]="emp.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'">{{ emp.active ? 'ACTIVO' : 'INACTIVO' }}</span>
                </div>
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
          <div class="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 md:hidden max-h-[60vh] overflow-y-auto animate-slide-up">
            <div class="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-3 mb-4"></div>
            <div class="px-6 pb-8">
              <h2 class="text-lg font-bold mb-5">Opciones</h2>
              <label class="flex items-center gap-3 p-4 bg-slate-50 rounded-xl cursor-pointer select-none">
                <input type="checkbox" [(ngModel)]="showInactive" (ngModelChange)="loadEmpresas()" class="rounded border-slate-300 text-primary focus:ring-primary/30 w-5 h-5">
                <span class="text-sm font-medium text-slate-700">Mostrar empresas inactivas</span>
              </label>
              <button (click)="mobileFilterOpen.set(false)" class="w-full mt-4 py-3.5 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20">Cerrar</button>
            </div>
          </div>
        }
      </div>

      <!-- Detail Drawer -->
      @if (showDetail()) {
        <app-drawer title="Detalle de Empresa" (close)="showDetail.set(false)">
          <div class="flex flex-col h-full">
            <div class="flex-1 overflow-y-auto p-6 space-y-5">

              <!-- Header Card -->
              <div class="px-4 py-4 rounded-lg border border-slate-200 bg-gradient-to-r" [ngClass]="detailEmpresa()!.type === 'PROPIA' ? 'from-purple-50 to-white' : 'from-teal-50 to-white'">
                <div class="flex items-center gap-4">
                  <div class="w-14 h-14 rounded-xl flex items-center justify-center text-white shadow-md"
                    [ngClass]="detailEmpresa()!.type === 'PROPIA' ? 'bg-purple-500' : 'bg-teal-500'">
                    <span class="material-icons text-2xl">{{ detailEmpresa()!.type === 'PROPIA' ? 'apartment' : 'handshake' }}</span>
                  </div>
                  <div class="flex-1">
                    <h2 class="text-base font-bold text-slate-800">{{ detailEmpresa()!.name }}</h2>
                    <div class="flex items-center gap-3 mt-1">
                      <span class="text-[10px] font-mono text-slate-400">ID: {{ detailEmpresa()!.id }}</span>
                      <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold"
                        [ngClass]="detailEmpresa()!.type === 'PROPIA' ? 'bg-purple-100 text-purple-700' : 'bg-teal-100 text-teal-700'">
                        {{ detailEmpresa()!.type }}
                      </span>
                      <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold"
                        [ngClass]="detailEmpresa()!.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'">
                        {{ detailEmpresa()!.active ? 'ACTIVO' : 'INACTIVO' }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Datos Generales -->
              <section class="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <div class="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                  <span class="material-icons text-primary text-base">info</span>
                  <h3 class="text-xs font-bold text-slate-600 uppercase tracking-wider">Datos Generales</h3>
                </div>
                <div class="p-4 grid grid-cols-2 gap-4">
                  <div>
                    <label class="text-[10px] font-bold text-slate-400 uppercase">Nombre</label>
                    <p class="text-sm text-slate-800 font-medium mt-0.5">{{ detailEmpresa()!.name }}</p>
                  </div>
                  <div>
                    <label class="text-[10px] font-bold text-slate-400 uppercase">Tipo de Empresa</label>
                    <p class="text-sm text-slate-800 font-medium mt-0.5">{{ detailEmpresa()!.type === 'PROPIA' ? 'Propia' : 'CAS (Tercero)' }}</p>
                  </div>
                  <div>
                    <label class="text-[10px] font-bold text-slate-400 uppercase">Código FSM</label>
                    <p class="text-sm font-mono mt-0.5" [ngClass]="detailEmpresa()!.codigoFSM ? 'text-slate-800' : 'text-slate-400'">{{ detailEmpresa()!.codigoFSM || 'No asignado' }}</p>
                  </div>
                  <div>
                    <label class="text-[10px] font-bold text-slate-400 uppercase">Usuarios Asignados</label>
                    <p class="text-sm text-slate-800 font-medium mt-0.5 flex items-center gap-1.5">
                      <span class="material-icons text-sm text-slate-400">people</span>
                      {{ detailEmpresa()!.userCount || 0 }} usuario(s)
                    </p>
                  </div>
                </div>
              </section>

              <!-- Fechas -->
              <section class="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <div class="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                  <span class="material-icons text-slate-400 text-base">schedule</span>
                  <h3 class="text-xs font-bold text-slate-600 uppercase tracking-wider">Fechas</h3>
                </div>
                <div class="p-4 grid grid-cols-2 gap-4">
                  <div>
                    <label class="text-[10px] font-bold text-slate-400 uppercase">Fecha de Creación</label>
                    <p class="text-sm text-slate-800 mt-0.5">{{ detailEmpresa()!.createdAt | date:'dd/MM/yyyy HH:mm' }}</p>
                  </div>
                  <div>
                    <label class="text-[10px] font-bold text-slate-400 uppercase">Última Modificación</label>
                    <p class="text-sm mt-0.5" [ngClass]="detailEmpresa()!.updatedAt ? 'text-slate-800' : 'text-slate-400'">{{ detailEmpresa()!.updatedAt ? (detailEmpresa()!.updatedAt | date:'dd/MM/yyyy HH:mm') : 'Sin modificaciones' }}</p>
                  </div>
                </div>
              </section>
            </div>

            <div class="px-6 py-3 border-t border-slate-200 bg-white flex items-center justify-between shrink-0">
              <button (click)="showDetail.set(false)"
                class="px-4 py-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded text-sm font-medium transition-colors">
                Cerrar
              </button>
              <div class="flex items-center gap-2">
                <button (click)="showDetail.set(false); confirmDelete(detailEmpresa()!)"
                  class="px-4 py-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded text-sm font-medium transition-colors flex items-center gap-1.5">
                  <span class="material-icons text-sm">delete_outline</span>
                  Eliminar
                </button>
                <button (click)="showDetail.set(false); editEmpresa(detailEmpresa()!)"
                  class="px-5 py-2 bg-primary hover:bg-primary/90 text-white font-bold text-xs uppercase tracking-wide rounded shadow-sm transition-all flex items-center gap-1.5">
                  <span class="material-icons text-sm">edit</span>
                  Editar
                </button>
              </div>
            </div>
          </div>
        </app-drawer>
      }

      <!-- Drawer Form -->
      @if (isFormOpen()) {
        <app-drawer [title]="selectedEmpresa() ? 'Editar Empresa' : 'Nueva Empresa'" (close)="closeForm()">
          <div class="flex flex-col h-full">
            <div class="flex-1 overflow-y-auto p-6 space-y-5">

              @if (selectedEmpresa()) {
                <div class="px-4 py-3 bg-primary/5 border border-primary/10 rounded-lg flex items-center gap-3">
                  <div class="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white text-sm"
                    [ngClass]="selectedEmpresa()!.type === 'PROPIA' ? 'bg-purple-500' : 'bg-teal-500'">
                    <span class="material-icons text-lg">{{ selectedEmpresa()!.type === 'PROPIA' ? 'apartment' : 'handshake' }}</span>
                  </div>
                  <div>
                    <p class="text-sm font-bold text-slate-800">{{ selectedEmpresa()!.name }}</p>
                    <div class="flex gap-3 mt-0.5">
                      <span class="text-[10px] text-slate-400 font-mono">ID: {{ selectedEmpresa()!.id }}</span>
                      @if (selectedEmpresa()!.userCount) {
                        <span class="text-[10px] text-slate-400">{{ selectedEmpresa()!.userCount }} usuario(s)</span>
                      }
                    </div>
                  </div>
                </div>
              }

              <!-- Info de la Empresa -->
              <section class="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <div class="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                  <span class="material-icons text-primary text-base">business</span>
                  <h3 class="text-xs font-bold text-slate-600 uppercase tracking-wider">Información</h3>
                </div>
                <div class="p-4 space-y-3">
                  <div>
                    <label class="text-[10px] font-bold text-slate-400 uppercase">Nombre *</label>
                    <input [(ngModel)]="formData.name"
                      class="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded text-sm text-slate-800 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
                      placeholder="ej: MT Industrial S.A.C.">
                  </div>
                  <div class="grid grid-cols-2 gap-3">
                    <div>
                      <label class="text-[10px] font-bold text-slate-400 uppercase">Tipo de Empresa</label>
                      <select [(ngModel)]="formData.type"
                        class="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded text-sm text-slate-800 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all">
                        <option value="PROPIA">PROPIA</option>
                        <option value="CAS">CAS</option>
                      </select>
                    </div>
                    <div>
                      <label class="text-[10px] font-bold text-slate-400 uppercase">Código FSM</label>
                      <input [(ngModel)]="formData.codigoFSM"
                        class="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded text-sm text-slate-800 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
                        placeholder="Código en FSM">
                    </div>
                  </div>
                  @if (selectedEmpresa()) {
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

              <!-- Info del Sistema (modo edición) -->
              @if (selectedEmpresa()) {
                <section class="bg-white border border-slate-200 rounded-lg overflow-hidden">
                  <div class="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                    <span class="material-icons text-slate-400 text-base">info</span>
                    <h3 class="text-xs font-bold text-slate-600 uppercase tracking-wider">Info del Sistema</h3>
                  </div>
                  <div class="p-4 grid grid-cols-2 gap-3">
                    <div>
                      <label class="text-[10px] font-bold text-slate-400 uppercase">Creación</label>
                      <p class="text-xs text-slate-600 mt-0.5">{{ selectedEmpresa()!.createdAt | date:'dd/MM/yyyy HH:mm' }}</p>
                    </div>
                    <div>
                      <label class="text-[10px] font-bold text-slate-400 uppercase">Última Modificación</label>
                      <p class="text-xs text-slate-600 mt-0.5">{{ selectedEmpresa()!.updatedAt | date:'dd/MM/yyyy HH:mm' }}</p>
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
              <button (click)="onSave()"
                class="px-5 py-2 bg-primary hover:bg-primary/90 text-white font-bold text-xs uppercase tracking-wide rounded shadow-sm transition-all flex items-center gap-1.5">
                <span class="material-icons text-sm">save</span>
                {{ selectedEmpresa() ? 'Guardar Cambios' : 'Crear Empresa' }}
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
                <h3 class="text-sm font-bold text-slate-800">Eliminar Empresa</h3>
                <p class="text-xs text-slate-500">Esta acción no se puede deshacer</p>
              </div>
            </div>
            <p class="text-sm text-slate-600 mb-5">
              ¿Eliminar <strong>{{ empresaToDelete()?.name }}</strong>?
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
              <button (click)="deleteEmpresa()"
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
export class EmpresaListComponent implements OnInit {
  private http = inject(HttpClient);
  userService = inject(UserService);

  empresas = signal<Empresa[]>([]);
  loading = signal(false);
  isFormOpen = signal(false);
  selectedEmpresa = signal<Empresa | null>(null);
  showDetail = signal(false);
  detailEmpresa = signal<Empresa | null>(null);
  showDeleteConfirm = signal(false);
  empresaToDelete = signal<Empresa | null>(null);
  deleteError = signal('');
  showInactive = false;
  mobileFilterOpen = signal(false);

  formData = { name: '', type: 'CAS', codigoFSM: '', active: true };

  ngOnInit() {
    this.loadEmpresas();
  }

  loadEmpresas() {
    this.loading.set(true);
    const q = this.showInactive ? '?all=true' : '';
    this.http.get<Empresa[]>(`${environment.apiUrl}/empresas${q}`)
      .subscribe({
        next: (data) => { this.empresas.set(data); this.loading.set(false); },
        error: () => this.loading.set(false)
      });
  }

  countByType(type: string): number {
    return this.empresas().filter(e => e.type === type).length;
  }

  totalUsers(): number {
    return this.empresas().reduce((sum, e) => sum + (e.userCount || 0), 0);
  }

  viewDetail(emp: Empresa) {
    this.detailEmpresa.set(emp);
    this.showDetail.set(true);
  }

  openForm() {
    this.selectedEmpresa.set(null);
    this.formData = { name: '', type: 'CAS', codigoFSM: '', active: true };
    this.isFormOpen.set(true);
  }

  editEmpresa(emp: Empresa) {
    this.selectedEmpresa.set(emp);
    this.formData = { name: emp.name, type: emp.type, codigoFSM: emp.codigoFSM || '', active: emp.active };
    this.isFormOpen.set(true);
  }

  closeForm() {
    this.isFormOpen.set(false);
    this.selectedEmpresa.set(null);
  }

  onSave() {
    if (!this.formData.name.trim()) return alert('El nombre de la empresa es requerido');

    if (this.selectedEmpresa()) {
      this.http.put(`${environment.apiUrl}/empresas/${this.selectedEmpresa()!.id}`, this.formData)
        .subscribe({
          next: () => { this.closeForm(); this.loadEmpresas(); this.userService.loadEmpresas(); },
          error: () => alert('Error al actualizar empresa')
        });
    } else {
      this.http.post(`${environment.apiUrl}/empresas`, this.formData)
        .subscribe({
          next: () => { this.closeForm(); this.loadEmpresas(); this.userService.loadEmpresas(); },
          error: (err: any) => {
            if (err.status === 409) alert('La empresa ya existe');
            else alert('Error al crear empresa');
          }
        });
    }
  }

  confirmDelete(emp: Empresa) {
    this.empresaToDelete.set(emp);
    this.deleteError.set('');
    this.showDeleteConfirm.set(true);
  }

  deleteEmpresa() {
    const emp = this.empresaToDelete();
    if (!emp) return;
    this.http.delete(`${environment.apiUrl}/empresas/${emp.id}`)
      .subscribe({
        next: () => {
          this.showDeleteConfirm.set(false);
          this.empresaToDelete.set(null);
          this.deleteError.set('');
          this.loadEmpresas();
          this.userService.loadEmpresas();
        },
        error: (err: any) => {
          this.deleteError.set(err.error?.error || 'Error al eliminar empresa');
        }
      });
  }
}
