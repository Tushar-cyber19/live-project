import { User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { INITIAL_BOOKINGS, INITIAL_EVENT_TYPES } from '../data/seedData';
import {
  Booking,
  BookingStatus,
  ChatMessage,
  EventType,
} from '../types/scheduling';
import { db, handleFirestoreError, OperationType } from './firebase';

function clampString(val: string, maxLen: number): string {
  return val.trim().slice(0, maxLen);
}

function sanitizeId(raw: string): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_\-]/g, '-').slice(0, 128);
  return cleaned || `id-${Date.now()}`;
}

function sanitizeSlug(raw: string): string {
  const cleaned = raw
    .toLowerCase()
    .replace(/[^a-z0-9\-]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
  return cleaned || 'custom-event';
}

function timestampToIso(ts: unknown): string {
  if (ts instanceof Timestamp) {
    return ts.toDate().toISOString();
  }
  if (typeof ts === 'string') return ts;
  return new Date().toISOString();
}

export async function ensureUserWorkspaceInitialized(user: User): Promise<void> {
  const userRef = doc(db, 'users', user.uid);
  const privateRef = doc(db, 'users', user.uid, 'private', 'info');

  try {
    const existingProfile = await getDoc(userRef);
    if (!existingProfile.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        displayName: clampString(user.displayName || 'Workspace Host', 100),
        ...(user.photoURL ? { photoURL: clampString(user.photoURL, 500) } : {}),
        role: 'Principal Product Architect',
        timezone: 'America/Los_Angeles',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    const existingPrivate = await getDoc(privateRef);
    if (!existingPrivate.exists() && user.email) {
      await setDoc(privateRef, {
        uid: user.uid,
        email: clampString(user.email, 160),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    const eventsQuery = query(
      collection(db, 'users', user.uid, 'eventTypes'),
      where('ownerId', '==', user.uid)
    );
    const eventsSnap = await getDocs(eventsQuery);
    const hasLegacySeed = eventsSnap.docs.some((d) => d.id === 'evt-arch') &&
      !eventsSnap.docs.some((d) => d.id === 'evt-consultation');

    if (eventsSnap.empty || hasLegacySeed) {
      const batch = writeBatch(db);
      if (hasLegacySeed) {
        for (const d of eventsSnap.docs) {
          batch.delete(d.ref);
        }
      }
      for (const evt of INITIAL_EVENT_TYPES) {
        const ref = doc(db, 'users', user.uid, 'eventTypes', sanitizeId(evt.id));
        batch.set(ref, {
          ownerId: user.uid,
          slug: sanitizeSlug(evt.slug),
          title: clampString(evt.title, 100),
          durationMinutes: evt.durationMinutes,
          location: evt.location,
          description: clampString(evt.description, 500),
          bufferMinutes: evt.bufferMinutes,
          dailyLimit: evt.dailyLimit,
          active: evt.active,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      await batch.commit();
    }

    const bookingsQuery = query(
      collection(db, 'users', user.uid, 'bookings'),
      where('ownerId', '==', user.uid)
    );
    const bookingsSnap = await getDocs(bookingsQuery);
    if (bookingsSnap.empty || hasLegacySeed) {
      const batch = writeBatch(db);
      if (hasLegacySeed) {
        for (const d of bookingsSnap.docs) {
          batch.delete(d.ref);
        }
      }
      for (const b of INITIAL_BOOKINGS) {
        const ref = doc(db, 'users', user.uid, 'bookings', sanitizeId(b.id));
        batch.set(ref, {
          ownerId: user.uid,
          title: clampString(b.title, 140),
          eventTypeId: sanitizeId(b.eventTypeId),
          date: b.date,
          startTime: b.startTime,
          durationMinutes: b.durationMinutes,
          status: b.status,
          clientName: clampString(b.clientName, 100),
          clientEmail: clampString(b.clientEmail, 160),
          clientCompany: clampString(b.clientCompany, 100),
          ...(b.clientAvatar ? { clientAvatar: clampString(b.clientAvatar, 300) } : {}),
          location: b.location,
          ...(b.meetingUrl ? { meetingUrl: clampString(b.meetingUrl, 300) } : {}),
          notes: clampString(b.notes, 2000),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
  }
}

export function subscribeUserBookings(
  uid: string,
  onData: (bookings: Booking[]) => void,
  onError: (err: Error) => void
): () => void {
  const path = `users/${uid}/bookings`;
  const q = query(collection(db, 'users', uid, 'bookings'), where('ownerId', '==', uid));
  return onSnapshot(
    q,
    (snap) => {
      const items: Booking[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          title: String(data.title ?? ''),
          eventTypeId: String(data.eventTypeId ?? ''),
          date: String(data.date ?? ''),
          startTime: String(data.startTime ?? '09:00'),
          durationMinutes: Number(data.durationMinutes ?? 30),
          status: (data.status as BookingStatus) ?? 'confirmed',
          clientName: String(data.clientName ?? ''),
          clientEmail: String(data.clientEmail ?? ''),
          clientCompany: String(data.clientCompany ?? ''),
          clientAvatar: typeof data.clientAvatar === 'string' ? data.clientAvatar : undefined,
          location: data.location,
          meetingUrl: typeof data.meetingUrl === 'string' ? data.meetingUrl : undefined,
          notes: String(data.notes ?? ''),
          updatedAt: timestampToIso(data.updatedAt),
        };
      });
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export function subscribeUserEventTypes(
  uid: string,
  onData: (events: EventType[]) => void,
  onError: (err: Error) => void
): () => void {
  const path = `users/${uid}/eventTypes`;
  const q = query(collection(db, 'users', uid, 'eventTypes'), where('ownerId', '==', uid));
  return onSnapshot(
    q,
    (snap) => {
      const items: EventType[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          slug: String(data.slug ?? ''),
          title: String(data.title ?? ''),
          durationMinutes: Number(data.durationMinutes ?? 30),
          location: data.location,
          description: String(data.description ?? ''),
          bufferMinutes: Number(data.bufferMinutes ?? 10),
          dailyLimit: Number(data.dailyLimit ?? 4),
          active: Boolean(data.active),
        };
      });
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export function subscribeUserChatMessages(
  uid: string,
  onData: (messages: ChatMessage[]) => void,
  onError: (err: Error) => void
): () => void {
  const path = `users/${uid}/chatMessages`;
  const q = query(collection(db, 'users', uid, 'chatMessages'), where('ownerId', '==', uid));
  return onSnapshot(
    q,
    (snap) => {
      const items: ChatMessage[] = snap.docs
        .map((d) => {
          const data = d.data();
          return {
            id: d.id,
            role: (data.role as 'user' | 'model') ?? 'user',
            text: String(data.text ?? ''),
            modelUsed: String(data.modelUsed ?? 'gemini-4-hydrogen'),
            createdAt: timestampToIso(data.createdAt),
          };
        })
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export async function createBookingDoc(uid: string, booking: Booking): Promise<void> {
  const id = sanitizeId(booking.id);
  const path = `users/${uid}/bookings/${id}`;
  try {
    await setDoc(doc(db, 'users', uid, 'bookings', id), {
      ownerId: uid,
      title: clampString(booking.title, 140) || 'Scheduled Appointment',
      eventTypeId: sanitizeId(booking.eventTypeId),
      date: booking.date,
      startTime: booking.startTime,
      durationMinutes: Math.max(5, Math.min(240, Math.round(booking.durationMinutes))),
      status: booking.status,
      clientName: clampString(booking.clientName, 100) || 'Guest',
      clientEmail: clampString(booking.clientEmail, 160),
      clientCompany: clampString(booking.clientCompany, 100),
      ...(booking.clientAvatar ? { clientAvatar: clampString(booking.clientAvatar, 300) } : {}),
      location: booking.location,
      ...(booking.meetingUrl ? { meetingUrl: clampString(booking.meetingUrl, 300) } : {}),
      notes: clampString(booking.notes, 2000),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateBookingStatusDoc(
  uid: string,
  bookingId: string,
  status: BookingStatus
): Promise<void> {
  const path = `users/${uid}/bookings/${bookingId}`;
  try {
    await updateDoc(doc(db, 'users', uid, 'bookings', bookingId), {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateBookingNotesDoc(
  uid: string,
  bookingId: string,
  notes: string
): Promise<void> {
  const path = `users/${uid}/bookings/${bookingId}`;
  try {
    await updateDoc(doc(db, 'users', uid, 'bookings', bookingId), {
      notes: clampString(notes, 2000),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function rescheduleBookingDoc(
  uid: string,
  bookingId: string,
  date: string,
  startTime: string
): Promise<void> {
  const path = `users/${uid}/bookings/${bookingId}`;
  try {
    await updateDoc(doc(db, 'users', uid, 'bookings', bookingId), {
      date,
      startTime,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteBookingDoc(uid: string, bookingId: string): Promise<void> {
  const path = `users/${uid}/bookings/${bookingId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'bookings', bookingId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function createEventTypeDoc(uid: string, evt: EventType): Promise<void> {
  const id = sanitizeId(evt.id);
  const path = `users/${uid}/eventTypes/${id}`;
  try {
    await setDoc(doc(db, 'users', uid, 'eventTypes', id), {
      ownerId: uid,
      slug: sanitizeSlug(evt.slug),
      title: clampString(evt.title, 100) || 'Custom Session',
      durationMinutes: Math.max(5, Math.min(240, Math.round(evt.durationMinutes))),
      location: evt.location,
      description: clampString(evt.description, 500),
      bufferMinutes: Math.max(0, Math.min(60, Math.round(evt.bufferMinutes))),
      dailyLimit: Math.max(1, Math.min(20, Math.round(evt.dailyLimit))),
      active: evt.active,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function toggleEventTypeDoc(
  uid: string,
  eventTypeId: string,
  active: boolean
): Promise<void> {
  const path = `users/${uid}/eventTypes/${eventTypeId}`;
  try {
    await updateDoc(doc(db, 'users', uid, 'eventTypes', eventTypeId), {
      active,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function createChatMessageDoc(
  uid: string,
  msg: ChatMessage
): Promise<void> {
  const id = sanitizeId(msg.id);
  const path = `users/${uid}/chatMessages/${id}`;
  try {
    await setDoc(doc(db, 'users', uid, 'chatMessages', id), {
      ownerId: uid,
      role: msg.role,
      text: clampString(msg.text, 16000) || '...',
      modelUsed: clampString(msg.modelUsed, 64) || 'gemini-4-hydrogen',
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function clearChatMessagesDocs(
  uid: string,
  messageIds: string[]
): Promise<void> {
  const path = `users/${uid}/chatMessages`;
  try {
    const batch = writeBatch(db);
    for (const id of messageIds) {
      batch.delete(doc(db, 'users', uid, 'chatMessages', sanitizeId(id)));
    }
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
