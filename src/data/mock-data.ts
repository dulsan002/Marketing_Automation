import { Campaign, Workflow, ProspectSegment, SampleContact, ScoringRule, PaletteNode, WorkflowTemplate } from '../types';

/** Mock data for marketing campaigns. */
export const MOCK_CAMPAIGNS: Campaign[] = [
  { name: 'Q4 Product Launch', type: 'Email', status: 'paused', sent: 7893, openRate: 20.5, ctr: 20.5 },
  { name: 'Enterprise Cloud Webinar Series', type: 'Social Post', status: 'completed', sent: 33824, openRate: 17.7, ctr: 20.8 },
  { name: 'SMB Nurture Campaign', type: 'Email', status: 'draft', sent: 29854, openRate: 26.1, ctr: 14.4 },
  { name: 'Digital Transformation Summit', type: 'Email', status: 'draft', sent: 33818, openRate: 36.8, ctr: 23.4 },
  { name: 'Year-End Promotion', type: 'Social Post', status: 'completed', sent: 49758, openRate: 37.7, ctr: 12.8 },
  { name: 'Customer Success Stories', type: 'Email', status: 'active', sent: 49343, openRate: 28.8, ctr: 10.3 },
  { name: 'Industry Insights Newsletter', type: 'Offline', status: 'paused', sent: 32876, openRate: 18.2, ctr: 12.5 },
];

/** Mock data for automation workflows. */
export const MOCK_WORKFLOWS: Workflow[] = [
    { 
        id: 'wf_1',
        name: 'New Subscriber Engagement', 
        description: 'Engage new contacts and segment them based on email interaction.',
        trigger: 'Contact Created', 
        status: 'draft', 
        stats: { enrolled: 8, sent: 12, converted: 2 },
        modified: '2 minutes ago',
        nodes: [
            { id: 'node_1', type: 'Trigger', subType: 'Contact Created', settings: { nodeName: 'Contact Created', internalNote: 'When a new contact is added' }, position: {x: 350, y: 50} },
            { id: 'node_2', type: 'Action', subType: 'Send Email', settings: { nodeName: 'Send Email', selectCampaign: 'Q4 Product Launch' }, position: {x: 350, y: 230} },
            { id: 'node_3', type: 'FlowControl', subType: 'If/Then Branch', settings: { nodeName: 'If/Then Branch', conditionType: 'Email Opened' }, position: {x: 350, y: 410} },
            { id: 'node_4', type: 'Action', subType: 'Add to Segment', settings: { nodeName: 'Add to Segment', segmentId: 'VIP Members' }, position: {x: 150, y: 590} },
            { id: 'node_5', type: 'FlowControl', subType: 'Wait / Delay', settings: { nodeName: 'Wait', waitDurationValue: 3, waitDurationUnit: 'Days' }, position: {x: 550, y: 590} },
        ],
        edges: [
            { id: 'edge_1', source: 'node_1', target: 'node_2' },
            { id: 'edge_2', source: 'node_2', target: 'node_3' },
            { id: 'edge_3', source: 'node_3', target: 'node_4', label: 'YES' },
            { id: 'edge_4', source: 'node_3', target: 'node_5', label: 'NO' },
        ]
    },
    { 
        id: 'wf_2',
        name: 'Cart Abandonment Recovery', 
        description: 'Re-engage customers who left items in their cart',
        trigger: 'Cart abandoned for 1 hour', 
        status: 'active', 
        stats: { enrolled: 8920, sent: 26780, converted: 890 },
        modified: '1/14/2024',
        nodes: [
            { id: 'node_cart_1', type: 'Trigger', subType: 'Form Submitted', settings: { nodeName: 'Cart Abandonment Trigger' }, position: {x: 400, y: 50} }
        ],
        edges: []
    },
    { 
        id: 'wf_3',
        name: 'Re-engagement Campaign', 
        description: 'Win back inactive subscribers',
        trigger: 'No email opens in 90 days', 
        status: 'paused', 
        stats: { enrolled: 3450, sent: 10350, converted: 230 },
        modified: '1/10/2024',
        nodes: [],
        edges: []
    },
];

