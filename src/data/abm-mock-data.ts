import { Account, IntentSignal, BuyingCommittee, AccountAnalytics, Account360 } from '../types';

export const MOCK_ACCOUNTS: Account[] = [
  { id: 'acc_1', name: 'Vertex Analytics', employees: 7118, revenue: 210, industry: 'Manufacturing', tier: 'T2', score: 2, intent: 40, country: 'Germany' },
  { id: 'acc_2', name: 'Summit Partners', employees: 9636, revenue: 182, industry: 'Media & Entertainment', tier: 'T2', score: 68, intent: 75, country: 'Singapore' },
  { id: 'acc_3', name: 'Pulse Digital', employees: 7572, revenue: 491, industry: 'Professional Services', tier: 'T2', score: 51, intent: 60, country: 'Netherlands' },
  { id: 'acc_4', name: 'Matrix Corp', employees: 3265, revenue: 9, industry: 'Manufacturing', tier: 'T2', score: 60, intent: 80, country: 'Australia' },
  { id: 'acc_5', name: 'Global Dynamics', employees: 9261, revenue: 331, industry: 'Energy', tier: 'T1', score: 96, intent: 90, country: 'Sweden' },
  { id: 'acc_6', name: 'Stellar Tech', employees: 5806, revenue: 451, industry: 'Healthcare', tier: 'T3', score: 80, intent: 55, country: 'Japan' },
];

export const MOCK_INTENT_SIGNALS: IntentSignal[] = [
  { accountId: 'acc_6', accountName: 'Stellar Tech', solutionCategory: 'CRM Solutions', score: 49, trend: 'Declining', sources: ['Bombora'] },
  { accountId: 'acc_7', accountName: 'Catalyst Ventures', solutionCategory: 'DevOps Tools', score: 75, trend: 'Rising', sources: ['TrustRadius'] },
  { accountId: 'acc_3', accountName: 'Pulse Digital', solutionCategory: 'Marketing Automation', score: 54, trend: 'Declining', sources: ['TrustRadius', 'Bombora', 'Website', 'G2'] },
  { accountId: 'acc_2', accountName: 'Summit Partners', solutionCategory: 'Remote Collaboration', score: 79, trend: 'Stable', sources: ['Bombora'] },
  { accountId: 'acc_8', accountName: 'Vector Labs', solutionCategory: 'Remote Collaboration', score: 94, trend: 'Rising', sources: ['LinkedIn'] },
  { accountId: 'acc_9', accountName: 'Catalyst Ventures', solutionCategory: 'Sales Automation', score: 45, trend: 'Declining', sources: ['G2', 'LinkedIn', 'TrustRadius'] },
];

export const MOCK_BUYING_COMMITTEES: BuyingCommittee[] = [
  { 
    accountId: 'acc_1', 
    accountName: 'Vertex Analytics', 
    members: [
      { id: 'mem_9', name: 'John Doe', role: 'Decision Maker', title: 'VP of Operations', email: 'john.doe@vertex.com', influence: 'High' },
      { id: 'mem_10', name: 'Jane Smith', role: 'Influencer', title: 'Senior Analyst', email: 'jane.smith@vertex.com', influence: 'Medium' },
    ]
  },
  { 
    accountId: 'acc_5', 
    accountName: 'Global Dynamics', 
    members: [
      { id: 'mem_1', name: 'Daniel Rodriguez', role: 'Decision Maker', title: 'Content Marketing Manager', email: 'daniel.rodriguez@globaldynamics4.com', influence: 'High' },
      { id: 'mem_2', name: 'Joseph Taylor', role: 'Influencer', title: 'Customer Success Manager', email: 'joseph.taylor@globaldynamics4.com', influence: 'Medium' },
      { id: 'mem_3', name: 'Ashley Perez', role: 'Champion', title: 'Partner Manager', email: 'ashley.perez@globaldynamics4.com', influence: 'Low' },
      { id: 'mem_4', name: 'Donald Ramirez', role: 'End-User', title: 'Director of Marketing', email: 'donald.ramirez@globaldynamics4.com', influence: 'High' },
    ]
  },
  {
    accountId: 'acc_2',
    accountName: 'Summit Partners',
    members: [
      { id: 'mem_5', name: 'Jennifer Clark', role: 'Decision Maker', title: 'Head of Growth', email: 'jennifer.clark@summitpartners6.com', influence: 'High' },
      { id: 'mem_6', name: 'Jennifer Martin', role: 'Influencer', title: 'CEO', email: 'jennifer.martin@summitpartners6.com', influence: 'Medium' },
      { id: 'mem_7', name: 'Michelle Rodriguez', role: 'Champion', title: 'Director of Sales', email: 'michelle.rodriguez@summitpartners6.com', influence: 'Low' },
      { id: 'mem_8', name: 'Laura Wilson', role: 'End-User', title: 'Marketing Manager', email: 'laura.wilson@summitpartners6.com', influence: 'High' },
    ]
  }
];

export const MOCK_ACCOUNT_ANALYTICS: AccountAnalytics = {
  totalAccounts: 40,
  t1Accounts: 12,
  avgIntentScore: 50,
  intentSignals: 50,
  accountTiers: [
    { tier: 'T1', count: 12 },
    { tier: 'T2', count: 18 },
    { tier: 'T3', count: 10 },
  ],
  topAccounts: [
    { rank: 1, id: 'acc_10', name: 'Beacon Analytics', industry: 'Retail', tier: 'T1', score: 99 },
    { rank: 2, id: 'acc_5', name: 'Global Dynamics', industry: 'Energy', tier: 'T1', score: 96 },
    { rank: 3, id: 'acc_11', name: 'Forge Industries', industry: 'Education', tier: 'T1', score: 93 },
    { rank: 4, id: 'acc_8', name: 'Vector Labs', industry: 'Retail', tier: 'T2', score: 82 },
  ]
};

export const MOCK_ACCOUNT_360_DATA: Account360[] = MOCK_ACCOUNTS.map(account => ({
    ...account,
    intentScoreTrend: [
        { date: 'Jan', score: Math.max(0, account.intent - 20) },
        { date: 'Feb', score: Math.max(0, account.intent - 10) },
        { date: 'Mar', score: Math.max(0, account.intent - 15) },
        { date: 'Apr', score: Math.max(0, account.intent + 5) },
        { date: 'May', score: account.intent },
    ],
    engagementSummary: [
        { metric: 'Marketing Emails', value: 12, change: 15 },
        { metric: 'Sales Emails', value: 8, change: -5 },
        { metric: 'Page Views', value: 45, change: 30 },
        { metric: 'Form Fills', value: 2, change: 100 },
    ],
    buyingCommittee: MOCK_BUYING_COMMITTEES.find(c => c.accountId === account.id)?.members || [],
    recentActivities: [
        { date: '2024-05-20', type: 'Email', description: 'Opened "Q2 Webinar" email', contact: 'Daniel Rodriguez' },
        { date: '2024-05-18', type: 'Website', description: 'Visited Pricing Page', contact: 'Ashley Perez' },
        { date: '2024-05-15', type: 'Form', description: 'Downloaded "ABM Guide"', contact: 'Daniel Rodriguez' },
    ]
}));