import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export type UserRole = 'ADMIN' | 'TECNICO' | 'OPERADOR';

export interface User {
  id: string;
  username: string;
  name: string;
  role: string; // Keep as string for flexibility, but expected to be UserRole
  originalRole?: string; // DB Role Name
  token?: string;
  lastLogin?: string;
  email?: string;
  companyName?: string;
  fsmCode?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3001/api';

  // Current Session
  currentUser = signal<User | null>(this.loadUserFromStorage());

  // Placeholder for UserManagementComponent (to be implemented)
  users = signal<User[]>([]);

  constructor() {
    this.loadUsers();
  }

  async loadUsers() {
    try {
      const users = await firstValueFrom(this.http.get<User[]>(`${this.apiUrl}/users`));
      this.users.set(users);
    } catch (e) {
      console.error('Failed to load users', e);
    }
  }

  getUserTypes() {
    return this.http.get<{ id: string, name: string }[]>(`${this.apiUrl}/user-types`);
  }

  updateUser(id: string, data: any) {
    return this.http.put(`${this.apiUrl}/users/${id}`, data);
  }

  private loadUserFromStorage(): User | null {
    const stored = localStorage.getItem('currentUser');
    return stored ? JSON.parse(stored) : null;
  }

  async login(username: string, password: string): Promise<boolean> {
    try {
      const response = await firstValueFrom(this.http.post<{ token: string, user: User }>(`${this.apiUrl}/login`, { username, password }));

      if (response && response.token) {
        // Store session
        const user = { ...response.user, token: response.token };
        this.currentUser.set(user);
        localStorage.setItem('currentUser', JSON.stringify(user));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login failed', error);
      return false;
    }
  }

  logout() {
    this.currentUser.set(null);
    localStorage.removeItem('currentUser');
  }

  // Helper to check if logged in
  isAuthenticated = computed(() => !!this.currentUser());

  // Helper to check role
  hasRole(allowedRoles: UserRole[]): boolean {
    const user = this.currentUser();
    if (!user || !user.role) return false;
    return allowedRoles.includes(user.role as UserRole);
  }

  // Username Persistence for 'Remember Me'
  getSavedUsername(): string | null {
    return localStorage.getItem('saved_username');
  }

  saveUsername(username: string) {
    localStorage.setItem('saved_username', username);
  }

  clearSavedUsername() {
    localStorage.removeItem('saved_username');
  }
}