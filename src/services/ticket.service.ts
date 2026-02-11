import { Injectable, signal, computed, inject, Resource, resource } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';

// Mapping the schema from the image to TypeScript
export interface Ticket {
  id: string; // Internal/Local standard
  Ticket: string; // DB field (1)
  IdServicio: string; // (8)
  Estado: string; // (4)
  FechaVisita: string; // (5)
  NombreCliente: string; // (11)
  NombreEquipo: string; // (27)
  ComentarioTecnico: string; // (39)
  CodigoTecnico: string; // (30)
  NombreTecnico: string; // (31)
  ApellidoTecnico: string; // (32)
  Distrito: string; // (18)
  Ciudad: string; // (19)
  Email: string; // (12)

  // Location/Derived
  Calle?: string;
  NumeroCalle?: string;
  Referencia?: string;
  Latitud?: string;
  Longitud?: string;
  IdEquipo?: string;
  CodigoExternoEquipo?: string;
  IdCliente?: string;
  Telefono1?: string;
  Celular1?: string;
  Pais?: string;
  CodigoPostal?: string;
  LlamadaFSM?: string;

  // Execution Flags (Parsed as booleans by backend)
  VisitaRealizada?: boolean;
  TrabajoRealizado?: boolean;
  SolicitaNuevaVisita?: boolean;
  MotivoNuevaVisita?: string;
  CheckOut?: string | null;
  ComentarioProgramador?: string;
  FechaUltimaModificacion?: string;
  TipoServicio?: string; // Descriptive name from [APPGAC].[ServicioTipo]

  // Cancellation data
  Motivo_Cancelacion?: string;
  Autorizador_Cancelacion?: string;
  FechaCancelacion?: string;
}

export interface ServiceType {
  id: string;
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class TicketService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3001/api';

  // State
  private ticketsSignal = signal<Ticket[]>([]);
  private loadingSignal = signal<boolean>(false);
  private todayStatsSignal = signal<{
    total: number,
    ready: number,
    closed: number,
    other: number,
    statusDistribution: { name: string, value: number }[],
    byType: { name: string, value: number }[]
  }>({
    total: 0, ready: 0, closed: 0, other: 0, statusDistribution: [], byType: []
  });

  // Pagination State
  public currentPage = signal<number>(1);
  public pageSize = signal<number>(10);
  public totalItems = signal<number>(0);
  public totalPages = signal<number>(0);
  public searchQuery = signal<string>(''); // Tracks search term

  // Advanced Controls
  visibleColumns = signal<string[]>(['Ticket', 'TipoServicio', 'Estado', 'NombreCliente', 'FechaVisita', 'NombreTecnico']);
  columnFilters = signal<Record<string, string>>({});

  // Read-only signals
  public tickets = this.ticketsSignal.asReadonly();
  public isLoading = this.loadingSignal.asReadonly();
  public todayStats = this.todayStatsSignal.asReadonly();

  constructor() {
    this.refreshTickets();
    this.refreshTodayStats();
  }

  async getServiceTypes(): Promise<ServiceType[]> {
    try {
      return await firstValueFrom(this.http.get<ServiceType[]>(`${this.apiUrl}/service-types`));
    } catch (error) {
      console.error('Error fetching service types:', error);
      return [];
    }
  }

  authService = inject(AuthService); // Inject Auth Service

  async refreshTodayStats() {
    try {
      let params = new HttpParams();
      const fsmCode = this.authService.currentUser()?.fsmCode;
      if (fsmCode) {
        params = params.set('company', fsmCode);
      }

      const stats = await firstValueFrom(this.http.get<{
        total: number,
        ready: number,
        closed: number,
        other: number,
        statusDistribution: { name: string, value: number }[],
        byType: { name: string, value: number }[]
      }>(`${this.apiUrl}/stats/today`, { params }));
      this.todayStatsSignal.set(stats);
    } catch (error) {
      console.error('Error fetching today stats:', error);
    }
  }

