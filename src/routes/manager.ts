import { Router } from "express";
import prisma from "../lib/prisma";
import { requireManager } from "../lib/auth";

const router = Router();
const MAX_OFFERS = 2;

// POST /manager/login
router.post("/manager/login", async (req, res) => {
  const { restaurantId, managerCode } = req.body;
  if (!restaurantId || !managerCode) {
    res.json({ success: false, message: "restaurantId and managerCode are required." });
    return;
  }

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: parseInt(restaurantId) },
    include: { offers: true },
  });

  if (!restaurant || restaurant.managerCode !== managerCode) {
    res.json({ success: false, message: "Invalid restaurant ID or manager code." });
    return;
  }

  res.json({
    success: true,
    restaurant: {
      id: restaurant.id,
      name: restaurant.name,
      icon: restaurant.icon,
      cuisine: restaurant.cuisine,
    },
    offers: restaurant.offers,
  });
});

// GET /manager/offers — list offers for the manager's restaurant
router.get("/manager/offers", requireManager, async (req, res) => {
  const restaurant = (req as any).restaurant;
  const offers = await prisma.restaurantOffer.findMany({
    where: { restaurantId: restaurant.id },
  });
  res.json({ success: true, offers });
});

// POST /manager/offers — add an offer (max 2)
router.post("/manager/offers", requireManager, async (req, res) => {
  const restaurant = (req as any).restaurant;
  const { title, description, discount, expiry, category } = req.body;

  if (!title || !description || !discount || !expiry || !category) {
    res.json({ success: false, message: "All fields are required." });
    return;
  }

  const existing = await prisma.restaurantOffer.count({
    where: { restaurantId: restaurant.id },
  });

  if (existing >= MAX_OFFERS) {
    res.json({ success: false, message: `Offer limit reached. You can have at most ${MAX_OFFERS} active offers.` });
    return;
  }

  const offer = await prisma.restaurantOffer.create({
    data: { restaurantId: restaurant.id, title, description, discount, expiry, category },
  });

  res.json({ success: true, message: "Offer created.", offer });
});

// DELETE /manager/offers/:id — delete one of the manager's offers
router.delete("/manager/offers/:id", requireManager, async (req, res) => {
  const restaurant = (req as any).restaurant;
  const id = parseInt(req.params.id);

  const offer = await prisma.restaurantOffer.findUnique({ where: { id } });
  if (!offer || offer.restaurantId !== restaurant.id) {
    res.json({ success: false, message: "Offer not found." });
    return;
  }

  await prisma.restaurantOffer.delete({ where: { id } });
  res.json({ success: true, message: "Offer deleted." });
});

export default router;
