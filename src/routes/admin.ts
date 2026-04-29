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

export default router;
