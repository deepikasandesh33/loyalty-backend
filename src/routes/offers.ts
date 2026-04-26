import { Router } from "express";
import prisma from "../lib/prisma";

const router = Router();

// iOS OfferItem shape — both store and restaurant offers use the same struct,
// with StoreId/StoreName/StoreIcon/StoreColor mapping to whichever entity owns the offer.

function formatStoreOffer(
  offer: { id: number; storeId: number; title: string; description: string; discount: string; expiry: string; category: string },
  store: { name: string; icon: string; color: string }
) {
  return {
    Id: offer.id,
    StoreId: offer.storeId,
    StoreName: store.name,
    StoreIcon: store.icon,
    StoreColor: store.color,
    Title: offer.title,
    Description: offer.description,
    Discount: offer.discount,
    Expiry: offer.expiry,
    Category: offer.category,
  };
}

function formatRestaurantOffer(
  offer: { id: number; restaurantId: number; title: string; description: string; discount: string; expiry: string; category: string },
  restaurant: { name: string; icon: string; color: string }
) {
  return {
    Id: offer.id,
    StoreId: offer.restaurantId,
    StoreName: restaurant.name,
    StoreIcon: restaurant.icon,
    StoreColor: restaurant.color,
    Title: offer.title,
    Description: offer.description,
    Discount: offer.discount,
    Expiry: offer.expiry,
    Category: offer.category,
  };
}

// GET /offers — all store offers, or filtered by userId's subscribed stores
router.get("/offers", async (req, res) => {
  const userId = req.query.userId ? parseInt(req.query.userId as string) : null;

  if (userId !== null && !isNaN(userId)) {
    // Return offers only for stores the user is subscribed to
    const userStores = await prisma.userStore.findMany({
      where: { userId },
      select: { storeId: true },
    });
    const storeIds = userStores.map((us) => us.storeId);

    const offers = await prisma.storeOffer.findMany({
      where: { storeId: { in: storeIds } },
      include: { store: true },
    });

    res.json({ success: true, offers: offers.map((o) => formatStoreOffer(o, o.store)) });
  } else {
    // Return all store offers
    const offers = await prisma.storeOffer.findMany({ include: { store: true } });
    res.json({ success: true, offers: offers.map((o) => formatStoreOffer(o, o.store)) });
  }
});

// GET /restaurant-offers?userId= — restaurant offers for user's subscribed restaurants
router.get("/restaurant-offers", async (req, res) => {
  const userId = req.query.userId ? parseInt(req.query.userId as string) : null;

  if (userId !== null && !isNaN(userId)) {
    const userRestaurants = await prisma.userRestaurant.findMany({
      where: { userId },
      select: { restaurantId: true },
    });
    const restaurantIds = userRestaurants.map((ur) => ur.restaurantId);

    const offers = await prisma.restaurantOffer.findMany({
      where: { restaurantId: { in: restaurantIds } },
      include: { restaurant: true },
    });

    res.json({ success: true, offers: offers.map((o) => formatRestaurantOffer(o, o.restaurant)) });
  } else {
    const offers = await prisma.restaurantOffer.findMany({ include: { restaurant: true } });
    res.json({ success: true, offers: offers.map((o) => formatRestaurantOffer(o, o.restaurant)) });
  }
});

export default router;
