import { Routes } from '@angular/router';
import { LoginComponent } from './pages/auth/login.component';
import { authGuard } from './services/auth.guard';

// MAP Components
import { CampaignsComponent } from './pages/map/campaigns/campaigns.component';
import { NewCampaignComponent } from './pages/map/new-campaign/new-campaign.component';
import { ProspectSegmentsComponent } from './pages/map/segments/segments.component';
import { NewSegmentComponent } from './pages/map/segments/new-segment/new-segment.component';
import { WorkflowsComponent } from './pages/map/workflows/workflows.component';
import { WorkflowBuilderComponent } from './pages/map/workflows/workflow-builder/workflow-builder.component';
import { MapAnalyticsComponent } from './pages/map/analytics/analytics.component';

// ABM Components
import { AccountsComponent } from './pages/abm/accounts/accounts.component';
import { Account360Component } from './pages/abm/account-360/account-360.component';
import { AbmAnalyticsComponent } from './pages/abm/analytics/analytics.component';
import { IntentSignalsComponent } from './pages/abm/intent-signals/intent-signals.component';
import { BuyingCommitteeComponent } from './pages/abm/buying-committee/buying-committee.component';

// Events Components
import { AllEventsComponent } from './pages/events/all-events/all-events.component';
import { EventDetailComponent } from './pages/events/event-detail/event-detail.component';
import { EventsAnalyticsComponent } from './pages/events/analytics/analytics.component';

export const APP_ROUTES: Routes = [
  // Auth
  {
    path: 'login',
    component: LoginComponent,
    data: { fullScreen: true, title: 'Login' }
  },

  // Default Redirect
  { path: '', redirectTo: '/map/analytics', pathMatch: 'full' },
  { path: 'dashboard', redirectTo: '/map/analytics', pathMatch: 'full' },

  // MAP Module
  {
    path: 'map/analytics',
    component: MapAnalyticsComponent,
    canActivate: [authGuard],
    data: { title: 'Marketing Overview' }
  },
  {
    path: 'map/campaigns',
    component: CampaignsComponent,
    canActivate: [authGuard],
    data: { title: 'Campaigns' }
  },
  {
    path: 'map/campaigns/new',
    component: NewCampaignComponent,
    canActivate: [authGuard],
    data: { title: 'New Campaign' }
  },
  {
    path: 'map/campaigns/:id',
    component: NewCampaignComponent, // Reusing New/Edit component
    canActivate: [authGuard],
    data: { title: 'Edit Campaign' }
  },
  {
    path: 'map/prospect-segments',
    component: ProspectSegmentsComponent,
    canActivate: [authGuard],
    data: { title: 'Segments' }
  },
  {
    path: 'map/prospect-segments/new',
    component: NewSegmentComponent,
    canActivate: [authGuard],
    data: { title: 'New Segment' }
  },
  {
    path: 'map/workflows',
    component: WorkflowsComponent,
    canActivate: [authGuard],
    data: { title: 'Workflows' }
  },
  {
    path: 'map/workflows/builder/:id',
    component: WorkflowBuilderComponent,
    canActivate: [authGuard],
    data: { title: 'Workflow Builder' }
  },

  // ABM Module
  {
    path: 'abm/analytics',
    component: AbmAnalyticsComponent,
    canActivate: [authGuard],
    data: { title: 'ABM Analytics' }
  },
  { path: 'abm/dashboard', redirectTo: 'abm/analytics', pathMatch: 'full' },
  {
    path: 'abm/accounts',
    component: AccountsComponent,
    canActivate: [authGuard],
    data: { title: 'Target Accounts' }
  },
  {
    path: 'abm/account/:id',
    component: Account360Component,
    canActivate: [authGuard],
    data: { title: 'Account 360' }
  },
  {
    path: 'abm/intent-signals',
    component: IntentSignalsComponent,
    canActivate: [authGuard],
    data: { title: 'Intent Signals' }
  },
  {
    path: 'abm/buying-committee',
    component: BuyingCommitteeComponent,
    canActivate: [authGuard],
    data: { title: 'Buying Committee' }
  },

  // Events Module
  {
    path: 'events/dashboard',
    component: EventsAnalyticsComponent,
    canActivate: [authGuard],
    data: { title: 'Events Overview' }
  },
  {
    path: 'events/all',
    component: AllEventsComponent,
    canActivate: [authGuard],
    data: { title: 'All Events' }
  },
  {
    path: 'events/event/:id',
    component: EventDetailComponent,
    canActivate: [authGuard],
    data: { title: 'Event Details' }
  },
];