/** Catalog of all available node types for the workflow builder palette. */
export const MOCK_WORKFLOW_NODES_CATALOG: PaletteNode[] = [
    { type: 'Trigger', subType: 'Contact Created', description: 'When a new contact is added', icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.5 21c-2.305 0-4.47-.612-6.375-1.666z" />' },
    { type: 'Trigger', subType: 'Joined Segment', description: 'When contact joins a segment', icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m-7.5-2.928A3 3 0 017.5 15.25m0-4.01a3 3 0 013-3m0 0a3 3 0 013 3m0 0a3 3 0 01-3 3m0 0a3 3 0 01-3-3m2.25 6H12m-2.25-6l-2.25-2.25" />' },
    { type: 'Trigger', subType: 'Left Segment', description: 'When contact leaves a segment', icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m-7.5-2.928A3 3 0 017.5 15.25m0-4.01a3 3 0 013-3m0 0a3 3 0 013 3m0 0a3 3 0 01-3 3m0 0a3 3 0 01-3-3m2.25 6H12m-2.25-6l-2.25-2.25" />' },
    { type: 'Trigger', subType: 'Form Submitted', description: 'When a form is submitted', icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />' },
    { type: 'Trigger', subType: 'Email Opened', description: 'When an email is opened', icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M21.75 9v.906a2.25 2.25 0 01-1.183 1.981l-6.478 3.488M2.25 9v.906a2.25 2.25 0 001.183 1.981l6.478 3.488m8.839 2.51-4.66-2.51m0 0l-1.023-.55a2.25 2.25 0 00-2.134 0l-1.022.55m0 0l-4.661 2.51m16.5 1.615a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V8.844a2.25 2.25 0 011.183-1.981l7.5-4.039a2.25 2.25 0 012.134 0l7.5 4.039a2.25 2.25 0 011.183 1.98V19.5z" />' },
    { type: 'Trigger', subType: 'Email Clicked', description: 'When an email link is clicked', icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25a8.25 8.25 0 00-8.25 8.25c0 1.913.666 3.69 1.855 5.042a8.25 8.25 0 0012.79 0A8.25 8.25 0 0012 2.25z" />' },
    { type: 'Trigger', subType: 'Page Visited', description: 'When a specific page is visited', icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 008.217-5.938m-16.434 0A9.004 9.004 0 0112 3c1.932 0 3.716.63 5.166 1.688m-10.332 0A9.004 9.004 0 0012 21a9.004 9.004 0 005.166-13.312M12 15a3 3 0 100-6 3 3 0 000 6z" />' },
    { type: 'Trigger', subType: 'Event Registered', description: 'When registering for an event', icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0h18" />' },
    { type: 'Trigger', subType: 'Event Attended', description: 'When attending an event', icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0h18" />' },
    { type: 'Trigger', subType: 'CRM Field Updated', description: 'When a CRM field changes', icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />' },
    { type: 'FlowControl', subType: 'If/Then Branch', description: 'Add conditional logic with YE...', icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />' },
    { type: 'FlowControl', subType: 'Wait / Delay', description: 'Pause workflow for specified ...', icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />' },
    { type: 'Action', subType: 'Send Email', description: 'Send an email campaign', icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />' },
    { type: 'Action', subType: 'Send SMS', description: 'Send an SMS message', icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />' },
    { type: 'Action', subType: 'Send Push', description: 'Send a push notification', icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />' },
    { type: 'Action', subType: 'Add to Segment', description: 'Add contact to a segment', icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.5 21c-2.305 0-4.47-.612-6.375-1.666z" />' },
    { type: 'Action', subType: 'Notify Sales', description: 'Send notification to sales', icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />' },
    { type: 'End', subType: 'End Workflow', description: 'Marks the end of a path', icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75l3 3m0 0l3-3m-3 3v-7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />'}
];

/** Mock data for pre-built workflow templates. */
export const MOCK_WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
    {
        id: 'tmpl_welcome',
        name: 'Welcome Series',
        description: 'Engage new subscribers with a series of welcome emails to introduce your brand.',
        icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9 9.563C9 9.252 9.252 9 9.563 9h4.874c.311 0 .563.252.563.563v4.874c0 .311-.252.563-.563.563H9.563A.562.562 0 019 14.437V9.564z" />',
        workflow: {
            name: 'Welcome Series',
            description: 'Engage new subscribers with a series of welcome emails to introduce your brand.',
            trigger: 'Joins Segment',
            nodes: [
                { id: 'node_1', type: 'Trigger', subType: 'Joined Segment', settings: { nodeName: 'Joined "New Subscribers" Segment', segmentId: '' }, position: {x: 350, y: 50} },
                { id: 'node_2', type: 'Action', subType: 'Send Email', settings: { nodeName: 'Send Welcome Email #1', selectCampaign: '' }, position: {x: 350, y: 230} },
                { id: 'node_3', type: 'FlowControl', subType: 'Wait / Delay', settings: { nodeName: 'Wait 2 Days', waitDurationValue: 2, waitDurationUnit: 'Days' }, position: {x: 350, y: 410} },
                { id: 'node_4', type: 'Action', subType: 'Send Email', settings: { nodeName: 'Send Welcome Email #2', selectCampaign: '' }, position: {x: 350, y: 590} },
            ],
            edges: [
                { id: 'edge_1', source: 'node_1', target: 'node_2' },
                { id: 'edge_2', source: 'node_2', target: 'node_3' },
                { id: 'edge_3', source: 'node_3', target: 'node_4' },
            ]
        }
    },
    {
        id: 'tmpl_reengage',
        name: 'Re-engagement',
        description: 'Win back inactive customers who haven\'t purchased in a while.',
        icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />',
        workflow: {
            name: 'Re-engagement Campaign',
            description: 'Win back inactive customers who haven\'t purchased in a while.',
            trigger: 'Left Segment',
             nodes: [
                { id: 'node_1', type: 'Trigger', subType: 'Left Segment', settings: { nodeName: 'Left "Active Customers" Segment', segmentId: '' }, position: {x: 350, y: 50} },
                { id: 'node_2', type: 'Action', subType: 'Send Email', settings: { nodeName: 'Send "We Miss You" Email', selectCampaign: '' }, position: {x: 350, y: 230} },
            ],
            edges: [
                 { id: 'edge_1', source: 'node_1', target: 'node_2' },
            ]
        }
    }
];

/** Mock data for prospect segments. */
export const MOCK_SEGMENTS: ProspectSegment[] = [
    { id: 'sg_1', name: 'All Active Customers', description: 'Customers who made a purchase in the last 90 days', type: 'Dynamic', rulesCount: 1, members: 45230, memberChange: 12.5, updated: '2 hours ago', ruleGroups: [{ condition: 'AND', rules: [{ field: 'Last Purchase Date', operator: 'in the last', value: '90 days' }] }] },
    { id: 'sg_2', name: 'VIP Members', description: 'High-value customers with lifetime value > $1000', type: 'Dynamic', rulesCount: 2, members: 8540, memberChange: 5.2, updated: '1 hour ago', ruleGroups: [{ condition: 'AND', rules: [{ field: 'Total Spent', operator: 'is greater than', value: '1000' }, { field: 'Order Count', operator: 'is greater than', value: '5' }] }] },
    { id: 'sg_3', name: 'Newsletter Subscribers', description: 'Opted-in to receive newsletter communications', type: 'Dynamic', rulesCount: 1, members: 67800, memberChange: 8.1, updated: '30 minutes ago', ruleGroups: [{ condition: 'AND', rules: [{ field: 'Email', operator: 'is set', value: '' }] }] },
    { id: 'sg_4', name: 'Cart Abandoners', description: 'Added items to cart but didn\'t complete purchase', type: 'Dynamic', rulesCount: 1, members: 12340, memberChange: -3.4, updated: '15 minutes ago', ruleGroups: [{ condition: 'AND', rules: [{ field: 'Last Purchase Date', operator: 'is not set', value: '' }] }] },
];

/** Mock sample contacts for display in the segment editor preview. */
export const MOCK_SAMPLE_CONTACTS: SampleContact[] = [
    { name: 'Sarah Johnson', email: 'sarah@example.com', avatarInitial: 'S' },
    { name: 'Michael Chen', email: 'michael@example.com', avatarInitial: 'M' },
    { name: 'Emily Davis', email: 'emily@example.com', avatarInitial: 'E' },
];

/** Mock data for the lead score distribution chart. */
export const MOCK_SCORE_DISTRIBUTION = [
  { range: '0-25', count: 52, color: '#EF4444' },
  { range: '26-50', count: 54, color: '#F97316' },
  { range: '51-75', count: 44, color: '#8B5CF6' },
  { range: '76-100', count: 50, color: '#22C55E' },
];

/** Mock data for lead scoring rules. */
export const MOCK_SCORING_RULES: ScoringRule[] = [
    { id: 'rule_1', name: 'Email Click', score: 10 },
    { id: 'rule_2', name: 'Webinar Attendance', score: 20 },
    { id: 'rule_3', name: 'Pricing Page Visit', score: 30 },
    { id: 'rule_4', name: 'Demo Request', score: 50 },
    { id: 'rule_5', name: 'Form Submission', score: 15 },
];

/** Mock data for the list of top leads by score. */
export const MOCK_TOP_LEADS = [
    { name: 'Dorothy Jones', company: 'Synergy Group', title: 'Demand Gen Manager', score: 100 },
    { name: 'Jennifer Martin', company: 'Fusion Enterprises', title: 'VP of Marketing', score: 98 },
    { name: 'Robert Williams', company: 'Innovate Solutions', title: 'Marketing Director', score: 95 },
    { name: 'Patricia Brown', company: 'Apex Industries', title: 'Senior Product Manager', score: 92 },
    { name: 'James Miller', company: 'Quantum Corp', title: 'CEO', score: 91 },
];

/** Mock data for Key Performance Indicators (KPIs) on the MAP analytics dashboard. */
export const MOCK_ANALYTICS_KPIS = {
  emailsSent: { value: 303395, change: 12.5 },
  totalOpens: { value: 80835, change: 8.2 },
  totalClicks: { value: 12294, change: -2.1 },
  engagements: { value: 1000, change: 15.0 },
};

/** Mock data for the lead conversion funnel chart. */
export const MOCK_CONVERSION_FUNNEL = [
  { stage: 'Emails Sent', count: 303395 },
  { stage: 'Opened', count: 80835, rate: 26.6 },
  { stage: 'Clicked', count: 12294, rate: 15.2 },
  { stage: 'Converted', count: 1502, rate: 12.2 }
];

/** Mock data for the engagement trends line chart. */
export const MOCK_ENGAGEMENT_TRENDS = {
  labels: ['Nov 17', 'Nov 20', 'Nov 23', 'Nov 26', 'Nov 29', 'Dec 2', 'Dec 5', 'Dec 8', 'Dec 11', 'Dec 15'],
  series: [
    { name: 'Email Opens', data: [4, 5, 3, 6, 10, 7, 5, 8, 4, 6], color: '#3B82F6' },
    { name: 'Clicks', data: [2, 3, 2, 8, 4, 9, 3, 5, 6, 4], color: '#8B5CF6' },
    { name: 'Page Visits', data: [1, 6, 7, 4, 5, 6, 8, 3, 5, 9], color: '#22C55E' }
  ]
};

/** Mock data for the campaign performance bar chart. */
export const MOCK_CAMPAIGN_PERFORMANCE = [
    { name: 'Q4 Product Launch', openRate: 20, clickRate: 20 },
    { name: 'Enterprise Cloud...', openRate: 18, clickRate: 15 },
    { name: 'SMB Nurture...', openRate: 26, clickRate: 14 },
    { name: 'Digital Transfor...', openRate: 36, clickRate: 23 },
    { name: 'Year-End Promotion', openRate: 37, clickRate: 12 },
];
