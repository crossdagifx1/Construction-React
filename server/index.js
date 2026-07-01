import "dotenv/config"; // load env before any module constructs DB/Supabase clients
import dns from "node:dns";

// Fix DNS resolution timeout in Node.js on Windows systems
dns.setDefaultResultOrder("ipv4first");

import express from "express";
import cors from "cors";
import prisma from "./db.js";

import authRoutes from "./routes/auth.js";
import siteRoutes from "./routes/site.js";
import blogRoutes from "./routes/blog.js";
import adRoutes from "./routes/ad.js";
import settingsRoutes from "./routes/settings.js";
import contactRoutes from "./routes/contact.js";
import uploadRoutes from "./routes/upload.js";
import crudRouter from "./routes/crud.js";
import bookingRoutes from "./routes/booking.js";
import chatRoutes from "./routes/chat.js";
import notificationRoutes from "./routes/notifications.js";
import techRoutes from "./routes/tech.js";
import { isStorageConfigured } from "./supabase.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

// ── Request logger (captures errors to ErrorLog) ───────────────────────────
app.use((req, res, next) => {
  req._startTime = Date.now();
  next();
});

app.get("/api/health", (_req, res) =>
  res.json({ ok: true, storage: isStorageConfigured() })
);

// Public + auth
app.use("/api/auth", authRoutes);
app.use("/api/site", siteRoutes);
app.use("/api/site/blogs", blogRoutes);
app.use("/api/site/ads", adRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/admin/notifications", notificationRoutes);

// Admin content
app.use("/api/admin/settings", settingsRoutes);
app.use("/api/admin/upload", uploadRoutes);
app.use(
  "/api/admin/blogs",
  crudRouter("blogPost", [
    "order", "slug", "title", "excerpt", "content",
    "imageUrl", "category", "author", "readTime", "published",
  ])
);
app.use(
  "/api/admin/ads",
  crudRouter("adPost", [
    "order", "title", "type", "description", "price", "location",
    "contactPhone", "contactEmail", "imageUrl", "features", "approved", "featured",
  ])
);
app.use(
  "/api/admin/services",
  crudRouter("service", ["order", "icon", "title", "about"])
);
app.use(
  "/api/admin/process",
  crudRouter("processStep", ["order", "icon", "step", "title", "about"])
);
app.use(
  "/api/admin/projects",
  crudRouter("project", [
    "order", "slug", "title", "tag", "imageUrl", "wide",
    "description", "year", "location", "area", "beforeUrl", "afterUrl", "gallery",
  ])
);
app.use(
  "/api/admin/testimonials",
  crudRouter("testimonial", ["order", "name", "post", "quote", "imageUrl"])
);

// ── Technical Admin routes ─────────────────────────────────────────────────
app.use("/api/tech", techRoutes);

// ── Global error capture middleware ───────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use(async (err, req, res, _next) => {
  console.error("[Server Error]", err);

  // Determine severity
  const status = err.status || err.statusCode || 500;
  const severity = status >= 500 ? "ERROR" : status >= 400 ? "WARN" : "INFO";

  // Log to ErrorLog table (non-blocking)
  prisma.errorLog
    .create({
      data: {
        severity,
        route: req.path,
        method: req.method,
        message: err.message || "Unknown error",
        stack: err.stack || null,
        meta: {
          status,
          query: req.query,
          body: req.body
            ? JSON.stringify(req.body).slice(0, 500) // truncate large bodies
            : null,
          latencyMs: req._startTime ? Date.now() - req._startTime : null,
        },
      },
    })
    .catch((logErr) => console.error("[ErrorLog] Failed to save:", logErr));

  res.status(status).json({ error: err.message || "Server error" });
});

const PORT = process.env.PORT || 4000;
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`\n🚀 API listening on http://localhost:${PORT}`);
    console.log(`   Storage uploads: ${isStorageConfigured() ? "enabled" : "disabled (set SUPABASE_SERVICE_ROLE_KEY)"}`);
    console.log(`   AI Primary: ${process.env.AI_PRIMARY_PROVIDER || "openrouter"}`);
    console.log(`   OpenRouter: ${process.env.OPENROUTER_API_KEY ? "✅ configured" : "❌ not set"}`);
    console.log(`   Gemini: ${process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.includes("your-") ? "✅ configured" : "❌ not set"}\n`);
  });
}

export default app;
