import { Routes } from '@angular/router';
import { CampaignsComponent } from './pages/map/campaigns/campaigns.component';
import { WorkflowsComponent } from './pages/map/workflows/workflows.component';
import { ProspectSegmentsComponent } from './pages/map/segments/segments.component';
import { LeadScoringComponent } from './pages/map/lead-scoring/lead-scoring.component';
import { MapAnalyticsComponent } from './pages/map/analytics/analytics.component';
import { AccountsComponent } from './pages/abm/accounts/accounts.component';
import { IntentSignalsComponent } from './pages/abm/intent-signals/intent-signals.component';
import { BuyingCommitteeComponent } from './pages/abm/buying-committee/buying-committee.component';
import { AbmAnalyticsComponent } from './pages/abm/analytics/analytics.component';
import { AllEventsComponent } from './pages/events/all-events/all-events.component';
import { RegistrationsComponent } from './pages/events/registrations/registrations.component';
import { EventsAnalyticsComponent } from './pages/events/analytics/analytics.component';
import { NewCampaignComponent } from './pages/map/new-campaign/new-campaign.component';
import { WorkflowBuilderComponent } from './pages/map/workflows/workflow-builder/workflow-builder.component';
import { SegmentEditorComponent } from './pages/map/segments/segment-editor/segment-editor.component';
import { Account360Component } from './pages/abm/account-360/account-360.component';
import { EventDetailComponent } from './pages/events/event-detail/event-detail.component';
import { EventFormComponent } from './pages/events/event-form/event-form.component';

export const APP_ROUTES: Routes = [
  { path: '', redirectTo: '/map/analytics', pathMatch: 'full' },
  { 
    path: 'map/campaigns', 
    component: CampaignsComponent,
    data: { title: 'Campaigns', description: 'Manage your email and marketing campaigns.' }
  },
  {
    path: 'map/campaigns/new',
    component: NewCampaignComponent,
    data: { title: 'Create New Campaign', description: 'Build your new campaign step-by-step.', fullScreen: true }
  },
  { 
    path: 'map/workflows', 
    component: WorkflowsComponent,
    data: { title: 'Workflows', description: 'Automation workflows for lead nurturing.' }
  },
  {
    path: 'map/workflows/builder/:id',
    component: WorkflowBuilderComponent,
    data: { title: 'Workflow Builder', description: 'Design an automation workflow.', fullScreen: true }
  },
  { 
    path: 'map/prospect-segments', 
    component: ProspectSegmentsComponent,
    data: { title: 'Segments', description: 'Create and manage audience segments for targeted campaigns' }
  },
  {
    path: 'map/prospect-segments/new',
    component: SegmentEditorComponent,
    data: { title: 'Create Segment', description: 'Build a dynamic audience segment.', fullScreen: true }
  },
  {
    path: 'map/prospect-segments/:id',
    component: SegmentEditorComponent,
    data: { title: 'Edit Segment', description: 'Edit an existing audience segment.', fullScreen: true }
  },
  { 
    path: 'map/lead-scoring', 
    component: LeadScoringComponent,
    data: { title: 'Lead Scoring', description: 'Configure and monitor lead scoring rules.' }
  },
  { 
    path: 'map/analytics', 
    component: MapAnalyticsComponent,
    data: { title: 'MAP Analytic Report', description: 'Marketing automation performance metrics.' }
  },
  { path: 'abm', redirectTo: '/abm/analytics', pathMatch: 'full' },
  { 
    path: 'abm/accounts', 
    component: AccountsComponent,
    data: { title: 'Accounts', description: 'Manage target accounts.' }
  },
   { 
    path: 'abm/accounts/:id', 
    component: Account360Component,
    data: { title: 'Account 360', description: 'A unified view of the target account.' }
  },
  { 
    path: 'abm/intent-signals', 
    component: IntentSignalsComponent,
    data: { title: 'Intent Signals', description: 'Monitor buying intent signals.' }
  },
  { 
    path: 'abm/buying-committee', 
    component: BuyingCommitteeComponent,
    data: { title: 'Buying Committee', description: 'Map out buying committees.' }
  },
  { 
    path: 'abm/analytics', 
    component: AbmAnalyticsComponent,
    data: { title: 'ABM Analytics', description: 'Account-Based Marketing performance.' }
  },
  { path: 'events', redirectTo: '/events/all', pathMatch: 'full' },
  { 
    path: 'events/all', 
    component: AllEventsComponent,
    data: { title: 'All Events', description: 'Create and manage all your events and webinars.' }
  },
  {
    path: 'events/new',
    component: EventFormComponent,
    data: { title: 'Create New Event', description: 'Set up a new event or webinar.' },
  },
  {
    path: 'events/edit/:id',
    component: EventFormComponent,
    data: { title: 'Edit Event', description: 'Update details for an existing event.' },
  },
  {
    path: 'events/view/:id',
    component: EventDetailComponent,
    data: { title: 'Event Details', description: 'Manage and review a specific event.' },
  },
  { 
    path: 'events/registrations', 
    component: RegistrationsComponent,
    data: { title: 'Registrations', description: 'Track and manage all event registrations.' }
  },
  { 
    path: 'events/analytics', 
    component: EventsAnalyticsComponent,
    data: { title: 'Event Analytics', description: 'Analyze event performance and ROI.' }
  },
];
