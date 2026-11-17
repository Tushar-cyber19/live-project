import { Booking } from '../types/scheduling';

export function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function formatIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDays(iso: string, delta: number): string {
  const d = parseIsoDate(iso);
  d.setDate(d.getDate() + delta);
  return formatIsoDate(d);
}

export function formatReadableDate(iso: string): string {
  const d = parseIsoDate(iso);
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatShortDate(iso: string): string {
  const d = parseIsoDate(iso);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export function minutesToTime(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function getEndTime(startTime: string, durationMinutes: number): string {
  return minutesToTime(timeToMinutes(startTime) + durationMinutes);
}

export function getWeekDays(anchorIso: string): string[] {
  const d = parseIsoDate(anchorIso);
  const day = d.getDay(); // 0=Sun, 1=Mon
  const diffToMon = day === 0 ? -6 : 1 - day;
  const mon = new Date(d);
  mon.setDate(d.getDate() + diffToMon);
  return Array.from({ length: 5 }, (_, i) => {
    const cur = new Date(mon);
    cur.setDate(mon.getDate() + i);
    return formatIsoDate(cur);
  });
}

export function getMonthGrid(year: number, monthIndex: number): Array<{ iso: string; inMonth: boolean; dayNumber: number }> {
  const firstDay = new Date(year, monthIndex, 1);
  const startWeekday = firstDay.getDay(); // 0=Sun
  const startDate = new Date(year, monthIndex, 1 - startWeekday);

  const cells: Array<{ iso: string; inMonth: boolean; dayNumber: number }> = [];
  for (let i = 0; i < 42; i++) {
    const cur = new Date(startDate);
    cur.setDate(startDate.getDate() + i);
    cells.push({
      iso: formatIsoDate(cur),
      inMonth: cur.getMonth() === monthIndex,
      dayNumber: cur.getDate(),
    });
  }
  return cells;
}

export function isSlotConflict(
  dateIso: string,
  slotStart: string,
  durationMinutes: number,
  bookings: Booking[],
  excludeBookingId?: string
): boolean {
  const s1 = timeToMinutes(slotStart);
  const e1 = s1 + durationMinutes;

  return bookings.some((b) => {
    if (b.id === excludeBookingId) return false;
    if (b.status === 'cancelled') return false;
    if (b.date !== dateIso) return false;
    const s2 = timeToMinutes(b.startTime);
    const e2 = s2 + b.durationMinutes;
    return s1 < e2 && s2 < e1;
  });
}
