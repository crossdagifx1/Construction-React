import { Router } from "express";
import bcrypt from "bcryptjs";
import prisma from "../db.js";
import { signToken, requireAuth } from "../auth.js";

const router = Router();

router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password)
    return res.status(400).json({ error: "Email and password are required" });

  const admin = await prisma.admin.findUnique({ where: { email } });
  if (!admin) return res.status(401).json({ error: "Invalid credentials" });

  const ok = await bcrypt.compare(password, admin.passwordHash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  const token = signToken(admin);
  res.json({
    token,
    admin: {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,  // ← expose role to frontend
    },
  });
});

router.get("/me", requireAuth, async (req, res) => {
  const admin = await prisma.admin.findUnique({ where: { id: req.admin.id } });
  if (!admin) return res.status(404).json({ error: "Not found" });
  res.json({
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,  // ← expose role to frontend
  });
});

export default router;
