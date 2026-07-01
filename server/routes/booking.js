import express from "express";
import prisma from "../db.js";
import { requireAuth } from "../auth.js";

const router = express.Router();

// Time slots available each day
const ALL_SLOTS = [
  "09:00", "10:00", "11:00", "12:00",
  "14:00", "15:00", "16:00", "17:00",
];

// ── Public: get available slots for a date ─────────────────────────────────
router.get("/availability", async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: "date query param required" });

    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const booked = await prisma.booking.findMany({
      where: {
        date: { gte: start, lte: end },
        status: { not: "cancelled" },
      },
      select: { timeSlot: true },
    });

    const bookedSlots = booked.map((b) => b.timeSlot);
    const available = ALL_SLOTS.filter((s) => !bookedSlots.includes(s));

    res.json({ date, available, booked: bookedSlots, allSlots: ALL_SLOTS });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Public: create a booking ───────────────────────────────────────────────
router.post("/", async (req, res) => {
  try {
    const { name, email, phone, service, date, timeSlot, message } = req.body;

    if (!name || !email || !service || !date || !timeSlot) {
      return res.status(400).json({ error: "Missing required fields: name, email, service, date, timeSlot" });
    }

    // Check slot is still available
    const bookingDate = new Date(date);
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const conflict = await prisma.booking.findFirst({
      where: {
        date: { gte: start, lte: end },
        timeSlot,
        status: { not: "cancelled" },
      },
    });

    if (conflict) {
      return res.status(409).json({ error: "This time slot has just been taken. Please choose another." });
    }

    const booking = await prisma.booking.create({
      data: { name, email, phone, service, date: bookingDate, timeSlot, message },
    });

    // Create admin notification
    await prisma.notification.create({
      data: {
        type: "booking",
        title: "New Booking Request",
        body: `${name} requested a ${service} consultation on ${new Date(date).toDateString()} at ${timeSlot}`,
        refId: booking.id,
      },
    });

    res.status(201).json({ booking, message: "Booking submitted successfully!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Admin: list all bookings ───────────────────────────────────────────────
router.get("/", requireAuth, async (req, res) => {
  try {
    const { status, from, to, page = 1, limit = 50 } = req.query;
    const where = {};
    if (status) where.status = status;
    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from);
      if (to) where.date.lte = new Date(to);
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
      }),
      prisma.booking.count({ where }),
    ]);

    res.json({ bookings, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Admin: stats for dashboard ─────────────────────────────────────────────
router.get("/stats/summary", requireAuth, async (req, res) => {
  try {
    const [total, pending, confirmed, completed, cancelled] = await Promise.all([
      prisma.booking.count(),
      prisma.booking.count({ where: { status: "pending" } }),
      prisma.booking.count({ where: { status: "confirmed" } }),
      prisma.booking.count({ where: { status: "completed" } }),
      prisma.booking.count({ where: { status: "cancelled" } }),
    ]);

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthly = await prisma.booking.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true, status: true },
    });

    res.json({ total, pending, confirmed, completed, cancelled, monthly });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Admin: get single booking ──────────────────────────────────────────────
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const booking = await prisma.booking.findUnique({ where: { id: req.params.id } });
    if (!booking) return res.status(404).json({ error: "Not found" });
    res.json(booking);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Admin: update status / note ────────────────────────────────────────────
router.patch("/:id", requireAuth, async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    const updated = await prisma.booking.update({
      where: { id: req.params.id },
      data: { ...(status && { status }), ...(adminNote !== undefined && { adminNote }) },
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Admin: delete booking ──────────────────────────────────────────────────
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    await prisma.booking.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
