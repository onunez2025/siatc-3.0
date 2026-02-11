import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap, finalize, Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Ticket {
    id: string; // Ticket ID (e.g., 1117059)
    Ticket: string; // Backend ID
    subject: string;
    date: string;
    Estado: string;
    NombreCliente: string;
    Direccion: string;
    NombreTecnico: string;
    ApellidoTecnico: string;
    VisitaRealizada: boolean;
    TrabajoRealizado: boolean;
    ComentarioTecnico: string;
    SolicitaNuevaVisita: boolean;
    // Add other loose fields as needed
    [key: string]: any;
}

interface TicketResponse {
    data: Ticket[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

interface TicketSearchParams {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
}

@Injectable({
    providedIn: 'root'
})
export class TicketService {
    private http = inject(HttpClient);
    private apiUrl = environment.apiUrl;

    // Search Subject for debouncing
    private searchSubject = new Subject<TicketSearchParams>();
    
    // Cache for quick access
    private cache = new Map<string, { data: TicketResponse; timestamp: number }>();
    private cacheTimeout = 30000; // 30 seconds cache

    // State Signals
    private ticketsSignal = signal<Ticket[]>([]);
    private loadingSignal = signal<boolean>(false);
    private errorSignal = signal<string | null>(null);
    private paginationSignal = signal({ page: 1, limit: 10, total: 0, totalPages: 0 });

    // Computed
    tickets = computed(() => this.ticketsSignal());
    loading = computed(() => this.loadingSignal());
    error = computed(() => this.errorSignal());
    pagination = computed(() => this.paginationSignal());

    constructor() {
        // Setup debounced search
        this.searchSubject.pipe(
            debounceTime(300), // Wait 300ms after user stops typing
            distinctUntilChanged((prev, curr) => 
                prev.search === curr.search && 
                prev.status === curr.status && 
                prev.page === curr.page
            ),
            switchMap(params => this.fetchTickets(params))
        ).subscribe();
    }

    // Debounced search method
    searchTickets(params: TicketSearchParams = {}) {
        this.loadingSignal.set(true);
        this.searchSubject.next(params);
    }

    // Direct load (bypasses debounce - for initial load)
    loadTickets(params: TicketSearchParams = {}) {
        this.loadingSignal.set(true);
        this.errorSignal.set(null);

        // Check cache first
        const cacheKey = this.getCacheKey(params);
        const cached = this.cache.get(cacheKey);
        
        if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
            this.ticketsSignal.set(cached.data.data);
            this.paginationSignal.set(cached.data.pagination);
            this.loadingSignal.set(false);
            return;
        }

        this.fetchTickets(params).subscribe();
    }

    private fetchTickets(params: TicketSearchParams): Observable<TicketResponse> {
        let httpParams = new HttpParams()
            .set('page', params.page?.toString() || '1')
            .set('limit', params.limit?.toString() || '10');

        if (params.search) httpParams = httpParams.set('search', params.search);
        if (params.status) httpParams = httpParams.set('status', params.status);

        return this.http.get<TicketResponse>(`${this.apiUrl}/tickets`, { params: httpParams })
            .pipe(
                tap(res => {
                    this.ticketsSignal.set(res.data);
                    this.paginationSignal.set(res.pagination);
                    
                    // Update cache
                    const cacheKey = this.getCacheKey(params);
                    this.cache.set(cacheKey, { data: res, timestamp: Date.now() });
                }),
                finalize(() => this.loadingSignal.set(false))
            );
    }

    private getCacheKey(params: TicketSearchParams): string {
        return JSON.stringify({
            page: params.page || 1,
            limit: params.limit || 10,
            search: params.search || '',
            status: params.status || ''
        });
    }

    // Invalidate cache when data changes
    private invalidateCache() {
        this.cache.clear();
    }

    createTicket(ticket: Partial<Ticket>): Observable<any> {
        return this.http.post(`${this.apiUrl}/tickets`, ticket).pipe(
            tap(() => {
                this.invalidateCache();
                this.loadTickets();
            })
        );
    }

    updateTicket(id: string, ticket: Partial<Ticket>): Observable<any> {
        return this.http.put(`${this.apiUrl}/tickets/${id}`, ticket).pipe(
            tap(() => {
                this.invalidateCache();
                this.loadTickets();
            })
        );
    }

    deleteTicket(id: string): Observable<any> {
        return this.http.delete(`${this.apiUrl}/tickets/${id}`).pipe(
            tap(() => {
                this.invalidateCache();
                this.loadTickets();
            })
        );
    }
}
