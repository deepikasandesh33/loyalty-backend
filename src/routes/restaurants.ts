import { Router } from "express";
import prisma from "../lib/prisma";
import { requireAdmin } from "../lib/auth";

const router = Router();

function formatRestaurant(r: { id: number; name: string; icon: string; color: string; cuisine: string; points: number; tier: string }) {
  return { Id: r.id, Name: r.name, Icon: r.icon, Color: r.color, Cuisine: r.cuisine, Points: r.points, Tier: r.tier };
}

// POST /restaurants — create a new restaurant (admin only)
router.post("/restaurants", requireAdmin, async (req, res) => {
  const { name, cuisine, icon, color, points, tier, managerCode } = req.body;
  if (!name || !cuisine || !icon || !color || !managerCode) {
    res.json({ success: false, message: "name, cuisine, icon, color, and managerCode are required." });
    return;
  }

  const restaurant = await prisma.restaurant.create({
    data: {
      name,
      cuisine,
      icon,
      color,
      points: parseInt(points) || 10,
      tier: tier || "Bronze",
      managerCode,
    },
  });

  res.json({ success: true, message: "Restaurant created.", restaurant: formatRestaurant(restaurant) });
});

// GET /restaurants — all restaurants
router.get("/restaurants", async (_req, res) => {
  const restaurants = await prisma.restaurant.findMany({ orderBy: { name: "asc" } });
  res.json({ success: true, restaurants: restaurants.map(formatRestaurant) });
});

// GET /user-restaurants?userId=
router.get("/user-restaurants", async (req, res) => {
  const userId = parseInt(req.query.userId as string);
  if (isNaN(userId)) {
    res.json({ success: false, restaurants: [] });
    return;
  }

  const rows = await prisma.userRestaurant.findMany({
    where: { userId },
    include: { restaurant: true },
  });

  res.json({ success: true, restaurants: rows.map((r) => formatRestaurant(r.restaurant)) });
});

// POST /user-restaurants/add
router.post("/user-restaurants/add", async (req, res) => {
  const { userId, restaurantId } = req.body;
  if (!userId || !restaurantId) {
    res.json({ success: false, message: "userId and restaurantId are required." });
    return;
  }

  await prisma.userRestaurant.upsert({
    where: { userId_restaurantId: { userId, restaurantId } },
    update: {},
    create: { userId, restaurantId },
  });

  res.json({ success: true, message: "Restaurant added." });
});

// POST /user-restaurants/remove
router.post("/user-restaurants/remove", async (req, res) => {
  const { userId, restaurantId } = req.body;
  if (!userId || !restaurantId) {
    res.json({ success: false, message: "userId and restaurantId are required." });
    return;
  }

  await prisma.userRestaurant.deleteMany({ where: { userId, restaurantId } });
  res.json({ success: true, message: "Restaurant removed." });
});

export default router;
