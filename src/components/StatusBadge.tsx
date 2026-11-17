import { Check, Clock, X } from 'lucide-react';
import { BookingStatus } from '../types/scheduling';

interface StatusBadgeProps {
  status: BookingStatus;
}

const STATUS_CONFIG: Record<
  BookingStatus,
  {
    label: string;
    bg: string;
    text: string;
    border: string;
    Icon: typeof Check;
  }
> = {
  confirmed: {
    label: 'Confirmed',
    bg: 'bg-[#ecfdf5]',
    text: 'text-[#047857]',
    border: 'border-[#a7f3d0]',
    Icon: Check,
  },
  pending: {
    label: 'Pending',
    bg: 'bg-[#fffbeb]',
    text: 'text-[#b45309]',
    border: 'border-[#fde68a]',
    Icon: Clock,
  },
  cancelled: {
    label: 'Cancelled',
    bg: 'bg-[#fff1f2]',
    text: 'text-[#be123c]',
    border: 'border-[#fecdd3]',
    Icon: X,
  },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.Icon;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold leading-4 tracking-[0.04em] uppercase whitespace-nowrap shrink-0 ${cfg.bg} ${cfg.text} ${cfg.border}`}
    >
      <Icon className="w-3 h-3 shrink-0" strokeWidth={2.25} aria-hidden="true" />
      <span>{cfg.label}</span>
    </span>
  );
}
