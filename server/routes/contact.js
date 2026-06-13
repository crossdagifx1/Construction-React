import { Router } from "express";
import prisma from "../db.js";
import { requireAuth } from "../auth.js";

const router = Router();

// Public: submit a contact enquiry.
router.post("/", async (req, res) => {
  const { name, email, phone, message } = req.body || {};
  if (!name || !email || !message)
    return res.status(400).json({ error: "Name, email and message are required" });
  const msg = await prisma.contactMessage.create({
    data: { name, email, phone: phone || null, message },
  });
  res.status(201).json({ ok: true, id: msg.id });
});

// Admin: list submissions (newest first).
router.get("/", requireAuth, async (_req, res) => {
  const messages = await prisma.contactMessage.findMany({
    orderBy: { createdAt: "desc" },
  });
  res.json(messages);
});

router.patch("/:id", requireAuth, async (req, res) => {
  try {
    const msg = await prisma.contactMessage.update({
      where: { id: req.params.id },
      data: { read: req.body.read ?? true },
    });
    res.json(msg);
  } catch {
    res.status(404).json({ error: "Not found" });
  }
});

router.delete("/:id", requireAuth, async (req, res) => {
  try {
    await prisma.contactMessage.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch {
    res.status(404).json({ error: "Not found" });
  }
});

export default router;
