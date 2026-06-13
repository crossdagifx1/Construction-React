import { Router } from "express";
import prisma from "../db.js";

const router = Router();

// GET all approved ads
router.get("/", async (_req, res) => {
  try {
    const ads = await prisma.adPost.findMany({
      where: { approved: true },
      orderBy: [
        { order: "asc" },
        { createdAt: "desc" }
      ]
    });
    res.json(ads);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single ad by ID
router.get("/:id", async (req, res) => {
  try {
    const ad = await prisma.adPost.findUnique({
      where: { id: req.params.id }
    });
    if (!ad) return res.status(404).json({ error: "Ad listing not found" });
    res.json(ad);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST submit a new ad (public endpoint)
router.post("/", async (req, res) => {
  try {
    const { title, type, description, price, location, contactPhone, contactEmail, imageUrl, features } = req.body;
    if (!title || !type || !description || !contactPhone) {
      return res.status(400).json({ error: "Missing required fields (title, type, description, contactPhone)" });
    }

    const count = await prisma.adPost.count();

    const ad = await prisma.adPost.create({
      data: {
        title,
        type,
        description,
        price,
        location: location || "Addis Ababa",
        contactPhone,
        contactEmail,
        imageUrl: imageUrl || "/assets/project1.jpg",
        features: Array.isArray(features) ? features : [],
        approved: true,
        featured: false,
        order: count
      }
    });

    res.status(201).json(ad);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
