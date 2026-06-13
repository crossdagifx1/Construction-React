import { Router } from "express";
import prisma from "../db.js";

const router = Router();

// GET all published blogs
router.get("/", async (_req, res) => {
  try {
    const blogs = await prisma.blogPost.findMany({
      where: { published: true },
      orderBy: [
        { order: "asc" },
        { createdAt: "desc" }
      ]
    });
    res.json(blogs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single blog by slug
router.get("/:slug", async (req, res) => {
  try {
    const blog = await prisma.blogPost.findUnique({
      where: { slug: req.params.slug }
    });
    if (!blog) return res.status(404).json({ error: "Blog post not found" });
    res.json(blog);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
