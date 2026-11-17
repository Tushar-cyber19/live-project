import { useState } from 'react';
import { ArrowUpRight, Check, Clock, Copy, MapPin, Plus, Video } from 'lucide-react';
import { BookingLocation, EventType } from '../types/scheduling';

interface EventTypesViewProps {
  eventTypes: EventType[];
  onToggleActive: (id: string) => void;
  onCreateEventType: (evt: Omit<EventType, 'id'>) => void;
  onPreviewBooking: (eventTypeId: string) => void;
}

export function EventTypesView({
  eventTypes,
  onToggleActive,
  onCreateEventType,
  onPreviewBooking,
}: EventTypesViewProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [location, setLocation] = useState<BookingLocation>('Google Meet');
  const [bufferMinutes, setBufferMinutes] = useState(10);
  const [description, setDescription] = useState('');

  const handleCopy = (evt: EventType) => {
    const url = `https://cadence.work/elena/${evt.slug}`;
    navigator.clipboard?.writeText(url).catch(() => {});
    setCopiedId(evt.id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const slug = title
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    onCreateEventType({
      slug: slug || 'custom-session',
      title: title.trim(),
      durationMinutes,
      location,
      description:
        description.trim() ||
        'Structured consultation session coordinated via Cadence.',
      bufferMinutes,
      dailyLimit: 4,
      active: true,
    });
    setTitle('');
    setDescription('');
    setCreating(false);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8">
      <div className="max-w-5xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-0.5">
            <h1 className="font-display text-[24px] font-semibold tracking-[-0.02em] text-[#0f172a]">
              Event Types
            </h1>
            <p className="text-[13px] text-[#475569]">
              Reusable appointment templates, buffer rules, and shareable booking links.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCreating((v) => !v)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#4f46e5] hover:bg-[#4338ca] text-white text-[13px] font-medium transition-colors cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>{creating ? 'Close Form' : 'New Event Type'}</span>
          </button>
        </div>

        {creating && (
          <form
            onSubmit={handleSubmit}
            className="bg-white border border-[#e2e8f0] rounded-xl p-6 shadow-calm-2 space-y-4"
          >
            <h2 className="font-display text-[16px] font-semibold text-[#0f172a]">
              Create Event Template
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[12px] font-medium text-[#475569] mb-1">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Technical Scoping"
                  className="input-calm w-full px-3 py-2 text-[13px]"
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[#475569] mb-1">
                  Duration (min)
                </label>
                <select
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="input-calm w-full px-3 py-2 text-[13px] tabular-nums"
                >
                  <option value={15}>15 minutes</option>
                  <option value={20}>20 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>60 minutes</option>
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[#475569] mb-1">
                  Location
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
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-[12px] font-medium text-[#475569] mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Agenda expectations for attendees..."
                  className="input-calm w-full px-3 py-2 text-[13px]"
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[#475569] mb-1">
                  Buffer Before/After
                </label>
                <select
                  value={bufferMinutes}
                  onChange={(e) => setBufferMinutes(Number(e.target.value))}
                  className="input-calm w-full px-3 py-2 text-[13px] tabular-nums"
                >
                  <option value={0}>No buffer</option>
                  <option value={5}>5 minutes</option>
                  <option value={10}>10 minutes</option>
                  <option value={15}>15 minutes</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCreating(false)}
                className="px-4 py-2 rounded-lg border border-[#e2e8f0] bg-white hover:bg-[#f1f5f9] text-[13px] font-medium text-[#0f172a] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-[#4f46e5] hover:bg-[#4338ca] text-white text-[13px] font-medium cursor-pointer"
              >
                Save Event Type
              </button>
            </div>
          </form>
        )}

        {/* Event Type Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {eventTypes.map((evt) => (
            <div
              key={evt.id}
              className="bg-white border border-[#e2e8f0] rounded-xl p-5 shadow-calm-1 hover:shadow-calm-2 hover:border-[#cbd5e1] transition-all flex flex-col justify-between gap-5"
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <h3 className="font-display text-[16px] font-semibold text-[#0f172a] tracking-[-0.01em]">
                      {evt.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 text-[12px] text-[#64748b] tabular-nums">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{evt.durationMinutes} min</span>
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="inline-flex items-center gap-1">
                        {evt.location === 'Studio B · SF' ? (
                          <MapPin className="w-3.5 h-3.5" />
                        ) : (
                          <Video className="w-3.5 h-3.5" />
                        )}
                        <span>{evt.location}</span>
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{evt.bufferMinutes}m buffer</span>
                    </div>
                  </div>

                  {/* Active Toggle */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={evt.active}
                    aria-label={`Toggle ${evt.title}`}
                    onClick={() => onToggleActive(evt.id)}
                    className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors cursor-pointer ${
                      evt.active ? 'bg-[#4f46e5]' : 'bg-[#cbd5e1]'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                        evt.active ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <p className="text-[13px] text-[#475569] leading-relaxed">
                  {evt.description}
                </p>
              </div>

              <div className="pt-4 border-t border-[#e2e8f0] flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-[12px] text-[#64748b] truncate">
                  /elena/{evt.slug}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopy(evt)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#e2e8f0] bg-white hover:bg-[#f1f5f9] text-[12px] font-medium text-[#0f172a] transition-colors cursor-pointer"
                  >
                    {copiedId === evt.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#047857]" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-[#64748b]" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => onPreviewBooking(evt.id)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#f8fafc] border border-[#e2e8f0] hover:border-[#4f46e5] hover:text-[#4f46e5] text-[12px] font-medium text-[#0f172a] transition-colors cursor-pointer"
                  >
                    <span>Book Slot</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
