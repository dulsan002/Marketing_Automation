import { ChangeDetectionStrategy, Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Campaign } from '../../../types';
import { CampaignDetailModalComponent } from './campaign-detail-modal.component';
import { CampaignService } from '../../../services/campaign.service';

@Component({
  selector: 'app-campaigns',
  imports: [CommonModule, RouterModule, CampaignDetailModalComponent],
  templateUrl: './campaigns.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CampaignsComponent {
  private campaignService = inject(CampaignService);

  readonly campaigns = this.campaignService.getCampaigns();
  readonly activeDropdown = signal<string | null>(null);
  readonly selectedCampaign = signal<Campaign | null>(null);

  getStatusClass(status: Campaign['status']): string {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  toggleDropdown(campaignName: string): void {
    this.activeDropdown.update(current => current === campaignName ? null : campaignName);
  }

  viewCampaign(campaign: Campaign): void {
    this.selectedCampaign.set(campaign);
    this.activeDropdown.set(null); // Close dropdown
  }

  editCampaign(campaign: Campaign): void {
    if (campaign.status === 'active' || campaign.status === 'completed') {
      console.log('Cannot edit active or completed campaigns.');
      this.activeDropdown.set(null);
      return;
    }
    console.log('Editing campaign:', campaign);
    // In a real app, you would navigate to an edit route, e.g.:
    // this.router.navigate(['/map/campaigns', campaign.id, 'edit']);
    this.activeDropdown.set(null); // Close dropdown
  }

  deleteCampaign(campaignNameToDelete: string): void {
    this.campaignService.deleteCampaign(campaignNameToDelete);
    this.activeDropdown.set(null); // Close dropdown
  }

  closeModal(): void {
    this.selectedCampaign.set(null);
  }
}
