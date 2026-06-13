import { Router } from "express";
import prisma from "../db.js";
import { requireAuth } from "../auth.js";

/**
 * Builds an admin CRUD router for a Prisma model.
 * @param {string} model  Prisma delegate name, e.g. "service"
 * @param {string[]} fields  Whitelisted writable fields
 */
export default function crudRouter(model, fields) {
  const router = Router();
  const delegate = () => prisma[model];

  const pick = (body = {}) => {
    const data = {};
    for (const f of fields) if (body[f] !== undefined) data[f] = body[f];
    return data;
  };

  router.get("/", requireAuth, async (_req, res) => {
    const items = await delegate().findMany({ orderBy: { order: "asc" } });
    res.json(items);
  });

  router.post("/", requireAuth, async (req, res) => {
    const data = pick(req.body);
    if (data.order === undefined) {
      const count = await delegate().count();
      data.order = count;
    }
    const item = await delegate().create({ data });
    res.status(201).json(item);
  });

  router.put("/:id", requireAuth, async (req, res) => {
    try {
      const item = await delegate().update({
        where: { id: req.params.id },
        data: pick(req.body),
      });
      res.json(item);
    } catch {
      res.status(404).json({ error: "Not found" });
    }
  });

  router.delete("/:id", requireAuth, async (req, res) => {
    try {
      await delegate().delete({ where: { id: req.params.id } });
      res.json({ ok: true });
    } catch {
      res.status(404).json({ error: "Not found" });
    }
  });

  // Bulk reorder: body = [{ id, order }, ...]
  router.put("/", requireAuth, async (req, res) => {
    const updates = Array.isArray(req.body) ? req.body : [];
    await Promise.all(
      updates.map((u) =>
        delegate().update({ where: { id: u.id }, data: { order: u.order } })
      )
    );
    res.json({ ok: true });
  });

  return router;
}
