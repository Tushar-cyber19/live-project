import { useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { Menu, Plus } from 'lucide-react';
import { AssistantView } from './components/AssistantView';
import { BookingDetailDrawer } from './components/BookingDetailDrawer';
import { BookingsDirectoryView } from './components/BookingsDirectoryView';
import { BookSlotView } from './components/BookSlotView';
import { DashboardView } from './components/DashboardView';
import { EventTypesView } from './components/EventTypesView';
import { InsightsView } from './components/InsightsView';
import { LeftRail } from './components/LeftRail';
import { NewBookingModal } from './components/NewBookingModal';
import { ScheduleView } from './components/ScheduleView';
import {
  DEFAULT_SCHEDULE_DATE,
  HOST_PROFILE,
  INITIAL_BOOKINGS,
  INITIAL_EVENT_TYPES,
  TODAY_ISO,
} from './data/seedData';
import { auth, googleProvider } from './lib/firebase';
import {
  clearChatMessagesDocs,
  createBookingDoc,
  createChatMessageDoc,
  createEventTypeDoc,
  deleteBookingDoc,
  ensureUserWorkspaceInitialized,
  rescheduleBookingDoc,
  subscribeUserBookings,
  subscribeUserChatMessages,
  subscribeUserEventTypes,
  toggleEventTypeDoc,
  updateBookingNotesDoc,
  updateBookingStatusDoc,
} from './lib/firestoreService';
import {
  AppScreen,
  Booking,
  BookingLocation,
  BookingStatus,
  ChatMessage,
  EventType,
} from './types/scheduling';

const STORAGE_BOOKINGS_KEY = 'cadence_bookings_v3';
const STORAGE_EVENTS_KEY = 'cadence_events_v3';
const STORAGE_CHAT_KEY = 'cadence_chat_v1';

function loadStored<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authActionBusy, setAuthActionBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [firestoreError, setFirestoreError] = useState<Error | null>(null);

  const [bookings, setBookings] = useState<Booking[]>(() =>
    loadStored(STORAGE_BOOKINGS_KEY, INITIAL_BOOKINGS)
  );
  const [eventTypes, setEventTypes] = useState<EventType[]>(() =>
    loadStored(STORAGE_EVENTS_KEY, INITIAL_EVENT_TYPES)
  );
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() =>
    loadStored(STORAGE_CHAT_KEY, [])
  );

  const [activeScreen, setActiveScreen] = useState<AppScreen>('dashboard');
  const [selectedDate, setSelectedDate] = useState<string>(DEFAULT_SCHEDULE_DATE);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [selectedEventTypeId, setSelectedEventTypeId] = useState<string>('evt-consultation');
  const [pendingCopilotPrompt, setPendingCopilotPrompt] = useState<string | null>(null);

  const [statusFilters, setStatusFilters] = useState<Record<BookingStatus, boolean>>({
    confirmed: true,
    pending: true,
    cancelled: true,
  });

  const [mobileRailOpen, setMobileRailOpen] = useState(false);
  const [newBookingOpen, setNewBookingOpen] = useState(false);
  const [modalInitialSlot, setModalInitialSlot] = useState<string | null>(null);
  const [modalInitialEventTypeId, setModalInitialEventTypeId] = useState<string | null>(null);

  // Surface any async Firestore permission errors to ErrorBoundary
  if (firestoreError) {
    throw firestoreError;
  }

  // Firebase Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthUser(user);
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Attach Firestore listeners only when auth is ready and user is authenticated
  useEffect(() => {
    if (!authReady || !authUser) return;

    let cancelled = false;
    let unsubBookings: (() => void) | undefined;
    let unsubEvents: (() => void) | undefined;
    let unsubChat: (() => void) | undefined;

    (async () => {
      try {
        await ensureUserWorkspaceInitialized(authUser);
        if (cancelled) return;

        unsubBookings = subscribeUserBookings(
          authUser.uid,
          (items) => setBookings(items),
          (err) => setFirestoreError(err)
        );
        unsubEvents = subscribeUserEventTypes(
          authUser.uid,
          (items) => setEventTypes(items),
          (err) => setFirestoreError(err)
        );
        unsubChat = subscribeUserChatMessages(
          authUser.uid,
          (items) => setChatMessages(items),
          (err) => setFirestoreError(err)
        );
      } catch (err) {
        if (!cancelled) {
          setFirestoreError(err instanceof Error ? err : new Error(String(err)));
        }
      }
    })();

    return () => {
      cancelled = true;
      unsubBookings?.();
      unsubEvents?.();
      unsubChat?.();
    };
  }, [authReady, authUser]);

  // Local fallback persistence when signed out
  useEffect(() => {
    if (authUser) return;
    try {
      localStorage.setItem(STORAGE_BOOKINGS_KEY, JSON.stringify(bookings));
    } catch {
      // ignore
    }
  }, [bookings, authUser]);

  useEffect(() => {
    if (authUser) return;
    try {
      localStorage.setItem(STORAGE_EVENTS_KEY, JSON.stringify(eventTypes));
    } catch {
      // ignore
    }
  }, [eventTypes, authUser]);

  useEffect(() => {
    if (authUser) return;
    try {
      localStorage.setItem(STORAGE_CHAT_KEY, JSON.stringify(chatMessages));
    } catch {
      // ignore
    }
  }, [chatMessages, authUser]);

  const handleSignInGoogle = async () => {
    setAuthError(null);
    setAuthActionBusy(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Google sign-in failed.');
    } finally {
      setAuthActionBusy(false);
    }
  };

  const handleSignOut = async () => {
    setAuthError(null);
    await signOut(auth);
    setBookings(loadStored(STORAGE_BOOKINGS_KEY, INITIAL_BOOKINGS));
    setEventTypes(loadStored(STORAGE_EVENTS_KEY, INITIAL_EVENT_TYPES));
    setChatMessages(loadStored(STORAGE_CHAT_KEY, []));
  };

  const selectedBooking =
    bookings.find((b) => b.id === selectedBookingId) ?? null;

  const handleToggleStatusFilter = (status: BookingStatus) => {
    setStatusFilters((prev) => ({ ...prev, [status]: !prev[status] }));
  };

  const handleResetFilters = () => {
    setStatusFilters({ confirmed: true, pending: true, cancelled: true });
  };

  const handleUpdateStatus = (id: string, status: BookingStatus) => {
    if (authUser) {
      void updateBookingStatusDoc(authUser.uid, id, status).catch((err) =>
        setFirestoreError(err instanceof Error ? err : new Error(String(err)))
      );
      return;
    }
    setBookings((prev) =>
      prev.map((b) =>
        b.id === id ? { ...b, status, updatedAt: new Date().toISOString() } : b
      )
    );
  };

  const handleUpdateNotes = (id: string, notes: string) => {
    if (authUser) {
      void updateBookingNotesDoc(authUser.uid, id, notes).catch((err) =>
        setFirestoreError(err instanceof Error ? err : new Error(String(err)))
      );
      return;
    }
    setBookings((prev) =>
      prev.map((b) =>
        b.id === id ? { ...b, notes, updatedAt: new Date().toISOString() } : b
      )
    );
  };

  const handleReschedule = (id: string, date: string, startTime: string) => {
    if (authUser) {
      void rescheduleBookingDoc(authUser.uid, id, date, startTime).catch((err) =>
        setFirestoreError(err instanceof Error ? err : new Error(String(err)))
      );
      setSelectedDate(date);
      return;
    }
    setBookings((prev) =>
      prev.map((b) =>
        b.id === id
          ? { ...b, date, startTime, updatedAt: new Date().toISOString() }
          : b
      )
    );
    setSelectedDate(date);
  };

  const handleDeleteBooking = (id: string) => {
    if (authUser) {
      void deleteBookingDoc(authUser.uid, id).catch((err) =>
        setFirestoreError(err instanceof Error ? err : new Error(String(err)))
      );
      if (selectedBookingId === id) {
        setSelectedBookingId(null);
      }
      return;
    }
    setBookings((prev) => prev.filter((b) => b.id !== id));
    if (selectedBookingId === id) {
      setSelectedBookingId(null);
    }
  };

  const handleCreateBooking = (input: {
    title: string;
    eventTypeId: string;
    date: string;
    startTime: string;
    durationMinutes: number;
    status?: BookingStatus;
    clientName: string;
    clientEmail: string;
    clientCompany: string;
    location: BookingLocation;
    notes: string;
  }): string => {
    const id = `bk-${Date.now().toString(36)}-${Math.floor(10 + Math.random() * 89)}`;
    const meetingUrl =
      input.location === 'Google Meet'
        ? `https://meet.google.com/cad-${Math.random().toString(36).slice(2, 6)}`
        : input.location === 'Zoom'
        ? `https://zoom.us/j/${Math.floor(100000000 + Math.random() * 899999999)}`
        : undefined;

    const newBooking: Booking = {
      id,
      title: input.title,
      eventTypeId: input.eventTypeId,
      date: input.date,
      startTime: input.startTime,
      durationMinutes: input.durationMinutes,
      status: input.status ?? 'confirmed',
      clientName: input.clientName,
      clientEmail: input.clientEmail,
      clientCompany: input.clientCompany,
      location: input.location,
      meetingUrl,
      notes: input.notes,
      updatedAt: new Date().toISOString(),
    };

    if (authUser) {
      void createBookingDoc(authUser.uid, newBooking).catch((err) =>
        setFirestoreError(err instanceof Error ? err : new Error(String(err)))
      );
    } else {
      setBookings((prev) => [...prev, newBooking]);
    }

    setSelectedBookingId(id);
    setSelectedDate(input.date);
    return id;
  };

  const handleToggleEventType = (id: string) => {
    const target = eventTypes.find((e) => e.id === id);
    if (!target) return;
    if (authUser) {
      void toggleEventTypeDoc(authUser.uid, id, !target.active).catch((err) =>
        setFirestoreError(err instanceof Error ? err : new Error(String(err)))
      );
      return;
    }
    setEventTypes((prev) =>
      prev.map((e) => (e.id === id ? { ...e, active: !e.active } : e))
    );
  };

  const handleCreateEventType = (evt: Omit<EventType, 'id'>) => {
    const id = `evt-${Date.now().toString(36)}`;
    const newEvt: EventType = { ...evt, id };
    if (authUser) {
      void createEventTypeDoc(authUser.uid, newEvt).catch((err) =>
        setFirestoreError(err instanceof Error ? err : new Error(String(err)))
      );
      return;
    }
    setEventTypes((prev) => [...prev, newEvt]);
  };

  const handleSendChatMessage = async (userText: string, mode: 'general' | 'fast') => {
    const userMsg: ChatMessage = {
      id: `msg-${Date.now().toString(36)}-u`,
      role: 'user',
      text: userText,
      modelUsed: 'user',
      createdAt: new Date().toISOString(),
    };

    const historySnapshot = chatMessages.map((m) => ({
      role: m.role,
      text: m.text,
    }));

    if (authUser) {
      await createChatMessageDoc(authUser.uid, userMsg);
    } else {
      setChatMessages((prev) => [...prev, userMsg]);
    }

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: userText,
        history: historySnapshot,
        mode,
        scheduleContext: {
          today: TODAY_ISO,
          totalBookings: bookings.length,
          confirmedCount: bookings.filter((b) => b.status === 'confirmed').length,
          pendingCount: bookings.filter((b) => b.status === 'pending').length,
          cancelledCount: bookings.filter((b) => b.status === 'cancelled').length,
          eventTypes: eventTypes.map((e) => ({
            title: e.title,
            durationMinutes: e.durationMinutes,
            location: e.location,
            active: e.active,
          })),
          upcomingBookings: bookings
            .slice()
            .sort((a, b) => b.date.localeCompare(a.date))
            .slice(0, 25)
            .map((b) => ({
              date: b.date,
              startTime: b.startTime,
              durationMinutes: b.durationMinutes,
              title: b.title,
              status: b.status,
              clientName: b.clientName,
              location: b.location,
            })),
        },
      }),
    });

    const data = (await response.json()) as { text?: string; modelUsed?: string; error?: string };
    if (!response.ok || !data.text) {
      throw new Error(data.error || 'Assistant request failed.');
    }

    const modelMsg: ChatMessage = {
      id: `msg-${Date.now().toString(36)}-m`,
      role: 'model',
      text: data.text,
      modelUsed: data.modelUsed ?? 'gemini-4-hydrogen',
      createdAt: new Date().toISOString(),
    };

    if (authUser) {
      await createChatMessageDoc(authUser.uid, modelMsg);
    } else {
      setChatMessages((prev) => [...prev, modelMsg]);
    }
  };

  const handleClearChat = async () => {
    if (authUser) {
      await clearChatMessagesDocs(
        authUser.uid,
        chatMessages.map((m) => m.id)
      );
      return;
    }
    setChatMessages([]);
  };

  const handleQuickCreateAtSlot = (dateIso: string, startTime: string) => {
    setSelectedDate(dateIso);
    setModalInitialSlot(startTime);
    setModalInitialEventTypeId(null);
    setNewBookingOpen(true);
  };

  const handleOpenNewBookingModal = (opts?: { eventTypeId?: string; startTime?: string }) => {
    setModalInitialSlot(opts?.startTime ?? null);
    setModalInitialEventTypeId(opts?.eventTypeId ?? null);
    setNewBookingOpen(true);
  };

  const handleSelectScreen = (screen: AppScreen) => {
    setActiveScreen(screen);
    if (screen !== 'schedule' && screen !== 'bookings' && screen !== 'dashboard') {
      setSelectedBookingId(null);
    }
  };

  const showDrawer =
    selectedBooking !== null &&
    (activeScreen === 'dashboard' || activeScreen === 'schedule' || activeScreen === 'bookings');

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col lg:flex-row bg-[#f8fafc] text-[#0f172a]">
      {/* Mobile Header Bar */}
      <header className="lg:hidden h-13 shrink-0 px-4 bg-white border-b border-[#e2e8f0] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileRailOpen(true)}
            aria-label="Open navigation"
            className="p-1.5 -ml-1.5 rounded-lg text-[#475569] hover:bg-[#f1f5f9] hover:text-[#0f172a] cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-display font-semibold text-[16px] tracking-[-0.02em] text-[#0f172a]">
            Cadence
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            setModalInitialSlot(null);
            setNewBookingOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#4f46e5] hover:bg-[#4338ca] text-white text-[13px] font-medium cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New</span>
        </button>
      </header>

      {/* 280px Left Rail */}
      <LeftRail
        activeScreen={activeScreen}
        onSelectScreen={handleSelectScreen}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        bookings={bookings}
        statusFilters={statusFilters}
        onToggleStatusFilter={handleToggleStatusFilter}
        onOpenNewBooking={() => handleOpenNewBookingModal()}
        host={HOST_PROFILE}
        authUser={
          authUser
            ? {
                uid: authUser.uid,
                displayName: authUser.displayName || 'Workspace Host',
                email: authUser.email || '',
                photoURL: authUser.photoURL || undefined,
              }
            : null
        }
        authLoading={authActionBusy}
        onSignInGoogle={handleSignInGoogle}
        onSignOut={handleSignOut}
        mobileOpen={mobileRailOpen}
        onCloseMobile={() => setMobileRailOpen(false)}
      />

      {/* Primary Workspace Viewport */}
      <main className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
        {authError && (
          <div className="px-6 py-2.5 bg-[#fff1f2] border-b border-[#fecdd3] text-[13px] text-[#be123c] flex items-center justify-between">
            <span>{authError}</span>
            <button
              type="button"
              onClick={() => setAuthError(null)}
              className="text-[12px] font-medium underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="flex-1 flex min-w-0 min-h-0 overflow-hidden">
          {activeScreen === 'dashboard' && (
            <DashboardView
              hostName={authUser?.displayName || HOST_PROFILE.name}
              selectedDate={selectedDate}
              bookings={bookings}
              eventTypes={eventTypes}
              onNavigate={handleSelectScreen}
              onSelectBooking={setSelectedBookingId}
              onOpenNewBooking={handleOpenNewBookingModal}
              onAskAssistant={(prompt) => {
                setPendingCopilotPrompt(prompt);
                handleSelectScreen('assistant');
              }}
            />
          )}

          {activeScreen === 'schedule' && (
            <ScheduleView
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              bookings={bookings}
              statusFilters={statusFilters}
              selectedBookingId={selectedBookingId}
              onSelectBooking={setSelectedBookingId}
              onQuickCreateAtSlot={handleQuickCreateAtSlot}
              onResetFilters={handleResetFilters}
            />
          )}

          {activeScreen === 'bookings' && (
            <BookingsDirectoryView
              bookings={bookings}
              selectedBookingId={selectedBookingId}
              onSelectBooking={setSelectedBookingId}
              onUpdateStatus={handleUpdateStatus}
              onOpenNewBooking={() => {
                setModalInitialSlot(null);
                setNewBookingOpen(true);
              }}
            />
          )}

          {activeScreen === 'insights' && (
            <InsightsView
              bookings={bookings}
              eventTypes={eventTypes}
              onAskCopilot={(prompt) => {
                setPendingCopilotPrompt(prompt);
                handleSelectScreen('assistant');
              }}
            />
          )}

          {activeScreen === 'book' && (
            <BookSlotView
              host={
                authUser
                  ? {
                      ...HOST_PROFILE,
                      name: authUser.displayName || HOST_PROFILE.name,
                      email: authUser.email || HOST_PROFILE.email,
                      avatar: authUser.photoURL || HOST_PROFILE.avatar,
                    }
                  : HOST_PROFILE
              }
              eventTypes={eventTypes}
              bookings={bookings}
              selectedEventTypeId={selectedEventTypeId}
              onSelectEventTypeId={setSelectedEventTypeId}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              onCreateBooking={handleCreateBooking}
              onViewInSchedule={(dateIso, bookingId) => {
                setSelectedDate(dateIso);
                setSelectedBookingId(bookingId);
                setActiveScreen('schedule');
              }}
            />
          )}

          {activeScreen === 'events' && (
            <EventTypesView
              eventTypes={eventTypes}
              onToggleActive={handleToggleEventType}
              onCreateEventType={handleCreateEventType}
              onPreviewBooking={(eventTypeId) => {
                setSelectedEventTypeId(eventTypeId);
                setActiveScreen('book');
              }}
            />
          )}

          {activeScreen === 'assistant' && (
            <AssistantView
              messages={chatMessages}
              bookings={bookings}
              eventTypes={eventTypes}
              pendingPrompt={pendingCopilotPrompt}
              onConsumePendingPrompt={() => setPendingCopilotPrompt(null)}
              onSendMessage={handleSendChatMessage}
              onClearHistory={handleClearChat}
            />
          )}

          {/* 380px Contextual Booking Inspector Drawer */}
          {showDrawer && (
            <BookingDetailDrawer
              booking={selectedBooking}
              allBookings={bookings}
              onClose={() => setSelectedBookingId(null)}
              onUpdateStatus={handleUpdateStatus}
              onUpdateNotes={handleUpdateNotes}
              onReschedule={handleReschedule}
              onDelete={handleDeleteBooking}
            />
          )}
        </div>
      </main>

      {/* New Booking Modal */}
      <NewBookingModal
        open={newBookingOpen}
        initialDate={selectedDate}
        initialSlot={modalInitialSlot}
        initialEventTypeId={modalInitialEventTypeId}
        eventTypes={eventTypes}
        bookings={bookings}
        onClose={() => setNewBookingOpen(false)}
        onCreate={(input) => {
          const createdId = handleCreateBooking(input);
          setSelectedBookingId(createdId);
        }}
      />
    </div>
  );
}
