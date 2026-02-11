import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, catchError, map } from 'rxjs/operators';
import { of, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface User {
    id: string;
    username: string;
    name: string;
    role: 'ADMIN' | 'TECNICO' | 'OPERADOR';
    companyName?: string;
    fsmCode?: string;
}

interface LoginResponse {
    token: string;
    user: User;
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
    isAdmin = computed(() => this.currentUserSignal()?.role === 'ADMIN');
    isTechnician = computed(() => this.currentUserSignal()?.role === 'TECNICO');

    constructor() { }

    login(credentials: { username: string; password: string }): Observable<boolean> {
        return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials).pipe(
            tap(response => {
                this.setSession(response.user, response.token);
            }),
            map(() => true),
            catchError(err => {
                console.error('Login failed', err);
                return of(false);
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
