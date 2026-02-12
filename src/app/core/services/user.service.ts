import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap, finalize } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface User {
    id: number;
    username: string;
    firstName: string;
    lastName: string;
    name: string;
    roleId: number;
    roleName: string;
    roleDesc: string;
    email: string;
    empresaId: number;
    empresaName: string;
    codigoTecnico: string | null;
    active: boolean;
    lastLogin?: string;
    createdAt?: string;
}

export interface Role {
    id: number;
    name: string;
    description: string;
    active: boolean;
    createdAt?: string;
}

export interface Empresa {
    id: number;
    name: string;
    type: string;
    active: boolean;
    codigoFSM?: string;
    createdAt?: string;
    updatedAt?: string;
    userCount?: number;
}

export interface UserSearchParams {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
}

interface UserResponse {
    data: User[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private http = inject(HttpClient);
    private apiUrl = environment.apiUrl;

    // State
    private usersSignal = signal<User[]>([]);
    private rolesSignal = signal<Role[]>([]);
    private empresasSignal = signal<Empresa[]>([]);
    private loadingSignal = signal<boolean>(false);
    private paginationSignal = signal({ total: 0, page: 1, limit: 20, totalPages: 0 });

    // Computed
    users = computed(() => this.usersSignal());
    roles = computed(() => this.rolesSignal());
    empresas = computed(() => this.empresasSignal());
    loading = computed(() => this.loadingSignal());
    pagination = computed(() => this.paginationSignal());

    fetchUsers(params: UserSearchParams = {}) {
        this.loadingSignal.set(true);
        let httpParams = new HttpParams();
        if (params.page) httpParams = httpParams.set('page', params.page.toString());
        if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
        if (params.search) httpParams = httpParams.set('search', params.search);
        if (params.role) httpParams = httpParams.set('role', params.role);
        if (params.sortBy) httpParams = httpParams.set('sortBy', params.sortBy);
        if (params.sortDir) httpParams = httpParams.set('sortDir', params.sortDir);

        this.http.get<UserResponse>(`${this.apiUrl}/users`, { params: httpParams })
            .pipe(finalize(() => this.loadingSignal.set(false)))
            .subscribe({
                next: (res) => {
                    this.usersSignal.set(res.data);
                    this.paginationSignal.set(res.pagination);
                },
                error: (err) => console.error('Error loading users', err)
            });
    }

    loadRoles() {
        this.http.get<Role[]>(`${this.apiUrl}/roles`)
            .subscribe({
                next: (roles) => this.rolesSignal.set(roles),
                error: (err) => console.error('Error loading roles', err)
            });
    }

    loadEmpresas() {
        this.http.get<Empresa[]>(`${this.apiUrl}/empresas`)
            .subscribe({
                next: (empresas) => this.empresasSignal.set(empresas),
                error: (err) => console.error('Error loading empresas', err)
            });
    }

    createUser(data: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/users`, data);
    }

    updateUser(id: number, data: any): Observable<any> {
        return this.http.put(`${this.apiUrl}/users/${id}`, data);
    }

    deleteUser(id: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/users/${id}`);
    }
}
