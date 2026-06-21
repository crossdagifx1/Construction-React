import express from "express";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "../auth.js";

const router = express.Router();
const prisma = new PrismaClient();

// ── Admin: list notifications ──────────────────────────────────────────────
router.get("/", requireAuth, async (req, res) => {
  try {
    const { page = 1, limit = 30, unread } = req.query;
    const where = unread === "true" ? { read: false } : {};

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { read: false } }),
    ]);

    res.json({ notifications, total, unreadCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Admin: get unread count only ───────────────────────────────────────────
router.get("/count", requireAuth, async (req, res) => {
  try {
    const count = await prisma.notification.count({ where: { read: false } });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Admin: mark single notification as read ────────────────────────────────
router.patch("/:id/read", requireAuth, async (req, res) => {
  try {
    const notification = await prisma.notification.update({
      where: { id: req.params.id },
      data: { read: true },
    });
    res.json(notification);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Admin: mark all notifications as read ─────────────────────────────────
router.patch("/read-all", requireAuth, async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { read: false },
      data: { read: true },
    });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Admin: delete a notification ───────────────────────────────────────────
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    await prisma.notification.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
