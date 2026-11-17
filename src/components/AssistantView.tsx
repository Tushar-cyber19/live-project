import { useEffect, useRef, useState } from 'react';
import { Send, Sparkles, Trash2, Zap } from 'lucide-react';
import { Booking, ChatMessage, EventType } from '../types/scheduling';

interface AssistantViewProps {
  messages: ChatMessage[];
  bookings: Booking[];
  eventTypes: EventType[];
  pendingPrompt: string | null;
  onConsumePendingPrompt: () => void;
  onSendMessage: (userText: string, mode: 'general' | 'fast') => Promise<void>;
  onClearHistory: () => Promise<void>;
}

const STARTER_PROMPTS = [
  'Summarize my pending and confirmed bookings for Nov 2 and Nov 3.',
  'Which service has the highest completion rate over the past month?',
  'Find open 45-minute slots on 2026-11-02 and 2026-11-03.',
  'Draft a concise preparation agenda for Alex Morgan Consultation.',
];

export function AssistantView({
  messages,
  pendingPrompt,
  onConsumePendingPrompt,
  onSendMessage,
  onClearHistory,
}: AssistantViewProps) {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<'general' | 'fast'>('general');
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  useEffect(() => {
    if (pendingPrompt && !sending) {
      const promptToSend = pendingPrompt;
      onConsumePendingPrompt();
      void submitText(promptToSend);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingPrompt]);

  const submitText = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setErrorMsg(null);
    setSending(true);
    try {
      await onSendMessage(trimmed, mode);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Unable to reach scheduling assistant.'
      );
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending) return;
    const text = input;
    setInput('');
    void submitText(text);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full bg-[#f8fafc]">
      {/* Header */}
      <div className="px-6 lg:px-8 py-4 border-b border-[#e2e8f0] bg-white flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div className="space-y-0.5">
          <h1 className="font-display text-[22px] font-semibold tracking-[-0.02em] text-[#0f172a]">
            Scheduling Copilot
          </h1>
          <p className="text-[13px] text-[#475569]">
            Multi-turn assistant grounded in your live bookings, availability slots, and monthly insights.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Model Mode Switcher */}
          <div className="inline-flex items-center p-1 rounded-lg bg-[#f1f5f9] border border-[#e2e8f0]">
            <button
              type="button"
              onClick={() => setMode('general')}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[12px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
                mode === 'general'
                  ? 'bg-white text-[#0f172a] shadow-calm-1'
                  : 'text-[#475569] hover:text-[#0f172a]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#4f46e5]" />
              <span>Standard · Hydrogen</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('fast')}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[12px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
                mode === 'fast'
                  ? 'bg-white text-[#0f172a] shadow-calm-1'
                  : 'text-[#475569] hover:text-[#0f172a]'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-[#d97706]" />
              <span>Fast · Flash-Lite</span>
            </button>
          </div>

          {messages.length > 0 && (
            <button
              type="button"
              onClick={() => void onClearHistory()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#e2e8f0] bg-white hover:bg-[#fff1f2] hover:border-[#fecdd3] hover:text-[#be123c] text-[12px] font-medium text-[#475569] transition-colors cursor-pointer whitespace-nowrap"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Thread</span>
            </button>
          )}
        </div>
      </div>

      {/* Scrollable Conversation Thread */}
      <div className="flex-1 overflow-y-auto px-6 lg:px-8 py-6">
        <div className="max-w-3xl mx-auto space-y-5">
          {messages.length === 0 ? (
            <div className="bg-white border border-[#e2e8f0] rounded-xl p-6 shadow-calm-1 space-y-5">
              <div className="space-y-1">
                <h2 className="font-display text-[17px] font-semibold text-[#0f172a]">
                  Coordinate smarter with live calendar context
                </h2>
                <p className="text-[13px] text-[#475569] leading-relaxed">
                  Ask about open availability, monthly completion rates, potential overbooking, or draft structured agendas for upcoming client calls.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {STARTER_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => void submitText(prompt)}
                    className="text-left p-3.5 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] hover:bg-white hover:border-[#4f46e5] text-[13px] text-[#0f172a] transition-all cursor-pointer"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-xl px-4 py-3 text-[14px] leading-relaxed ${
                      isUser
                        ? 'bg-[#4f46e5] text-white shadow-slot-active'
                        : 'bg-white border border-[#e2e8f0] text-[#0f172a] shadow-calm-1'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.text}</div>
                    <div
                      className={`mt-1.5 text-[11px] font-mono tabular-nums ${
                        isUser ? 'text-[#dad7ff]' : 'text-[#94a3b8]'
                      }`}
                    >
                      {isUser ? 'You' : msg.modelUsed}
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {sending && (
            <div className="flex justify-start">
              <div className="bg-white border border-[#e2e8f0] rounded-xl px-4 py-3 text-[13px] text-[#64748b] shadow-calm-1">
                Analyzing schedule context…
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-[#fff1f2] border border-[#fecdd3] text-[13px] text-[#be123c]">
              {errorMsg}
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input Composer */}
      <div className="p-4 lg:px-8 border-t border-[#e2e8f0] bg-white shrink-0">
        <form
          onSubmit={handleSubmit}
          className="max-w-3xl mx-auto flex items-center gap-2.5"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about availability, monthly trends, or meeting agendas..."
            aria-label="Message Scheduling Copilot"
            className="input-calm flex-1 px-4 py-2.5 text-[14px] text-[#0f172a] placeholder:text-[#94a3b8]"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-medium transition-all whitespace-nowrap ${
              sending || !input.trim()
                ? 'bg-[#f1f5f9] text-[#94a3b8] cursor-not-allowed'
                : 'bg-[#4f46e5] hover:bg-[#4338ca] active:scale-[0.99] text-white cursor-pointer'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Send</span>
          </button>
        </form>
      </div>
    </div>
  );
}
