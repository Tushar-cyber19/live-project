import { useEffect, useState } from 'react';
import {
  Calendar,
  Check,
  Clock,
  Copy,
  MapPin,
  Trash2,
  Video,
  X,
} from 'lucide-react';
import { STANDARD_TIME_SLOTS } from '../data/seedData';
import { Booking, BookingStatus } from '../types/scheduling';
import { formatReadableDate, getEndTime, isSlotConflict } from '../utils/dateUtils';
import { Avatar } from './Avatar';
import { StatusBadge } from './StatusBadge';

interface BookingDetailDrawerProps {
  booking: Booking | null;
  allBookings: Booking[];
  onClose: () => void;
  onUpdateStatus: (id: string, status: BookingStatus) => void;
  onUpdateNotes: (id: string, notes: string) => void;
  onReschedule: (id: string, date: string, startTime: string) => void;
  onDelete: (id: string) => void;
}

export function BookingDetailDrawer({
  booking,
  allBookings,
  onClose,
  onUpdateStatus,
  onUpdateNotes,
  onReschedule,
  onDelete,
}: BookingDetailDrawerProps) {
  const [notesDraft, setNotesDraft] = useState('');
  const [notesSaved, setNotesSaved] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);
  const [nextDate, setNextDate] = useState('');
  const [nextSlot, setNextSlot] = useState('');

  useEffect(() => {
    if (booking) {
      setNotesDraft(booking.notes);
      setNotesSaved(false);
      setCopiedUrl(false);
      setRescheduling(false);
      setNextDate(booking.date);
      setNextSlot(booking.startTime);
    }
  }, [booking]);

  if (!booking) return null;

  const endTime = getEndTime(booking.startTime, booking.durationMinutes);
  const isCancelled = booking.status === 'cancelled';

  const handleSaveNotes = () => {
    if (isCancelled) return;
    onUpdateNotes(booking.id, notesDraft);
    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 1800);
  };

  const handleCopyUrl = () => {
    if (!booking.meetingUrl) return;
    navigator.clipboard?.writeText(booking.meetingUrl).catch(() => {});
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 1800);
  };

  const handleConfirmReschedule = () => {
    if (isCancelled || !nextDate || !nextSlot) return;
    onReschedule(booking.id, nextDate, nextSlot);
    setRescheduling(false);
  };

  return (
    <aside
      aria-label="Booking details"
      className="fixed inset-y-0 right-0 z-30 w-full sm:w-[380px] lg:static lg:z-0 lg:w-[380px] shrink-0 bg-[#ffffff] border-l border-[#e2e8f0] shadow-calm-3 lg:shadow-none flex flex-col h-full"
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-[#e2e8f0] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <StatusBadge status={booking.status} />
          <span className="text-[12px] font-mono tabular-nums text-[#94a3b8]">
            {booking.id.toUpperCase()}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close booking details"
          className="p-1.5 rounded-lg text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0f172a] transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Title & Time */}
        <div className="space-y-2">
          <h2 className="font-display text-[20px] font-semibold leading-7 tracking-[-0.015em] text-[#0f172a]">
            {booking.title}
          </h2>
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center gap-2 text-[13px] text-[#475569]">
              <Calendar className="w-4 h-4 text-[#64748b] shrink-0" />
              <span>{formatReadableDate(booking.date)}</span>
            </div>
            <div className="flex items-center gap-2 text-[13px] text-[#475569]">
              <Clock className="w-4 h-4 text-[#64748b] shrink-0" />
              <span className="font-mono tabular-nums">
                {booking.startTime} – {endTime}
              </span>
              <span aria-hidden="true" className="text-[#94a3b8]">·</span>
              <span className="tabular-nums">{booking.durationMinutes} min</span>
            </div>
            <div className="flex items-center gap-2 text-[13px] text-[#475569]">
              {booking.location === 'Studio B · SF' ? (
                <MapPin className="w-4 h-4 text-[#64748b] shrink-0" />
              ) : (
                <Video className="w-4 h-4 text-[#64748b] shrink-0" />
              )}
              <span>{booking.location}</span>
            </div>
          </div>
        </div>

        {/* Meeting Link */}
        {booking.meetingUrl && (
          <div className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg bg-[#f8fafc] border border-[#e2e8f0]">
            <span className="text-[12px] font-mono text-[#475569] truncate">
              {booking.meetingUrl}
            </span>
            <button
              type="button"
              onClick={handleCopyUrl}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-[#e2e8f0] hover:border-[#cbd5e1] text-[12px] font-medium text-[#0f172a] shrink-0 transition-colors cursor-pointer"
            >
              {copiedUrl ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#047857]" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#64748b]" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        )}

        <div className="border-t border-[#e2e8f0]" />

        {/* Client Attendee */}
        <div className="space-y-2.5">
          <div className="text-[11px] font-semibold tracking-[0.04em] uppercase text-[#64748b]">
            Attendee
          </div>
          <div className="flex items-center gap-3">
            <Avatar src={booking.clientAvatar} name={booking.clientName} size="lg" />
            <div className="min-w-0">
              <div className="text-[14px] font-semibold text-[#0f172a] truncate">
                {booking.clientName}
              </div>
              <div className="text-[13px] text-[#475569] truncate">{booking.clientCompany}</div>
              <div className="text-[12px] text-[#64748b] truncate">{booking.clientEmail}</div>
            </div>
          </div>
        </div>

        <div className="border-t border-[#e2e8f0]" />

        {/* Reschedule Section */}
        {!isCancelled && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold tracking-[0.04em] uppercase text-[#64748b]">
                Time Slot
              </span>
              <button
                type="button"
                onClick={() => setRescheduling((v) => !v)}
                className="text-[12px] font-medium text-[#4f46e5] hover:text-[#4338ca] cursor-pointer"
              >
                {rescheduling ? 'Cancel reschedule' : 'Reschedule'}
              </button>
            </div>

            {rescheduling && (
              <div className="space-y-3 p-3.5 rounded-xl bg-[#f8fafc] border border-[#e2e8f0]">
                <div>
                  <label className="block text-[12px] font-medium text-[#475569] mb-1">
                    New Date
                  </label>
                  <input
                    type="date"
                    value={nextDate}
                    onChange={(e) => setNextDate(e.target.value)}
                    className="input-calm w-full px-3 py-1.5 text-[13px] tabular-nums"
                  />
                </div>
                <div>
                  <div className="text-[12px] font-medium text-[#475569] mb-1.5">
                    Available Slots
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {STANDARD_TIME_SLOTS.map((slot) => {
                      const conflict = isSlotConflict(
                        nextDate,
                        slot,
                        booking.durationMinutes,
                        allBookings,
                        booking.id
                      );
                      const selected = nextSlot === slot;
                      return (
                        <button
                          key={slot}
                          type="button"
                          disabled={conflict}
                          onClick={() => setNextSlot(slot)}
                          className={`py-1.5 px-2 rounded-lg text-[12px] font-mono tabular-nums border transition-all ${
                            conflict
                              ? 'bg-[#f8fafc] text-[#94a3b8] border-dashed border-[#e2e8f0] cursor-not-allowed'
                              : selected
                              ? 'bg-[#4f46e5] text-white border-[#4f46e5] shadow-slot-active cursor-pointer'
                              : 'bg-white text-[#0f172a] border-[#e2e8f0] hover:border-[#cbd5e1] cursor-pointer'
                          }`}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleConfirmReschedule}
                  className="w-full py-2 px-3 rounded-lg bg-[#4f46e5] hover:bg-[#4338ca] text-white text-[13px] font-medium transition-colors cursor-pointer"
                >
                  Save New Time
                </button>
              </div>
            )}
          </div>
        )}

        {/* Editable Agenda Notes */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label
              htmlFor="drawer-notes"
              className="text-[11px] font-semibold tracking-[0.04em] uppercase text-[#64748b]"
            >
              Agenda &amp; Notes
            </label>
            {notesSaved && (
              <span className="text-[12px] font-medium text-[#047857]">Saved</span>
            )}
          </div>
          <textarea
            id="drawer-notes"
            rows={4}
            disabled={isCancelled}
            value={notesDraft}
            onChange={(e) => setNotesDraft(e.target.value)}
            placeholder="Add preparation notes, links, or decision items..."
            className="input-calm w-full px-3 py-2 text-[13px] leading-5 text-[#0f172a] placeholder:text-[#94a3b8] resize-none disabled:bg-[#f8fafc] disabled:text-[#64748b]"
          />
          {!isCancelled && notesDraft !== booking.notes && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSaveNotes}
                className="px-3 py-1.5 rounded-lg bg-[#4f46e5] hover:bg-[#4338ca] text-white text-[12px] font-medium transition-colors cursor-pointer"
              >
                Save Notes
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-[#e2e8f0] bg-[#f8fafc]/70 space-y-2">
        {isCancelled ? (
          <div className="text-[12px] text-[#64748b] text-center py-1">
            Cancelled appointments are locked. You may remove this record.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {booking.status !== 'confirmed' && (
              <button
                type="button"
                onClick={() => onUpdateStatus(booking.id, 'confirmed')}
                className="py-2 px-3 rounded-lg bg-[#4f46e5] hover:bg-[#4338ca] text-white text-[13px] font-medium transition-colors cursor-pointer whitespace-nowrap"
              >
                Confirm Booking
              </button>
            )}
            {booking.status !== 'pending' && (
              <button
                type="button"
                onClick={() => onUpdateStatus(booking.id, 'pending')}
                className="py-2 px-3 rounded-lg bg-white border border-[#e2e8f0] hover:bg-[#f1f5f9] hover:border-[#cbd5e1] text-[#0f172a] text-[13px] font-medium transition-colors cursor-pointer whitespace-nowrap"
              >
                Mark Pending
              </button>
            )}
            <button
              type="button"
              onClick={() => onUpdateStatus(booking.id, 'cancelled')}
              className="py-2 px-3 rounded-lg bg-white border border-[#fecdd3] hover:bg-[#fff1f2] text-[#be123c] text-[13px] font-medium transition-colors cursor-pointer whitespace-nowrap"
            >
              Cancel Booking
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => onDelete(booking.id)}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-[12px] font-medium text-[#64748b] hover:text-[#be123c] hover:bg-[#fff1f2] transition-colors cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Remove Record</span>
        </button>
      </div>
    </aside>
  );
}
