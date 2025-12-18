/**
 * Represents a single marketing campaign.
 */
export interface Campaign {
  id?: string;
  name: string;
  type: 'Email' | 'SMS' | 'Social Post' | 'In-app' | 'Offline';
  status: 'draft' | 'active' | 'paused' | 'completed' | 'scheduled';
  sent: number;
  openRate: number;
  ctr: number;

  // Details
  description?: string;
  segmentId?: string;

  // Content (Email)
  senderName?: string;
  senderEmail?: string;
  subject?: string;
  body?: string;

  // Content (SMS)
  message?: string;

  // Content (Social)
  platform?: string;
  text?: string;
  imageUrl?: string;

  // Content (In-App)
  headline?: string;

  // Content (Offline)
  title?: string;
  details?: string;

  // Schedule
  scheduleType?: 'immediate' | 'later';
  scheduleDate?: string;
  scheduleTime?: string;
}

/**
 * Represents a connection between two nodes in a workflow.
 */
export interface WorkflowEdge {
  id: string;
  source: string; // source node id
  target: string; // target node id
  /** Optional label for conditional branches (e.g., from an If/Then node). */
  label?: 'YES' | 'NO' | 'A' | 'B';
}

/**
 * Represents a complete automation workflow, including its nodes and edges.
 */
export interface Workflow {
  id: string;
  name: string;
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

/**
 * Represents a pre-built workflow template that users can start from.
 */
export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  workflow: Omit<Workflow, 'id' | 'status' | 'stats' | 'modified'>;
}

/**
 * Defines a single rule within a segment's logic.
 */
export interface SegmentRule {
  field: string;
  operator: string;
  value: string;
}

/**
 * A group of segment rules combined with a condition (AND/OR).
 */
export interface SegmentRuleGroup {
  condition: 'AND' | 'OR';
  rules: SegmentRule[];
}

/**
 * Represents a segment of prospects, defined by a set of rules.
 */
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

/**
 * Represents a sample contact for display purposes in the segment editor.
 */
export interface SampleContact {
  name: string;
  email: string;
  avatarInitial: string;
}

/**
 * Defines a rule for scoring leads based on their actions.
 */
export interface ScoringRule {
  id: string;
  name: string;
  score: number;
}


// Types for Workflow Builder

/** The primary category of a workflow node. */
export type NodeType = 'Trigger' | 'FlowControl' | 'Action' | 'End';

/** The specific type of a workflow node, determining its function. */
export type NodeSubType =
  // Triggers
  'Contact Created' | 'Joined Segment' | 'Left Segment' | 'Email Opened' | 'Form Submitted' | 'Email Clicked' | 'Page Visited' | 'Event Registered' | 'Event Attended' | 'CRM Field Updated' |
  // Flow Control
  'If/Then Branch' | 'Wait / Delay' | 'A/B Split Test' |
  // Actions
  'Send Email' | 'Send SMS' | 'Send Push' | 'Add to Segment' | 'Notify Sales' |
  // End
  'End Workflow';

/**
 * A flexible object to hold the settings for any type of workflow node.
 */
export interface NodeSettings {
  nodeName: string;
  [key: string]: any;
}

/**
 * Represents a single node on the workflow canvas.
 */
export interface WorkflowNode {
  id: string;
  type: NodeType;
  subType: NodeSubType;
  settings: NodeSettings;
  position: { x: number; y: number };
  isTrigger?: boolean;
}

/**
 * Represents a node item available in the workflow builder's palette.
 */
export interface PaletteNode {
  type: NodeType;
  subType: NodeSubType;
  description: string;
  icon: string; // SVG path
}

// ABM (Account-Based Marketing) Module Types

/**
 * Represents a target account in the ABM module.
 */
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

/** The trend direction of an account's buying intent. */
export type IntentTrend = 'Rising' | 'Declining' | 'Stable';
/** The source of an intent signal (e.g., a third-party data provider). */
export type IntentSource = 'Bombora' | 'G2' | 'TrustRadius' | 'LinkedIn' | 'Website';

/**
 * Represents a signal of buying intent from a specific account for a solution category.
 */
export interface IntentSignal {
  accountId: string;
  accountName: string;
  solutionCategory: string;
  score: number;
  trend: IntentTrend;
  sources: IntentSource[];
}

/** The role a contact plays within a buying committee. */
export type CommitteeRole = 'Decision Maker' | 'Influencer' | 'Champion' | 'End-User';
/** The level of influence a contact has on a purchasing decision. */
export type InfluenceLevel = 'High' | 'Medium' | 'Low';

/**
 * Represents a single member of a buying committee within an account.
 */
export interface BuyingCommitteeMember {
  id: string;
  name: string;
  role: CommitteeRole;
  title: string;
  email: string;
  influence: InfluenceLevel;
}

/**
 * Represents the entire buying committee for a specific account.
 */
export interface BuyingCommittee {
  accountId: string;
  accountName: string;
  members: BuyingCommitteeMember[];
}

/**
 * A summary of analytics for the Account-Based Marketing module.
 */
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
/**
 * Represents a key engagement metric for an account.
 */
export interface EngagementStat {
  metric: string;
  value: number;
  change: number; // percentage
}

/**
 * Represents a single recent activity performed by a contact at an account.
 */
export interface RecentActivity {
  date: string;
  type: string;
  description: string;
  contact: string;
}

/**
 * A comprehensive, detailed view of a single target account.
 */
export interface Account360 extends Account {
  intentScoreTrend: { date: string, score: number }[];
  engagementSummary: EngagementStat[];
  buyingCommittee: BuyingCommitteeMember[];
  recentActivities: RecentActivity[];
}

// Events Module Types
/** The category of an event. */
export type EventType = 'webinar' | 'conference' | 'meetup' | 'workshop';
/** The current status of an event. */
export type EventStatus = 'upcoming' | 'live' | 'completed';
/** The status of a person's registration for an event. */
export type RegistrationStatus = 'confirmed' | 'pending' | 'cancelled';
/** The attendance status of a registrant for an event. */
export type AttendanceStatus = 'attended' | 'no-show' | 'partial';

/**
 * Represents a single event, such as a webinar or conference.
 */
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

/**
 * Represents a single registration for an event.
 */
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

/**
 * A summary of analytics for the Events module.
 */
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
