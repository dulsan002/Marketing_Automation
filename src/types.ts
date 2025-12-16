export interface Campaign {
  name: string;
  type: 'Email' | 'SMS' | 'Social Post' | 'In-app' | 'Offline';
  status: 'draft' | 'active' | 'paused' | 'completed';
  sent: number;
  openRate: number;
  ctr: number;
}

export interface WorkflowEdge {
  id: string;
  source: string; // source node id
  target: string; // target node id
  label?: 'YES' | 'NO';
}

export interface Workflow {
  id: string;
  name:string;
  description: string;
  trigger: string;
  status: 'draft' | 'active' | 'paused';
  stats: {
    enrolled: number;
    sent: number;
    converted: number;
  };
  modified: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  workflow: Omit<Workflow, 'id' | 'status' | 'stats' | 'modified'>;
}

export interface SegmentRule {
  field: string;
  operator: string;
  value: string;
}

export interface SegmentRuleGroup {
  condition: 'AND' | 'OR';
  rules: SegmentRule[];
}

export interface ProspectSegment {
  id: string;
  name: string;
  description: string;
  type: 'Dynamic' | 'Static';
  rulesCount: number;
  members: number;
  memberChange: number; // percentage
  updated: string;
  ruleGroups: SegmentRuleGroup[];
}

export interface SampleContact {
    name: string;
    email: string;
    avatarInitial: string;
}

export interface ScoringRule {
  id: string;
  name: string;
  score: number;
}


// Types for Workflow Builder
export type NodeType = 'Trigger' | 'FlowControl' | 'Action' | 'End';
export type NodeSubType = 
  'Contact Created' | 'Joined Segment' | 'Left Segment' | 'Email Opened' | 'Form Submitted' | 'Email Clicked' | 'Page Visited' | 'Event Registered' | 'Event Attended' | 'CRM Field Updated' |// Triggers
  'If/Then Branch' | 'Wait / Delay' | // Flow Control
  'Send Email' | 'Send SMS' | 'Send Push' | 'Add to Segment' | 'Notify Sales' | // Actions
  'End Workflow'; // End

export interface NodeSettings {
  nodeName: string;
  [key: string]: any;
}

export interface WorkflowNode {
  id: string;
  type: NodeType;
  subType: NodeSubType;
  settings: NodeSettings;
  position: { x: number; y: number };
}

export interface PaletteNode {
  type: NodeType;
  subType: NodeSubType;
  description: string;
  icon: string; // SVG path
}

// ABM Module Types
export interface Account {
  id: string;
  name: string;
  employees: number;
  revenue: number; // in millions
  industry: string;
  tier: 'T1' | 'T2' | 'T3';
  score: number;
  intent: number; // 0-100
  country: string;
}

export type IntentTrend = 'Rising' | 'Declining' | 'Stable';
export type IntentSource = 'Bombora' | 'G2' | 'TrustRadius' | 'LinkedIn' | 'Website';

export interface IntentSignal {
  accountId: string;
  accountName: string;
  solutionCategory: string;
  score: number;
  trend: IntentTrend;
  sources: IntentSource[];
}

export type CommitteeRole = 'Decision Maker' | 'Influencer' | 'Champion' | 'End-User';
export type InfluenceLevel = 'High' | 'Medium' | 'Low';

export interface BuyingCommitteeMember {
  id: string;
  name: string;
  role: CommitteeRole;
  title: string;
  email: string;
  influence: InfluenceLevel;
}

export interface BuyingCommittee {
  accountId: string;
  accountName: string;
  members: BuyingCommitteeMember[];
}

export interface AccountAnalytics {
  totalAccounts: number;
  t1Accounts: number;
  avgIntentScore: number;
  intentSignals: number;
  accountTiers: { tier: 'T1' | 'T2' | 'T3', count: number }[];
  topAccounts: {
    rank: number;
    id: string;
    name: string;
    industry: string;
    tier: 'T1' | 'T2' | 'T3';
    score: number;
  }[];
}

// Account 360 View specific types
export interface EngagementStat {
    metric: string;
    value: number;
    change: number; // percentage
}

export interface RecentActivity {
    date: string;
    type: string;
    description: string;
    contact: string;
}

export interface Account360 extends Account {
    intentScoreTrend: { date: string, score: number }[];
    engagementSummary: EngagementStat[];
    buyingCommittee: BuyingCommitteeMember[];
    recentActivities: RecentActivity[];
}

// Events Module Types
export type EventType = 'webinar' | 'conference' | 'meetup' | 'workshop';
export type EventStatus = 'upcoming' | 'live' | 'completed';
export type RegistrationStatus = 'confirmed' | 'pending' | 'cancelled';
export type AttendanceStatus = 'attended' | 'no-show' | 'partial';

export interface Event {
  id: string;
  name: string;
  type: EventType;
  status: EventStatus;
  speaker: string;
  date: string; // ISO string for simplicity
  duration: number; // in minutes
  registrations: number;
  attendees: number;
}

export interface Registration {
  id: string;
  registrant: {
    name: string;
    email: string;
  };
  company: string;
  eventId: string;
  eventName: string;
  status: RegistrationStatus;
  registeredDate: string; // ISO string
}

export interface EventAnalytics {
  totalEvents: number;
  totalRegistrations: number;
  totalAttendees: number;
  noShows: number;
  attendanceByEvent: {
    eventName: string;
    registrations: number;
    attendees: number;
  }[];
}