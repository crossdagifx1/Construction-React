import { Router } from "express";
import prisma from "../db.js";
import { requireAuth } from "../auth.js";

const router = Router();

// All settings as a map (admin convenience).
router.get("/", requireAuth, async (_req, res) => {
  const rows = await prisma.setting.findMany();
  res.json(Object.fromEntries(rows.map((r) => [r.key, r.value])));
});

// Update one settings group (e.g. "hero", "about", "contact", "marquee").
router.put("/:key", requireAuth, async (req, res) => {
  const { key } = req.params;
  const value = req.body;
  const row = await prisma.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
  res.json(row);
});

export default router;
