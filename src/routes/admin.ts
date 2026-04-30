import { Router } from "express";
import prisma from "../lib/prisma";
import { requireAdmin } from "../lib/auth";

const router = Router();

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

// POST /admin/login
router.post("/admin/login", (req, res) => {
  const { password } = req.body;
  if (password !== ADMIN_PASSWORD) {
    res.json({ success: false, message: "Invalid password." });
    return;
  }
  res.json({ success: true, message: "Logged in." });
});

// DELETE /restaurants/:id — admin only
router.delete("/restaurants/:id", requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id as string);
  if (isNaN(id)) {
    res.json({ success: false, message: "Invalid ID." });
    return;
  }

  const restaurant = await prisma.restaurant.findUnique({ where: { id } });
  if (!restaurant) {
    res.json({ success: false, message: "Restaurant not found." });
    return;
  }

  await prisma.restaurant.delete({ where: { id } });
  res.json({ success: true, message: `${restaurant.name} deleted.` });
});

// PATCH /restaurants/:id/active — toggle active status
router.patch("/restaurants/:id/active", requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id as string);
  const { active } = req.body as { active: boolean };
  if (isNaN(id) || typeof active !== "boolean") {
    res.json({ success: false, message: "Invalid request." });
    return;
  }
  const restaurant = await prisma.restaurant.update({ where: { id }, data: { active } });
  res.json({ success: true, active: restaurant.active, name: restaurant.name });
});

// GET /admin/stores — all stores including inactive (admin view)
router.get("/admin/stores", requireAdmin, async (_req, res) => {
  const stores = await prisma.store.findMany({ orderBy: { name: "asc" } });
  res.json({ success: true, stores });
});

// PATCH /stores/:id/active — toggle active status
router.patch("/stores/:id/active", requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id as string);
  const { active } = req.body as { active: boolean };
  if (isNaN(id) || typeof active !== "boolean") {
    res.json({ success: false, message: "Invalid request." });
    return;
  }
  const store = await prisma.store.update({ where: { id }, data: { active } });
  res.json({ success: true, active: store.active, name: store.name });
});

// GET /admin/restaurants — all restaurants including inactive (admin view)
router.get("/admin/restaurants", requireAdmin, async (_req, res) => {
  const restaurants = await prisma.restaurant.findMany({ orderBy: { name: "asc" } });
  res.json({ success: true, restaurants });
});

export default router;
