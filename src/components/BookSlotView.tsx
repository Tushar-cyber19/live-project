import { useMemo, useState } from 'react';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Globe,
  MapPin,
  Sparkles,
  Video,
} from 'lucide-react';
import { STANDARD_TIME_SLOTS, TIMEZONES } from '../data/seedData';
import { Booking, EventType, HostProfile } from '../types/scheduling';
import {
  formatReadableDate,
  getEndTime,
  getMonthGrid,
  isSlotConflict,
  parseIsoDate,
} from '../utils/dateUtils';
import {
  convertSlotFromHostTimezone,
  getSmartSlotRecommendations,
} from '../utils/slotRecommendations';
import { Avatar } from './Avatar';

interface BookSlotViewProps {
  host: HostProfile;
  eventTypes: EventType[];
  bookings: Booking[];
  selectedEventTypeId: string;
  onSelectEventTypeId: (id: string) => void;
  selectedDate: string;
  onSelectDate: (iso: string) => void;
  onCreateBooking: (input: {
    title: string;
    eventTypeId: string;
    date: string;
    startTime: string;
    durationMinutes: number;
    clientName: string;
    clientEmail: string;
    clientCompany: string;
    location: EventType['location'];
    notes: string;
  }) => string;
  onViewInSchedule: (dateIso: string, bookingId: string) => void;
}

