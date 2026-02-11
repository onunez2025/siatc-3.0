import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../pipes/translate.pipe';

interface ChartData {
  name: string;
  value: number;
  color: string;
}

@Component({
  selector: 'app-dashboard-charts',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  template: `
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
      <!-- Status Donut Chart -->
      <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center">
        <h3 class="text-sm font-bold text-slate-800 uppercase tracking-wider mb-8 self-start flex items-center gap-2">
          <div class="w-1 h-4 bg-blue-500 rounded-full"></div>
          {{ 'STATUS_DISTRIBUTION' | translate }}
        </h3>
        
        <div class="relative w-64 h-64 flex items-center justify-center">
          <svg viewBox="0 0 100 100" class="w-full h-full transform -rotate-90">
            @for (segment of donutSegments(); track segment.name) {
              <circle
                cx="50" cy="50" r="40"
                fill="transparent"
                [attr.stroke]="segment.color"
                stroke-width="12"
                [attr.stroke-dasharray]="segment.dashArray"
                [attr.stroke-dashoffset]="segment.dashOffset"
                class="transition-all duration-1000 ease-out hover:stroke-[14px] cursor-pointer"
              >
                <title>{{ segment.name }}: {{ segment.value }}</title>
              </circle>
            }
          </svg>
          
          <div class="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span class="text-4xl font-black text-slate-900">{{ totalToday() }}</span>
            <span class="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{{ 'TOTAL' | translate }}</span>
          </div>
        </div>

        <div class="grid grid-cols-3 gap-4 mt-8 w-full border-t border-slate-50 pt-6">
          @for (item of statusData(); track item.name) {
            <div class="flex flex-col items-center">
              <div class="flex items-center gap-1.5 mb-1">
                <div class="w-2 h-2 rounded-full" [style.backgroundColor]="item.color"></div>
                <span class="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">{{ item.name | translate }}</span>
              </div>
              <span class="text-lg font-black text-slate-800">{{ item.value }}</span>
              <span class="text-[10px] text-slate-400 font-medium">{{ getPercentage(item.value) }}%</span>
            </div>
          }
        </div>
      </div>

      <!-- Service Type Bar Chart -->
      <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
        <h3 class="text-sm font-bold text-slate-800 uppercase tracking-wider mb-8 flex items-center gap-2">
          <div class="w-1 h-4 bg-emerald-500 rounded-full"></div>
          {{ 'TOP_SERVICE_TYPES' | translate }}
        </h3>

        <div class="flex-1 flex flex-col gap-6 justify-center">
          @if (typeData().length === 0) {
            <div class="flex flex-col items-center justify-center py-12 opacity-40">
              <div class="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-2">
                <svg class="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
              </div>
              <p class="text-sm font-medium">{{ 'NO_DATA_TODAY' | translate }}</p>
            </div>
          } @else {
            @for (item of typeData().slice(0, 5); track item.name) {
              <div class="group">
                <div class="flex justify-between items-center mb-1.5">
                  <span class="text-xs font-bold text-slate-700 truncate max-w-[80%]">{{ item.name }}</span>
                  <span class="text-xs font-black text-slate-900">{{ item.value }}</span>
                </div>
                <div class="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    class="h-full bg-blue-500 rounded-full transition-all duration-1000 ease-out group-hover:bg-blue-600 group-hover:shadow-[0_0_10px_rgba(59,130,246,0.3)]"
                    [style.width.%]="(item.value / maxTypeValue()) * 100"
                  ></div>
                </div>
              </div>
            }
          }
        </div>

        <div class="mt-8 pt-6 border-t border-slate-50 flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
          <span>{{ 'SERVICE_CATEGORY' | translate }}</span>
          <span>{{ 'COUNT' | translate }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes fade-in {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in {
      animation: fade-in 0.2s ease-out forwards;
    }
  `]
})
export class DashboardChartsComponent {
  stats = input.required<{
    total: number,
    ready: number,
    closed: number,
    other: number,
    statusDistribution: { name: string, value: number }[],
    byType: { name: string, value: number }[]
  }>();

  statusData = computed<ChartData[]>(() => {
    const dist = this.stats().statusDistribution || [];

    // Status colors mapping
    const colors: Record<string, string> = {
      'Ready to plan': '#F59E0B',
      'Closed': '#10B981',
      'Cancelled': '#EF4444',
      'Rechazado por service': '#DC2626',
      'Reprogramado': '#3B82F6'
    };

    const statusTranslationKeys: Record<string, string> = {
      'Ready to plan': 'STATUS_READY',
      'Closed': 'STATUS_CLOSED',
      'Cancelled': 'STATUS_CANCELLED',
      'Rechazado por service': 'STATUS_REJECTED',
      'Reprogramado': 'STATUS_REPROGRAMMED'
    };

    return dist.map(item => ({
      name: statusTranslationKeys[item.name] || item.name,
      value: item.value,
      color: colors[item.name] || '#94A3B8'
    }));
  });

  typeData = computed(() => this.stats().byType || []);

  totalToday = computed(() => this.stats().total || 0);

  maxTypeValue = computed(() => {
    const values = this.typeData().map(i => i.value);
    return values.length > 0 ? Math.max(...values) : 1;
  });

  donutSegments = computed(() => {
    const total = this.totalToday();
    if (total === 0) return [];

    let currentOffset = 0;
    const circumference = 2 * Math.PI * 40;

    return this.statusData().map(item => {
      const percentage = (item.value / total) * 100;
      const dashArray = `${(percentage * circumference) / 100} ${circumference}`;
      const segmentOffset = (currentOffset * circumference) / 100;

      currentOffset += percentage;

      return {
        ...item,
        dashArray,
        dashOffset: -segmentOffset
      };
    });
  });

  getPercentage(value: number): string {
    const total = this.totalToday();
    if (total === 0) return '0';
    return ((value / total) * 100).toFixed(0);
  }
}
