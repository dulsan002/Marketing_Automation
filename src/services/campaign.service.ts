import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Campaign } from '../types';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CampaignService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3001/api/campaigns';

  // We expose a signal, but we fetch manually.
  // Ideally, use RxJS resource or effect, but keeping it simple to match previous pattern.
  // Actually, previous pattern exposed a Promise. I will keep Promise signature to minimalize component changes.

  async getCampaigns(): Promise<Campaign[]> {
    const url = `${this.apiUrl}`;
    try {
      const response = await firstValueFrom(this.http.get<{ status: string, data: any[] }>(url));
      // Backend returns { status: 'success', data: [...] }
      // Backend data items include nested CampaignVersions.
      // We need to map backend DTO to Frontend Campaign Interface.

      return response.data.map((dto: any) => this.mapBackendToFrontend(dto));
    } catch (e) {
      console.error('API Error', e);
      return [];
    }
  }

  async getCampaign(id: string): Promise<Campaign | undefined> {
    const url = `${this.apiUrl}/${id}`;
    try {
      const response = await firstValueFrom(this.http.get<{ status: string, data: any }>(url));
      return this.mapBackendToFrontend(response.data);
    } catch (e) {
      console.error('API Error', e);
      return undefined;
    }
  }

  async addCampaign(campaign: Campaign): Promise<Campaign> {
    const url = `${this.apiUrl}`;
    const payload = this.mapFrontendToBackend(campaign);
    try {
      const response = await firstValueFrom(this.http.post<{ status: string, data: any }>(url, payload));
      return this.mapBackendToFrontend(response.data);
    } catch (e) {
      console.error('API Create Error', e);
      throw e;
    }
  }

  async updateCampaign(campaign: Campaign): Promise<void> {
    if (!campaign.id) return;
    const url = `${this.apiUrl}/${campaign.id}`;
    // Handle Status Updates (Activate/Pause) vs Content Updates
    // The Backend has a specific /activate endpoint but allow Status patch?
    // Backend controller `update` allows status change if Active. 
    // `activate` endpoint is for draft -> active with validation.
    // If frontend sets status='active', we should call `activate` endpoint if strictly required,
    // matches Backend `activateCampaign` logic which calls `validateContent`.
    // However, for simplicity here, I'll send PATCH first. If it fails with "invalid state", valid integration finding.

    // Wait, Frontend `updateStatus` calls `updateCampaign`.
    // If status is becoming 'active', I should hit `/activate`?
    // Let's check status change.

    const payload = this.mapFrontendToBackend(campaign);

    // NOTE: If status is present in payload, backend handles it.
    // But backend `activate` route does extra logic (locking).
    // Let's try standard PATCH. If it fails, the user will see error.

    try {
      await firstValueFrom(this.http.patch(url, payload));
    } catch (e) {
      // Fallback: If status is 'active' and patch failed, try activate endpoint?
      // Or just throw.
      console.error('API Update Error', e);
      throw e;
    }
  }

  async deleteCampaign(id: string): Promise<void> {
    // Note: Signature changed from name to id
    const url = `${this.apiUrl}/${id}/archive`; // Backend uses /archive for strict safety, or DELETE?
    // Routes: router.delete('/:id')? No.
    // Campaign Routes: router.post('/:id/archive')
    // Router does NOT have DELETE for campaign (safe only).
    // Wait, check campaign.routes.js again.
    // Line 14: router.post('/:id/archive', ...)
    // No router.delete.
    // So I must POST to archive.

    try {
      await firstValueFrom(this.http.post(`${url}`, {}));
    } catch (e) {
      console.error('API Delete Error', e);
      throw e;
    }
  }

  // --- MAPPERS ---

  private mapBackendToFrontend(dto: any): Campaign {
    // Backend DTO: { id, name, type, status, activeVersion, CampaignVersions: [ { content: {...}, metrics: {...} } ] }
    // OR getOne DTO: { id, name, ..., content: {...} } (merged by service)

    // If 'content' is top level (getOne result), use it.
    // If not, try to find active version in CampaignVersions array.

    let content = dto.content || {};
    let metrics = dto.metrics || { sent: 0, openRate: 0, ctr: 0 };

    if (!dto.content && dto.CampaignVersions && Array.isArray(dto.CampaignVersions)) {
      const active = dto.CampaignVersions.find((v: any) => v.version === dto.activeVersion)
        || dto.CampaignVersions[dto.CampaignVersions.length - 1]; // Fallback to last
      if (active) {
        content = active.content || {};
        metrics = active.metrics || metrics;
      }
    }

    return {
      id: dto.id,
      name: dto.name,
      type: dto.type,
      status: dto.status?.toLowerCase() || 'draft', // Ensure lowercase
      sent: metrics.sent || 0,
      openRate: metrics.openRate || 0,
      ctr: metrics.ctr || 0,

      // Content Mapping (Flatten)
      description: dto.description, // Metadata
      segmentId: dto.segmentId,

      // Email
      senderName: content.senderName,
      senderEmail: content.senderEmail,
      subject: content.subject,
      body: content.body,

      // SMS
      message: content.message,

      // Social
      platform: content.platform,
      text: content.text,
      imageUrl: content.imageUrl,

      // Schedule
      scheduleType: dto.schedule?.type,
      scheduleDate: dto.schedule?.date
    } as Campaign;
  }

  private mapFrontendToBackend(campaign: Campaign): any {
    // Create nested structure
    const content: any = {};

    if (campaign.type === 'Email') {
      content.senderName = campaign.senderName;
      content.senderEmail = campaign.senderEmail;
      content.subject = campaign.subject;
      content.body = campaign.body;
    } else if (campaign.type === 'SMS') {
      content.message = campaign.message;
    } else if (campaign.type === 'Social Post') {
      content.platform = campaign.platform;
      content.text = campaign.text;
    }

    return {
      name: campaign.name,
      type: campaign.type,
      status: campaign.status?.toUpperCase(), // Backend expects DRAFT/ACTIVE

      description: campaign.description,
      segmentId: campaign.segmentId,

      content: content,
    };
  }
}
