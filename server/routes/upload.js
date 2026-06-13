import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../auth.js";
import { supabase, BUCKET, isStorageConfigured } from "../supabase.js";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB
});

const slug = (name) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/^-+|-+$/g, "");

router.post("/", requireAuth, upload.single("file"), async (req, res) => {
  if (!isStorageConfigured())
    return res.status(503).json({
      error:
        "Image storage is not configured. Add SUPABASE_SERVICE_ROLE_KEY to .env to enable uploads.",
    });
  if (!req.file) return res.status(400).json({ error: "No file provided" });

  // Build a unique-ish key without Date.now/Math.random restrictions in scripts;
  // here we are in Node so those are available.
  const stamp = Date.now();
  const path = `uploads/${stamp}-${slug(req.file.originalname)}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, req.file.buffer, {
      contentType: req.file.mimetype,
      upsert: false,
    });

  if (error) return res.status(500).json({ error: error.message });

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  res.status(201).json({ url: data.publicUrl });
});

export default router;
