import "dotenv/config"; // load env before any module constructs DB/Supabase clients
import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.js";
import siteRoutes from "./routes/site.js";
import settingsRoutes from "./routes/settings.js";
import contactRoutes from "./routes/contact.js";
import uploadRoutes from "./routes/upload.js";
import crudRouter from "./routes/crud.js";
import { isStorageConfigured } from "./supabase.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) =>
  res.json({ ok: true, storage: isStorageConfigured() })
);

// Public + auth
app.use("/api/auth", authRoutes);
app.use("/api/site", siteRoutes);
app.use("/api/contact", contactRoutes);

// Admin content
app.use("/api/admin/settings", settingsRoutes);
app.use("/api/admin/upload", uploadRoutes);
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
    "order",
    "slug",
    "title",
    "tag",
    "imageUrl",
    "wide",
    "description",
    "year",
    "location",
    "area",
    "beforeUrl",
    "afterUrl",
    "gallery",
  ])
);
app.use(
  "/api/admin/testimonials",
  crudRouter("testimonial", ["order", "name", "post", "quote", "imageUrl"])
);

// Fallback error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || "Server error" });
});

const PORT = process.env.PORT || 4000;
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`\n🚀 API listening on http://localhost:${PORT}`);
    console.log(`   Storage uploads: ${isStorageConfigured() ? "enabled" : "disabled (set SUPABASE_SERVICE_ROLE_KEY)"}\n`);
  });
}

export default app;
