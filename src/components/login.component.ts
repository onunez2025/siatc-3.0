import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { TranslatePipe } from '../pipes/translate.pipe';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, TranslatePipe],
  template: `
    <div class="min-h-screen flex bg-white font-sans overflow-hidden">
      
      <!-- Left Side: Visual/Brand (Hidden on Mobile) -->
      <div class="hidden lg:flex w-1/2 relative bg-slate-900 overflow-hidden items-center justify-center">
        <!-- Abstract Background -->
        <div class="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 z-10 opacity-90"></div>
        <img 
          src="https://picsum.photos/1000/1000?grayscale" 
          alt="Sole Background" 
          class="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-40 animate-pulse"
          style="animation-duration: 10s;"
        >
        
        <div class="relative z-20 text-center p-12">
           <div class="inline-block p-4 rounded-full bg-white/10 backdrop-blur-sm mb-6 border border-white/20 animate-enter">
             <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-white" viewBox="0 0 20 20" fill="currentColor">
               <path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd" />
             </svg>
           </div>
           <h1 class="text-5xl font-bold text-white mb-4 tracking-tight animate-enter-delay-1">Grupo Sole</h1>
           <p class="text-slate-300 text-lg tracking-widest uppercase font-light animate-enter-delay-2">Rinnai Corporation</p>
           <div class="mt-10 h-1 w-24 bg-blue-500 mx-auto rounded-full animate-enter-delay-2"></div>
        </div>
      </div>

      <!-- Right Side: Form -->
      <div class="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16 bg-white relative">
        <div class="w-full max-w-md space-y-8 animate-enter">
          
          <div class="text-center lg:text-left">
            <h2 class="text-3xl font-extrabold text-slate-900 tracking-tight">{{ 'WELCOME_BACK' | translate }}</h2>
            <p class="mt-2 text-sm text-slate-500">
              {{ 'LOGIN_SUBTITLE' | translate }}
            </p>
          </div>

          <form (submit)="onLogin($event)" class="mt-8 space-y-6">
            <div class="rounded-md shadow-sm space-y-5">
              
              <div class="group">
                <label for="username" class="block text-sm font-medium text-slate-700 mb-1 transition-colors group-focus-within:text-blue-600">{{ 'USERNAME' | translate }}</label>
                <div class="relative">
                   <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                     <svg class="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                       <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
                     </svg>
                   </div>
                   <input 
                     id="username" 
                     name="username" 
                     type="text" 
                     required 
                     [(ngModel)]="username"
                     class="appearance-none rounded-lg relative block w-full pl-10 pr-3 py-3 border border-slate-300 placeholder-slate-400 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm transition-all shadow-sm" 
                     [placeholder]="'ENTER_USER' | translate"
                   >
                </div>
              </div>
              
              <div class="group">
                <label for="password" class="block text-sm font-medium text-slate-700 mb-1 transition-colors group-focus-within:text-blue-600">{{ 'PASSWORD' | translate }}</label>
                <div class="relative">
                   <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                     <svg class="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                       <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd" />
                     </svg>
                   </div>
                   <input 
                     id="password" 
                     name="password" 
                     type="password" 
                     required 
                     [(ngModel)]="password"
                     class="appearance-none rounded-lg relative block w-full pl-10 pr-3 py-3 border border-slate-300 placeholder-slate-400 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm transition-all shadow-sm" 
                     placeholder="••••••••"
                   >
                </div>
              </div>

            </div>

            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <input id="remember-me" name="remember-me" type="checkbox" [(ngModel)]="rememberMe" class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer">
                <label for="remember-me" class="ml-2 block text-sm text-slate-600 cursor-pointer">{{ 'REMEMBER_ME' | translate }}</label>
              </div>

              <div class="text-sm">
                <a href="#" class="font-medium text-blue-600 hover:text-blue-500 transition-colors">{{ 'FORGOT_PASS' | translate }}</a>
              </div>
            </div>

            @if (error()) {
              <div class="rounded-md bg-red-50 p-4 border border-red-100 animate-fade-in">
                <div class="flex">
                  <div class="flex-shrink-0">
                    <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                    </svg>
                  </div>
                  <div class="ml-3">
                    <h3 class="text-sm font-medium text-red-800">{{ 'AUTH_ERROR_TITLE' | translate }}</h3>
                    <div class="mt-1 text-sm text-red-700">{{ 'AUTH_ERROR_MSG' | translate }}</div>
                  </div>
                </div>
              </div>
            }

            <div>
              <button 
                type="submit" 
                class="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <span class="absolute left-0 inset-y-0 flex items-center pl-3">
                  <svg class="h-5 w-5 text-slate-500 group-hover:text-slate-400 transition-colors" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd" />
                  </svg>
                </span>
                {{ 'LOGIN_BTN' | translate }}
              </button>
            </div>
          </form>
          
          <div class="mt-6 text-center text-xs text-slate-400">
             © 2024 MT INDUSTRIAL S.A.C. {{ 'RIGHTS_RESERVED' | translate }}
          </div>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  authService = inject(AuthService);
  username = '';
  password = '';
  rememberMe = false;
  error = signal(false);
  isLoading = signal(false);

  constructor() {
    const saved = this.authService.getSavedUsername();
    if (saved) {
      this.username = saved;
      this.rememberMe = true;
    }
  }

  async onLogin(e: Event) {
    e.preventDefault();
    this.isLoading.set(true);
    this.error.set(false);

    const success = await this.authService.login(this.username, this.password);

    if (success) {
      if (this.rememberMe) {
        this.authService.saveUsername(this.username);
      } else {
        this.authService.clearSavedUsername();
      }
    } else {
      this.error.set(true);
    }
    this.isLoading.set(false);
  }
}