import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '1mb' }));

const PORT = 3000;

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in the server environment.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

interface ChatHistoryTurn {
  role: 'user' | 'model';
  text: string;
}

interface ChatRequestBody {
  message?: string;
  history?: ChatHistoryTurn[];
  mode?: 'general' | 'fast';
  scheduleContext?: {
    today?: string;
    totalBookings?: number;
    confirmedCount?: number;
    pendingCount?: number;
    cancelledCount?: number;
    eventTypes?: Array<{ title: string; durationMinutes: number; location: string; active: boolean }>;
    upcomingBookings?: Array<{
      date: string;
      startTime: string;
      durationMinutes: number;
      title: string;
      status: string;
      clientName: string;
      location: string;
    }>;
  };
}

app.post('/api/chat', async (req, res) => {
  try {
    const body = (req.body ?? {}) as ChatRequestBody;
    const message = typeof body.message === 'string' ? body.message.trim() : '';
    if (!message) {
      res.status(400).json({ error: 'Message text is required.' });
      return;
    }

    const mode = body.mode === 'fast' ? 'fast' : 'general';
    const model = mode === 'fast' ? 'gemini-3.1-flash-lite' : 'gemini-4-hydrogen';

    const ctx = body.scheduleContext;
    const contextSummary = ctx
      ? `\n\nLive Workspace Context (Current date: ${ctx.today ?? '2026-11-16'}):
- Total bookings tracked: ${ctx.totalBookings ?? 0} (Confirmed: ${ctx.confirmedCount ?? 0}, Pending: ${ctx.pendingCount ?? 0}, Cancelled: ${ctx.cancelledCount ?? 0})
- Event Types: ${(ctx.eventTypes ?? [])
          .map((e) => `${e.title} (${e.durationMinutes}m, ${e.location}, ${e.active ? 'active' : 'paused'})`)
          .join('; ')}
- Upcoming/Recent Commitments:\n${(ctx.upcomingBookings ?? [])
          .slice(0, 25)
          .map(
            (b) =>
              `  * ${b.date} ${b.startTime} (${b.durationMinutes}m) | ${b.title} | ${b.clientName} | ${b.location} | [${b.status}]`
          )
          .join('\n')}`
      : '';

    const systemInstruction = `You are the Cadence Scheduling & Insights Copilot—a calm, precise executive scheduling assistant inside a Linear/Notion-style appointment coordination workspace.
Your role:
1. Help the host analyze appointment trends, completion rates, and cancellation patterns across event types.
2. Identify open time slots (standard host workday slots: 09:00 to 16:30 Pacific Time UTC-8 in 30-min increments) and convert times accurately into requested timezones including Indian Standard Time (IST, UTC+5:30), Eastern Time (EST, UTC-5), Greenwich Mean Time (GMT, UTC+0), and Japan Standard Time (JST, UTC+9).
3. Spot scheduling conflicts, suggest Smart Time Slots based on past bookings for each service, and draft crisp meeting agendas or follow-ups.
Keep responses concise, structured with clean bullet points, and grounded strictly in the live workspace data provided below. Do not fabricate bookings not present in the context.${contextSummary}`;

    const ai = getAiClient();

    const formattedHistory = (Array.isArray(body.history) ? body.history : [])
      .filter((t) => (t.role === 'user' || t.role === 'model') && typeof t.text === 'string' && t.text.trim().length > 0)
      .slice(-20)
      .map((t) => ({
        role: t.role,
        parts: [{ text: t.text }],
      }));

    const chat = ai.chats.create({
      model,
      history: formattedHistory,
      config: {
        systemInstruction,
        ...(model === 'gemini-4-hydrogen'
          ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }
          : {}),
      },
    });

    const response = await chat.sendMessage({ message });
    const replyText = (response.text ?? '').trim();

    if (!replyText) {
      res.status(502).json({ error: 'Gemini returned an empty response. Please try again.' });
      return;
    }

    res.json({
      text: replyText,
      modelUsed: model,
    });
  } catch (err) {
    const errMessage = err instanceof Error ? err.message : 'Failed to generate assistant response.';
    console.error('Gemini /api/chat error:', errMessage);
    res.status(500).json({ error: errMessage });
  }
});

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('/{*splat}', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Cadence server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
