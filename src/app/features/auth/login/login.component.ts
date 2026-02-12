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
    <div class="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <!-- Background Image -->
      <div class="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style="background-image: url('https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1920&q=80');"></div>
      <!-- Dark overlay -->
      <div class="absolute inset-0 bg-gradient-to-br from-slate-900/85 via-slate-900/75 to-primary/40"></div>
      <!-- Subtle pattern overlay -->
      <div class="absolute inset-0 opacity-[0.03]" style="background-image: url('data:image/svg+xml,%3Csvg width=&quot;60&quot; height=&quot;60&quot; viewBox=&quot;0 0 60 60&quot; xmlns=&quot;http://www.w3.org/2000/svg&quot;%3E%3Cg fill=&quot;none&quot; fill-rule=&quot;evenodd&quot;%3E%3Cg fill=&quot;%23ffffff&quot; fill-opacity=&quot;1&quot;%3E%3Cpath d=&quot;M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z&quot;/%3E%3C/g%3E%3C/g%3E%3C/svg%3E');"></div>

      <div class="relative w-full max-w-md z-10">
        <!-- Card -->
        <div class="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/30 p-8 sm:p-10 border border-white/20">
          <!-- Logo & Branding -->
          <div class="text-center mb-8">
            <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-blue-700 shadow-lg shadow-primary/30 mb-4">
              <span class="material-icons text-white text-3xl">hub</span>
            </div>
            <h1 class="text-2xl font-bold text-slate-800 tracking-tight">SIATC <span class="text-primary">3.0</span></h1>
            <p class="text-slate-400 text-sm mt-1">Sistema Integral de Atención Técnica</p>
          </div>

          <!-- Form -->
          <form (ngSubmit)="login()" class="space-y-5">
            <!-- Username -->
            <div>
              <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Usuario</label>
              <div class="relative">
                <span class="material-icons absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xl">person</span>
                <input
                  [(ngModel)]="username" name="username" type="text"
                  class="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 focus:ring-2 focus:ring-primary/30 focus:border-primary focus:bg-white outline-none transition-all text-sm placeholder:text-slate-300"
                  placeholder="Ingrese su usuario"
                  [class.border-red-300]="error() && !username"
                  required
                  autocomplete="username">
              </div>
            </div>

            <!-- Password -->
            <div>
              <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Contraseña</label>
              <div class="relative">
                <span class="material-icons absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xl">lock</span>
                <input
                  [(ngModel)]="password" name="password"
                  [type]="showPassword() ? 'text' : 'password'"
                  class="w-full pl-11 pr-11 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 focus:ring-2 focus:ring-primary/30 focus:border-primary focus:bg-white outline-none transition-all text-sm placeholder:text-slate-300"
                  placeholder="••••••••"
                  [class.border-red-300]="error() && !password"
                  required
                  autocomplete="current-password">
                <button type="button" (click)="showPassword.set(!showPassword())" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                  <span class="material-icons text-xl">{{ showPassword() ? 'visibility_off' : 'visibility' }}</span>
                </button>
              </div>
            </div>

            <!-- Error Message -->
            @if (error()) {
              <div class="flex items-center gap-2.5 p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 animate-shake">
                <span class="material-icons text-lg shrink-0">error</span>
                <span>{{ error() }}</span>
              </div>
            }

            <!-- Submit -->
            <button
              [disabled]="loading()"
              type="submit"
              class="w-full bg-gradient-to-r from-primary to-blue-700 hover:from-blue-700 hover:to-primary text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98]">
              @if (loading()) {
                <span class="material-icons animate-spin text-xl">progress_activity</span>
                <span>Ingresando...</span>
              } @else {
                <span class="material-icons text-xl">login</span>
                <span>Ingresar</span>
              }
            </button>
          </form>

          <!-- Footer -->
          <div class="mt-8 pt-6 border-t border-slate-100 text-center">
            <p class="text-xs text-slate-400">
              <span class="material-icons text-[10px] align-middle mr-0.5">shield</span>
              Conexión segura · v3.0
            </p>
          </div>
        </div>

        <!-- Bottom credit -->
        <p class="text-center text-xs text-white/60 mt-6 drop-shadow-sm">
          MT Industrial S.A.C. · Todos los derechos reservados
        </p>
      </div>
    </div>
  `,
    styles: [`
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      15%, 45%, 75% { transform: translateX(-4px); }
      30%, 60%, 90% { transform: translateX(4px); }
    }
    .animate-shake { animation: shake 0.4s ease-in-out; }
  `]
})
export class LoginComponent {
    authService = inject(AuthService);
    router = inject(Router);

    username = '';
    password = '';
    loading = signal(false);
    error = signal<string | null>(null);
    showPassword = signal(false);

    login() {
        if (!this.username || !this.password) {
            this.error.set('Complete todos los campos');
            return;
        }

        this.loading.set(true);
        this.error.set(null);

        this.authService.login({ username: this.username, password: this.password })
            .subscribe(result => {
                this.loading.set(false);
                if (result.success) {
                    this.router.navigate(['/']);
                } else {
                    this.error.set(result.error || 'Usuario o contraseña incorrectos');
                }
            });
    }
}
