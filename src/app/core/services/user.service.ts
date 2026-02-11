import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, finalize } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface User {
    id: string; // ID Usuario
    username: string;
    name: string;
    role: string;
    email: string;
    lastLogin?: string;
}

export interface UserType {
    id: string;
    name: string;
}

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private http = inject(HttpClient);
    private apiUrl = environment.apiUrl;

    // State
    private usersSignal = signal<User[]>([]);
    private userTypesSignal = signal<UserType[]>([]);
    private loadingSignal = signal<boolean>(false);

    // Computed
    users = computed(() => this.usersSignal());
    userTypes = computed(() => this.userTypesSignal());
    loading = computed(() => this.loadingSignal());

    loadUsers() {
        this.loadingSignal.set(true);
        this.http.get<User[]>(`${this.apiUrl}/users`)
            .pipe(finalize(() => this.loadingSignal.set(false)))
            .subscribe({
                next: (users) => this.usersSignal.set(users),
                error: (err) => console.error('Error loading users', err)
            });
    }

    loadUserTypes() {
        this.http.get<UserType[]>(`${this.apiUrl}/user-types`)
            .subscribe({
                next: (types) => this.userTypesSignal.set(types),
                error: (err) => console.error('Error loading user types', err)
            });
    }

    updateUser(id: string, data: any): Observable<any> {
        return this.http.put(`${this.apiUrl}/users/${id}`, data).pipe(
            tap(() => this.loadUsers()) // Refresh list
        );
    }
}
