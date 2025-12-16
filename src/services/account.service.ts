import { Injectable, signal } from '@angular/core';
import { Account, IntentSignal, BuyingCommittee, AccountAnalytics, Account360, BuyingCommitteeMember } from '../types';
import { MOCK_ACCOUNTS, MOCK_INTENT_SIGNALS, MOCK_BUYING_COMMITTEES, MOCK_ACCOUNT_ANALYTICS, MOCK_ACCOUNT_360_DATA } from '../data/abm-mock-data';

// Helper for deep cloning
function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private accounts = signal<Account[]>(MOCK_ACCOUNTS);
  private intentSignals = signal<IntentSignal[]>(MOCK_INTENT_SIGNALS);
  private buyingCommittees = signal<BuyingCommittee[]>(MOCK_BUYING_COMMITTEES);
  private analytics = signal<AccountAnalytics>(MOCK_ACCOUNT_ANALYTICS);
  private accounts360 = signal<Account360[]>(MOCK_ACCOUNT_360_DATA);

  private async simulate<T>(callback: () => T, delay = 200): Promise<T> {
    return new Promise<T>(resolve => setTimeout(() => {
      resolve(callback());
    }, delay));
  }

  getAccounts(): Promise<Account[]> {
    return this.simulate(() => deepClone(this.accounts()));
  }

  getIntentSignals(): Promise<IntentSignal[]> {
    return this.simulate(() => deepClone(this.intentSignals()));
  }

  getBuyingCommittees(): Promise<BuyingCommittee[]> {
    return this.simulate(() => deepClone(this.buyingCommittees()));
  }

  getAnalytics(): Promise<AccountAnalytics> {
    return this.simulate(() => deepClone(this.analytics()));
  }
  
  getAccount360(id: string): Promise<Account360 | undefined> {
     return this.simulate(() => deepClone(this.accounts360().find(a => a.id === id)));
  }

  addAccount(accountData: Omit<Account, 'id' | 'score' | 'intent'>): Promise<Account> {
    return this.simulate(() => {
      const newAccount: Account = {
        ...accountData,
        id: `acc_${Date.now()}`,
        score: Math.floor(Math.random() * 100),
        intent: Math.floor(Math.random() * 100),
      };
      this.accounts.update(accounts => [newAccount, ...accounts]);
      // Also add to the 360 data for consistency
      const newAccount360: Account360 = {
        ...newAccount,
        intentScoreTrend: [],
        engagementSummary: [],
        buyingCommittee: [],
        recentActivities: []
      };
      this.accounts360.update(data => [newAccount360, ...data]);
      return newAccount;
    });
  }

  addCommitteeMember(accountId: string, memberData: Omit<BuyingCommitteeMember, 'id'>): Promise<BuyingCommitteeMember> {
    return this.simulate(() => {
      const newMember: BuyingCommitteeMember = { ...memberData, id: `mem_${Date.now()}` };
      this.buyingCommittees.update(committees => {
        const committee = committees.find(c => c.accountId === accountId);
        if (committee) {
          committee.members.push(newMember);
        }
        return [...committees];
      });
      return newMember;
    });
  }

  updateCommitteeMember(accountId: string, updatedMember: BuyingCommitteeMember): Promise<BuyingCommitteeMember> {
    return this.simulate(() => {
      this.buyingCommittees.update(committees => {
        const committee = committees.find(c => c.accountId === accountId);
        if (committee) {
          const index = committee.members.findIndex(m => m.id === updatedMember.id);
          if (index !== -1) {
            committee.members[index] = updatedMember;
          }
        }
        return [...committees];
      });
      return updatedMember;
    });
  }

  deleteCommitteeMember(accountId: string, memberId: string): Promise<void> {
    return this.simulate(() => {
      this.buyingCommittees.update(committees => {
        const committee = committees.find(c => c.accountId === accountId);
        if (committee) {
          committee.members = committee.members.filter(m => m.id !== memberId);
        }
        return [...committees];
      });
    });
  }
}