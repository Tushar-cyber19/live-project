import { STANDARD_TIME_SLOTS } from '../data/seedData';
import { Booking } from '../types/scheduling';
import { isSlotConflict, minutesToTime, timeToMinutes } from './dateUtils';

export interface SmartSlotRecommendation {
  slot: string;
  score: number;
  matchCount: number;
  reason: string;
  source: 'event-history' | 'overall-history' | 'default';
}

const TIMEZONE_OFFSET_MINUTES: Record<string, number> = {
  'America/Los_Angeles': -8 * 60,
  'America/New_York': -5 * 60,
  'Europe/London': 0,
  'Asia/Kolkata': 5 * 60 + 30,
  'Asia/Tokyo': 9 * 60,
};

/**
 * Converts a host-local HH:MM slot (America/Los_Angeles UTC-8) into a target timezone label.
 */
export function convertSlotFromHostTimezone(hhmm: string, targetTimezoneId: string): {
  time: string;
  dayShift: '' | '+1d' | '-1d';
} {
  const hostOffset = TIMEZONE_OFFSET_MINUTES['America/Los_Angeles'];
  const targetOffset = TIMEZONE_OFFSET_MINUTES[targetTimezoneId] ?? hostOffset;
  const diff = targetOffset - hostOffset;
  const total = timeToMinutes(hhmm) + diff;

  if (total >= 24 * 60) {
    return { time: minutesToTime(total - 24 * 60), dayShift: '+1d' };
  }
  if (total < 0) {
    return { time: minutesToTime(total + 24 * 60), dayShift: '-1d' };
  }
  return { time: minutesToTime(total), dayShift: '' };
}

/**
 * Computes ranked "Smart Time Slot" recommendations for a given event type & date
 * based on the user's past booking history.
 */
export function getSmartSlotRecommendations(
  eventTypeId: string,
  eventTitle: string,
  dateIso: string,
  durationMinutes: number,
  bookings: Booking[],
  limit = 3
): SmartSlotRecommendation[] {
  const sameEventBookings = bookings.filter((b) => b.eventTypeId === eventTypeId);
  const allActiveBookings = bookings.filter((b) => b.status !== 'cancelled');

  // Prefer non-cancelled history for the exact event type; fallback to all history of that event type,
  // then overall booking history across services.
  const primaryPool = sameEventBookings.filter((b) => b.status !== 'cancelled');
  const pool =
    primaryPool.length > 0
      ? primaryPool
      : sameEventBookings.length > 0
      ? sameEventBookings
      : allActiveBookings;

  const source: SmartSlotRecommendation['source'] =
    sameEventBookings.length > 0
      ? 'event-history'
      : allActiveBookings.length > 0
      ? 'overall-history'
      : 'default';

  const freqMap = new Map<string, number>();
  for (const b of pool) {
    const weight = b.status === 'confirmed' ? 2 : b.status === 'pending' ? 1.5 : 0.75;
    freqMap.set(b.startTime, (freqMap.get(b.startTime) ?? 0) + weight);
  }

  const availableSlots = STANDARD_TIME_SLOTS.filter(
    (slot) => !isSlotConflict(dateIso, slot, durationMinutes, bookings)
  );

  if (availableSlots.length === 0) return [];

  const scored = availableSlots.map((slot) => {
    const directFreq = freqMap.get(slot) ?? 0;
    const slotMins = timeToMinutes(slot);

    // Proximity affinity to historically booked times for this event type
    let proximityScore = 0;
    let closestHistoricalSlot = '';
    let minDiff = Infinity;

    for (const [histSlot, weight] of freqMap.entries()) {
      const diff = Math.abs(slotMins - timeToMinutes(histSlot));
      if (diff < minDiff) {
        minDiff = diff;
        closestHistoricalSlot = histSlot;
      }
      if (diff === 0) {
        proximityScore += weight * 10;
      } else if (diff <= 60) {
        proximityScore += weight * (4 - diff / 30);
      }
    }

    const matchCount = pool.filter((b) => b.startTime === slot).length;

    let reason = `Optimal open slot for ${eventTitle}`;
    if (source === 'event-history') {
      if (matchCount > 0) {
        reason = `Most common time for ${eventTitle} (${matchCount} past ${
          matchCount === 1 ? 'booking' : 'bookings'
        })`;
      } else if (closestHistoricalSlot) {
        reason = `Closest open time to your ${closestHistoricalSlot} ${eventTitle} pattern`;
      }
    } else if (source === 'overall-history') {
      if (matchCount > 0) {
        reason = `Matches your peak booking hour (${matchCount} past ${
          matchCount === 1 ? 'session' : 'sessions'
        })`;
      } else if (closestHistoricalSlot) {
        reason = `Near your frequent ${closestHistoricalSlot} schedule window`;
      }
    }

    return {
      slot,
      score: directFreq * 10 + proximityScore,
      matchCount,
      reason,
      source,
    };
  });

  scored.sort((a, b) => b.score - a.score || a.slot.localeCompare(b.slot));
  return scored.slice(0, limit);
}
