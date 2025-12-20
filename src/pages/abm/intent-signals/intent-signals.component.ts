import { ChangeDetectionStrategy, Component, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AccountService } from '../../../services/account.service';
import { IntentSignal, IntentTrend } from '../../../types';

@Component({
  selector: 'app-intent-signals',
  imports: [CommonModule],
  templateUrl: './intent-signals.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IntentSignalsComponent {
  private accountService = inject(AccountService);

  readonly signals = signal<IntentSignal[]>([]);
  readonly isLoading = signal(true);
  readonly trendFilter = signal<'All' | IntentTrend>('All');
  readonly searchTerm = signal('');

  constructor() {
    this.loadIntentSignals();
  }

  async loadIntentSignals() {
    this.isLoading.set(true);
    const data = await this.accountService.getIntentSignals();
    this.signals.set(data);
    this.isLoading.set(false);
  }

  readonly filteredSignals = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const trend = this.trendFilter();
    return this.signals().filter(s => {
      const nameMatch = s.accountName.toLowerCase().includes(term);
      const trendMatch = trend === 'All' || s.trend === trend;
      return nameMatch && trendMatch;
    });
  });

  onSearch(event: Event) {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  setFilter(filter: 'All' | IntentTrend) {
    this.trendFilter.set(filter);
  }

  getTrendClass(trend: IntentTrend): string {
    const base = 'flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border';
    switch (trend) {
      case 'Rising': return `${base} bg-emerald-50 text-emerald-700 border-emerald-100 ring-1 ring-emerald-600/10`;
      case 'Declining': return `${base} bg-rose-50 text-rose-700 border-rose-100 ring-1 ring-rose-600/10`;
      case 'Stable': return `${base} bg-slate-50 text-slate-600 border-slate-100 ring-1 ring-slate-600/10`;
      default: return `${base} bg-gray-50 text-gray-600 border-gray-100`;
    }
  }

  getSourceClass(source: string): string {
    const base = 'px-2 py-0.5 text-xs font-medium rounded-full';
    switch (source) {
      case 'Bombora': return `${base} bg-orange-100 text-orange-800`;
      case 'G2': return `${base} bg-red-100 text-red-800`;
      case 'TrustRadius': return `${base} bg-blue-100 text-blue-800`;
      case 'LinkedIn': return `${base} bg-sky-100 text-sky-800`;
      case 'Website': return `${base} bg-indigo-100 text-indigo-800`;
      default: return `${base} bg-gray-100 text-gray-800`;
    }
  }
}