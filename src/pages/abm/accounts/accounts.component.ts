import { ChangeDetectionStrategy, Component, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Account } from '../../../types';
import { AccountService } from '../../../services/account.service';
import { AddAccountModalComponent } from './add-account-modal.component';

@Component({
  selector: 'app-accounts',
  imports: [CommonModule, RouterModule, AddAccountModalComponent],
  templateUrl: './accounts.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountsComponent {
  private accountService = inject(AccountService);
  
  readonly accounts = signal<Account[]>([]);
  readonly isLoading = signal(true);
  readonly isModalOpen = signal(false);

  constructor() {
    this.loadAccounts();
  }
  
  async loadAccounts() {
    this.isLoading.set(true);
    const data = await this.accountService.getAccounts();
    this.accounts.set(data);
    this.isLoading.set(false);
  }
  
  async handleSaveAccount(accountData: Omit<Account, 'id' | 'score' | 'intent'>) {
    await this.accountService.addAccount(accountData);
    this.isModalOpen.set(false);
    this.loadAccounts();
  }

  getTierClass(tier: 'T1' | 'T2' | 'T3'): string {
    switch (tier) {
      case 'T1': return 'bg-blue-100 text-blue-800';
      case 'T2': return 'bg-purple-100 text-purple-800';
      case 'T3': return 'bg-gray-200 text-gray-800';
    }
  }
}