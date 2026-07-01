import express from "express";
import prisma from "../db.js";
import { requireAuth } from "../auth.js";
import { generateReply } from "../services/aiEngine.js";

const router = express.Router();

// HAVI's context system prompt
const SYSTEM_PROMPT = `You are HAVI, a friendly and professional AI assistant for HAVI'S DESIGN — a premium interior design and construction company based in Addis Ababa, Ethiopia.

About HAVI'S DESIGN:
- Specialties: Interior Design, Home Renovation, Office Design, Commercial Construction, Landscaping
- Location: Addis Ababa, Ethiopia
- Experience: Over 10 years of excellence
- Services: Free initial consultation, 3D visualization, project management, after-service support

Services & Pricing:
- Interior Design: Starting from ETB 15,000 per room
- Full Home Renovation: Project-based, starting from ETB 80,000
- Office Design: Starting from ETB 50,000
- Consultation: Free first session

How to Book:
- Use our online booking system at /booking
- Or call/WhatsApp us directly
- Available Mon-Sat, 9AM-5PM

Your tone: Warm, professional, knowledgeable. Keep responses concise (2-4 sentences max unless asked for details). Always end with a helpful next step or offer to book a consultation. If asked about specific prices for custom projects, say "pricing depends on project scope" and offer a free consultation.

Do NOT make up specific project details, client names, or fabricate testimonials.`;

// ── Public: send message ───────────────────────────────────────────────────
router.post("/message", async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    if (!message || !sessionId) {
      return res.status(400).json({ error: "message and sessionId are required" });
    }

    // Get or create session
    let session = await prisma.chatSession.findUnique({
      where: { sessionId },
      include: { messages: { orderBy: { createdAt: "asc" }, take: 20 } },
    });

    if (!session) {
      session = await prisma.chatSession.create({
        data: { sessionId },
        include: { messages: true },
      });

      // Create notification for first message
      await prisma.notification.create({
        data: {
          type: "chat",
          title: "New Chat Session Started",
          body: `A visitor started a chat: "${message.slice(0, 80)}${message.length > 80 ? "..." : ""}"`,
          refId: session.id,
        },
      });
    }

    // Save user message
    await prisma.chatMessage.create({
      data: { sessionId: session.id, role: "user", content: message },
    });

    // Build history for the AI engine
    const history = session.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // Generate reply via multi-provider AI engine (with fallback chain)
    const { reply, provider, model } = await generateReply(
      SYSTEM_PROMPT,
      history,
      message,
      session.id
    );

    // Save assistant reply
    await prisma.chatMessage.create({
      data: { sessionId: session.id, role: "assistant", content: reply },
    });

    res.json({ reply, sessionId, _meta: { provider, model } });
  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).json({ error: "Failed to process message. Please try again." });
  }
});

// ── Admin: list sessions ───────────────────────────────────────────────────
router.get("/sessions", requireAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const [sessions, total] = await Promise.all([
      prisma.chatSession.findMany({
        orderBy: { updatedAt: "desc" },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        include: {
          _count: { select: { messages: true } },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { content: true, role: true, createdAt: true },
          },
        },
      }),
      prisma.chatSession.count(),
    ]);

    res.json({ sessions, total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Admin: get full session transcript ────────────────────────────────────
router.get("/sessions/:id", requireAuth, async (req, res) => {
  try {
    const session = await prisma.chatSession.findUnique({
      where: { id: req.params.id },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
    if (!session) return res.status(404).json({ error: "Session not found" });
    res.json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Admin: delete session ──────────────────────────────────────────────────
router.delete("/sessions/:id", requireAuth, async (req, res) => {
  try {
    await prisma.chatMessage.deleteMany({ where: { sessionId: req.params.id } });
    await prisma.chatSession.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
