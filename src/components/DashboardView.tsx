import {
  ArrowRight,
  BarChart3,
  Calendar,
  Clock,
  MessageSquareText,
  Plus,
  Sparkles,
} from 'lucide-react';
import { AppScreen, Booking, EventType } from '../types/scheduling';
import { formatShortDate, getEndTime, timeToMinutes } from '../utils/dateUtils';
import {
  convertSlotFromHostTimezone,
  getSmartSlotRecommendations,
} from '../utils/slotRecommendations';
import { Avatar } from './Avatar';
import { StatusBadge } from './StatusBadge';

interface DashboardViewProps {
  hostName: string;
  selectedDate: string;
  bookings: Booking[];
  eventTypes: EventType[];
  onNavigate: (screen: AppScreen) => void;
  onSelectBooking: (bookingId: string) => void;
  onOpenNewBooking: (opts?: { eventTypeId?: string; startTime?: string }) => void;
  onAskAssistant: (prompt: string) => void;
}

export function DashboardView({
  hostName,
  selectedDate,
  bookings,
  eventTypes,
  onNavigate,
  onSelectBooking,
  onOpenNewBooking,
  onAskAssistant,
}: DashboardViewProps) {
  const confirmedCount = bookings.filter((b) => b.status === 'confirmed').length;
  const pendingCount = bookings.filter((b) => b.status === 'pending').length;
  const cancelledCount = bookings.filter((b) => b.status === 'cancelled').length;
  const totalCount = bookings.length;
  const activeServicesCount = eventTypes.filter((e) => e.active).length;

  const decidedCount = confirmedCount + cancelledCount;
  const confirmedRate =
    decidedCount > 0 ? Math.round((confirmedCount / decidedCount) * 100) : 100;

  const sortedBookings = bookings
    .slice()
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) ||
        timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
    );

  const nextActiveBooking =
    sortedBookings.find((b) => b.status !== 'cancelled') ?? null;

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
      {/* Header */}
      <div className="px-6 lg:px-8 pt-6 pb-5 border-b border-[#e2e8f0] bg-white">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-0.5">
            <h1 className="font-display text-[24px] font-semibold tracking-[-0.02em] text-[#0f172a]">
              Welcome back, {hostName.split(' ')[0]}
            </h1>
            <p className="text-[13px] text-[#475569]">
              Overview of active commitments, smart time slot availability, and scheduling trends.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => onNavigate('assistant')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#e2e8f0] bg-white hover:bg-[#f1f5f9] hover:border-[#cbd5e1] text-[13px] font-medium text-[#0f172a] transition-colors cursor-pointer whitespace-nowrap"
            >
              <MessageSquareText className="w-4 h-4 text-[#4f46e5]" />
              <span>AI Assistant</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenNewBooking()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#4f46e5] hover:bg-[#4338ca] text-white text-[13px] font-medium transition-colors cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>New Booking</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Dashboard Grid */}
      <div className="p-6 lg:p-8 space-y-6 max-w-7xl w-full">
        {/* 4-Column KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="bg-white border border-[#e2e8f0] rounded-xl p-5 shadow-calm-1 space-y-1.5">
            <div className="text-[12px] font-medium text-[#64748b]">Total Bookings</div>
            <div className="font-display text-[28px] font-semibold tracking-[-0.02em] text-[#0f172a] tabular-nums">
              {totalCount}
            </div>
            <div className="text-[12px] text-[#475569] tabular-nums">
              {confirmedCount} confirmed · {pendingCount} pending · {cancelledCount} cancelled
            </div>
          </div>

          <div className="bg-white border border-[#e2e8f0] rounded-xl p-5 shadow-calm-1 space-y-1.5">
            <div className="text-[12px] font-medium text-[#64748b]">Completion Rate</div>
            <div className="font-display text-[28px] font-semibold tracking-[-0.02em] text-[#047857] tabular-nums">
              {confirmedRate}%
            </div>
            <div className="text-[12px] text-[#475569] tabular-nums">
              Based on finalized appointments
            </div>
          </div>

          <div className="bg-white border border-[#e2e8f0] rounded-xl p-5 shadow-calm-1 space-y-1.5">
            <div className="text-[12px] font-medium text-[#64748b]">Active Services</div>
            <div className="font-display text-[28px] font-semibold tracking-[-0.02em] text-[#0f172a] tabular-nums">
              {activeServicesCount}
            </div>
            <div className="text-[12px] text-[#475569]">
              {eventTypes.map((e) => e.title).slice(0, 3).join(' · ')}
            </div>
          </div>

          <div className="bg-white border border-[#e2e8f0] rounded-xl p-5 shadow-calm-1 space-y-1.5">
            <div className="text-[12px] font-medium text-[#64748b]">Next Up</div>
            {nextActiveBooking ? (
              <>
                <div className="font-display text-[20px] font-semibold tracking-[-0.015em] text-[#0f172a] truncate">
                  {nextActiveBooking.clientName}
                </div>
                <div className="text-[12px] text-[#475569] font-mono tabular-nums truncate">
                  {nextActiveBooking.date} {nextActiveBooking.startTime} · {nextActiveBooking.title}
                </div>
              </>
            ) : (
              <>
                <div className="font-display text-[20px] font-semibold text-[#0f172a]">
                  Clear
                </div>
                <div className="text-[12px] text-[#475569]">No upcoming appointments</div>
              </>
            )}
          </div>
        </div>

        {/* 12-Column Primary Split */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Left 7 Columns: Scheduled Appointments */}
          <div className="xl:col-span-7 bg-white border border-[#e2e8f0] rounded-xl shadow-calm-1 overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-[#e2e8f0] flex items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-[16px] font-semibold text-[#0f172a]">
                  Commitments Queue
                </h2>
                <p className="text-[12px] text-[#64748b]">
                  Select any booking to inspect details, update status, or reschedule.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('bookings')}
                className="inline-flex items-center gap-1 text-[13px] font-medium text-[#4f46e5] hover:text-[#4338ca] cursor-pointer whitespace-nowrap"
              >
                <span>All bookings</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-[#e2e8f0] flex-1">
              {sortedBookings.slice(0, 6).map((b) => {
                const istTime = convertSlotFromHostTimezone(b.startTime, 'Asia/Kolkata');
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => onSelectBooking(b.id)}
                    className="w-full px-6 py-4 text-left hover:bg-[#f8fafc] transition-colors flex flex-wrap items-center justify-between gap-3 cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar src={b.clientAvatar} name={b.clientName} size="md" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[14px] font-semibold text-[#0f172a] truncate">
                            {b.clientName}
                          </span>
                          <span aria-hidden="true" className="text-[#cbd5e1]">·</span>
                          <span className="text-[13px] font-medium text-[#475569] truncate">
                            {b.title}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-[12px] text-[#64748b] mt-0.5">
                          <span className="font-mono tabular-nums text-[#0f172a]">
                            {b.date} {b.startTime}–{getEndTime(b.startTime, b.durationMinutes)}
                          </span>
                          <span aria-hidden="true" className="text-[#cbd5e1]">·</span>
                          <span className="font-mono tabular-nums">
                            {istTime.time} IST
                          </span>
                          <span aria-hidden="true" className="text-[#cbd5e1]">·</span>
                          <span>{b.location}</span>
                        </div>
                      </div>
                    </div>

                    <StatusBadge status={b.status} />
                  </button>
                );
              })}
            </div>

            <div className="px-6 py-3.5 border-t border-[#e2e8f0] bg-[#f8fafc]/60 flex items-center justify-between text-[12px]">
              <span className="text-[#64748b]">
                Viewing {Math.min(6, sortedBookings.length)} of {sortedBookings.length} total records
              </span>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => onNavigate('schedule')}
                  className="inline-flex items-center gap-1 font-medium text-[#0f172a] hover:text-[#4f46e5] cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Open Timeline</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('insights')}
                  className="inline-flex items-center gap-1 font-medium text-[#0f172a] hover:text-[#4f46e5] cursor-pointer"
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>View Insights</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right 5 Columns: Smart Time Slot Services + AI Copilot Card */}
          <div className="xl:col-span-5 space-y-6">
            {/* Services & Smart Time Slot Quick Launch */}
            <div className="bg-white border border-[#e2e8f0] rounded-xl p-6 shadow-calm-1 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="font-display text-[16px] font-semibold text-[#0f172a]">
                    Services &amp; Smart Time Slots
                  </h2>
                  <p className="text-[12px] text-[#64748b]">
                    Peak slots recommended from your booking history ({formatShortDate(selectedDate)}).
                  </p>
                </div>
              </div>

              <div className="space-y-2.5">
                {eventTypes.filter((e) => e.active).map((evt) => {
                  const top = getSmartSlotRecommendations(
                    evt.id,
                    evt.title,
                    selectedDate,
                    evt.durationMinutes,
                    bookings,
                    1
                  )[0];
                  const istConv = top
                    ? convertSlotFromHostTimezone(top.slot, 'Asia/Kolkata')
                    : null;

                  return (
                    <div
                      key={evt.id}
                      className="p-3.5 rounded-xl border border-[#e2e8f0] bg-[#f8fafc]/60 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-display text-[14px] font-semibold text-[#0f172a]">
                            {evt.title}
                          </span>
                          <span className="font-mono text-[12px] tabular-nums text-[#64748b]">
                            {evt.durationMinutes}m
                          </span>
                        </div>
                        {top ? (
                          <div className="flex items-center gap-1.5 text-[12px] text-[#3525cd]">
                            <Sparkles className="w-3 h-3 text-[#4f46e5] shrink-0" />
                            <span className="truncate font-mono tabular-nums">
                              Smart: {top.slot} PST ({istConv?.time} IST)
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-[12px] text-[#64748b]">
                            <Clock className="w-3 h-3 shrink-0" />
                            <span>{evt.location}</span>
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          onOpenNewBooking({
                            eventTypeId: evt.id,
                            startTime: top?.slot ?? '10:00',
                          })
                        }
                        className="px-3 py-1.5 rounded-lg bg-white border border-[#e2e8f0] hover:border-[#4f46e5] hover:text-[#4f46e5] text-[12px] font-medium text-[#0f172a] transition-colors cursor-pointer shrink-0 whitespace-nowrap"
                      >
                        Quick Book
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Embedded AI Scheduling Copilot Card */}
            <div className="bg-white border border-[#e2e8f0] rounded-xl p-6 shadow-calm-1 space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#4f46e5]" />
                <h2 className="font-display text-[16px] font-semibold text-[#0f172a]">
                  AI Scheduling Assistant
                </h2>
              </div>
              <p className="text-[13px] text-[#475569] leading-relaxed">
                Ask the Gemini copilot to inspect your schedule, convert times to IST, or draft agendas.
              </p>
              <div className="space-y-2">
                {[
                  'Summarize my pending and confirmed appointments on 2026-11-02 and 2026-11-03.',
                  'What are the best IST and PST time slots for my next Consultation?',
                  'Analyze completion and cancellation rates across my services.',
                ].map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => onAskAssistant(prompt)}
                    className="w-full text-left px-3 py-2.5 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] hover:bg-white hover:border-[#4f46e5] text-[12px] text-[#0f172a] transition-all cursor-pointer flex items-center justify-between gap-2"
                  >
                    <span className="truncate">{prompt}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#64748b] shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