  async refreshTickets() {
    this.loadingSignal.set(true);
    try {
      const page = this.currentPage();
      const limit = this.pageSize();

      let params = new HttpParams()
        .set('page', page.toString())
        .set('limit', limit.toString());

      const fsmCode = this.authService.currentUser()?.fsmCode;
      if (fsmCode) {
        params = params.set('company', fsmCode);
      }

      if (this.searchQuery()) {
        params = params.set('search', this.searchQuery());
      }

      // Add column filters
      const filters = this.columnFilters();
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params = params.set(`col_${key}`, filters[key]);
        }
      });

      const response = await firstValueFrom(this.http.get<{
        data: Ticket[],
        pagination: { total: number, page: number, limit: number, totalPages: number }
      }>(`${this.apiUrl}/tickets`, { params }));

      this.ticketsSignal.set(response.data);
      this.totalItems.set(response.pagination.total);
      this.totalPages.set(response.pagination.totalPages);

      // Auto-refresh stats when tickets change
      this.refreshTodayStats();
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async cancelTicket(ticketId: string, data: { motivo: string, autorizador: string }) {
    try {
      await firstValueFrom(this.http.post(`${this.apiUrl}/tickets/${ticketId}/cancel`, data));
      // Refresh after cancellation
      this.refreshTickets();
      this.refreshTodayStats();
    } catch (error) {
      console.error('Error cancelling ticket:', error);
      throw error;
    }
  }

  setPage(page: number) {
    this.currentPage.set(page);
    this.refreshTickets();
  }

  setPageSize(size: number) {
    this.pageSize.set(size);
    this.currentPage.set(1); // Reset to first page
    this.refreshTickets();
  }

  async saveTicket(ticket: Partial<Ticket>): Promise<boolean> {
    try {
      if (ticket.Ticket) {
        // Update
        await firstValueFrom(this.http.put(`${this.apiUrl}/tickets/${ticket.Ticket}`, ticket));
      } else {
        // Create
        await firstValueFrom(this.http.post(`${this.apiUrl}/tickets`, ticket));
      }
      await this.refreshTickets();
      return true;
    } catch (error) {
      console.error('Error saving ticket:', error);
      return false;
    }
  }

  async deleteTicket(id: string): Promise<boolean> {
    try {
      await firstValueFrom(this.http.delete(`${this.apiUrl}/tickets/${id}`));
      await this.refreshTickets();
      return true;
    } catch (error) {
      console.error('Error deleting ticket:', error);
      return false;
    }
  }

  exportTickets() {
    const list = this.ticketsSignal();
    if (list.length === 0) return;

    const headers = Object.keys(list[0]).join(',');
    const rows = list.map(t =>
      Object.values(t).map(value =>
        typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
      ).join(',')
    );

    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `tickets_export_${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Computed Stats for Dashboard
  public stats = computed(() => {
    return {
      total: this.totalItems(),
      pendiente: this.ticketsSignal().filter(item => item.Estado === 'Pendiente' || item.Estado === 'Open').length,
      enProceso: this.ticketsSignal().filter(item => item.Estado === 'En Proceso' || item.Estado === 'In Process').length,
      finalizado: this.ticketsSignal().filter(item => item.Estado === 'Finalizado' || item.Estado === 'Closed').length
    };
  });

  // Actions
  getTicketById(id: string): Ticket | undefined {
    return this.ticketsSignal().find(item => item.Ticket === id || item.id === id);
  }

  searchTickets(query: string) {
    this.searchQuery.set(query);
    this.currentPage.set(1); // Reset on search
    this.refreshTickets();
  }

  // Advanced Table Methods
  toggleColumn(key: string) {
    const current = this.visibleColumns();
    if (current.includes(key)) {
      this.visibleColumns.set(current.filter(k => k !== key));
    } else {
      this.visibleColumns.set([...current, key]);
    }
  }

  setColumnFilter(key: string, value: string) {
    this.columnFilters.update(filters => ({
      ...filters,
      [key]: value
    }));
    this.currentPage.set(1);
    this.refreshTickets();
  }

  clearAllFilters() {
    this.columnFilters.set({});
    this.searchQuery.set('');
    this.currentPage.set(1);
    this.refreshTickets();
  }

  resetFilters() {
    this.searchQuery.set('');
    this.columnFilters.set({});
    this.currentPage.set(1);
    this.refreshTickets();
  }

  // Cancellation Methods
  async getCancellationReasons(): Promise<{ id: string, name: string }[]> {
    try {
      return await firstValueFrom(this.http.get<{ id: string, name: string }[]>(`${this.apiUrl}/cancellation-reasons`));
    } catch (e) {
      console.error('Error fetching cancellation reasons', e);
      return [];
    }
  }
}