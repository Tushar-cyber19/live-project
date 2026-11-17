import { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Plus,
  Search,
  Video,
} from 'lucide-react';
import { TODAY_ISO } from '../data/seedData';
import { Booking, BookingStatus } from '../types/scheduling';
import {
  addDays,
  formatReadableDate,
  formatShortDate,
  getEndTime,
  getWeekDays,
  parseIsoDate,
  timeToMinutes,
} from '../utils/dateUtils';
import { Avatar } from './Avatar';
import { StatusBadge } from './StatusBadge';

interface ScheduleViewProps {
  selectedDate: string;
  onSelectDate: (iso: string) => void;
  bookings: Booking[];
  statusFilters: Record<BookingStatus, boolean>;
  selectedBookingId: string | null;
  onSelectBooking: (id: string) => void;
  onQuickCreateAtSlot: (dateIso: string, startTime: string) => void;
  onResetFilters: () => void;
}

const TIMELINE_HOURS = Array.from({ length: 10 }, (_, i) => 8 + i); // 08:00 to 17:00

export function ScheduleView({
  selectedDate,
  onSelectDate,
  bookings,
  statusFilters,
  selectedBookingId,
  onSelectBooking,
  onQuickCreateAtSlot,
  onResetFilters,
}: ScheduleViewProps) {
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [searchQuery, setSearchQuery] = useState('');

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const matchesFilter = (b: Booking) => {
    if (!statusFilters[b.status]) return false;
    if (!normalizedQuery) return true;
    return (
      b.title.toLowerCase().includes(normalizedQuery) ||
      b.clientName.toLowerCase().includes(normalizedQuery) ||
      b.clientCompany.toLowerCase().includes(normalizedQuery) ||
      b.location.toLowerCase().includes(normalizedQuery)
    );
  };

  const dayBookings = bookings
    .filter((b) => b.date === selectedDate && matchesFilter(b))
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

  const confirmedToday = bookings.filter(
    (b) => b.date === selectedDate && b.status === 'confirmed'
  ).length;
  const pendingToday = bookings.filter(
    (b) => b.date === selectedDate && b.status === 'pending'
  ).length;
  const bookedMinutesToday = bookings
    .filter((b) => b.date === selectedDate && b.status !== 'cancelled')
    .reduce((sum, b) => sum + b.durationMinutes, 0);
  const openHoursToday = Math.max(0, 8 - bookedMinutesToday / 60);

  const weekDays = getWeekDays(selectedDate);

  const shiftRange = (direction: -1 | 1) => {
    onSelectDate(addDays(selectedDate, viewMode === 'week' ? direction * 7 : direction));
  };

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Top Toolbar */}
      <div className="px-6 lg:px-8 pt-6 pb-5 border-b border-[#e2e8f0] bg-[#ffffff] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-0.5">
            <h1 className="font-display text-[22px] sm:text-[26px] font-semibold tracking-[-0.02em] text-[#0f172a]">
              {viewMode === 'day'
                ? formatReadableDate(selectedDate)
                : `Week of ${formatShortDate(weekDays[0])}`}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-[13px] text-[#475569] tabular-nums">
              <span>{confirmedToday} confirmed</span>
              <span aria-hidden="true" className="text-[#cbd5e1]">·</span>
              <span>{pendingToday} pending</span>
              <span aria-hidden="true" className="text-[#cbd5e1]">·</span>
              <span>{openHoursToday.toFixed(1).replace(/\.0$/, '')}h open capacity</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-[#94a3b8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search schedule..."
                aria-label="Search schedule"
                className="input-calm pl-9 pr-3 py-1.5 w-48 sm:w-56 text-[13px] text-[#0f172a] placeholder:text-[#94a3b8]"
              />
            </div>

            {/* Date Navigation */}
            <div className="inline-flex items-center rounded-lg border border-[#e2e8f0] bg-white overflow-hidden">
              <button
                type="button"
                onClick={() => shiftRange(-1)}
                aria-label={viewMode === 'week' ? 'Previous week' : 'Previous day'}
                className="p-2 text-[#475569] hover:bg-[#f1f5f9] hover:text-[#0f172a] transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onSelectDate(TODAY_ISO)}
                className="px-3 py-1.5 text-[13px] font-medium text-[#0f172a] hover:bg-[#f1f5f9] border-x border-[#e2e8f0] transition-colors cursor-pointer whitespace-nowrap"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => shiftRange(1)}
                aria-label={viewMode === 'week' ? 'Next week' : 'Next day'}
                className="p-2 text-[#475569] hover:bg-[#f1f5f9] hover:text-[#0f172a] transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Day / Week Segmented Switch */}
            <div className="inline-flex items-center p-1 rounded-lg bg-[#f1f5f9] border border-[#e2e8f0]">
              <button
                type="button"
                onClick={() => setViewMode('day')}
                className={`px-3 py-1 rounded-md text-[13px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  viewMode === 'day'
                    ? 'bg-white text-[#0f172a] shadow-calm-1'
                    : 'text-[#475569] hover:text-[#0f172a]'
                }`}
              >
                Day
              </button>
              <button
                type="button"
                onClick={() => setViewMode('week')}
                className={`px-3 py-1 rounded-md text-[13px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  viewMode === 'week'
                    ? 'bg-white text-[#0f172a] shadow-calm-1'
                    : 'text-[#475569] hover:text-[#0f172a]'
                }`}
              >
                Week
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 lg:p-8">
        {viewMode === 'day' ? (
          <div className="max-w-4xl space-y-6">
            {/* Day Chronological Timeline */}
            {dayBookings.length === 0 && (
              <div className="bg-white border border-[#e2e8f0] rounded-xl p-8 text-center shadow-calm-1 space-y-3">
                <div className="font-display text-[16px] font-semibold text-[#0f172a]">
                  No appointments match your current view
                </div>
                <p className="text-[13px] text-[#64748b] max-w-md mx-auto">
                  {normalizedQuery || Object.values(statusFilters).some((v) => !v)
                    ? 'Try clearing your search query or re-enabling status filters in the left rail.'
                    : 'This day is open. Select any time slot below to coordinate a new commitment.'}
                </p>
                <div className="flex items-center justify-center gap-2 pt-1">
                  {(normalizedQuery || Object.values(statusFilters).some((v) => !v)) && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        onResetFilters();
                      }}
                      className="px-3.5 py-2 rounded-lg border border-[#e2e8f0] bg-white hover:bg-[#f1f5f9] text-[13px] font-medium text-[#0f172a] transition-colors cursor-pointer"
                    >
                      Reset Filters
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onQuickCreateAtSlot(selectedDate, '10:00')}
                    className="px-4 py-2 rounded-lg bg-[#4f46e5] hover:bg-[#4338ca] text-white text-[13px] font-medium transition-colors cursor-pointer"
                  >
                    Schedule Appointment
                  </button>
                </div>
              </div>
            )}

            <div className="divide-y divide-[#e2e8f0] border border-[#e2e8f0] rounded-xl bg-white shadow-calm-1 overflow-hidden">
              {TIMELINE_HOURS.map((hour) => {
                const hourStr = `${String(hour).padStart(2, '0')}:00`;
                const slotBookings = dayBookings.filter((b) => {
                  const startHour = Math.floor(timeToMinutes(b.startTime) / 60);
                  return startHour === hour;
                });
                const isCurrentHour = selectedDate === TODAY_ISO && hour === 11;

                return (
                  <div
                    key={hour}
                    className="relative flex flex-col sm:flex-row min-h-[76px]"
                  >
                    {isCurrentHour && (
                      <div
                        aria-label="Current time indicator"
                        className="absolute left-0 right-0 top-2 border-t border-[#4f46e5]/50 pointer-events-none z-10 flex items-center"
                      >
                        <span className="ml-2 -mt-2.5 px-1.5 py-0.5 rounded bg-[#4f46e5] text-white text-[10px] font-mono tabular-nums font-medium">
                          11:04
                        </span>
                      </div>
                    )}

                    {/* Hour Rail */}
                    <div className="sm:w-24 shrink-0 px-4 py-3.5 sm:border-r border-[#e2e8f0] bg-[#f8fafc]/60 flex items-start justify-between sm:justify-end">
                      <span className="font-mono text-[12px] font-medium tabular-nums text-[#64748b]">
                        {hourStr}
                      </span>
                    </div>

                    {/* Slot Content */}
                    <div className="flex-1 p-3 space-y-2.5">
                      {slotBookings.length > 0 ? (
                        slotBookings.map((booking) => {
                          const isSelected = booking.id === selectedBookingId;
                          const endTime = getEndTime(booking.startTime, booking.durationMinutes);
                          return (
                            <button
                              key={booking.id}
                              type="button"
                              onClick={() => onSelectBooking(booking.id)}
                              className={`w-full text-left rounded-xl p-4 border transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-[#e2dfff]/20 border-[#4f46e5] shadow-calm-2'
                                  : 'bg-white border-[#e2e8f0] shadow-calm-1 hover:border-[#cbd5e1] hover:shadow-calm-2'
                              }`}
                            >
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="space-y-1.5 min-w-0">
                                  <div className="flex flex-wrap items-center gap-2.5">
                                    <span className="font-display text-[15px] font-semibold text-[#0f172a] tracking-[-0.01em]">
                                      {booking.title}
                                    </span>
                                    <StatusBadge status={booking.status} />
                                  </div>

                                  <div className="flex flex-wrap items-center gap-2 text-[13px] text-[#475569]">
                                    <span className="font-mono tabular-nums text-[#0f172a] font-medium">
                                      {booking.startTime} – {endTime}
                                    </span>
                                    <span aria-hidden="true" className="text-[#cbd5e1]">·</span>
                                    <span className="tabular-nums">{booking.durationMinutes} min</span>
                                    <span aria-hidden="true" className="text-[#cbd5e1]">·</span>
                                    <span className="inline-flex items-center gap-1">
                                      {booking.location === 'Studio B · SF' ? (
                                        <MapPin className="w-3.5 h-3.5 text-[#64748b]" />
                                      ) : (
                                        <Video className="w-3.5 h-3.5 text-[#64748b]" />
                                      )}
                                      <span>{booking.location}</span>
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2.5 shrink-0">
                                  <div className="text-right hidden sm:block">
                                    <div className="text-[13px] font-medium text-[#0f172a]">
                                      {booking.clientName}
                                    </div>
                                    <div className="text-[12px] text-[#64748b]">
                                      {booking.clientCompany}
                                    </div>
                                  </div>
                                  <Avatar
                                    src={booking.clientAvatar}
                                    name={booking.clientName}
                                    size="md"
                                  />
                                </div>
                              </div>
                            </button>
                          );
                        })
                      ) : (
                        <button
                          type="button"
                          onClick={() => onQuickCreateAtSlot(selectedDate, hourStr)}
                          className="group w-full h-12 rounded-lg border border-dashed border-transparent hover:border-[#cbd5e1] hover:bg-[#f8fafc] flex items-center justify-between px-3 text-[12px] text-[#94a3b8] hover:text-[#4f46e5] transition-colors cursor-pointer"
                        >
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                              Open slot · Schedule at {hourStr}
                            </span>
                          </span>
                          <Plus className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Week Matrix View */
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {weekDays.map((dayIso) => {
              const d = parseIsoDate(dayIso);
              const isSelected = dayIso === selectedDate;
              const isToday = dayIso === TODAY_ISO;
              const items = bookings
                .filter((b) => b.date === dayIso && matchesFilter(b))
                .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

              return (
                <div
                  key={dayIso}
                  className={`flex flex-col rounded-xl border bg-white shadow-calm-1 overflow-hidden min-h-[420px] ${
                    isSelected ? 'border-[#4f46e5]' : 'border-[#e2e8f0]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      onSelectDate(dayIso);
                      setViewMode('day');
                    }}
                    className={`px-4 py-3 border-b border-[#e2e8f0] text-left flex items-center justify-between transition-colors cursor-pointer ${
                      isSelected ? 'bg-[#e2dfff]/35' : 'bg-[#f8fafc]/70 hover:bg-[#f1f5f9]'
                    }`}
                  >
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#64748b]">
                        {d.toLocaleDateString('en-US', { weekday: 'short' })}
                      </div>
                      <div className="font-display text-[16px] font-semibold text-[#0f172a] tabular-nums">
                        {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                    {isToday && (
                      <span className="text-[11px] font-semibold text-[#4f46e5]">Today</span>
                    )}
                  </button>

                  <div className="flex-1 p-2.5 space-y-2">
                    {items.length === 0 ? (
                      <button
                        type="button"
                        onClick={() => onQuickCreateAtSlot(dayIso, '10:00')}
                        className="w-full h-24 rounded-lg border border-dashed border-[#e2e8f0] hover:border-[#4f46e5]/50 hover:bg-[#f8fafc] text-[12px] text-[#94a3b8] hover:text-[#4f46e5] flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add slot</span>
                      </button>
                    ) : (
                      items.map((booking) => {
                        const selected = booking.id === selectedBookingId;
                        return (
                          <button
                            key={booking.id}
                            type="button"
                            onClick={() => onSelectBooking(booking.id)}
                            className={`w-full text-left p-3 rounded-lg border transition-all cursor-pointer space-y-1.5 ${
                              selected
                                ? 'bg-[#e2dfff]/25 border-[#4f46e5]'
                                : 'bg-white border-[#e2e8f0] hover:border-[#cbd5e1] hover:shadow-calm-1'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-mono text-[11px] font-medium tabular-nums text-[#475569]">
                                {booking.startTime} · {booking.durationMinutes}m
                              </span>
                              <StatusBadge status={booking.status} />
                            </div>
                            <div className="text-[13px] font-semibold text-[#0f172a] leading-snug line-clamp-2">
                              {booking.title}
                            </div>
                            <div className="text-[12px] text-[#64748b] truncate">
                              {booking.clientName}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
