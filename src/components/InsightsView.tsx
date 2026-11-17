import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Sparkles } from 'lucide-react';
import { TODAY_ISO } from '../data/seedData';
import { Booking, EventType } from '../types/scheduling';
import { addDays, formatShortDate, parseIsoDate } from '../utils/dateUtils';

interface InsightsViewProps {
  bookings: Booking[];
  eventTypes: EventType[];
  onAskCopilot: (prompt: string) => void;
}

type RangeWindow = 30 | 14 | 7;

export function InsightsView({
  bookings,
  eventTypes,
  onAskCopilot,
}: InsightsViewProps) {
  const [rangeDays, setRangeDays] = useState<RangeWindow>(30);

  const windowStart = useMemo(() => addDays(TODAY_ISO, -(rangeDays - 1)), [rangeDays]);

  const scopedBookings = useMemo(() => {
    return bookings.filter((b) => b.date >= windowStart && b.date <= TODAY_ISO);
  }, [bookings, windowStart]);

  const totalCount = scopedBookings.length;
  const confirmedCount = scopedBookings.filter((b) => b.status === 'confirmed').length;
  const pendingCount = scopedBookings.filter((b) => b.status === 'pending').length;
  const cancelledCount = scopedBookings.filter((b) => b.status === 'cancelled').length;

  const decidedCount = confirmedCount + cancelledCount;
  const completionRate =
    decidedCount > 0 ? Math.round((confirmedCount / decidedCount) * 1000) / 10 : 0;
  const cancellationRate =
    totalCount > 0 ? Math.round((cancelledCount / totalCount) * 1000) / 10 : 0;
  const scheduledHours =
    Math.round(
      (scopedBookings
        .filter((b) => b.status !== 'cancelled')
        .reduce((acc, b) => acc + b.durationMinutes, 0) /
        60) *
        10
    ) / 10;

  // Bookings & Completion Breakdown per Event Type
  const eventTypeStats = useMemo(() => {
    return eventTypes.map((evt) => {
      const matching = scopedBookings.filter((b) => b.eventTypeId === evt.id);
      const confirmed = matching.filter((b) => b.status === 'confirmed').length;
      const pending = matching.filter((b) => b.status === 'pending').length;
      const cancelled = matching.filter((b) => b.status === 'cancelled').length;
      const total = matching.length;
      const decided = confirmed + cancelled;
      const rate = decided > 0 ? Math.round((confirmed / decided) * 100) : 0;
      const hours =
        Math.round(
          (matching
            .filter((b) => b.status !== 'cancelled')
            .reduce((s, b) => s + b.durationMinutes, 0) /
            60) *
            10
        ) / 10;

      return {
        id: evt.id,
        name: evt.title,
        shortName:
          evt.title.length > 18 ? `${evt.title.slice(0, 16)}…` : evt.title,
        confirmed,
        pending,
        cancelled,
        total,
        completionRate: rate,
        hours,
        durationMinutes: evt.durationMinutes,
      };
    });
  }, [eventTypes, scopedBookings]);

  // Weekly / Multi-day Trend over the Past Month
  const trendData = useMemo(() => {
    const bucketSize = rangeDays === 7 ? 1 : rangeDays === 14 ? 2 : 5;
    const buckets: Array<{
      label: string;
      confirmed: number;
      pending: number;
      cancelled: number;
      completionRate: number;
    }> = [];

    for (let offset = rangeDays - 1; offset >= 0; offset -= bucketSize) {
      const endOffset = Math.max(0, offset - (bucketSize - 1));
      const startIso = addDays(TODAY_ISO, -offset);
      const endIso = addDays(TODAY_ISO, -endOffset);

      const inBucket = scopedBookings.filter(
        (b) => b.date >= startIso && b.date <= endIso
      );
      const confirmed = inBucket.filter((b) => b.status === 'confirmed').length;
      const pending = inBucket.filter((b) => b.status === 'pending').length;
      const cancelled = inBucket.filter((b) => b.status === 'cancelled').length;
      const decided = confirmed + cancelled;
      const rate = decided > 0 ? Math.round((confirmed / decided) * 100) : 100;

      const d = parseIsoDate(startIso);
      const label =
        bucketSize === 1
          ? d.toLocaleDateString('en-US', { weekday: 'short' })
          : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      buckets.push({
        label,
        confirmed,
        pending,
        cancelled,
        completionRate: rate,
      });
    }

    return buckets;
  }, [rangeDays, scopedBookings]);

  // Location / Format Distribution
  const channelStats = useMemo(() => {
    const channels: Array<'Google Meet' | 'Zoom' | 'Studio B · SF' | 'Phone Call'> = [
      'Google Meet',
      'Zoom',
      'Studio B · SF',
      'Phone Call',
    ];
    return channels.map((ch) => {
      const list = scopedBookings.filter((b) => b.location === ch);
      return {
        channel: ch,
        count: list.length,
        confirmed: list.filter((b) => b.status === 'confirmed').length,
      };
    });
  }, [scopedBookings]);

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
      {/* Header */}
      <div className="px-6 lg:px-8 pt-6 pb-5 border-b border-[#e2e8f0] bg-white">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-0.5">
            <h1 className="font-display text-[24px] font-semibold tracking-[-0.02em] text-[#0f172a]">
              Appointment Insights
            </h1>
            <p className="text-[13px] text-[#475569]">
              {formatShortDate(windowStart)} – {formatShortDate(TODAY_ISO)} · Live metrics from your coordinated commitments.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="inline-flex items-center p-1 rounded-lg bg-[#f1f5f9] border border-[#e2e8f0]">
              {([30, 14, 7] as RangeWindow[]).map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setRangeDays(days)}
                  className={`px-3 py-1 rounded-md text-[13px] font-medium tabular-nums transition-colors cursor-pointer whitespace-nowrap ${
                    rangeDays === days
                      ? 'bg-white text-[#0f172a] shadow-calm-1'
                      : 'text-[#475569] hover:text-[#0f172a]'
                  }`}
                >
                  Last {days}d
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() =>
                onAskCopilot(
                  `Analyze my last ${rangeDays} days of appointments: completion rate is ${completionRate}% across ${totalCount} bookings. What patterns or optimization opportunities do you see?`
                )
              }
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#4f46e5] hover:bg-[#4338ca] text-white text-[13px] font-medium transition-colors cursor-pointer whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Interpret with Copilot</span>
            </button>
          </div>
        </div>
      </div>

      {/* Dashboard Body */}
      <div className="p-6 lg:p-8 space-y-6 max-w-7xl w-full">
        {/* 4-Column KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="bg-white border border-[#e2e8f0] rounded-xl p-5 shadow-calm-1 space-y-1.5">
            <div className="text-[12px] font-medium text-[#64748b]">Total Bookings</div>
            <div className="font-display text-[28px] font-semibold tracking-[-0.02em] text-[#0f172a] tabular-nums">
              {totalCount}
            </div>
            <div className="text-[12px] text-[#475569] tabular-nums">
              {confirmedCount} confirmed · {pendingCount} pending
            </div>
          </div>

          <div className="bg-white border border-[#e2e8f0] rounded-xl p-5 shadow-calm-1 space-y-1.5">
            <div className="text-[12px] font-medium text-[#64748b]">Completion Rate</div>
            <div className="font-display text-[28px] font-semibold tracking-[-0.02em] text-[#047857] tabular-nums">
              {completionRate}%
            </div>
            <div className="text-[12px] text-[#475569] tabular-nums">
              {confirmedCount} of {decidedCount} decided sessions
            </div>
          </div>

          <div className="bg-white border border-[#e2e8f0] rounded-xl p-5 shadow-calm-1 space-y-1.5">
            <div className="text-[12px] font-medium text-[#64748b]">Committed Hours</div>
            <div className="font-display text-[28px] font-semibold tracking-[-0.02em] text-[#0f172a] tabular-nums">
              {scheduledHours}h
            </div>
            <div className="text-[12px] text-[#475569] tabular-nums">
              Active non-cancelled calendar load
            </div>
          </div>

          <div className="bg-white border border-[#e2e8f0] rounded-xl p-5 shadow-calm-1 space-y-1.5">
            <div className="text-[12px] font-medium text-[#64748b]">Cancellation Rate</div>
            <div className="font-display text-[28px] font-semibold tracking-[-0.02em] text-[#be123c] tabular-nums">
              {cancellationRate}%
            </div>
            <div className="text-[12px] text-[#475569] tabular-nums">
              {cancelledCount} cancelled in past {rangeDays} days
            </div>
          </div>
        </div>

        {/* Primary Charts Row */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Trend Chart: Completion Rate & Volume */}
          <div className="xl:col-span-7 bg-white border border-[#e2e8f0] rounded-xl p-6 shadow-calm-1 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-[16px] font-semibold text-[#0f172a]">
                  Completion Rate &amp; Booking Volume
                </h2>
                <p className="text-[12px] text-[#64748b]">
                  Rolling appointment outcomes alongside completion percentage over the last {rangeDays} days.
                </p>
              </div>
            </div>

            <div className="h-[290px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={trendData} margin={{ top: 10, right: 12, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                  />
                  <YAxis
                    yAxisId="left"
                    allowDecimals={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    domain={[0, 100]}
                    unit="%"
                    tick={{ fill: '#4f46e5', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '0.75rem',
                      boxShadow: '0 4px 6px -1px rgba(15, 23, 42, 0.06)',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                  <Bar
                    yAxisId="left"
                    dataKey="confirmed"
                    name="Confirmed"
                    stackId="vol"
                    fill="#10b981"
                    radius={[0, 0, 0, 0]}
                    barSize={24}
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="pending"
                    name="Pending"
                    stackId="vol"
                    fill="#f59e0b"
                    barSize={24}
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="cancelled"
                    name="Cancelled"
                    stackId="vol"
                    fill="#f43f5e"
                    radius={[4, 4, 0, 0]}
                    barSize={24}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="completionRate"
                    name="Completion %"
                    stroke="#4f46e5"
                    strokeWidth={2.5}
                    dot={{ r: 3.5, fill: '#4f46e5', strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bookings per Event Type */}
          <div className="xl:col-span-5 bg-white border border-[#e2e8f0] rounded-xl p-6 shadow-calm-1 space-y-4">
            <div>
              <h2 className="font-display text-[16px] font-semibold text-[#0f172a]">
                Bookings per Event Type
              </h2>
              <p className="text-[12px] text-[#64748b]">
                Status mix segmented across each appointment template.
              </p>
            </div>

            <div className="h-[290px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={eventTypeStats}
                  layout="vertical"
                  margin={{ top: 8, right: 16, left: 10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="shortName"
                    width={126}
                    tick={{ fill: '#0f172a', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '0.75rem',
                      boxShadow: '0 4px 6px -1px rgba(15, 23, 42, 0.06)',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                  <Bar
                    dataKey="confirmed"
                    name="Confirmed"
                    stackId="evt"
                    fill="#10b981"
                    barSize={18}
                  />
                  <Bar
                    dataKey="pending"
                    name="Pending"
                    stackId="evt"
                    fill="#f59e0b"
                    barSize={18}
                  />
                  <Bar
                    dataKey="cancelled"
                    name="Cancelled"
                    stackId="evt"
                    fill="#f43f5e"
                    radius={[0, 4, 4, 0]}
                    barSize={18}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Bottom Row: Event Type Performance Table & Channel Mix */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-8 bg-white border border-[#e2e8f0] rounded-xl shadow-calm-1 overflow-hidden">
            <div className="px-6 py-4 border-b border-[#e2e8f0]">
              <h2 className="font-display text-[16px] font-semibold text-[#0f172a]">
                Event Type Performance Breakdown
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#f8fafc] border-b border-[#e2e8f0] text-[11px] font-semibold uppercase tracking-[0.04em] text-[#64748b]">
                    <th className="py-2.5 px-5">Event Type</th>
                    <th className="py-2.5 px-4 text-right">Duration</th>
                    <th className="py-2.5 px-4 text-right">Total</th>
                    <th className="py-2.5 px-4 text-right">Confirmed</th>
                    <th className="py-2.5 px-4 text-right">Cancelled</th>
                    <th className="py-2.5 px-5 text-right">Completion Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e2e8f0] text-[13px]">
                  {eventTypeStats.map((row) => (
                    <tr key={row.id} className="hover:bg-[#f8fafc] transition-colors">
                      <td className="py-3 px-5 font-medium text-[#0f172a]">{row.name}</td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-[#64748b]">
                        {row.durationMinutes}m
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-[#0f172a]">
                        {row.total}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-[#047857]">
                        {row.confirmed}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-[#be123c]">
                        {row.cancelled}
                      </td>
                      <td className="py-3 px-5 text-right font-mono tabular-nums font-semibold text-[#4f46e5]">
                        {row.completionRate}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="xl:col-span-4 bg-white border border-[#e2e8f0] rounded-xl p-6 shadow-calm-1 space-y-4">
            <div>
              <h2 className="font-display text-[16px] font-semibold text-[#0f172a]">
                Channel Distribution
              </h2>
              <p className="text-[12px] text-[#64748b]">
                Bookings segmented by meeting format.
              </p>
            </div>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={channelStats} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="channel"
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '0.75rem',
                      fontSize: '12px',
                    }}
                  />
                  <Bar
                    dataKey="count"
                    name="Bookings"
                    fill="#4f46e5"
                    radius={[6, 6, 0, 0]}
                    barSize={32}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
