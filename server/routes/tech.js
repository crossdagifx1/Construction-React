/**
 * Technical Admin Routes — /api/tech/*
 * All routes require TECHNICAL_ADMIN role (requireTechAdmin middleware)
 */
import { Router } from "express";
import prisma from "../db.js";
import { requireTechAdmin } from "../auth.js";
import {
  getProviderStatus,
  getAiStats,
  getModelQueue,
  setModelQueue,
  getGeminiModelQueue,
  setGeminiModelQueue,
  getProvidersActive,
  setProvidersActive,
  OPENROUTER_MODELS,
  GEMINI_MODELS,
  generateReply,
} from "../services/aiEngine.js";


const router = Router();

// Apply tech-admin guard to ALL routes in this file
router.use(requireTechAdmin);

// ═══════════════════════════════════════════════════════════════════════════
// AI ENGINE
// ═══════════════════════════════════════════════════════════════════════════

// GET /api/tech/ai/status — live provider ping + model lists + active provider states
router.get("/ai/status", async (req, res) => {
  try {
    const [status, queue, geminiQ] = await Promise.all([
      getProviderStatus(),
      Promise.resolve(getModelQueue()),
      Promise.resolve(getGeminiModelQueue()),
    ]);
    res.json({
      providers: status,
      providersActive: getProvidersActive(),
      modelQueue: queue,
      geminiQueue: geminiQ,
      allModels: OPENROUTER_MODELS,
      allGeminiModels: GEMINI_MODELS,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/tech/ai/stats?hours=24 — token usage, success rate, per-provider breakdown
router.get("/ai/stats", async (req, res) => {
  try {
    const hours = Number(req.query.hours) || 24;
    const stats = await getAiStats(hours);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/tech/ai/logs?page=1&limit=30&provider=&success= — paginated AI call logs
router.get("/ai/logs", async (req, res) => {
  try {
    const { page = 1, limit = 30, provider, success } = req.query;
    const where = {};
    if (provider) where.provider = provider;
    if (success !== undefined) where.success = success === "true";

    const [logs, total] = await Promise.all([
      prisma.aiLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        select: {
          id: true,
          provider: true,
          model: true,
          prompt: true,
          tokens: true,
          latencyMs: true,
          success: true,
          errorMsg: true,
          sessionId: true,
          createdAt: true,
          // Truncate response for list view
        },
      }),
      prisma.aiLog.count({ where }),
    ]);

    res.json({ logs, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/tech/ai/logs/:id — full log entry with response
router.get("/ai/logs/:id", async (req, res) => {
  try {
    const log = await prisma.aiLog.findUnique({ where: { id: req.params.id } });
    if (!log) return res.status(404).json({ error: "Log not found" });
    res.json(log);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/tech/ai/config — update model priority/enabled state and provider toggles
router.put("/ai/config", async (req, res) => {
  try {
    const { modelQueue: newQueue, geminiQueue: newGeminiQueue, providersActive } = req.body;
    if (newQueue) setModelQueue(newQueue);
    if (newGeminiQueue) setGeminiModelQueue(newGeminiQueue);
    if (providersActive) setProvidersActive(providersActive);
    res.json({
      ok: true,
      modelQueue: getModelQueue(),
      geminiQueue: getGeminiModelQueue(),
      providersActive: getProvidersActive(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tech/ai/test — send a test message through the AI engine
router.post("/ai/test", async (req, res) => {
  try {
    const { message = "Hello! What services do you offer?" } = req.body;
    const start = Date.now();
    const result = await generateReply(
      "You are HAVI, a helpful interior design assistant. Be concise.",
      [],
      message,
      "tech-admin-test"
    );
    res.json({
      ...result,
      latencyMs: Date.now() - start,
      timestamp: new Date(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// ERROR MONITORING
// ═══════════════════════════════════════════════════════════════════════════

// GET /api/tech/errors?page=1&severity=&resolved=&route= — paginated error logs
router.get("/errors", async (req, res) => {
  try {
    const { page = 1, limit = 25, severity, resolved, route } = req.query;
    const where = {};
    if (severity) where.severity = severity;
    // resolved param is always a string from query string
    if (resolved === "true") where.resolved = true;
    else if (resolved === "false") where.resolved = false;
    // if resolved === "" or undefined, no filter (show all)
    if (route) where.route = { contains: route };

    const [errors, total] = await Promise.all([
      prisma.errorLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
      }),
      prisma.errorLog.count({ where }),
    ]);

    res.json({ errors, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/tech/errors/:id — full error with stack trace
router.get("/errors/:id", async (req, res) => {
  try {
    const error = await prisma.errorLog.findUnique({ where: { id: req.params.id } });
    if (!error) return res.status(404).json({ error: "Not found" });
    res.json(error);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/tech/errors/:id/resolve — mark error as resolved
router.put("/errors/:id/resolve", async (req, res) => {
  try {
    const error = await prisma.errorLog.update({
      where: { id: req.params.id },
      data: { resolved: true, resolvedAt: new Date() },
    });
    res.json(error);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/tech/errors/:id — delete an error log
router.delete("/errors/:id", async (req, res) => {
  try {
    await prisma.errorLog.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/tech/errors — bulk delete resolved errors
router.delete("/errors", async (req, res) => {
  try {
    const { resolved = true } = req.query;
    const result = await prisma.errorLog.deleteMany({
      where: { resolved: resolved === "true" || resolved === true },
    });
    res.json({ deleted: result.count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/tech/errors/summary — count by severity
router.get("/errors/summary", async (req, res) => {
  try {
    const summary = await prisma.errorLog.groupBy({
      by: ["severity"],
      _count: { id: true },
      where: { resolved: false },
    });
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// REPORT GENERATION
// ═══════════════════════════════════════════════════════════════════════════

// POST /api/tech/reports/generate — generate a report
router.post("/reports/generate", async (req, res) => {
  try {
    const { type = "full", startDate, endDate } = req.body;
    const since = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const until = endDate ? new Date(endDate) : new Date();

    const params = { type, startDate: since, endDate: until };
    let result = {};

    if (type === "ai-usage" || type === "full") {
      const aiLogs = await prisma.aiLog.findMany({ where: { createdAt: { gte: since, lte: until } } });
      const aiSuccess = aiLogs.filter((l) => l.success).length;
      const byProvider = {};
      for (const l of aiLogs) {
        byProvider[l.provider] = (byProvider[l.provider] || 0) + 1;
      }
      result.ai = {
        totalCalls: aiLogs.length,
        successRate: aiLogs.length ? `${((aiSuccess / aiLogs.length) * 100).toFixed(1)}%` : "N/A",
        totalTokens: aiLogs.reduce((s, l) => s + (l.tokens || 0), 0),
        avgLatencyMs: aiLogs.length
          ? Math.round(aiLogs.reduce((s, l) => s + (l.latencyMs || 0), 0) / aiLogs.length)
          : 0,
        byProvider,
      };
    }

    if (type === "errors" || type === "full") {
      const errorLogs = await prisma.errorLog.findMany({ where: { createdAt: { gte: since, lte: until } } });
      const bySeverity = {};
      for (const e of errorLogs) {
        bySeverity[e.severity] = (bySeverity[e.severity] || 0) + 1;
      }
      result.errors = {
        total: errorLogs.length,
        resolved: errorLogs.filter((e) => e.resolved).length,
        unresolved: errorLogs.filter((e) => !e.resolved).length,
        bySeverity,
      };
    }

    if (type === "bookings" || type === "full") {
      const bookings = await prisma.booking.findMany({ where: { createdAt: { gte: since, lte: until } } });
      const byStatus = {};
      for (const b of bookings) {
        byStatus[b.status] = (byStatus[b.status] || 0) + 1;
      }
      result.bookings = {
        total: bookings.length,
        byStatus,
        services: [...new Set(bookings.map((b) => b.service))],
      };
    }

    if (type === "chat" || type === "full") {
      const sessions = await prisma.chatSession.findMany({ where: { createdAt: { gte: since, lte: until } } });
      const messages = await prisma.chatMessage.count({ where: { createdAt: { gte: since, lte: until } } });
      result.chat = {
        totalSessions: sessions.length,
        totalMessages: messages,
        avgMessagesPerSession: sessions.length ? (messages / sessions.length).toFixed(1) : 0,
      };
    }

    if (type === "full") {
      const [admins, settings, projects, blogs, ads] = await Promise.all([
        prisma.admin.count(),
        prisma.setting.count(),
        prisma.project.count(),
        prisma.blogPost.count(),
        prisma.adPost.count(),
      ]);
      result.system = { admins, settings, projects, blogs, ads };
    }

    const report = await prisma.reportJob.create({
      data: { type, params, result },
    });

    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/tech/reports — list all generated reports
router.get("/reports", async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const [reports, total] = await Promise.all([
      prisma.reportJob.findMany({
        orderBy: { generatedAt: "desc" },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        select: { id: true, type: true, params: true, generatedAt: true },
      }),
      prisma.reportJob.count(),
    ]);
    res.json({ reports, total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/tech/reports/:id — download full report
router.get("/reports/:id", async (req, res) => {
  try {
    const report = await prisma.reportJob.findUnique({ where: { id: req.params.id } });
    if (!report) return res.status(404).json({ error: "Report not found" });

    // Serve as downloadable JSON file
    res.setHeader("Content-Type", "application/json");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="havi-report-${report.type}-${report.id}.json"`
    );
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/tech/reports/:id
router.delete("/reports/:id", async (req, res) => {
  try {
    await prisma.reportJob.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// SYSTEM HEALTH
// ═══════════════════════════════════════════════════════════════════════════

// GET /api/tech/system/health — DB ping, storage, env check
router.get("/system/health", async (req, res) => {
  const health = {
    timestamp: new Date(),
    services: {},
    env: {},
  };

  // DB ping
  const dbStart = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    health.services.database = { status: "online", latencyMs: Date.now() - dbStart };
  } catch (err) {
    health.services.database = { status: "offline", error: err.message };
  }

  // Supabase storage check
  const supaStart = Date.now();
  try {
    const supaRes = await fetch(`${process.env.SUPABASE_URL}/storage/v1/bucket`, {
      headers: { Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}` },
    });
    health.services.storage = {
      status: supaRes.ok ? "online" : "error",
      latencyMs: Date.now() - supaStart,
    };
  } catch {
    health.services.storage = { status: "offline" };
  }

  // OpenRouter check
  const orStart = Date.now();
  try {
    const orRes = await fetch("https://openrouter.ai/api/v1/models", {
      headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}` },
    });
    health.services.openrouter = {
      status: orRes.ok ? "online" : "error",
      latencyMs: Date.now() - orStart,
      configured: !!process.env.OPENROUTER_API_KEY,
    };
  } catch {
    health.services.openrouter = { status: "offline", configured: !!process.env.OPENROUTER_API_KEY };
  }

  // Gemini check
  const gemStart = Date.now();
  try {
    const gemRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`
    );
    health.services.gemini = {
      status: gemRes.ok ? "online" : "error",
      latencyMs: Date.now() - gemStart,
      configured: !!process.env.GEMINI_API_KEY,
    };
  } catch {
    health.services.gemini = { status: "offline", configured: !!process.env.GEMINI_API_KEY };
  }

  // Env audit (show which vars are set, never show values)
  const envKeys = [
    "DATABASE_URL", "DIRECT_URL", "JWT_SECRET", "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_BUCKET", "OPENROUTER_API_KEY",
    "GEMINI_API_KEY", "AI_PRIMARY_PROVIDER", "AI_FALLBACK_CHAIN", "PORT",
  ];
  for (const key of envKeys) {
    health.env[key] = process.env[key] ? "✅ set" : "❌ missing";
  }

  const allOnline = Object.values(health.services).every((s) => s.status === "online");
  health.overallStatus = allOnline ? "healthy" : "degraded";

  res.json(health);
});

// GET /api/tech/system/stats — full DB record counts
router.get("/system/stats", async (req, res) => {
  try {
    const [
      admins, settings, services, processSteps, projects, testimonials,
      contactMessages, blogPosts, adPosts, bookings, chatSessions,
      chatMessages, notifications, aiLogs, errorLogs, reportJobs,
    ] = await Promise.all([
      prisma.admin.count(),
      prisma.setting.count(),
      prisma.service.count(),
      prisma.processStep.count(),
      prisma.project.count(),
      prisma.testimonial.count(),
      prisma.contactMessage.count(),
      prisma.blogPost.count(),
      prisma.adPost.count(),
      prisma.booking.count(),
      prisma.chatSession.count(),
      prisma.chatMessage.count(),
      prisma.notification.count(),
      prisma.aiLog.count(),
      prisma.errorLog.count(),
      prisma.reportJob.count(),
    ]);

    res.json({
      admin: { admins, settings },
      content: { services, processSteps, projects, testimonials, blogPosts, adPosts },
      engagement: { contactMessages, bookings, chatSessions, chatMessages },
      system: { notifications, aiLogs, errorLogs, reportJobs },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/tech/system/admins — list all admin accounts
router.get("/system/admins", async (req, res) => {
  try {
    const admins = await prisma.admin.findMany({
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });
    res.json(admins);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
