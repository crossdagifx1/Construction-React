import express from "express";
import prisma from "../db.js";
import { requireAuth } from "../auth.js";

const router = express.Router();

// ── Time slots available each day ───────────────────────────────────────────
const ALL_SLOTS = [
  "09:00", "10:00", "11:00", "12:00",
  "14:00", "15:00", "16:00", "17:00",
];

// ── Generate unique booking reference ───────────────────────────────────────
function generateBookingRef() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars
  let code = "";
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return `HV-${code}`;
}

async function getUniqueRef() {
  let ref;
  let attempts = 0;
  do {
    ref = generateBookingRef();
    const exists = await prisma.booking.findUnique({ where: { bookingRef: ref } });
    if (!exists) return ref;
    attempts++;
  } while (attempts < 10);
  throw new Error("Could not generate unique booking reference");
}

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

// ── Public: lookup booking by ref (limited info only) ──────────────────────
router.get("/lookup/:ref", async (req, res) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { bookingRef: req.params.ref.toUpperCase() },
      select: {
        bookingRef: true,
        name: true,
        meetingType: true,
        date: true,
        timeSlot: true,
        status: true,
        verifiedAt: true,
        confirmedNote: true,
        meetingLink: true,
        siteAddress: true,
        service: true,
        // Explicitly NOT selecting: adminNote, email, phone, budget, projectDescription, etc.
      },
    });

    if (!booking) {
      return res.status(404).json({ error: "No booking found with that reference. Please check your Booking ID." });
    }

    res.json({ booking });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Public: create a booking ───────────────────────────────────────────────
router.post("/", async (req, res) => {
  try {
    const {
      name, email, phone, city,
      service, services,
      meetingType, date, timeSlot,
      siteAddress, budget, projectDescription, message,
    } = req.body;

    if (!name || !email || !phone || !service || !date || !timeSlot) {
      return res.status(400).json({ error: "Missing required fields: name, email, phone, service, date, timeSlot" });
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

    const bookingRef = await getUniqueRef();

    const booking = await prisma.booking.create({
      data: {
        bookingRef,
        name, email, phone, city,
        service,
        services: services || [],
        meetingType: meetingType || "free_consultation",
        date: bookingDate,
        timeSlot,
        siteAddress,
        budget,
        projectDescription,
        message,
      },
    });

    // Create admin notification
    await prisma.notification.create({
      data: {
        type: "booking",
        title: "New Booking Request",
        body: `${name} requested a ${meetingType || "free consultation"} on ${new Date(date).toDateString()} at ${timeSlot}`,
        refId: booking.id,
      },
    });

    res.status(201).json({
      booking: {
        bookingRef: booking.bookingRef,
        name: booking.name,
        date: booking.date,
        timeSlot: booking.timeSlot,
        meetingType: booking.meetingType,
        status: booking.status,
      },
      message: "Booking submitted successfully! Our team will call you within 2 hours to verify.",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Admin: list all bookings ───────────────────────────────────────────────
router.get("/", requireAuth, async (req, res) => {
  try {
    const { status, meetingType, from, to, search, page = 1, limit = 50 } = req.query;
    const where = {};
    if (status) where.status = status;
    if (meetingType) where.meetingType = meetingType;
    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from);
      if (to) where.date.lte = new Date(to);
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { bookingRef: { contains: search.toUpperCase() } },
        { phone: { contains: search } },
      ];
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
    const [total, pending, verified, confirmed, completed, cancelled] = await Promise.all([
      prisma.booking.count(),
      prisma.booking.count({ where: { status: "pending" } }),
      prisma.booking.count({ where: { status: "verified" } }),
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
      select: { createdAt: true, status: true, meetingType: true },
    });

    res.json({ total, pending, verified, confirmed, completed, cancelled, monthly });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Admin: get single booking (full details) ───────────────────────────────
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const booking = await prisma.booking.findUnique({ where: { id: req.params.id } });
    if (!booking) return res.status(404).json({ error: "Not found" });
    res.json(booking);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Admin: verify booking (phone verified) ─────────────────────────────────
router.patch("/:id/verify", requireAuth, async (req, res) => {
  try {
    const updated = await prisma.booking.update({
      where: { id: req.params.id },
      data: { status: "verified", verifiedAt: new Date() },
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Admin: update status / details / notes ─────────────────────────────────
router.patch("/:id", requireAuth, async (req, res) => {
  try {
    const {
      status, adminNote, confirmedNote,
      meetingLink, siteAddress,
    } = req.body;

    const data = {};
    if (status !== undefined) data.status = status;
    if (adminNote !== undefined) data.adminNote = adminNote;
    if (confirmedNote !== undefined) data.confirmedNote = confirmedNote;
    if (meetingLink !== undefined) data.meetingLink = meetingLink;
    if (siteAddress !== undefined) data.siteAddress = siteAddress;

    // Auto-set verifiedAt when marking as verified
    if (status === "verified" && !data.verifiedAt) data.verifiedAt = new Date();

    const updated = await prisma.booking.update({
      where: { id: req.params.id },
      data,
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
