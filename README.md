# Cadence — Calm Scheduling

> **Freelancer Practical Assessment** · Appointment Manager · MERN Stack

A clean, responsive appointment management application built with **React + TypeScript** (frontend), **Node.js + Express** (API), and **Firebase Firestore** (persistence) — with optional local/offline mode via `localStorage`.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Starting Data](#starting-data)
- [Prerequisites](#prerequisites)
- [Setup & Run Locally](#setup--run-locally)
- [API Reference](#api-reference)
- [Tests Performed](#tests-performed)
- [Technical Decision](#technical-decision)
- [Known Limitations & Incomplete Items](#known-limitations--incomplete-items)
- [Assumptions](#assumptions)

---

## Features

### Core Requirements ✅

| # | Requirement | Status |
|---|---|---|
| 1 | Display appointments with customer name, service, date/time and status | ✅ Done |
| 2 | Add an appointment with customer name, service, date/time and status | ✅ Done |
| 3 | Validate required fields and display clear error messages | ✅ Done |
| 4 | Allow the user to change an appointment's status | ✅ Done |
| 5 | Filter appointments by status: All, Pending, Confirmed, Cancelled | ✅ Done |
| 6 | Customer-name search field | ✅ Done |
| 7 | Clean, responsive interface usable on mobile and desktop | ✅ Done |
| 8 | Node.js / Express API with data persistence | ✅ Done (Firebase Firestore + localStorage fallback) |

### Additional Features

- **AI Scheduling Assistant** — Gemini-powered copilot for analyzing trends, suggesting open slots, and drafting agendas (`POST /api/chat`)
- **Smart Slot Recommendations** — Highlights historically popular time slots per event type
- **Insights Dashboard** — Completion rates, cancellation patterns, and booking volume charts (Recharts)
- **Multi-timezone support** — Pacific, Eastern, GMT, IST, JST
- **Conflict detection** — Prevents double-booking the same time slot
- **Offline mode** — All data persists in `localStorage` when logged out; syncs to Firestore on sign-in
- **Google OAuth** — Optional sign-in to persist data across devices via Firebase Auth + Firestore

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Tailwind CSS v4, Vite |
| Backend (API) | Node.js, Express 4 |
| Persistence | Firebase Firestore (authenticated) · localStorage (guest/offline) |
| AI | Google Gemini API (`@google/genai`) |
| Auth | Firebase Authentication (Google OAuth) |
| Charts | Recharts |
| Animations | Motion (Framer Motion) |

---

## Starting Data

The app is pre-seeded with the following appointments:

| Customer | Service | Date / Time | Status |
|---|---|---|---|
| Alex Morgan | Consultation | 2026-11-02 10:00 | Pending |
| Jamie Lee | Follow-up | 2026-11-02 11:30 | Confirmed |
| Taylor Smith | Review | 2026-11-03 14:00 | Cancelled |

These are defined in [`src/data/seedData.ts`](src/data/seedData.ts) and loaded automatically on first launch.

---

## Prerequisites

- **Node.js** v18 or later (`node -v`)
- **npm** v9 or later (`npm -v`)
- A **Gemini API key** — get one free at [aistudio.google.com](https://aistudio.google.com) *(required only for the AI Assistant feature)*

---

## Setup & Run Locally

### 1. Install dependencies

```bash
npm install
```

> **Note:** `bun.lock` is included for reference but `npm` is the recommended package manager for local setup.

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Then edit `.env.local` and fill in your key:

```env
GEMINI_API_KEY="your_gemini_api_key_here"
APP_URL="http://localhost:3000"
```

> The app works **without** a Gemini API key — all appointment features (add, edit, filter, search) work fully offline. The AI Assistant panel will show an error only if you try to use it without the key.

### 3. Run in development mode

```bash
npm run dev
```

The app opens at **http://localhost:3000** with hot-module replacement enabled.

### 4. Build for production

```bash
npm run build        # Compile frontend to dist/
npm run start        # Serve production build on port 3000
```

---

## API Reference

The Express server exposes one API endpoint. The frontend manages appointment state client-side (localStorage / Firebase), so the API is used exclusively for the AI assistant feature.

### `POST /api/chat`

Sends a message to the Gemini-powered scheduling assistant.

**Request body:**

```json
{
  "message": "What slots are free tomorrow?",
  "mode": "general",
  "history": [
    { "role": "user", "text": "previous user message" },
    { "role": "model", "text": "previous assistant reply" }
  ],
  "scheduleContext": {
    "today": "2026-11-16",
    "totalBookings": 12,
    "confirmedCount": 7,
    "pendingCount": 3,
    "cancelledCount": 2,
    "eventTypes": [
      { "title": "Consultation", "durationMinutes": 45, "location": "Google Meet", "active": true }
    ],
    "upcomingBookings": [
      {
        "date": "2026-11-17",
        "startTime": "10:00",
        "durationMinutes": 45,
        "title": "Consultation · Alex Morgan",
        "status": "confirmed",
        "clientName": "Alex Morgan",
        "location": "Google Meet"
      }
    ]
  }
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `message` | string | ✅ | The user's message |
| `mode` | `"general"` \| `"fast"` | ❌ | `"fast"` uses a lighter model; default is `"general"` |
| `history` | array | ❌ | Last N chat turns for context (max 20) |
| `scheduleContext` | object | ❌ | Live workspace data for grounded responses |

**Success response `200`:**

```json
{
  "text": "You have 3 open slots tomorrow: 09:00, 13:30, and 16:00 PT...",
  "modelUsed": "gemini-4-hydrogen"
}
```

**Error responses:**

| Status | Meaning |
|---|---|
| `400` | Missing or empty `message` |
| `500` | Gemini API error or missing `GEMINI_API_KEY` |
| `502` | Gemini returned an empty response |

---

## Tests Performed

All tests were performed manually in Chrome (desktop) and mobile viewport simulation (DevTools).

### Appointment Display
- [x] Bookings list renders with customer name, service type, date/time, and status badge
- [x] Status badges are colour-coded: green (Confirmed), amber (Pending), red (Cancelled)

### Add Appointment
- [x] Modal opens via "New Commitment" button
- [x] Required field (`Client Name`) blocked submission when empty — form does not submit
- [x] Appointment appears immediately in the list after creation
- [x] Conflict detection prevents double-booking the same time slot

### Status Change
- [x] Status can be changed to Confirmed / Pending / Cancelled from the booking detail drawer
- [x] Change is reflected immediately in the list without page refresh
- [x] Cancelled bookings cannot be re-confirmed (enforced by Firestore rules when logged in)

### Filter by Status
- [x] "All Commitments" tab shows all records
- [x] "Confirmed", "Pending", "Cancelled" tabs each filter correctly
- [x] Count badges on tabs update when bookings are added or status-changed

### Customer-Name Search
- [x] Search field filters list in real-time as the user types
- [x] Search is case-insensitive and matches partial names
- [x] Works in combination with status filter tabs (AND logic)

### Persistence
- [x] Guest mode: data persists in `localStorage` across page refreshes
- [x] Auth mode: data writes to Firestore and survives a full browser close/reopen

### Responsive Layout
- [x] Mobile (375px): single-column layout, full-width cards
- [x] Tablet (768px): two-column layout
- [x] Desktop (1280px+): three-pane layout (left rail + main + detail drawer)

### AI Assistant (requires GEMINI_API_KEY)
- [x] Assistant responds with schedule-aware answers
- [x] Missing API key shows a clear error rather than crashing

---

## Technical Decision

**Why Firebase Firestore instead of MongoDB for persistence?**

The brief specifies MongoDB as the preferred persistence layer. However, this project was initially scaffolded in Google AI Studio, which provisions a Firestore database automatically. Given the 90-minute constraint, switching to MongoDB would have consumed significant setup time (local install or Atlas signup, connection string management, schema design, Mongoose models) with limited added value for a demo.

**The trade-off I made:** Use Firestore (a real, production-grade NoSQL database with the same document/collection model as MongoDB) to stay focused on feature delivery. The Firestore Security Rules (`firestore.rules`) enforce strict per-user access control — no row is readable by another user, all writes require an email-verified Google account, and field-level validation is enforced at the database layer.

If I were to migrate to MongoDB, the data shape in `src/types/scheduling.ts` maps 1-to-1 to Mongoose schemas, and `src/lib/firestoreService.ts` would be replaced by equivalent Mongoose service functions with minimal changes to `App.tsx`.

---

## Known Limitations & Incomplete Items

| Item | Notes |
|---|---|
| MongoDB not used | Firestore used as equivalent substitute (see [Technical Decision](#technical-decision)) |
| No dedicated REST endpoints for bookings | Bookings are managed client-side via Firestore SDK; a traditional REST API (`GET /api/bookings`, `POST /api/bookings`, `PATCH /api/bookings/:id`) was not implemented within the time scope |
| No server-side unit tests | Manual testing only; Jest/Vitest tests would be the next step |
| AI Assistant requires paid Gemini API key | Free-tier key from AI Studio works; app is fully usable without it |
| `bun.lock` committed | Project was originally built with Bun; `npm install` works fine as an alternative |

---

## Assumptions

1. **Stack flexibility**: The brief allows MERN or MEVN with TypeScript. React (MERN) was chosen as the frontend framework.
2. **Persistence fallback**: The brief states "persist data in MongoDB if the environment allows within the time limit; communicate early and explain your fallback." Firebase Firestore is used as the persistence layer with a `localStorage` offline fallback.
3. **AI Assistant is out-of-scope bonus**: The brief does not require an AI feature; this was added as an enhancement.
4. **Fictional data only**: All seed data (`seedData.ts`) uses fictional names, emails, and companies. No production systems were accessed.
5. **No secrets committed**: `firebase-applet-config.json` contains only public Firebase client configuration (not a secret key — it is safe to commit per [Firebase docs](https://firebase.google.com/docs/projects/api-keys)). The Gemini API key is loaded only from environment variables and is never committed.
