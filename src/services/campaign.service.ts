import { Injectable, signal } from '@angular/core';
import { Campaign } from '../types';
import { MOCK_CAMPAIGNS } from '../data/mock-data';

@Injectable({
  providedIn: 'root',
})
export class CampaignService {
  private campaignsSignal = signal<Campaign[]>(MOCK_CAMPAIGNS);

  getCampaigns() {
    return this.campaignsSignal.asReadonly();
  }

  addCampaign(campaign: Campaign) {
    this.campaignsSignal.update(campaigns => [campaign, ...campaigns]);
  }

  deleteCampaign(campaignName: string) {
    this.campaignsSignal.update(campaigns => 
      campaigns.filter(c => c.name !== campaignName)
    );
  }
}
