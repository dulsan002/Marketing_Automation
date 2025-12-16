import { ChangeDetectionStrategy, Component, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AccountService } from '../../../services/account.service';
import { Account360, CommitteeRole, InfluenceLevel } from '../../../types';

@Component({
  selector: 'app-account-360',
  imports: [CommonModule],
  templateUrl: './account-360.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Account360Component {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private accountService = inject(AccountService);

  readonly account = signal<Account360 | null>(null);
  readonly isLoading = signal(true);
  readonly activeTab = signal<'overview' | 'committee' | 'activities'>('overview');

  constructor() {
    this.loadAccountData();
  }

  async loadAccountData() {
    this.isLoading.set(true);
    const accountId = this.route.snapshot.paramMap.get('id');
    if (!accountId) {
      this.router.navigate(['/abm/accounts']);
      return;
    }
    const data = await this.accountService.getAccount360(accountId);
    if (!data) {
      this.router.navigate(['/abm/accounts']);
      return;
    }
    this.account.set(data);
    this.isLoading.set(false);
  }

  setTab(tab: 'overview' | 'committee' | 'activities') {
    this.activeTab.set(tab);
  }

  goBack() {
    this.router.navigate(['/abm/accounts']);
  }
  
  getTierClass(tier: 'T1' | 'T2' | 'T3'): string {
    switch (tier) {
      case 'T1': return 'bg-blue-100 text-blue-800';
      case 'T2': return 'bg-purple-100 text-purple-800';
      case 'T3': return 'bg-gray-200 text-gray-800';
    }
  }

  getRoleClass(role: CommitteeRole): string {
    const base = 'px-2 py-0.5 text-xs font-semibold rounded-full';
    switch (role) {
      case 'Decision Maker': return `${base} bg-blue-100 text-blue-800`;
      case 'Influencer': return `${base} bg-purple-100 text-purple-800`;
      case 'Champion': return `${base} bg-green-100 text-green-800`;
      case 'End-User': return `${base} bg-sky-100 text-sky-800`;
    }
  }

  getInfluenceClass(level: InfluenceLevel): string {
    switch (level) {
      case 'High': return 'text-green-600';
      case 'Medium': return 'text-yellow-600';
      case 'Low': return 'text-red-600';
    }
  }
}