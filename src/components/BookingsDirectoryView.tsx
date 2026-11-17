import { useState } from 'react';
import { ArrowUpDown, Check, Plus, Search, X } from 'lucide-react';
import { Booking, BookingStatus } from '../types/scheduling';
import { formatShortDate, getEndTime, timeToMinutes } from '../utils/dateUtils';
import { Avatar } from './Avatar';
import { StatusBadge } from './StatusBadge';

interface BookingsDirectoryViewProps {
  bookings: Booking[];
  selectedBookingId: string | null;
  onSelectBooking: (id: string) => void;
  onUpdateStatus: (id: string, status: BookingStatus) => void;
  onOpenNewBooking: () => void;
}

type FilterTab = 'all' | BookingStatus;

export function BookingsDirectoryView({
  bookings,
  selectedBookingId,
  onSelectBooking,
  onUpdateStatus,
  onOpenNewBooking,
}: BookingsDirectoryViewProps) {
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortAsc, setSortAsc] = useState(true);

  const q = searchQuery.trim().toLowerCase();

  const filtered = bookings
    .filter((b) => {
      if (filterTab !== 'all' && b.status !== filterTab) return false;
      if (!q) return true;
      return (
        b.title.toLowerCase().includes(q) ||
        b.clientName.toLowerCase().includes(q) ||
        b.clientEmail.toLowerCase().includes(q) ||
        b.clientCompany.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const cmp =
        a.date.localeCompare(b.date) ||
        timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
      return sortAsc ? cmp : -cmp;
    });

  const tabs: Array<{ id: FilterTab; label: string; count: number }> = [
    { id: 'all', label: 'All Commitments', count: bookings.length },
    {
      id: 'confirmed',
      label: 'Confirmed',
      count: bookings.filter((b) => b.status === 'confirmed').length,
    },
    {
      id: 'pending',
      label: 'Pending',
      count: bookings.filter((b) => b.status === 'pending').length,
    },
    {
      id: 'cancelled',
      label: 'Cancelled',
      count: bookings.filter((b) => b.status === 'cancelled').length,
    },
  ];

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Header */}
      <div className="px-6 lg:px-8 pt-6 pb-5 border-b border-[#e2e8f0] bg-white space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-0.5">
            <h1 className="font-display text-[24px] font-semibold tracking-[-0.02em] text-[#0f172a]">
              Bookings Directory
            </h1>
            <p className="text-[13px] text-[#475569]">
              Structured ledger of upcoming, pending, and cancelled client appointments.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenNewBooking}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#4f46e5] hover:bg-[#4338ca] text-white text-[13px] font-medium transition-colors cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>New Booking</span>
          </button>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1 p-1 rounded-lg bg-[#f1f5f9] border border-[#e2e8f0]">
            {tabs.map((t) => {
              const active = filterTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setFilterTab(t.id)}
                  className={`px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    active
                      ? 'bg-white text-[#0f172a] shadow-calm-1'
                      : 'text-[#475569] hover:text-[#0f172a]'
                  }`}
                >
                  <span>{t.label}</span>
                  <span className="font-mono text-[11px] tabular-nums text-[#64748b]">
                    {t.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-[#94a3b8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by client or title..."
                aria-label="Filter bookings"
                className="input-calm pl-9 pr-3 py-1.5 w-56 text-[13px] text-[#0f172a] placeholder:text-[#94a3b8]"
              />
            </div>

            <button
              type="button"
              onClick={() => setSortAsc((v) => !v)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#e2e8f0] bg-white hover:bg-[#f1f5f9] text-[13px] font-medium text-[#0f172a] transition-colors cursor-pointer whitespace-nowrap"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-[#64748b]" />
              <span>{sortAsc ? 'Earliest first' : 'Latest first'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-y-auto p-6 lg:p-8">
        {filtered.length === 0 ? (
          <div className="bg-white border border-[#e2e8f0] rounded-xl p-10 text-center shadow-calm-1 space-y-3">
            <div className="font-display text-[16px] font-semibold text-[#0f172a]">
              No matching commitments
            </div>
            <p className="text-[13px] text-[#64748b]">
              Adjust your search terms or switch back to all bookings.
            </p>
            <button
              type="button"
              onClick={() => {
                setFilterTab('all');
                setSearchQuery('');
              }}
              className="px-4 py-2 rounded-lg border border-[#e2e8f0] bg-white hover:bg-[#f1f5f9] text-[13px] font-medium text-[#0f172a] transition-colors cursor-pointer"
            >
              Reset View
            </button>
          </div>
        ) : (
          <div className="bg-white border border-[#e2e8f0] rounded-xl shadow-calm-1 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#e2e8f0] bg-[#f8fafc] text-[11px] font-semibold uppercase tracking-[0.04em] text-[#64748b]">
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Service</th>
                    <th className="py-3 px-4">Date / time</th>
                    <th className="py-3 px-4">Format</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e2e8f0]">
                  {filtered.map((booking) => {
                    const selected = booking.id === selectedBookingId;
                    const endTime = getEndTime(booking.startTime, booking.durationMinutes);
                    return (
                      <tr
                        key={booking.id}
                        onClick={() => onSelectBooking(booking.id)}
                        className={`transition-colors cursor-pointer ${
                          selected ? 'bg-[#e2dfff]/25' : 'hover:bg-[#f8fafc]'
                        }`}
                      >
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <Avatar
                              src={booking.clientAvatar}
                              name={booking.clientName}
                              size="sm"
                            />
                            <div>
                              <div className="text-[13px] font-semibold text-[#0f172a]">
                                {booking.clientName}
                              </div>
                              <div className="text-[12px] text-[#64748b]">
                                {booking.clientCompany}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-[13px] font-medium text-[#0f172a]">
                            {booking.title}
                          </div>
                          <div className="text-[12px] text-[#64748b] tabular-nums">
                            {booking.durationMinutes} min
                          </div>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-mono text-[13px] font-medium tabular-nums text-[#0f172a]">
                            {booking.date} {booking.startTime}
                          </div>
                          <div className="text-[12px] text-[#64748b] tabular-nums">
                            {formatShortDate(booking.date)} · ends {endTime}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-[13px] text-[#475569] whitespace-nowrap">
                          {booking.location}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <StatusBadge status={booking.status} />
                        </td>
                        <td
                          className="py-3 px-4 text-right whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {booking.status !== 'cancelled' ? (
                            <div className="inline-flex items-center gap-1">
                              {booking.status !== 'confirmed' && (
                                <button
                                  type="button"
                                  title="Confirm booking"
                                  aria-label="Confirm booking"
                                  onClick={() => onUpdateStatus(booking.id, 'confirmed')}
                                  className="p-1.5 rounded-md border border-[#e2e8f0] bg-white hover:bg-[#ecfdf5] hover:border-[#a7f3d0] text-[#047857] transition-colors cursor-pointer"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                type="button"
                                title="Cancel booking"
                                aria-label="Cancel booking"
                                onClick={() => onUpdateStatus(booking.id, 'cancelled')}
                                className="p-1.5 rounded-md border border-[#e2e8f0] bg-white hover:bg-[#fff1f2] hover:border-[#fecdd3] text-[#be123c] transition-colors cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] font-medium text-[#94a3b8]">Locked</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
