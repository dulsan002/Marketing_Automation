import { ChangeDetectionStrategy, Component, signal, computed, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MOCK_SEGMENTS } from '../../../data/mock-data';
import { WysiwygEditorComponent } from '../../../components/wysiwyg-editor/wysiwyg-editor.component';
import { CampaignService } from '../../../services/campaign.service';
import { AiService } from '../../../services/ai.service';
import { Campaign } from '../../../types';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

type CampaignType = 'Email' | 'SMS' | 'Social Post' | 'In-app' | 'Offline';
type ScheduleType = 'immediate' | 'later';

@Component({
  selector: 'app-new-campaign',
  imports: [CommonModule, ReactiveFormsModule, WysiwygEditorComponent],
  templateUrl: './new-campaign.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewCampaignComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private campaignService = inject(CampaignService);
  private aiService = inject(AiService);
  private destroyRef = inject(DestroyRef);

  readonly isGeneratingSubject = signal(false);
  readonly aiSubjectSuggestions = signal<string[]>([]);
  readonly prospectSegments = signal(MOCK_SEGMENTS);

  readonly currentStep = signal(1);

  // Edit Mode
  readonly campaignId = signal<string | null>(null);
  readonly isEditMode = computed(() => this.campaignId() !== null);
  readonly pageTitle = computed(() => this.isEditMode() ? 'Edit Campaign' : 'Create New Campaign');

  readonly steps = [
    { number: 1, name: 'Type' },
    { number: 2, name: 'Detail' },
    { number: 3, name: 'Editor' },
    { number: 4, name: 'Segment' },
    { number: 5, name: 'Schedule' },
    { number: 6, name: 'Review' },
  ];

  readonly campaignTypes = [
    { id: 'Email', title: 'Email Campaign', description: 'Send newsletters and promos', icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>' },
    { id: 'SMS', title: 'SMS Campaign', description: 'Text Message Alerts', icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>' },
    { id: 'Social Post', title: 'Social Post', description: 'LinkedIn and Facebook Post', icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12s-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"></path>' },
    { id: 'In-app', title: 'In-App-Message', description: 'Banner Inside the Application', icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path>' },
    { id: 'Offline', title: 'Offline Outreach', description: 'Direct mail', icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>' },
  ];

  readonly campaignType = signal<CampaignType | null>(null);

  // Forms
  readonly detailsForm = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    status: ['draft' as Campaign['status'], Validators.required]
  });
  readonly contentForm = this.fb.group({ senderName: ['', Validators.required], senderEmail: ['', [Validators.required, Validators.email]], subject: ['', Validators.required], body: ['<p>Start writing your amazing email content here!</p>', Validators.required] });
  readonly smsContentForm = this.fb.group({ message: ['', [Validators.required, Validators.maxLength(160)]] });
  readonly socialContentForm = this.fb.group({ platform: ['LinkedIn', Validators.required], text: ['', Validators.required], imageUrl: [''] });
  readonly inAppContentForm = this.fb.group({ headline: ['', Validators.required], body: ['', Validators.required] });
  readonly offlineContentForm = this.fb.group({ title: ['', Validators.required], details: ['', Validators.required] });
  readonly audienceForm = this.fb.group({ segmentId: ['', Validators.required] });
  readonly scheduleForm = this.fb.group({ type: ['immediate' as ScheduleType, Validators.required], date: [''], time: [''] });

  // Validity Signals
  private readonly detailsFormValid = signal(this.detailsForm.valid);
  private readonly contentFormValid = signal(this.contentForm.valid);
  private readonly smsContentFormValid = signal(this.smsContentForm.valid);
  private readonly socialContentFormValid = signal(this.socialContentForm.valid);
  private readonly inAppContentFormValid = signal(this.inAppContentForm.valid);
  private readonly offlineContentFormValid = signal(this.offlineContentForm.valid);
  private readonly audienceFormValid = signal(this.audienceForm.valid);
  private readonly scheduleFormValid = signal(this.scheduleForm.valid);

  readonly isCurrentStepValid = computed(() => {
    switch (this.currentStep()) {
      case 1: return this.campaignType() !== null;
      case 2: return this.detailsFormValid();
      case 3:
        switch (this.campaignType()) {
          case 'Email': return this.contentFormValid();
          case 'SMS': return this.smsContentFormValid();
          case 'Social Post': return this.socialContentFormValid();
          case 'In-app': return this.inAppContentFormValid();
          case 'Offline': return this.offlineContentFormValid();
          default: return false;
        }
      case 4: return this.audienceFormValid();
      case 5: return this.scheduleFormValid();
      default: return true;
    }
  });

  readonly progress = computed(() => ((this.currentStep() - 1) / (this.steps.length - 1)) * 100);

  constructor() {
    this.detailsForm.statusChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.detailsFormValid.set(this.detailsForm.valid));
    this.contentForm.statusChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.contentFormValid.set(this.contentForm.valid));
    this.smsContentForm.statusChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.smsContentFormValid.set(this.smsContentForm.valid));
    this.socialContentForm.statusChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.socialContentFormValid.set(this.socialContentForm.valid));
    this.inAppContentForm.statusChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.inAppContentFormValid.set(this.inAppContentForm.valid));
    this.offlineContentForm.statusChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.offlineContentFormValid.set(this.offlineContentForm.valid));
    this.audienceForm.statusChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.audienceFormValid.set(this.audienceForm.valid));
    this.scheduleForm.statusChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.scheduleFormValid.set(this.scheduleForm.valid));

    this.route.paramMap.subscribe(async params => {
      const id = params.get('id');
      if (id) {
        this.campaignId.set(id);
        const campaign = await this.campaignService.getCampaign(id);
        if (campaign) {
          this.patchForm(campaign);
        }
      }
    });
  }

  private patchForm(campaign: Campaign) {
    this.campaignType.set(campaign.type);

    // Patch Details
    this.detailsForm.patchValue({
      name: campaign.name,
      description: campaign.description,
      status: campaign.status
    });

    // Patch Type-Specific Content
    switch (campaign.type) {
      case 'Email':
        this.contentForm.patchValue({
          senderName: campaign.senderName,
          senderEmail: campaign.senderEmail,
          subject: campaign.subject,
          body: campaign.body
        });
        break;
      case 'SMS':
        this.smsContentForm.patchValue({ message: campaign.message });
        break;
      case 'Social Post':
        this.socialContentForm.patchValue({
          platform: campaign.platform,
          text: campaign.text,
          imageUrl: campaign.imageUrl
        });
        break;
      case 'In-app':
        this.inAppContentForm.patchValue({
          headline: campaign.headline,
          body: campaign.body // Note: In-app also uses 'body' in mock? or separate? I reused 'body' in type definition for convenience or specific field
        });
        // Note: type definition had `headline`. My type update had `headline`. `in-app` content form has `headline` and `body`.
        // Wait, did I add `body` to in-app form in type?
        // In Step 597/598: `Campaign` type has `body?: string`. `inAppContentForm` has `body`. OK.
        break;
      case 'Offline':
        this.offlineContentForm.patchValue({
          title: campaign.title,
          details: campaign.details
        });
        break;
    }

    // Patch Audience
    this.audienceForm.patchValue({ segmentId: campaign.segmentId });

    // Patch Schedule
    if (campaign.scheduleType) {
      this.scheduleForm.patchValue({
        type: campaign.scheduleType,
        date: campaign.scheduleDate,
        time: campaign.scheduleTime
      });
    }

    // Jump to Details (Step 2) since Type is set
    this.currentStep.set(2);
  }

  selectCampaignType(type: CampaignType) { this.campaignType.set(type); }
  nextStep(): void { if (this.currentStep() < this.steps.length) { this.currentStep.update(step => step + 1); } }
  prevStep(): void { if (this.currentStep() > 1) { this.currentStep.update(step => step - 1); } }
  cancel(): void { this.router.navigate(['/map/campaigns']); }

  handleImageUpload(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files[0]) {
      const file = target.files[0];
      const reader = new FileReader();
      reader.onload = (e) => this.socialContentForm.patchValue({ imageUrl: e.target?.result as string });
      reader.readAsDataURL(file);
    }
  }

  generateAiSubjects(): void {
    this.isGeneratingSubject.set(true);
    const topic = this.contentForm.get('subject')?.value || 'New Product';
    this.aiService.generateSubjectLines(topic).subscribe(suggestions => {
      this.aiSubjectSuggestions.set(suggestions);
      this.isGeneratingSubject.set(false);
    });
  }

  useAiSubject(subject: string): void {
    this.contentForm.patchValue({ subject });
    this.aiSubjectSuggestions.set([]);
  }

  finish(): void {
    const formVals = {
      ...this.detailsForm.value,
      ...this.contentForm.value,
      ...this.smsContentForm.value,
      ...this.socialContentForm.value,
      ...this.inAppContentForm.value,
      ...this.offlineContentForm.value,
      ...this.audienceForm.value,
      ...this.scheduleForm.value
    };

    const campaignData: any = {
      name: this.detailsForm.value.name || 'Untitled Campaign',
      type: this.campaignType()!,
      status: this.detailsForm.value.status || 'draft', // Use selected status
      sent: 0,
      openRate: 0,
      ctr: 0,
      description: this.detailsForm.value.description,

      // Merge all potential fields
      senderName: this.contentForm.value.senderName,
      senderEmail: this.contentForm.value.senderEmail,
      subject: this.contentForm.value.subject,
      body: this.contentForm.value.body || this.inAppContentForm.value.body,
      message: this.smsContentForm.value.message,
      platform: this.socialContentForm.value.platform,
      text: this.socialContentForm.value.text,
      imageUrl: this.socialContentForm.value.imageUrl,
      headline: this.inAppContentForm.value.headline,
      title: this.offlineContentForm.value.title,
      details: this.offlineContentForm.value.details,
      segmentId: this.audienceForm.value.segmentId,
      scheduleType: this.scheduleForm.value.type,
      scheduleDate: this.scheduleForm.value.date,
      scheduleTime: this.scheduleForm.value.time
    };

    if (this.isEditMode()) {
      // Preserve existing fields like stats
      this.campaignService.getCampaign(this.campaignId()!).then(existing => {
        if (existing) {
          const updated = { ...existing, ...campaignData, id: this.campaignId()! };
          this.campaignService.updateCampaign(updated).then(() => {
            this.router.navigate(['/map/campaigns']);
          });
        }
      });
    } else {
      this.campaignService.addCampaign(campaignData).then(() => {
        this.router.navigate(['/map/campaigns']);
      });
    }
  }
}