export function BookSlotView({
  host,
  eventTypes,
  bookings,
  selectedEventTypeId,
  onSelectEventTypeId,
  selectedDate,
  onSelectDate,
  onCreateBooking,
  onViewInSchedule,
}: BookSlotViewProps) {
  const activeEventTypes = eventTypes.filter((e) => e.active);
  const currentEvent =
    eventTypes.find((e) => e.id === selectedEventTypeId) ?? activeEventTypes[0] ?? eventTypes[0];

  const parsed = parseIsoDate(selectedDate);
  const [calMonth, setCalMonth] = useState({
    year: parsed.getFullYear(),
    month: parsed.getMonth(),
  });
  const [timezone, setTimezone] = useState(TIMEZONES[0].id);
  const [selectedSlot, setSelectedSlot] = useState<string | null>('10:30');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientCompany, setClientCompany] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');
  const [confirmedInfo, setConfirmedInfo] = useState<{
    bookingId: string;
    date: string;
    slot: string;
    clientName: string;
  } | null>(null);

  const recommendations = useMemo(
    () =>
      getSmartSlotRecommendations(
        currentEvent.id,
        currentEvent.title,
        selectedDate,
        currentEvent.durationMinutes,
        bookings,
        2
      ),
    [currentEvent.id, currentEvent.title, selectedDate, currentEvent.durationMinutes, bookings]
  );

  const recommendedSet = useMemo(
    () => new Set(recommendations.map((r) => r.slot)),
    [recommendations]
  );

  const cells = getMonthGrid(calMonth.year, calMonth.month);
  const monthLabel = new Date(calMonth.year, calMonth.month, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const selectedTz = TIMEZONES.find((t) => t.id === timezone) ?? TIMEZONES[0];

  const shiftMonth = (delta: number) => {
    setCalMonth((prev) => {
      const next = new Date(prev.year, prev.month + delta, 1);
      return { year: next.getFullYear(), month: next.getMonth() };
    });
  };

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) {
      setFormError('Please select an available time slot.');
      return;
    }
    if (!clientName.trim() || !clientEmail.trim()) {
      setFormError('Please enter your name and work email.');
      return;
    }
    setFormError('');

    const createdId = onCreateBooking({
      title: `${currentEvent.title} · ${clientCompany.trim() || clientName.trim()}`,
      eventTypeId: currentEvent.id,
      date: selectedDate,
      startTime: selectedSlot,
      durationMinutes: currentEvent.durationMinutes,
      clientName: clientName.trim(),
      clientEmail: clientEmail.trim(),
      clientCompany: clientCompany.trim() || 'Independent',
      location: currentEvent.location,
      notes: notes.trim() || `Booked via Cadence (${timezone}).`,
    });

    setConfirmedInfo({
      bookingId: createdId,
      date: selectedDate,
      slot: selectedSlot,
      clientName: clientName.trim(),
    });
    setClientName('');
    setClientEmail('');
    setClientCompany('');
    setNotes('');
    setSelectedSlot(null);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="space-y-1">
          <h1 className="font-display text-[24px] font-semibold tracking-[-0.02em] text-[#0f172a]">
            Interactive Time Slot Selector
          </h1>
          <p className="text-[14px] text-[#475569]">
            Select a service template, date, timezone (including IST), and open time slot.
          </p>
        </div>

        {confirmedInfo ? (
          <div className="bg-white border border-[#e2e8f0] rounded-xl p-8 shadow-calm-2 max-w-xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#ecfdf5] border border-[#a7f3d0] flex items-center justify-center text-[#047857]">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-display text-[18px] font-semibold text-[#0f172a]">
                  Appointment Confirmed
                </h2>
                <p className="text-[13px] text-[#475569]">
                  Calendar invitation prepared for {confirmedInfo.clientName}.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-[#f8fafc] border border-[#e2e8f0] space-y-1.5 text-[13px]">
              <div className="font-semibold text-[#0f172a]">{currentEvent.title}</div>
              <div className="text-[#475569]">
                {formatReadableDate(confirmedInfo.date)} ·{' '}
                <span className="font-mono tabular-nums text-[#0f172a]">
                  {confirmedInfo.slot} – {getEndTime(confirmedInfo.slot, currentEvent.durationMinutes)}
                </span>
              </div>
              <div className="text-[#64748b]">{currentEvent.location} · {selectedTz.label}</div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => onViewInSchedule(confirmedInfo.date, confirmedInfo.bookingId)}
                className="px-4 py-2 rounded-lg bg-[#4f46e5] hover:bg-[#4338ca] text-white text-[13px] font-medium transition-colors cursor-pointer"
              >
                View in Schedule
              </button>
              <button
                type="button"
                onClick={() => setConfirmedInfo(null)}
                className="px-4 py-2 rounded-lg border border-[#e2e8f0] bg-white hover:bg-[#f1f5f9] text-[#0f172a] text-[13px] font-medium transition-colors cursor-pointer"
              >
                Book Another Slot
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-[#e2e8f0] rounded-xl shadow-calm-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
            {/* Left Column: Host & Event Type Selection */}
            <div className="lg:col-span-4 p-6 border-b lg:border-b-0 lg:border-r border-[#e2e8f0] bg-[#f8fafc]/40 space-y-6">
              <div className="flex items-center gap-3">
                <Avatar src={host.avatar} name={host.name} size="lg" />
                <div>
                  <div className="text-[12px] font-medium text-[#64748b]">Host</div>
                  <div className="font-display text-[16px] font-semibold text-[#0f172a]">
                    {host.name}
                  </div>
                  <div className="text-[12px] text-[#64748b]">{host.role}</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#64748b]">
                  Select Service
                </div>
                <div className="space-y-2">
                  {activeEventTypes.map((evt) => {
                    const active = evt.id === currentEvent.id;
                    return (
                      <button
                        key={evt.id}
                        type="button"
                        onClick={() => {
                          onSelectEventTypeId(evt.id);
                          setSelectedSlot(null);
                        }}
                        className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                          active
                            ? 'bg-white border-[#4f46e5] shadow-calm-1'
                            : 'bg-white/70 border-[#e2e8f0] hover:border-[#cbd5e1] hover:bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-display text-[14px] font-semibold text-[#0f172a]">
                            {evt.title}
                          </span>
                          <span className="font-mono text-[12px] tabular-nums text-[#475569]">
                            {evt.durationMinutes}m
                          </span>
                        </div>
                        <p className="text-[12px] text-[#64748b] mt-1 line-clamp-2">
                          {evt.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 border-t border-[#e2e8f0] space-y-2.5 text-[13px] text-[#475569]">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#64748b]" />
                  <span className="tabular-nums">{currentEvent.durationMinutes} minutes</span>
                </div>
                <div className="flex items-center gap-2">
                  {currentEvent.location === 'Studio B · SF' ? (
                    <MapPin className="w-4 h-4 text-[#64748b]" />
                  ) : (
                    <Video className="w-4 h-4 text-[#64748b]" />
                  )}
                  <span>{currentEvent.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-[#64748b] shrink-0" />
                  <select
                    aria-label="Timezone"
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="input-calm w-full px-2.5 py-1.5 text-[12px] text-[#0f172a]"
                  >
                    {TIMEZONES.map((tz) => (
                      <option key={tz.id} value={tz.id}>
                        {tz.label} ({tz.offset})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Middle Column: Date Picker */}
            <div className="lg:col-span-4 p-6 border-b lg:border-b-0 lg:border-r border-[#e2e8f0] space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-[15px] font-semibold text-[#0f172a]">
                  {monthLabel}
                </h2>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => shiftMonth(-1)}
                    aria-label="Previous month"
                    className="p-1.5 rounded-lg border border-[#e2e8f0] hover:bg-[#f1f5f9] text-[#475569] cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => shiftMonth(1)}
                    aria-label="Next month"
                    className="p-1.5 rounded-lg border border-[#e2e8f0] hover:bg-[#f1f5f9] text-[#475569] cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 text-center text-[11px] font-semibold uppercase tracking-[0.04em] text-[#94a3b8]">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                  <div key={d} className="py-1">
                    {d}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1.5">
                {cells.map((cell) => {
                  const dt = parseIsoDate(cell.iso);
                  const weekday = dt.getDay();
                  const isWeekend = weekday === 0 || weekday === 6;
                  const disabled = !cell.inMonth || isWeekend;
                  const active = cell.iso === selectedDate;

                  return (
                    <button
                      key={cell.iso}
                      type="button"
                      disabled={disabled}
                      onClick={() => {
                        onSelectDate(cell.iso);
                        setSelectedSlot(null);
                      }}
                      className={`h-10 rounded-lg text-[13px] font-medium tabular-nums transition-all ${
                        disabled
                          ? 'text-[#cbd5e1] cursor-not-allowed'
                          : active
                          ? 'bg-[#4f46e5] text-white shadow-slot-active cursor-pointer'
                          : 'bg-[#f8fafc] text-[#0f172a] hover:bg-[#e2dfff]/50 hover:text-[#3525cd] cursor-pointer'
                      }`}
                    >
                      {cell.dayNumber}
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 text-[12px] text-[#64748b] flex items-center justify-between">
                <span>Selected date</span>
                <span className="font-medium text-[#0f172a]">
                  {formatReadableDate(selectedDate)}
                </span>
              </div>
            </div>

            {/* Right Column: Time Slot Selector Grid & Confirmation Form */}
            <div className="lg:col-span-4 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-[15px] font-semibold text-[#0f172a]">
                  Available Time Slots
                </h2>
                <span className="text-[12px] text-[#64748b] tabular-nums">
                  {selectedTz.offset}
                </span>
              </div>

              {recommendations[0] && (
                <div className="p-2.5 rounded-lg bg-[#e2dfff]/35 border border-[#c7c4d8] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Sparkles className="w-3.5 h-3.5 text-[#4f46e5] shrink-0" />
                    <span className="text-[12px] text-[#3525cd] truncate">
                      {recommendations[0].reason}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedSlot(recommendations[0].slot)}
                    className="px-2 py-1 rounded-md bg-[#4f46e5] text-white text-[11px] font-mono tabular-nums shrink-0 cursor-pointer"
                  >
                    {convertSlotFromHostTimezone(recommendations[0].slot, timezone).time}
                  </button>
                </div>
              )}

              {/* Product-Specific Time Slot Selectors from Calm Utility Spec */}
              <div className="grid grid-cols-2 gap-2">
                {STANDARD_TIME_SLOTS.map((slot) => {
                  const conflict = isSlotConflict(
                    selectedDate,
                    slot,
                    currentEvent.durationMinutes,
                    bookings
                  );
                  const active = selectedSlot === slot && !conflict;
                  const isRec = !conflict && recommendedSet.has(slot);
                  const conv = convertSlotFromHostTimezone(slot, timezone);

                  return (
                    <button
                      key={slot}
                      type="button"
                      disabled={conflict}
                      onClick={() => setSelectedSlot(slot)}
                      className={`relative py-2.5 px-3 rounded-lg border text-[13px] font-mono tabular-nums font-medium transition-all ${
                        conflict
                          ? 'bg-[#f8fafc] text-[#94a3b8] border-dashed border-[#e2e8f0] cursor-not-allowed line-through'
                          : active
                          ? 'bg-[#4f46e5] text-white border-[#4f46e5] shadow-slot-active cursor-pointer'
                          : isRec
                          ? 'bg-[#e2dfff]/25 text-[#3525cd] border-[#4f46e5]/45 hover:border-[#4f46e5] cursor-pointer'
                          : 'bg-white text-[#0f172a] border-[#e2e8f0] hover:border-[#cbd5e1] hover:bg-[#f8fafc] cursor-pointer'
                      }`}
                    >
                      <span>{conv.time}</span>
                      {conv.dayShift && (
                        <span className="ml-1 text-[10px] opacity-75">{conv.dayShift}</span>
                      )}
                      {isRec && !active && (
                        <Sparkles
                          className="w-3 h-3 text-[#4f46e5] absolute top-1.5 right-1.5"
                          aria-hidden="true"
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Attendee Details Form */}
              <form onSubmit={handleConfirm} className="pt-4 border-t border-[#e2e8f0] space-y-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#64748b]">
                  {selectedSlot
                    ? `Confirm ${convertSlotFromHostTimezone(selectedSlot, timezone).time} (${selectedTz.offset})`
                    : 'Choose a slot above'}
                </div>

                {formError && (
                  <div className="p-2.5 rounded-lg bg-[#fff1f2] border border-[#fecdd3] text-[12px] text-[#be123c]">
                    {formError}
                  </div>
                )}

                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Full name"
                  className="input-calm w-full px-3 py-2 text-[13px] text-[#0f172a] placeholder:text-[#94a3b8]"
                />
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="Work email"
                  className="input-calm w-full px-3 py-2 text-[13px] text-[#0f172a] placeholder:text-[#94a3b8]"
                />
                <input
                  type="text"
                  value={clientCompany}
                  onChange={(e) => setClientCompany(e.target.value)}
                  placeholder="Company or team (optional)"
                  className="input-calm w-full px-3 py-2 text-[13px] text-[#0f172a] placeholder:text-[#94a3b8]"
                />
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Agenda context (optional)"
                  className="input-calm w-full px-3 py-2 text-[13px] text-[#0f172a] placeholder:text-[#94a3b8] resize-none"
                />

                <button
                  type="submit"
                  disabled={!selectedSlot}
                  className={`w-full py-2.5 px-4 rounded-lg text-[13px] font-medium transition-all ${
                    selectedSlot
                      ? 'bg-[#4f46e5] hover:bg-[#4338ca] active:scale-[0.99] text-white cursor-pointer'
                      : 'bg-[#f1f5f9] text-[#94a3b8] cursor-not-allowed'
                  }`}
                >
                  Confirm Booking
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
