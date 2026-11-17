export type BookingStatus = 'confirmed' | 'pending' | 'cancelled';

export type BookingLocation = 'Google Meet' | 'Zoom' | 'Studio B · SF' | 'Phone Call';

export type AppScreen = 'dashboard' | 'schedule' | 'bookings' | 'insights' | 'book' | 'events' | 'assistant';

export interface HostProfile {
  name: string;
  role: string;
  email: string;
  avatar: string;
  timezone: string;
}

export interface EventType {
  id: string;
  slug: string;
  title: string;
  durationMinutes: number;
  location: BookingLocation;
  description: string;
  bufferMinutes: number;
  dailyLimit: number;
  active: boolean;
}

export interface Booking {
  id: string;
  title: string;
  eventTypeId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM (24h)
  durationMinutes: number;
  status: BookingStatus;
  clientName: string;
  clientEmail: string;
  clientCompany: string;
  clientAvatar?: string;
  location: BookingLocation;
  meetingUrl?: string;
  notes: string;
  updatedAt: string;
}

export interface TimezoneOption {
  id: string;
  label: string;
  offset: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  modelUsed: string;
  createdAt: string;
}
