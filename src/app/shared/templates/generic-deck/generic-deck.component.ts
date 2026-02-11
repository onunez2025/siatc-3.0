import { Component, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ViewDefinition, EntityDefinition, DeckConfig } from '../../../core/schema/view-definitions';
import { TranslatePipe } from '../../../../pipes/translate.pipe';

@Component({
    selector: 'app-generic-deck',
    standalone: true,
    imports: [CommonModule, TranslatePipe],
    template: `
    <div class="flex flex-col h-full bg-slate-50">
      <!-- Toolbar -->
      <div class="px-4 py-3 bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div class="flex justify-between items-center mb-2">
            <h2 class="text-lg font-bold text-slate-800">{{ view.name }}</h2>
            @for (action of view.actions; track action.id) {
                @if (action.type === 'create') {
                    <button 
                        (click)="handleAction(action)"
                        class="p-2 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 transition-all"
                    >
                        <i [class]="action.icon"></i>
                    </button>
                }
            }
        </div>
        
        <!-- Search -->
        <div class="relative">
            <input 
                type="text" 
                [placeholder]="'SEARCH' | translate"
                (input)="onSearch($event)"
                class="w-full pl-9 pr-4 py-2 bg-slate-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-red-500 transition-all"
            >
            <svg class="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        </div>
      </div>

      <!-- Deck List -->
      <div class="flex-1 overflow-y-auto p-4 space-y-3 custom-scroll">
        @for (item of filteredData(); track item[entity.idField]) {
            <div 
                (click)="handleAction({ type: 'navigate' }, item)"
                class="bg-white p-4 rounded-xl shadow-sm border border-slate-100 active:scale-[0.98] transition-transform flex gap-4"
            >
                <!-- Optional Image -->
                @if (config().imageField && item[config().imageField!]) {
                    <img [src]="item[config().imageField!]" class="w-16 h-16 rounded-lg object-cover bg-slate-100">
                } @else if (config().imageField) {
                    <div class="w-16 h-16 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                        <i class="fas fa-image"></i>
                    </div>
                }

                <!-- Content -->
                <div class="flex-1 min-w-0">
                    <h3 class="font-bold text-slate-900 truncate">{{ item[config().titleField] }}</h3>
                    <p class="text-sm text-slate-500 truncate">{{ item[config().subtitleField] }}</p>
                    
                    @if (config().statusField) {
                        <div class="mt-2 flex items-center gap-2">
                           <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">
                                {{ item[config().statusField!] }}
                           </span>
                        </div>
                    }
                </div>

                <!-- Action (Nav) -->
                <div class="flex items-center text-slate-300">
                    <i class="fas fa-chevron-right"></i>
                </div>
            </div>
        }
      </div>
    </div>
  `,
    styles: []
})
export class GenericDeckComponent {
    @Input({ required: true }) view!: ViewDefinition;
    @Input({ required: true }) entity!: EntityDefinition;
    @Input({ required: true }) data: any[] = [];
    @Output() actionTriggered = new EventEmitter<{ action: any, item?: any }>();

    searchQuery = signal('');

    config = computed(() => this.view.config as DeckConfig);

    filteredData = computed(() => {
        let result = [...this.data];
        const q = this.searchQuery().toLowerCase();

        if (q) {
            result = result.filter(item =>
                Object.values(item).some(val => String(val).toLowerCase().includes(q))
            );
        }
        return result;
    });

    onSearch(event: Event) {
        this.searchQuery.set((event.target as HTMLInputElement).value);
    }

    handleAction(action: any, item?: any) {
        this.actionTriggered.emit({ action, item });
    }
}
