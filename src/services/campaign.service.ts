import { Injectable, signal } from '@angular/core';
import { Campaign } from '../types';
import { MOCK_CAMPAIGNS } from '../data/mock-data';

@Injectable({
  providedIn: 'root',
})
export class CampaignService {
  private campaignsSignal = signal<Campaign[]>(MOCK_CAMPAIGNS);

  private async simulate<T>(callback: () => T, delay = 200): Promise<T> {
    return new Promise<T>(resolve => setTimeout(() => resolve(callback()), delay));
  }

  getCampaigns(): Promise<Campaign[]> {
    return this.simulate(() => [...this.campaignsSignal()]);
  }

  getCampaign(id: string): Promise<Campaign | undefined> {
    return this.simulate(() => this.campaignsSignal().find(c => c.id === id));
  }

  addCampaign(campaign: Campaign): Promise<Campaign> {
    return this.simulate(() => {
      const newCampaign = { ...campaign, id: `cmp_${Date.now()}` };
      this.campaignsSignal.update(campaigns => [newCampaign, ...campaigns]);
      return newCampaign;
    });
  }

  updateCampaign(campaign: Campaign): Promise<void> {
    return this.simulate(() => {
      this.campaignsSignal.update(campaigns =>
        campaigns.map(c => c.id === campaign.id ? { ...c, ...campaign } : c)
      );
    });
  }

  deleteCampaign(campaignName: string): Promise<void> {
    return this.simulate(() => {
      this.campaignsSignal.update(campaigns =>
        campaigns.filter(c => c.name !== campaignName)
      );
    });
  }
}
