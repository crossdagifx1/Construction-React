import express from "express";
import { PrismaClient } from "@prisma/client";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { requireAuth } from "../auth.js";

const router = express.Router();
const prisma = new PrismaClient();

// Initialize Gemini AI
const hasGeminiKey = process.env.GEMINI_API_KEY && 
  process.env.GEMINI_API_KEY !== "your-gemini-api-key-here" &&
  process.env.GEMINI_API_KEY !== "";

const genAI = hasGeminiKey
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

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
          body: `A visitor started a chat: "${message.slice(0, 80)}..."`,
          refId: session.id,
        },
      });
    }

    // Save user message
    await prisma.chatMessage.create({
      data: { sessionId: session.id, role: "user", content: message },
    });

    let aiReply = "";

    if (genAI) {
      // Build Gemini conversation history
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        systemInstruction: SYSTEM_PROMPT,
      });

      const history = session.messages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

      const chat = model.startChat({
        history,
      });

      const result = await chat.sendMessage(message);
      aiReply = result.response.text();
    } else {
      // Fallback responses when no API key is set
      const fallbacks = [
        "Thank you for reaching out to HAVI'S DESIGN! We specialize in premium interior design and renovation in Addis Ababa. Would you like to book a free consultation?",
        "Great question! Our team would love to help you with your design project. Feel free to book a consultation at /booking or tell me more about your project.",
        "We offer interior design, renovation, and construction services across Addis Ababa. Starting prices vary by project — a free consultation helps us give you an accurate quote!",
      ];
      aiReply = fallbacks[Math.floor(Math.random() * fallbacks.length)];
    }

    // Save assistant reply
    await prisma.chatMessage.create({
      data: { sessionId: session.id, role: "assistant", content: aiReply },
    });

    res.json({ reply: aiReply, sessionId });
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
