import { Event, Registration, EventAnalytics } from '../types';

export const MOCK_EVENTS: Event[] = [
  { id: 'evt_1', name: 'Cloud Migration Best Practices', type: 'webinar', status: 'upcoming', speaker: 'David Kim', date: '2025-01-14T14:00:00Z', duration: 35, registrations: 112, attendees: 0 },
  { id: 'evt_2', name: 'AI in Enterprise: What You Need to Know', type: 'meetup', status: 'live', speaker: 'Dr. Sarah Chen', date: '2024-11-20T10:00:00Z', duration: 76, registrations: 500, attendees: 350 },
  { id: 'evt_3', name: 'Digital Transformation Masterclass', type: 'webinar', status: 'completed', speaker: 'Michael Roberts', date: '2024-12-04T09:00:00Z', duration: 88, registrations: 827, attendees: 512 },
  { id: 'evt_4', name: 'Security Summit 2024', type: 'workshop', status: 'live', speaker: 'Alex Rivera', date: '2025-01-31T09:00:00Z', duration: 179, registrations: 758, attendees: 620 },
  { id: 'evt_5', name: 'RevOps Excellence Workshop', type: 'conference', status: 'completed', speaker: 'David Kim', date: '2025-02-06T11:00:00Z', duration: 87, registrations: 363, attendees: 250 },
  { id: 'evt_6', name: 'Data Analytics Deep Dive', type: 'conference', status: 'completed', speaker: 'Jennifer Walsh', date: '2025-01-07T13:00:00Z', duration: 121, registrations: 556, attendees: 398 },
];

export const MOCK_REGISTRATIONS: Registration[] = [
  { id: 'reg_1', registrant: { name: 'Jennifer Clark', email: 'jennifer.clark@summitpartners6.com' }, company: 'Summit Partners 6', eventId: 'evt_1', eventName: 'Cloud Migration Best Practices', status: 'confirmed', registeredDate: '2025-10-12T10:00:00Z' },
  { id: 'reg_2', registrant: { name: 'Nicole White', email: 'nicole.white@matrixcorp3.com' }, company: 'Matrix Corp 3', eventId: 'evt_2', eventName: 'AI in Enterprise: What You Need to Know', status: 'confirmed', registeredDate: '2025-10-12T11:00:00Z' },
  { id: 'reg_3', registrant: { name: 'Christopher Martinez', email: 'christopher.martinez@ciphertech25.com' }, company: 'Cipher Tech 25', eventId: 'evt_3', eventName: 'Digital Transformation Masterclass', status: 'confirmed', registeredDate: '2025-10-12T12:00:00Z' },
  { id: 'reg_4', registrant: { name: 'Robert Gonzalez', email: 'robert.gonzalez@globaldynamics8.com' }, company: 'Global Dynamics 8', eventId: 'evt_4', eventName: 'Security Summit 2024', status: 'pending', registeredDate: '2025-10-13T13:00:00Z' },
  { id: 'reg_5', registrant: { name: 'Emily Martinez', email: 'emily.martinez@stellartech5.com' }, company: 'Stellar Tech 5', eventId: 'evt_5', eventName: 'RevOps Excellence Workshop', status: 'cancelled', registeredDate: '2025-10-16T14:00:00Z' },
  { id: 'reg_6', registrant: { name: 'Matthew Harris', email: 'matthew.harris@globaldynamics34.com' }, company: 'Global Dynamics 34', eventId: 'evt_6', eventName: 'Data Analytics Deep Dive', status: 'confirmed', registeredDate: '2025-10-16T15:00:00Z' },
];

export const MOCK_EVENT_ANALYTICS: EventAnalytics = {
  totalEvents: 10,
  totalRegistrations: 5593,
  totalAttendees: 3133,
  noShows: 2460,
  attendanceByEvent: [
    { eventName: 'Cloud Migration', registrations: 120, attendees: 65 },
    { eventName: 'AI in Enterprise', registrations: 500, attendees: 280 },
    { eventName: 'Digital Transfo', registrations: 827, attendees: 512 },
    { eventName: 'Security Summit', registrations: 758, attendees: 401 },
    { eventName: 'RevOps Excellen', registrations: 363, attendees: 180 },
    { eventName: 'Data Analytics', registrations: 556, attendees: 301 },
  ]
};