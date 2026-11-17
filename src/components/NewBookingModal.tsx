import { useEffect, useMemo, useState } from 'react';
import { Globe, Sparkles, X } from 'lucide-react';
import { STANDARD_TIME_SLOTS, TIMEZONES } from '../data/seedData';
import { Booking, BookingLocation, BookingStatus, EventType } from '../types/scheduling';
import { isSlotConflict } from '../utils/dateUtils';
import {
  convertSlotFromHostTimezone,
  getSmartSlotRecommendations,
} from '../utils/slotRecommendations';

interface NewBookingModalProps {
  open: boolean;
  initialDate: string;
  initialSlot: string | null;
  initialEventTypeId?: string | null;
  eventTypes: EventType[];
  bookings: Booking[];
  onClose: () => void;
  onCreate: (input: {
    title: string;
    eventTypeId: string;
    date: string;
    startTime: string;
    durationMinutes: number;
    status: BookingStatus;
    clientName: string;
    clientEmail: string;
    clientCompany: string;
    location: BookingLocation;
    notes: string;
  }) => void;
}

export function NewBookingModal({
  open,
  initialDate,
  initialSlot,
  initialEventTypeId,
  eventTypes,
  bookings,
  onClose,
  onCreate,
}: NewBookingModalProps) {
  const [eventTypeId, setEventTypeId] = useState(
    initialEventTypeId || eventTypes[0]?.id || 'evt-consultation'
  );
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(initialDate);
  const [startTime, setStartTime] = useState(initialSlot || '10:00');
  const [timezone, setTimezone] = useState(TIMEZONES[0].id);
  const [status, setStatus] = useState<BookingStatus>('confirmed');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientCompany, setClientCompany] = useState('');
  const [location, setLocation] = useState<BookingLocation>('Google Meet');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (open) {
      const targetEvtId = initialEventTypeId || eventTypes[0]?.id || 'evt-consultation';
      setEventTypeId(targetEvtId);
      setDate(initialDate);
      setStartTime(initialSlot || '10:00');
      const evt = eventTypes.find((e) => e.id === targetEvtId) ?? eventTypes[0];
      if (evt) {
        setLocation(evt.location);
      }
    }
  }, [open, initialDate, initialSlot, initialEventTypeId, eventTypes]);

  const selectedEvt = eventTypes.find((e) => e.id === eventTypeId) ?? eventTypes[0];
  const duration = selectedEvt?.durationMinutes ?? 30;
  const eventTitle = selectedEvt?.title ?? 'Consultation';

  const recommendations = useMemo(
    () =>
      getSmartSlotRecommendations(
        eventTypeId,
        eventTitle,
        date,
        duration,
        bookings,
        3
      ),
    [eventTypeId, eventTitle, date, duration, bookings]
  );

  const recommendedSlotSet = useMemo(
    () => new Set(recommendations.map((r) => r.slot)),
    [recommendations]
  );
  const topRecommendation = recommendations[0] ?? null;

  if (!open) return null;

  const selectedTzObj = TIMEZONES.find((t) => t.id === timezone) ?? TIMEZONES[0];
  const convertedSelected = convertSlotFromHostTimezone(startTime, timezone);
  const istConverted = convertSlotFromHostTimezone(startTime, 'Asia/Kolkata');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) return;
    onCreate({
      title: title.trim() || `${eventTitle} · ${clientName.trim()}`,
      eventTypeId,
      date,
      startTime,
      durationMinutes: duration,
      status,
      clientName: clientName.trim(),
      clientEmail: clientEmail.trim() || 'client@company.com',
      clientCompany: clientCompany.trim() || 'Partner Team',
      location,
      notes: notes.trim(),
    });
    setTitle('');
    setClientName('');
    setClientEmail('');
    setClientCompany('');
    setNotes('');
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-booking-heading"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0f172a]/30 backdrop-blur-[1px]"
    >
      <div className="w-full max-w-xl bg-white border border-[#cbd5e1] rounded-xl shadow-calm-3 overflow-hidden">
        <div className="px-6 py-4 border-b border-[#e2e8f0] flex items-center justify-between">
          <h2
            id="new-booking-heading"
            className="font-display text-[17px] font-semibold text-[#0f172a]"
          >
            New Appointment Commitment
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0f172a] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[84vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[12px] font-medium text-[#475569] mb-1">
                Service / Event Template
              </label>
              <select
                value={eventTypeId}
                onChange={(e) => {
                  const nextId = e.target.value;
                  setEventTypeId(nextId);
                  const found = eventTypes.find((x) => x.id === nextId);
                  if (found) setLocation(found.location);
                }}
                className="input-calm w-full px-3 py-2 text-[13px]"
              >
                {eventTypes.map((evt) => (
                  <option key={evt.id} value={evt.id}>
                    {evt.title} ({evt.durationMinutes}m)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-medium text-[#475569] mb-1">
                Initial Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as BookingStatus)}
                className="input-calm w-full px-3 py-2 text-[13px]"
              >
                <option value="confirmed">Confirmed</option>
                <option value="pending">Pending Confirmation</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-medium text-[#475569] mb-1">
              Appointment Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={`${eventTitle} · Client Sync`}
              className="input-calm w-full px-3 py-2 text-[13px]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-[12px] font-medium text-[#475569] mb-1">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="input-calm w-full px-3 py-2 text-[13px] tabular-nums"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-[#475569] mb-1">
                Location / Format
              </label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value as BookingLocation)}
                className="input-calm w-full px-3 py-2 text-[13px]"
              >
                <option value="Google Meet">Google Meet</option>
                <option value="Zoom">Zoom</option>
                <option value="Studio B · SF">Studio B · SF</option>
                <option value="Phone Call">Phone Call</option>
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-medium text-[#475569] mb-1">
                Display Timezone
              </label>
              <div className="relative">
                <Globe className="w-3.5 h-3.5 text-[#64748b] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  aria-label="Timezone"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="input-calm w-full pl-8 pr-2 py-2 text-[12px] text-[#0f172a]"
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

          {/* Smart Time Slot Recommendation Banner */}
          {topRecommendation && (
            <div className="p-3.5 rounded-xl bg-[#f8fafc] border border-[#c7c4d8] space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-[12px] font-semibold text-[#3525cd]">
                  <Sparkles className="w-3.5 h-3.5 text-[#4f46e5] shrink-0" />
                  <span>Smart Time Slot Recommendations</span>
                </div>
                <span className="text-[11px] font-mono tabular-nums text-[#64748b]">
                  {selectedTzObj.offset}
                </span>
              </div>

              <p className="text-[12px] text-[#475569] leading-snug">
                {topRecommendation.reason}
              </p>

              <div className="flex flex-wrap items-center gap-2">
                {recommendations.map((rec, idx) => {
                  const conv = convertSlotFromHostTimezone(rec.slot, timezone);
                  const isActive = startTime === rec.slot;
                  return (
                    <button
                      key={rec.slot}
                      type="button"
                      onClick={() => setStartTime(rec.slot)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[12px] font-mono tabular-nums transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#4f46e5] text-white border-[#4f46e5] shadow-slot-active'
                          : 'bg-white text-[#3525cd] border-[#c7c4d8] hover:border-[#4f46e5]'
                      }`}
                    >
                      <span>{conv.time}</span>
                      {conv.dayShift && (
                        <span className="text-[10px] opacity-80">{conv.dayShift}</span>
                      )}
                      {idx === 0 && (
                        <span
                          className={`text-[10px] font-sans font-semibold ${
                            isActive ? 'text-[#dad7ff]' : 'text-[#4f46e5]'
                          }`}
                        >
                          · Best
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Discrete Time Slot Selector Grid */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
              <span className="text-[12px] font-medium text-[#475569]">
                Time Slot ({duration} min)
              </span>
              <span className="text-[11px] font-mono tabular-nums text-[#64748b]">
                Selected: {convertedSelected.time} {selectedTzObj.offset}
                {timezone !== 'Asia/Kolkata'
                  ? ` · ${istConverted.time} IST${istConverted.dayShift ? ` (${istConverted.dayShift})` : ''}`
                  : ''}
              </span>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5">
              {STANDARD_TIME_SLOTS.map((slot) => {
                const conflict = isSlotConflict(date, slot, duration, bookings);
                const selected = startTime === slot && !conflict;
                const isRecommended = !conflict && recommendedSlotSet.has(slot);
                const conv = convertSlotFromHostTimezone(slot, timezone);

                return (
                  <button
                    key={slot}
                    type="button"
                    disabled={conflict}
                    onClick={() => setStartTime(slot)}
                    title={
                      isRecommended
                        ? `Recommended for ${eventTitle}`
                        : `${conv.time} (${selectedTzObj.label})`
                    }
                    className={`relative py-1.5 px-2 rounded-lg border text-[12px] font-mono tabular-nums transition-all ${
                      conflict
                        ? 'bg-[#f8fafc] text-[#94a3b8] border-dashed border-[#e2e8f0] cursor-not-allowed line-through'
                        : selected
                        ? 'bg-[#4f46e5] text-white border-[#4f46e5] shadow-slot-active cursor-pointer'
                        : isRecommended
                        ? 'bg-[#e2dfff]/30 text-[#3525cd] border-[#4f46e5]/45 hover:border-[#4f46e5] cursor-pointer font-medium'
                        : 'bg-white text-[#0f172a] border-[#e2e8f0] hover:border-[#cbd5e1] cursor-pointer'
                    }`}
                  >
                    <span>{conv.time}</span>
                    {isRecommended && !selected && (
                      <Sparkles
                        className="w-2.5 h-2.5 text-[#4f46e5] absolute top-1 right-1"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[12px] font-medium text-[#475569] mb-1">
                Client Name *
              </label>
              <input
                type="text"
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Jane Doe"
                className="input-calm w-full px-3 py-2 text-[13px]"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-[#475569] mb-1">
                Email
              </label>
              <input
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="jane@acme.io"
                className="input-calm w-full px-3 py-2 text-[13px]"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-[#475569] mb-1">
                Company
              </label>
              <input
                type="text"
                value={clientCompany}
                onChange={(e) => setClientCompany(e.target.value)}
                placeholder="Acme Corp"
                className="input-calm w-full px-3 py-2 text-[13px]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-medium text-[#475569] mb-1">
              Agenda Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Key topics or preparation links..."
              className="input-calm w-full px-3 py-2 text-[13px] resize-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-[#e2e8f0]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-[#e2e8f0] bg-white hover:bg-[#f1f5f9] text-[13px] font-medium text-[#0f172a] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#4f46e5] hover:bg-[#4338ca] text-white text-[13px] font-medium cursor-pointer"
            >
              Create Commitment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
