import { Booking, EventType, HostProfile, TimezoneOption } from '../types/scheduling';

export const TODAY_ISO = '2026-11-16';
export const DEFAULT_SCHEDULE_DATE = '2026-11-02';

export const HOST_PROFILE: HostProfile = {
  name: 'Elena Vance',
  role: 'Principal Consultant',
  email: 'elena@cadence.work',
  avatar: '/src/assets/images/avatar_host_elena_1794855873035.jpg',
  timezone: 'America/Los_Angeles',
};

export const TIMEZONES: TimezoneOption[] = [
  { id: 'America/Los_Angeles', label: 'Pacific Time (Los Angeles)', offset: 'UTC-8' },
  { id: 'America/New_York', label: 'Eastern Time (New York)', offset: 'UTC-5' },
  { id: 'Europe/London', label: 'Greenwich Mean Time (London)', offset: 'UTC+0' },
  { id: 'Asia/Kolkata', label: 'Indian Standard Time (IST)', offset: 'UTC+5:30' },
  { id: 'Asia/Tokyo', label: 'Japan Standard Time (Tokyo)', offset: 'UTC+9' },
];

export const STANDARD_TIME_SLOTS: string[] = [
  '09:00',
  '09:30',
  '10:00',
  '10:30',
  '11:00',
  '11:30',
  '13:00',
  '13:30',
  '14:00',
  '14:30',
  '15:00',
  '15:30',
  '16:00',
  '16:30',
];

export const INITIAL_EVENT_TYPES: EventType[] = [
  {
    id: 'evt-consultation',
    slug: 'consultation',
    title: 'Consultation',
    durationMinutes: 45,
    location: 'Google Meet',
    description: 'Initial client consultation to scope goals, constraints, and expected timeline.',
    bufferMinutes: 15,
    dailyLimit: 6,
    active: true,
  },
  {
    id: 'evt-followup',
    slug: 'follow-up',
    title: 'Follow-up',
    durationMinutes: 30,
    location: 'Zoom',
    description: 'Structured follow-up session to verify action items and confirm next milestones.',
    bufferMinutes: 10,
    dailyLimit: 6,
    active: true,
  },
  {
    id: 'evt-review',
    slug: 'review',
    title: 'Review',
    durationMinutes: 60,
    location: 'Studio B · SF',
    description: 'Comprehensive milestone and deliverable review with stakeholder sign-off.',
    bufferMinutes: 15,
    dailyLimit: 4,
    active: true,
  },
];

export const INITIAL_BOOKINGS: Booking[] = [
  {
    id: 'bk-101',
    title: 'Consultation',
    eventTypeId: 'evt-consultation',
    date: '2026-11-02',
    startTime: '10:00',
    durationMinutes: 45,
    status: 'pending',
    clientName: 'Alex Morgan',
    clientEmail: 'alex.morgan@example.com',
    clientCompany: 'Morgan Advisory',
    clientAvatar: '/src/assets/images/avatar_client_marcus_1794855872840.jpg',
    location: 'Google Meet',
    meetingUrl: 'https://meet.google.com/cad-cns-101',
    notes: 'Initial consultation scheduled for 2026-11-02 at 10:00. Awaiting final client confirmation.',
    updatedAt: '2026-11-01T16:00:00Z',
  },
  {
    id: 'bk-102',
    title: 'Follow-up',
    eventTypeId: 'evt-followup',
    date: '2026-11-02',
    startTime: '11:30',
    durationMinutes: 30,
    status: 'confirmed',
    clientName: 'Jamie Lee',
    clientEmail: 'jamie.lee@example.com',
    clientCompany: 'Lee Operations',
    clientAvatar: '/src/assets/images/avatar_client_priya_1794855873819.jpg',
    location: 'Zoom',
    meetingUrl: 'https://zoom.us/j/884920112',
    notes: 'Confirmed follow-up session to review milestone progress and next steps.',
    updatedAt: '2026-11-01T17:30:00Z',
  },
  {
    id: 'bk-103',
    title: 'Review',
    eventTypeId: 'evt-review',
    date: '2026-11-03',
    startTime: '14:00',
    durationMinutes: 60,
    status: 'cancelled',
    clientName: 'Taylor Smith',
    clientEmail: 'taylor.smith@example.com',
    clientCompany: 'Smith Studio',
    clientAvatar: '/src/assets/images/avatar_client_david_1794855873201.jpg',
    location: 'Studio B · SF',
    notes: 'Cancelled by Taylor Smith prior to the Nov 3 afternoon review.',
    updatedAt: '2026-11-02T09:15:00Z',
  },
];
