import { ChangeDetectionStrategy, Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Campaign } from '../../../types';
import { CampaignDetailModalComponent } from './campaign-detail-modal.component';
import { CampaignService } from '../../../services/campaign.service';

/**
 * Manages the display and interaction of the main campaigns list.
 * This component is responsible for fetching and displaying a table of marketing campaigns,
 * handling user actions like viewing, editing, and deleting, and managing the state
 * for the campaign detail modal.
 */
@Component({
  selector: 'app-campaigns',
  imports: [CommonModule, RouterModule, CampaignDetailModalComponent],
  templateUrl: './campaigns.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CampaignsComponent {
  private campaignService = inject(CampaignService);

  /** A read-only signal holding the list of all marketing campaigns. */
  readonly campaigns = this.campaignService.getCampaigns();
  /** Manages which campaign's action dropdown is currently visible. Null if none are open. */
  readonly activeDropdown = signal<string | null>(null);
  /** Holds the campaign data for the currently selected campaign to be shown in the detail modal. */
  readonly selectedCampaign = signal<Campaign | null>(null);

  /**
   * Determines the Tailwind CSS classes for a campaign's status badge.
   * This provides a consistent visual representation of the campaign status.
   * @param status The status of the campaign.
   * @returns A string of CSS classes.
   */
  getStatusClass(status: Campaign['status']): string {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  /**
   * Toggles the visibility of the action dropdown menu for a specific campaign.
   * @param campaignName The name of the campaign whose dropdown should be toggled.
   */
  toggleDropdown(campaignName: string): void {
    this.activeDropdown.update(current => current === campaignName ? null : campaignName);
  }

  /**
   * Sets the selected campaign to be displayed in the detail modal.
   * @param campaign The campaign object to view.
   */
  viewCampaign(campaign: Campaign): void {
    this.selectedCampaign.set(campaign);
    this.activeDropdown.set(null); // Close dropdown
  }

  /**
   * Handles the logic for editing a campaign. Currently logs to the console.
   * In a real application, this would navigate to an edit route.
   * @param campaign The campaign object to edit.
   */
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

  /**
   * Deletes a campaign from the list via the campaign service.
   * @param campaignNameToDelete The name of the campaign to delete.
   */
  deleteCampaign(campaignNameToDelete: string): void {
    this.campaignService.deleteCampaign(campaignNameToDelete);
    this.activeDropdown.set(null); // Close dropdown
  }

  /**
   * Closes the campaign detail modal by resetting the selected campaign signal.
   */
  closeModal(): void {
    this.selectedCampaign.set(null);
  }
}
