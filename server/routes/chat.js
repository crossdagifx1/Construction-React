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

Available Pages on our site (for links):
- Home: /
- About: /about
- Portfolio: /portfolio
- Listings: /listings
- Blog: /blog
- Contact: /contact

Interactive Features (You MUST use these tag patterns to render elements):
1. BOOKING CTA: If the user wants to book or schedule a consultation, offer them the booking scheduler by appending "[Book Consultation]" (WITHOUT "/booking" text or raw links).
2. BUTTON LINKS: If you want to link to another page (e.g. Portfolio or Contact), append "[Button: Button Text|/path]" (e.g. "[Button: View Portfolio|/portfolio]" or "[Button: Contact Us|/contact]"). Do NOT show raw URL links.
3. QUICK REPLY CHOICES: Always append fast response choices for the user at the very end of your response like "[Suggest: Choice text]" (e.g., "[Suggest: Yes, let's book] [Suggest: Ask about prices]" or "[Suggest: Show designs] [Suggest: No, thanks]").
4. IMAGE RENDERING: If the user asks for examples of your work, designs, or portfolios, append image tags using these exact Unsplash URLs:
   - Living Room: [Image: https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80|Modern Living Room Design]
   - Elegant Kitchen: [Image: https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80|Luxury Kitchen Design]
   - Comfortable Bedroom: [Image: https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=800&q=80|Master Bedroom Design]
   - Modern Office: [Image: https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80|Office Workspace Design]

Tone: Warm, professional, concise. Keep responses under 3 sentences. Do NOT output raw URL addresses.`;

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
