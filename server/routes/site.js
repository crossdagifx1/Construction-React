import { Router } from "express";
import prisma from "../db.js";

const router = Router();

// Public hydration endpoint — returns the entire site payload in one call.
router.get("/", async (_req, res) => {
  const [settingsRows, services, steps, projects, testimonials] =
    await Promise.all([
      prisma.setting.findMany(),
      prisma.service.findMany({ orderBy: { order: "asc" } }),
      prisma.processStep.findMany({ orderBy: { order: "asc" } }),
      prisma.project.findMany({ orderBy: { order: "asc" } }),
      prisma.testimonial.findMany({ orderBy: { order: "asc" } }),
    ]);

  const settings = Object.fromEntries(settingsRows.map((r) => [r.key, r.value]));

  res.json({ settings, services, steps, projects, testimonials });
});

export default router;
