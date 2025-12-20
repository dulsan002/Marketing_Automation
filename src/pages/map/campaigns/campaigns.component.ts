import { ChangeDetectionStrategy, Component, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Campaign } from '../../../types';
import { CampaignDetailModalComponent } from './campaign-detail-modal.component';
import { CampaignService } from '../../../services/campaign.service';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

/**
 * Manages the display and interaction of the main campaigns list.
 * This component is responsible for fetching and displaying a table of marketing campaigns,
 * handling user actions like viewing, editing, and deleting, and managing the state
 * for the campaign detail modal.
 */
@Component({
  selector: 'app-campaigns',
  imports: [CommonModule, RouterModule, CampaignDetailModalComponent, MatButtonModule, MatIconModule],
  templateUrl: './campaigns.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CampaignsComponent {
  private campaignService = inject(CampaignService);
  private router = inject(Router);

  /** A signal holding the list of all marketing campaigns. */
  readonly campaigns = signal<Campaign[]>([]);

  /** Manages which campaign's action dropdown is currently visible. Null if none are open. */
  readonly activeDropdown = signal<string | null>(null);
  /** Holds the campaign data for the currently selected campaign to be shown in the detail modal. */
  readonly selectedCampaign = signal<Campaign | null>(null);

  // Search and Filter signals
  readonly searchTerm = signal('');
  readonly statusFilter = signal<Campaign['status'] | 'all'>('all');

  readonly filteredCampaigns = computed(() => {
    const campaigns = this.campaigns();
    const term = this.searchTerm().toLowerCase();
    const status = this.statusFilter();

    return campaigns.filter(campaign => {
      const matchesSearch = campaign.name.toLowerCase().includes(term);
      const matchesStatus = status === 'all' || campaign.status === status;
      return matchesSearch && matchesStatus;
    });
  });

  constructor() {
    this.loadData();
  }

  private loadData() {
    this.campaignService.getCampaigns().then(data => this.campaigns.set(data));
  }

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
      case 'scheduled': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  /**
   * Toggles the visibility of the action dropdown menu for a specific campaign.
   * @param campaignId The id of the campaign whose dropdown should be toggled.
   */
  toggleDropdown(campaignId: string | undefined): void {
    if (!campaignId) return;
    this.activeDropdown.update(current => current === campaignId ? null : campaignId);
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
    // Navigate to edit route
    if (!campaign.id) return;
    this.router.navigate(['/map/campaigns', campaign.id]);
    this.activeDropdown.set(null);
  }

  /**
   * Deletes a campaign from the list via the campaign service.
   * @param campaignId The id of the campaign to delete.
   */
  async deleteCampaign(campaignId: string | undefined): Promise<void> {
    if (!campaignId) return;
    await this.campaignService.deleteCampaign(campaignId);
    this.loadData(); // Reload list
    this.activeDropdown.set(null); // Close dropdown
  }

  /**
   * Toggles the status of a campaign between active and paused, or reactivates completed ones.
   * @param campaign The campaign to update.
   */
  /**
   * Updates the status of a campaign.
   * @param campaign The campaign to update.
   * @param status The new status to set.
   */
  async updateStatus(campaign: Campaign, status: Campaign['status']): Promise<void> {
    const updated = { ...campaign, status };
    await this.campaignService.updateCampaign(updated);
    this.loadData();
    this.activeDropdown.set(null);
  }

  /**
   * Closes the campaign detail modal by resetting the selected campaign signal.
   */
  closeModal(): void {
    this.selectedCampaign.set(null);
  }
}
