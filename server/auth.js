import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "dev-secret";
const EXPIRES = process.env.JWT_EXPIRES_IN || "7d";

// Signs JWT including admin role for role-based access control
export const signToken = (admin) =>
  jwt.sign({ id: admin.id, email: admin.email, role: admin.role }, SECRET, {
    expiresIn: EXPIRES,
  });

// Express middleware — rejects requests without a valid Bearer token.
export const requireAuth = (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Not authenticated" });
  try {
    req.admin = jwt.verify(token, SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired session" });
  }
};

// Requires TECHNICAL_ADMIN role — rejects regular admins with 403
export const requireTechAdmin = (req, res, next) => {
  requireAuth(req, res, () => {
    if (req.admin?.role !== "TECHNICAL_ADMIN") {
      return res.status(403).json({
        error: "Technical Admin access required",
        hint: "This endpoint requires TECHNICAL_ADMIN role",
      });
    }
    next();
  });
};
