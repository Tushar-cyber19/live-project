import { useState } from 'react';
import {
  BarChart3,
  Calendar,
  CalendarClock,
  Check,
  ChevronLeft,
  ChevronRight,
  Layers,
  LayoutDashboard,
  ListChecks,
  LogIn,
  LogOut,
  MessageSquareText,
  Plus,
  X,
} from 'lucide-react';
import { AppScreen, Booking, BookingStatus, HostProfile } from '../types/scheduling';
import { getMonthGrid, parseIsoDate } from '../utils/dateUtils';
import { Avatar } from './Avatar';

interface AuthUserSummary {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
}

interface LeftRailProps {
  activeScreen: AppScreen;
  onSelectScreen: (screen: AppScreen) => void;
  selectedDate: string;
  onSelectDate: (iso: string) => void;
  bookings: Booking[];
  statusFilters: Record<BookingStatus, boolean>;
  onToggleStatusFilter: (status: BookingStatus) => void;
  onOpenNewBooking: () => void;
  host: HostProfile;
  authUser: AuthUserSummary | null;
  authLoading: boolean;
  onSignInGoogle: () => void;
  onSignOut: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const NAV_ITEMS: Array<{ id: AppScreen; label: string; Icon: typeof Calendar }> = [
  { id: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { id: 'schedule', label: 'Schedule', Icon: Calendar },
  { id: 'bookings', label: 'Bookings', Icon: ListChecks },
  { id: 'insights', label: 'Insights', Icon: BarChart3 },
  { id: 'book', label: 'Book a Slot', Icon: CalendarClock },
  { id: 'events', label: 'Event Types', Icon: Layers },
  { id: 'assistant', label: 'AI Assistant', Icon: MessageSquareText },
];

const STATUS_META: Array<{ key: BookingStatus; label: string; dotColor: string }> = [
  { key: 'confirmed', label: 'Confirmed', dotColor: 'bg-[#10b981]' },
  { key: 'pending', label: 'Pending', dotColor: 'bg-[#f59e0b]' },
  { key: 'cancelled', label: 'Cancelled', dotColor: 'bg-[#f43f5e]' },
];

export function LeftRail({
  activeScreen,
  onSelectScreen,
  selectedDate,
  onSelectDate,
  bookings,
  statusFilters,
  onToggleStatusFilter,
  onOpenNewBooking,
  host,
  authUser,
  authLoading,
  onSignInGoogle,
  onSignOut,
  mobileOpen,
  onCloseMobile,
}: LeftRailProps) {
  const initial = parseIsoDate(selectedDate);
  const [calMonth, setCalMonth] = useState<{ year: number; month: number }>({
    year: initial.getFullYear(),
    month: initial.getMonth(),
  });

  const cells = getMonthGrid(calMonth.year, calMonth.month);
  const monthLabel = new Date(calMonth.year, calMonth.month, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const bookedDays = new Set(
    bookings.filter((b) => b.status !== 'cancelled').map((b) => b.date)
  );

  const counts: Record<BookingStatus, number> = {
    confirmed: bookings.filter((b) => b.status === 'confirmed').length,
    pending: bookings.filter((b) => b.status === 'pending').length,
    cancelled: bookings.filter((b) => b.status === 'cancelled').length,
  };

  const shiftMonth = (delta: number) => {
    setCalMonth((prev) => {
      const next = new Date(prev.year, prev.month + delta, 1);
      return { year: next.getFullYear(), month: next.getMonth() };
    });
  };

  const railContent = (
    <aside className="w-[280px] h-full bg-[#ffffff] border-r border-[#e2e8f0] flex flex-col justify-between shrink-0 select-none">
      <div className="p-4 space-y-5 overflow-y-auto">
        {/* Brand & Primary CTA */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#4f46e5] flex items-center justify-center text-white font-display font-bold text-sm shadow-slot-active">
                C
              </div>
              <span className="font-display font-semibold text-[16px] tracking-[-0.02em] text-[#0f172a] whitespace-nowrap">
                Cadence
              </span>
            </div>
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label="Close navigation"
              className="lg:hidden p-1.5 rounded-lg text-[#475569] hover:bg-[#f1f5f9] hover:text-[#0f172a] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              onOpenNewBooking();
              onCloseMobile();
            }}
            className="w-full flex items-center justify-center gap-2 bg-[#4f46e5] hover:bg-[#4338ca] active:scale-[0.99] text-white font-medium text-[14px] py-2 px-4 rounded-lg transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4f46e5]/40 focus-visible:ring-offset-2 whitespace-nowrap"
          >
            <Plus className="w-4 h-4 shrink-0" strokeWidth={2.2} />
            <span>New Booking</span>
          </button>
        </div>

        {/* Navigation Links */}
        <nav aria-label="Workspace navigation" className="space-y-1">
          {NAV_ITEMS.map(({ id, label, Icon }) => {
            const isActive = activeScreen === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  onSelectScreen(id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[14px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-[#e2dfff]/55 text-[#3525cd]'
                    : 'text-[#475569] hover:bg-[#f1f5f9] hover:text-[#0f172a]'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#4f46e5]' : 'text-[#64748b]'}`}
                  strokeWidth={1.9}
                />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>

        <div className="border-t border-[#e2e8f0]" />

        {/* Interactive Mini Calendar */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <span className="font-display text-[13px] font-semibold text-[#0f172a] tracking-[-0.01em]">
              {monthLabel}
            </span>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => shiftMonth(-1)}
                aria-label="Previous month"
                className="p-1 rounded-md text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0f172a] transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => shiftMonth(1)}
                aria-label="Next month"
                className="p-1 rounded-md text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0f172a] transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 text-center text-[11px] font-medium text-[#94a3b8]">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
              <div key={d} className="py-1">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-y-0.5 text-center">
            {cells.map((cell) => {
              const isSelected = cell.iso === selectedDate;
              const hasBooking = bookedDays.has(cell.iso);
              return (
                <button
                  key={cell.iso}
                  type="button"
                  onClick={() => {
                    onSelectDate(cell.iso);
                    if (activeScreen !== 'schedule' && activeScreen !== 'book') {
                      onSelectScreen('schedule');
                    }
                    onCloseMobile();
                  }}
                  className={`relative h-8 w-8 mx-auto rounded-lg text-[12px] font-medium tabular-nums flex flex-col items-center justify-center transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#4f46e5] text-white shadow-slot-active'
                      : cell.inMonth
                      ? 'text-[#0f172a] hover:bg-[#f1f5f9]'
                      : 'text-[#94a3b8] hover:bg-[#f8fafc]'
                  }`}
                >
                  <span>{cell.dayNumber}</span>
                  {hasBooking && (
                    <span
                      className={`w-1 h-1 rounded-full mt-0.5 ${
                        isSelected ? 'bg-white/90' : 'bg-[#4f46e5]'
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="border-t border-[#e2e8f0]" />

        {/* Status Checkboxes (Calm Utility 16x16 specs) */}
        <div className="space-y-2.5">
          <div className="px-1 text-[11px] font-semibold tracking-[0.04em] uppercase text-[#64748b]">
            Status Filter
          </div>
          <div className="space-y-1.5">
            {STATUS_META.map(({ key, label }) => {
              const checked = statusFilters[key];
              return (
                <button
                  key={key}
                  type="button"
                  role="checkbox"
                  aria-checked={checked}
                  onClick={() => onToggleStatusFilter(key)}
                  className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-[#f8fafc] transition-colors cursor-pointer text-left"
                >
                  <span className="flex items-center gap-2.5">
                    <span
                      className={`w-4 h-4 rounded-[4px] flex items-center justify-center border-[1.5px] transition-colors ${
                        checked
                          ? 'bg-[#4f46e5] border-[#4f46e5] text-white'
                          : 'bg-white border-[#cbd5e1]'
                      }`}
                    >
                      {checked && <Check className="w-3 h-3" strokeWidth={3} />}
                    </span>
                    <span className="text-[13px] font-medium text-[#0f172a]">{label}</span>
                  </span>
                  <span className="text-[12px] font-mono tabular-nums text-[#64748b]">
                    {counts[key]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Host / Auth Footer */}
      <div className="p-4 border-t border-[#e2e8f0] bg-[#f8fafc]/70 space-y-2.5">
        {authUser ? (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <Avatar
                src={authUser.photoURL || host.avatar}
                name={authUser.displayName}
                size="md"
              />
              <div className="min-w-0">
                <div className="text-[13px] font-semibold text-[#0f172a] truncate">
                  {authUser.displayName}
                </div>
                <div className="text-[11px] text-[#64748b] truncate">{authUser.email}</div>
              </div>
            </div>
            <button
              type="button"
              onClick={onSignOut}
              title="Sign out"
              aria-label="Sign out"
              className="p-1.5 rounded-lg text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0f172a] transition-colors cursor-pointer shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            <div className="flex items-center gap-2.5">
              <Avatar src={host.avatar} name={host.name} size="sm" />
              <div className="min-w-0">
                <div className="text-[12px] font-semibold text-[#0f172a] truncate">
                  {host.name} · Preview
                </div>
                <div className="text-[11px] text-[#64748b] truncate">
                  Sign in to sync Firestore
                </div>
              </div>
            </div>
            <button
              type="button"
              disabled={authLoading}
              onClick={onSignInGoogle}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-[#e2e8f0] bg-white hover:bg-[#f1f5f9] hover:border-[#cbd5e1] text-[13px] font-medium text-[#0f172a] transition-colors cursor-pointer disabled:opacity-60"
            >
              <LogIn className="w-3.5 h-3.5 text-[#4f46e5]" />
              <span>{authLoading ? 'Connecting…' : 'Sign in with Google'}</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );

  return (
    <>
      <div className="hidden lg:block h-full">{railContent}</div>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden flex">
          <div
            className="fixed inset-0 bg-[#0f172a]/25 backdrop-blur-[1px]"
            onClick={onCloseMobile}
          />
          <div className="relative z-10 h-full shadow-calm-3">{railContent}</div>
        </div>
      )}
    </>
  );
}
