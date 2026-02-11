import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-slate-800">SIAT <span class="text-blue-600">Lite</span></h1>
          <p class="text-slate-500 mt-2">Inicie sesión para continuar</p>
        </div>

        <form (ngSubmit)="login()" class="space-y-6">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2">Usuario</label>
            <input [(ngModel)]="username" name="username" type="text" class="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" placeholder="Ingrese su usuario" required>
          </div>

          <div>
             <label class="block text-sm font-medium text-slate-700 mb-2">Contraseña</label>
             <input [(ngModel)]="password" name="password" type="password" class="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" placeholder="••••••••" required>
          </div>

          @if (error()) {
            <div class="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
              {{ error() }}
            </div>
          }

          <button [disabled]="loading()" type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center">
            @if(loading()) {
              <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            } @else {
              INGRESAR
            }
          </button>
        </form>
      </div>
    </div>
  `
})
export class LoginComponent {
    authService = inject(AuthService);
    router = inject(Router);

    username = '';
    password = '';
    loading = signal(false);
    error = signal<string | null>(null);

    login() {
        if (!this.username || !this.password) return;

        this.loading.set(true);
        this.error.set(null);

        this.authService.login({ username: this.username, password: this.password })
            .subscribe(success => {
                this.loading.set(false);
                if (success) {
                    this.router.navigate(['/']);
                } else {
                    this.error.set('Usuario o contraseña incorrectos');
                }
            });
    }
}
