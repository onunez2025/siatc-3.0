import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, catchError, map } from 'rxjs/operators';
import { of, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface User {
    id: number;
    username: string;
    name: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    roleId: number;
    roleName: string;
    empresaId: number;
    empresaName: string;
    tipoEmpresa: string;
    codigoTecnico?: string;
    requirePasswordChange?: boolean;
}

interface LoginResponse {
    token: string;
    user: User;
}

interface LoginError {
    error: string;
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private http = inject(HttpClient);
    private router: Router = inject(Router);
    private apiUrl = environment.apiUrl;

    // State Signals
    private currentUserSignal = signal<User | null>(this.getUserFromStorage());
    private tokenSignal = signal<string | null>(localStorage.getItem('token'));

    // Computed
    currentUser = computed(() => this.currentUserSignal());
    isAuthenticated = computed(() => !!this.currentUserSignal());
    isAdmin = computed(() => {
        const u = this.currentUserSignal();
        return u?.roleId === 1 || (u?.role || '').toUpperCase() === 'ADMINISTRADOR';
    });
    isTechnician = computed(() => {
        const u = this.currentUserSignal();
        return u?.roleId === 2 || (u?.role || '').toUpperCase() === 'TECNICO';
    });

    constructor() { }

    login(credentials: { username: string; password: string }): Observable<{ success: boolean; error?: string }> {
        return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials).pipe(
            tap(response => {
                this.setSession(response.user, response.token);
            }),
            map(() => ({ success: true })),
            catchError(err => {
                const message = err?.error?.error || 'Error de conexión';
                return of({ success: false, error: message });
            })
        );
    }

    logout() {
        this.clearSession();
        this.router.navigate(['/login']);
    }

    private setSession(user: User, token: string) {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        this.currentUserSignal.set(user);
        this.tokenSignal.set(token);
    }

    private clearSession() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        this.currentUserSignal.set(null);
        this.tokenSignal.set(null);
    }

    private getUserFromStorage(): User | null {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                return JSON.parse(userStr);
            } catch {
                return null;
            }
        }
        return null;
    }
}
