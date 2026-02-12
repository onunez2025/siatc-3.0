import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap, finalize, Subject, debounceTime, distinctUntilChanged, switchMap, catchError, of } from 'rxjs';
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

export interface TicketSearchParams {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    tecnico?: string;
    cliente?: string;
    empresa?: string;
    dni?: string;
    telefono?: string;
    distrito?: string;
    codigoPostal?: string;
    fechaDesde?: string;
    fechaHasta?: string;
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
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
                JSON.stringify(prev) === JSON.stringify(curr)
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

        // Invalidate cache when filters change to avoid stale data
        const cacheKey = this.getCacheKey(params);
        const cached = this.cache.get(cacheKey);
        
        if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
            this.ticketsSignal.set(cached.data.data);
            this.paginationSignal.set(cached.data.pagination);
            this.loadingSignal.set(false);
            return;
        }

        this.fetchTickets(params).subscribe({
            next: (res) => {
                console.log('loadTickets success:', res.data?.length, 'tickets');
            },
            error: (err) => {
                console.error('Error loading tickets:', err);
                this.errorSignal.set(err.message || 'Error loading tickets');
                this.loadingSignal.set(false);
            }
        });
    }

    private fetchTickets(params: TicketSearchParams): Observable<TicketResponse> {
        let httpParams = new HttpParams()
            .set('page', params.page?.toString() || '1')
            .set('limit', params.limit?.toString() || '10');

        if (params.search) httpParams = httpParams.set('search', params.search);
        if (params.status) httpParams = httpParams.set('status', params.status);
        if (params.tecnico) httpParams = httpParams.set('tecnico', params.tecnico);
        if (params.cliente) httpParams = httpParams.set('col_NombreCliente', params.cliente);
        if (params.empresa) httpParams = httpParams.set('col_IDEmpresa', params.empresa);
        if (params.dni) httpParams = httpParams.set('col_CodigoExternoCliente', params.dni);
        if (params.telefono) httpParams = httpParams.set('telefono', params.telefono);
        if (params.distrito) httpParams = httpParams.set('col_Distrito', params.distrito);
        if (params.codigoPostal) httpParams = httpParams.set('col_CodigoPostal', params.codigoPostal);
        if (params.fechaDesde) httpParams = httpParams.set('fechaDesde', params.fechaDesde);
        if (params.fechaHasta) httpParams = httpParams.set('fechaHasta', params.fechaHasta);
        if (params.sortBy) httpParams = httpParams.set('sortBy', params.sortBy);
        if (params.sortDir) httpParams = httpParams.set('sortDir', params.sortDir);

        console.log('Fetching tickets from:', `${this.apiUrl}/tickets`, 'with params:', params);

        return this.http.get<TicketResponse>(`${this.apiUrl}/tickets`, { params: httpParams })
            .pipe(
                tap(res => {
                    console.log('Tickets received:', res);
                    this.ticketsSignal.set(res.data);
                    this.paginationSignal.set(res.pagination);
                    
                    // Update cache
                    const cacheKey = this.getCacheKey(params);
                    this.cache.set(cacheKey, { data: res, timestamp: Date.now() });
                }),
                catchError(err => {
                    console.error('HTTP Error:', err);
                    this.errorSignal.set(err.message || 'Error fetching tickets');
                    return of({ data: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } });
                }),
                finalize(() => this.loadingSignal.set(false))
            );
    }

    private getCacheKey(params: TicketSearchParams): string {
        return JSON.stringify({
            page: params.page || 1,
            limit: params.limit || 10,
            search: params.search || '',
            status: params.status || '',
            tecnico: params.tecnico || '',
            cliente: params.cliente || '',
            empresa: params.empresa || '',
            dni: params.dni || '',
            telefono: params.telefono || '',
            distrito: params.distrito || '',
            codigoPostal: params.codigoPostal || '',
            fechaDesde: params.fechaDesde || '',
            fechaHasta: params.fechaHasta || '',
            sortBy: params.sortBy || '',
            sortDir: params.sortDir || ''
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
