import { ChangeDetectionStrategy, Component, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AccountService } from '../../../services/account.service';
import { BuyingCommittee, BuyingCommitteeMember, CommitteeRole, InfluenceLevel, IntentSignal } from '../../../types';
import { AddEditMemberModalComponent } from './add-edit-member-modal.component';

@Component({
  selector: 'app-buying-committee',
  imports: [CommonModule, AddEditMemberModalComponent],
  templateUrl: './buying-committee.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BuyingCommitteeComponent {
  private accountService = inject(AccountService);

  readonly committees = signal<BuyingCommittee[]>([]);
  readonly signals = signal<IntentSignal[]>([]);
  readonly isLoading = signal(true);

  // Modal State
  readonly isModalOpen = signal(false);
  readonly editingMember = signal<BuyingCommitteeMember | null>(null);
  readonly selectedAccountId = signal<string | null>(null);

  constructor() {
    this.loadData();
  }

  async loadData() {
    this.isLoading.set(true);
    const [committeesData, signalsData] = await Promise.all([
      this.accountService.getBuyingCommittees(),
      this.accountService.getIntentSignals()
    ]);
    this.committees.set(committeesData);
    this.signals.set(signalsData);
    this.isLoading.set(false);
  }

  readonly searchQuery = signal('');

  readonly committeesWithCalculatedInfluence = computed(() => {
    const allSignals = this.signals();
    let allCommittees = this.committees();
    const query = this.searchQuery().toLowerCase();

    if (query) {
      allCommittees = allCommittees.filter(c => c.accountName.toLowerCase().includes(query));
    }

    if (!allSignals.length || !allCommittees.length) {
      return allCommittees.map(c => ({ ...c, members: c.members.map(m => ({ ...m, calculatedInfluence: m.influence })) }));
    }

    const scoresByAccount = new Map<string, { totalScore: number; count: number }>();
    for (const signal of allSignals) {
      // Signals might not have accountId directly if global, but our service maps it.
      // Assuming signal.accountId is present and valid.
      const existing = scoresByAccount.get(signal.accountId) || { totalScore: 0, count: 0 };
      existing.totalScore += signal.score;
      existing.count++;
      scoresByAccount.set(signal.accountId, existing);
    }

    const avgScoresByAccount = new Map<string, number>();
    for (const [accountId, data] of scoresByAccount.entries()) {
      avgScoresByAccount.set(accountId, data.totalScore / data.count);
    }

    return allCommittees.map(committee => ({
      ...committee,
      members: committee.members.map(member => {
        // Logic Adjustment:
        // Individual influence is primary.
        // We boost it if the account shows high intent (avgScore > 75).
        // e.g., if Influence is 'Low' but Intent is 'High', maybe we flag it?
        // Or for now, we just respect the individual influence as the truth,
        // effectively ignoring the "override" unless we want a "Dynamic Influence".
        // The previous logic completely overwrote it based on Account Score which was wrong.

        // Let's keep the original member influence as the calculated influence for now,
        // or effectively "boost" it?
        // Better: Return the member's influence, but maybe add a flag?
        // For this "fix", let's just use the MEMBER'S influence.
        return { ...member, calculatedInfluence: member.influence };
      })
    }));
  });


  openModal(accountId: string, member: BuyingCommitteeMember | null = null) {
    this.selectedAccountId.set(accountId);
    this.editingMember.set(member);
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.editingMember.set(null);
    this.selectedAccountId.set(null);
  }

  async handleSaveMember(member: BuyingCommitteeMember) {
    const accountId = this.selectedAccountId();
    if (!accountId) return;

    try {
      if (this.editingMember()) {
        await this.accountService.updateCommitteeMember(accountId, member);
      } else {
        await this.accountService.addCommitteeMember(accountId, member);
      }
      this.closeModal();
      this.loadData();
    } catch (e: any) {
      // Show cleaner error message
      const msg = e.error?.message || e.message || 'Unknown error';
      alert(`Error: ${msg}`);
    }
  }

  async deleteMember(accountId: string, memberId: string) {
    await this.accountService.deleteCommitteeMember(accountId, memberId);
    this.loadData();
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