import { Component, Input, signal, computed, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ViewDefinition, EntityDefinition, TableConfig } from '../../../core/schema/view-definitions';
import { TranslatePipe } from '../../../../pipes/translate.pipe';

@Component({
    selector: 'app-generic-table',
    standalone: true,
    imports: [CommonModule, TranslatePipe],
    template: `
    <div class="flexflex-col h-full bg-slate-50">
      <!-- Toolbar -->
      <div class="px-6 py-4 bg-white border-b border-slate-200 flex justify-between items-center sticky top-0 z-10">
        <h2 class="text-xl font-bold text-slate-800 tracking-tight">{{ view.name }}</h2>
        
        <div class="flex gap-3">
            <!-- Search -->
            <div class="relative">
                <input 
                    type="text" 
                    [placeholder]="'SEARCH' | translate"
                    (input)="onSearch($event)"
                    class="pl-9 pr-4 py-2 bg-slate-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-red-500 w-64 transition-all"
                >
                <svg class="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            </div>

            <!-- Actions -->
            @for (action of view.actions; track action.id) {
                @if (action.type === 'create') {
                    <button 
                        (click)="handleAction(action)"
                        class="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors shadow-sm shadow-red-200"
                    >
                        <i [class]="action.icon"></i>
                        <span>{{ action.label }}</span>
                    </button>
                }
            }
        </div>
      </div>

      <!-- Table Container -->
      <div class="flex-1 overflow-auto custom-scroll p-6">
        <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table class="w-full text-left border-collapse">
                <thead>
                    <tr class="bg-slate-50 border-b border-slate-200">
                        @for (col of displayColumns(); track col) {
                            <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors min-w-[120px]" (click)="sort(col)">
                                <div class="flex items-center gap-2">
                                    {{ getLabel(col) }}
                                    @if (sortCol() === col) {
                                        <span class="text-red-500">{{ sortDir() === 'asc' ? '↑' : '↓' }}</span>
                                    }
                                </div>
                            </th>
                        }
                        <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right w-24 sticky right-0 bg-slate-50 z-10 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.1)]">
                            {{ 'ACTIONS' | translate }}
                        </th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                    @for (item of pagedData(); track item[entity.idField]) {
                        <tr class="hover:bg-slate-50 transition-colors group">
                            @for (col of displayColumns(); track col) {
                                <td class="px-6 py-4 text-sm text-slate-700 whitespace-normal break-words align-middle">
                                    {{ formatValue(item[col], col) }}
                                </td>
                            }
                            <td class="px-6 py-4 text-right sticky right-0 bg-white group-hover:bg-slate-50 z-10 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.1)] align-middle">
                                <div class="flex justify-end gap-1">
                                    @for (action of view.actions; track action.id) {
                                        @if (action.type !== 'create') {
                                            <button 
                                                (click)="handleAction(action, item)"
                                                class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                [title]="action.label"
                                            >
                                                <i [class]="action.icon"></i>
                                            </button>
                                        }
                                    }
                                </div>
                            </td>
                        </tr>
                    }
                    @if (pagedData().length === 0) {
                        <tr>
                            <td [attr.colspan]="displayColumns().length + 1" class="px-6 py-8 text-center text-slate-500">
                                {{ 'NO_RECORDS' | translate }}
                            </td>
                        </tr>
                    }
                </tbody>
            </table>
        </div>
      </div>

      <!-- Footer / Pagination -->
      <div class="px-6 py-4 bg-white border-t border-slate-200 flex justify-between items-center text-sm text-slate-500 sticky bottom-0 z-10">
        <span>Mostrando {{ (currentPage() - 1) * pageSize() + 1 }} - {{ (currentPage() * pageSize()) > filteredData().length ? filteredData().length : (currentPage() * pageSize()) }} de {{ filteredData().length }} registros</span>
        
        <div class="flex items-center gap-2">
            <button 
                [disabled]="currentPage() === 1"
                (click)="prevPage()"
                class="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                <i class="fas fa-chevron-left"></i>
            </button>
            <span class="font-medium text-slate-700">Página {{ currentPage() }} de {{ totalPages() || 1 }}</span>
            <button 
                [disabled]="currentPage() >= totalPages()"
                (click)="nextPage()"
                class="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                <i class="fas fa-chevron-right"></i>
            </button>
        </div>
      </div>
    </div>
  `,
    styles: []
})
export class GenericTableComponent {
    @Input({ required: true }) view!: ViewDefinition;
    @Input({ required: true }) entity!: EntityDefinition;
    @Input({ required: true }) data: any[] = [];
    @Output() actionTriggered = new EventEmitter<{ action: any, item?: any }>();

    // Pagination State
    currentPage = signal(1);
    pageSize = signal(10);
    totalPages = computed(() => Math.ceil(this.filteredData().length / this.pageSize()));

    // Computed Data (Sorted & Filtered)
    filteredData = computed(() => {
        let result = [...this.data];
        const q = this.searchQuery().toLowerCase();

        // Search
        if (q) {
            result = result.filter(item =>
                Object.values(item).some(val => String(val).toLowerCase().includes(q))
            );
        }

        // Sort
        const col = this.sortCol();
        if (col) {
            result.sort((a, b) => {
                const valA = a[col];
                const valB = b[col];
                if (valA < valB) return this.sortDir() === 'asc' ? -1 : 1;
                if (valA > valB) return this.sortDir() === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return result;
    });

    // Paged Data (Slice of Filtered)
    pagedData = computed(() => {
        const start = (this.currentPage() - 1) * this.pageSize();
        const end = start + this.pageSize();
        return this.filteredData().slice(start, end);
    });

    getLabel(key: string): string {
        return this.entity.fields.find(f => f.key === key)?.label || key;
    }

    formatValue(value: any, key: string): string {
        if (typeof value === 'boolean') {
            return value ? 'Sí' : 'No';
        }
        return value;
    }

    onSearch(event: Event) {
        this.searchQuery.set((event.target as HTMLInputElement).value);
        this.currentPage.set(1); // Reset to first page on search
    }

    sort(col: string) {
        if (this.sortCol() === col) {
            this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
        } else {
            this.sortCol.set(col);
            this.sortDir.set('asc');
        }
    }

    handleAction(action: any, item?: any) {
        this.actionTriggered.emit({ action, item });
    }

    // Pagination Methods
    nextPage() {
        if (this.currentPage() < this.totalPages()) {
            this.currentPage.update(p => p + 1);
        }
    }

    prevPage() {
        if (this.currentPage() > 1) {
            this.currentPage.update(p => p - 1);
        }
    }
}
