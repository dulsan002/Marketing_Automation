import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Account, IntentSignal, BuyingCommittee, AccountAnalytics, Account360, BuyingCommitteeMember } from '../types';
import { MOCK_INTENT_SIGNALS, MOCK_BUYING_COMMITTEES, MOCK_ACCOUNT_ANALYTICS, MOCK_ACCOUNT_360_DATA } from '../data/abm-mock-data';
import { firstValueFrom } from 'rxjs';

// Helper for deep cloning
function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3001/api/abm/accounts';

  private accounts = signal<Account[]>([]); // Start empty, load from API
  private intentSignals = signal<IntentSignal[]>(MOCK_INTENT_SIGNALS);
  private buyingCommittees = signal<BuyingCommittee[]>(MOCK_BUYING_COMMITTEES);
  private analytics = signal<AccountAnalytics>(MOCK_ACCOUNT_ANALYTICS);
  private accounts360 = signal<Account360[]>(MOCK_ACCOUNT_360_DATA);

  private async simulate<T>(callback: () => T, delay = 200): Promise<T> {
    return new Promise<T>(resolve => setTimeout(() => {
      resolve(callback());
    }, delay));
  }

  async getAccounts(): Promise<Account[]> {
    try {
      const res = await firstValueFrom(this.http.get<{ status: string, data: any[] }>(this.apiUrl));

      console.log(`✅ AccountService: Fetched ${res.data.length} accounts from API`);

      return res.data.map((d: any): Account => ({
        id: d.id,
        name: d.name,
        domain: d.domain,
        industry: d.industry,
        size: d.employees ? `${d.employees} employees` : 'Unknown', // Map INT to String
        region: d.region || 'Unknown', // GAP: Missing in Backend
        country: 'USA', // GAP: Missing in Backend
        owner: d.owner || 'Unassigned', // GAP: Missing in Backend

        employees: d.employees || 0,
        revenue: d.revenue ? Number(d.revenue) : 0,

        // Fix Mapping: Backend 'Tier 1' -> Frontend 'T1'
        tier: (d.tier === 'Tier 1' ? 'T1' : d.tier === 'Tier 2' ? 'T2' : 'T3') as any,

        score: d.score || 0,
        intent: d.intentScore || 0, // Backend intentScore
        status: d.status || 'Active', // Backend might not have status? It does have timestamps.

        nextAction: d.nextAction || 'None', // GAP
        updated: d.updatedAt
      }));
    } catch (e) {
      console.warn('ABM API unavailable', e);
      return [];
    }
  }





  async getAnalytics(): Promise<AccountAnalytics> {
    try {
      const res = await firstValueFrom(this.http.get<{ status: string, data: any }>(`${this.apiUrl}/analytics`));

      // Map API response to AccountAnalytics interface
      // API returns: { accountTiers, pipelineValue, activeAccounts, topAccounts }
      // Types match mostly, but ensure mapping is safe.
      const d = res.data;
      return {
        totalAccounts: d.activeAccounts || 0,
        activeAccounts: d.activeAccounts || 0,
        t1Accounts: (d.accountTiers || []).find((t: any) => t.tier === 'T1')?.count || 0,
        avgIntentScore: d.avgIntentScore || 0,
        intentSignals: d.intentSignals || 0,
        signalsBySource: d.signalsBySource || [],
        pipelineValue: d.pipelineValue || 0,
        accountTiers: d.accountTiers || [],
        topAccounts: (d.topAccounts || []).map((a: any) => ({
          id: a.id,
          name: a.name,
          score: a.score || 0,
          change: a.change || 0,
          tier: a.tier
        }))
      };
    } catch (e) {
      console.warn('ABM Analytics API unavailable, falling back to mock or empty', e);
      // Fallback to empty structure to prevent UI crash, or throw if preferred.
      // Returning empty structure for resilience.
      return {
        totalAccounts: 0,
        activeAccounts: 0,
        t1Accounts: 0,
        avgIntentScore: 0,
        intentSignals: 0,
        signalsBySource: [],
        pipelineValue: 0,
        accountTiers: [],
        topAccounts: []
      };
    }
  }

  async getAccount360(id: string): Promise<Account360 | undefined> {
    try {
      const res = await firstValueFrom(this.http.get<{ status: string, data: any }>(`${this.apiUrl}/${id}`));
      const acc = res.data;

      // Map Buying Committee (Contacts)
      const buyingCommittee: BuyingCommitteeMember[] = (acc.Contacts || []).map((c: any) => ({
        id: c.id,
        name: `${c.firstName} ${c.lastName}`,
        email: c.email,
        title: c.tags?.[0] || 'Unknown Title', // Use first tag as title
        role: 'Influencer', // Default role for now (or c.tags?.[0])
        influence: (c.score > 75 ? 'High' : c.score > 40 ? 'Medium' : 'Low') as any
      }));

      // Map Intent Signals to Recent Activities
      const recentActivities = (acc.IntentSignals || []).map((s: any) => ({
        date: s.occurredAt,
        type: s.source,
        description: s.signalType,
        contact: 'System' // Signal is account-level usually
      }));

      return {
        id: acc.id,
        name: acc.name,
        domain: acc.domain,
        industry: acc.industry,
        employees: acc.employees,
        revenue: Number(acc.revenue),
        tier: (acc.tier === 'Tier 1' ? 'T1' : acc.tier === 'Tier 2' ? 'T2' : 'T3') as any,
        score: acc.score || 0,
        intent: acc.intentScore || 0,
        country: acc.country || 'USA',

        status: 'Active',
        nextAction: 'None',
        updated: acc.updatedAt,

        // Mapped Details
        buyingCommittee,
        recentActivities,

        // Mocked Complex Analytics (Backend doesn't compute these yet)
        intentScoreTrend: [
          { date: 'Jan', score: 20 },
          { date: 'Feb', score: 40 },
          { date: 'Mar', score: acc.intentScore || 50 }
        ],
        engagementSummary: [
          { metric: 'Signals', value: (acc.IntentSignals || []).length, change: 10 }
        ]
      };
    } catch (e) {
      console.error('Failed to load Account 360', e);
      return undefined;
    }
  }

  // Fetch Intent Signals for the specific account (or all? User view implies filtered by account usually)
  // If the user means the global "Intent Signals" page, we need a new API endpoint.
  // Using the mocked list for global view for now, effectively verifying "In Account View".
  async getIntentSignals(): Promise<IntentSignal[]> {
    try {
      const res = await firstValueFrom(this.http.get<{ status: string, data: any[] }>(`${this.apiUrl}/intent-signals`));
      return res.data.map((d: any) => ({
        accountId: d.accountId,
        accountName: d.accountName || d.Account?.name || 'Unknown',
        solutionCategory: 'N/A', // GAP: Missing in Backend
        score: d.weight,
        trend: 'Stable', // GAP
        sources: [d.source] as any
      }));
    } catch (e) {
      console.error('Failed to load intent signals', e);
      return [];
    }
  }

  async addAccount(accountData: Omit<Account, 'id' | 'score' | 'intent'>): Promise<Account> {
    const payload = {
      name: accountData.name,
      domain: accountData.domain,
      industry: accountData.industry,
      tier: accountData.tier,
      employees: accountData.employees,
      revenue: accountData.revenue,
      intentSources: accountData.intentSources || []
    };

    const res = await firstValueFrom(this.http.post<{ status: string, data: any }>(this.apiUrl, payload));
    const d = res.data;

    return {
      id: d.id,
      name: d.name,
      domain: d.domain,
      industry: d.industry,
      size: d.employees ? `${d.employees} employees` : 'Unknown',
      region: 'Unknown',
      country: 'USA',
      owner: 'Unassigned',
      employees: d.employees || 0,
      revenue: d.revenue ? Number(d.revenue) : 0,
      tier: d.tier,
      score: d.score || 0,
      intent: 0,
      status: 'Active',
      nextAction: 'None',
      updated: d.updatedAt
    };
  }

  async getBuyingCommittees(): Promise<BuyingCommittee[]> {
    try {
      const res = await firstValueFrom(this.http.get<{ status: string, data: BuyingCommittee[] }>(`${this.apiUrl}/buying-committees`));
      // Map to BuyingCommittee shape
      return res.data.map((committee: any) => ({
        ...committee,
        members: committee.members.map((m: any) => ({
          id: m.id,
          name: m.name,
          email: m.email,
          title: m.title,
          role: m.role,
          // Calculate Influence from Score
          influence: (m.score > 75 ? 'High' : m.score > 40 ? 'Medium' : 'Low') as any
        }))
      }));
    } catch (e) {
      console.error('Failed to load buying committees', e);
      return [];
    }
  }

  async addCommitteeMember(accountId: string, memberData: Omit<BuyingCommitteeMember, 'id'>): Promise<BuyingCommitteeMember> {
    try {
      const res = await firstValueFrom(this.http.post<{ status: string, data: any }>(
        `${this.apiUrl}/${accountId}/members`,
        memberData
      ));

      const c = res.data;
      return {
        id: c.id,
        name: `${c.firstName} ${c.lastName}`,
        email: c.email,
        title: c.title,
        role: (c.tags?.[0] || 'Influencer') as any,
        influence: (c.score > 75 ? 'High' : c.score > 40 ? 'Medium' : 'Low') as any
      };
    } catch (e: any) {
      console.error('Failed to add member', e);
      if (e.error && e.error.message) {
        throw new Error(e.error.message);
      }
      throw e;
    }
  }

  async updateCommitteeMember(accountId: string, updatedMember: BuyingCommitteeMember): Promise<BuyingCommitteeMember> {
    try {
      // PUT /api/abm/accounts/:id/members/:memberId
      const res = await firstValueFrom(this.http.patch<{ status: string, data: any }>(
        `${this.apiUrl}/${accountId}/members/${updatedMember.id}`,
        { role: updatedMember.role } // Only sending role as requested
      ));
      const c = res.data;
      return {
        id: c.id,
        name: `${c.firstName} ${c.lastName}`,
        email: c.email,
        title: c.title,
        role: (c.tags?.[0] || 'Influencer') as any,
        influence: (c.score > 75 ? 'High' : c.score > 40 ? 'Medium' : 'Low') as any
      };
    } catch (e: any) {
      console.error('Failed to update member', e);
      throw e;
    }
  }

  async deleteCommitteeMember(accountId: string, memberId: string): Promise<void> {
    try {
      await firstValueFrom(this.http.delete(
        `${this.apiUrl}/${accountId}/members/${memberId}`
      ));

      // Update Local State if successful
      this.buyingCommittees.update(committees => {
        const committee = committees.find(c => c.accountId === accountId);
        if (committee) {
          // Creating new array for immutability triggering signals
          const updatedMembers = committee.members.filter(m => m.id !== memberId);
          const updatedCommittee = { ...committee, members: updatedMembers };

          return committees.map(c => c.accountId === accountId ? updatedCommittee : c);
        }
        return committees;
      });

    } catch (e) {
      console.error('Failed to delete member', e);
      throw e;
    }
  }
}