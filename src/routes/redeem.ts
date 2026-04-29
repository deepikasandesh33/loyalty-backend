import { Router, Request, Response } from "express";
import { PrismaClient } from "../generated/prisma";
import { requireManager } from "../lib/auth";

const router = Router();
const prisma = new PrismaClient();

// Redemption rate: 100 points = $1 discount
const POINTS_PER_DOLLAR = 100;
const MIN_REDEEM_POINTS = 100;

// ── POST /scan  ───────────────────────────────────────────────────────────────
// Staff scans customer's loyalty QR (LOYALTY-{userId}-{phone}).
// Awards points, updates the user's balance for this restaurant.
// Requires manager auth.

router.post("/scan", requireManager, async (req: Request, res: Response) => {
  const { qrPayload } = req.body as { qrPayload?: string };
  if (!qrPayload) return res.status(400).json({ success: false, message: "qrPayload is required" });

  const match = qrPayload.match(/^LOYALTY-(\d+)-(\d+)$/);
  if (!match) return res.status(400).json({ success: false, message: "Invalid QR code format" });

  const userId = parseInt(match[1]);
  const phone  = match[2];
  const restaurant = (req as any).restaurant;

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    if (user.phone.replace(/\D/g, "") !== phone)
      return res.status(400).json({ success: false, message: "QR code does not match user" });

    // Ensure user is subscribed; auto-subscribe if not
    await prisma.userRestaurant.upsert({
      where:  { userId_restaurantId: { userId, restaurantId: restaurant.id } },
      create: { userId, restaurantId: restaurant.id, pointsBalance: 0 },
      update: {}
    });

    const pointsAwarded = restaurant.points ?? 10;

    // Increment balance and log visit atomically
    const [updatedSub, log] = await prisma.$transaction([
      prisma.userRestaurant.update({
        where:  { userId_restaurantId: { userId, restaurantId: restaurant.id } },
        data:   { pointsBalance: { increment: pointsAwarded } }
      }),
      prisma.visitLog.create({
        data: { userId, restaurantId: restaurant.id, pointsAwarded }
      })
    ]);

    return res.json({
      success: true,
      message: `${pointsAwarded} points awarded to ${user.name}`,
      userName: user.name,
      pointsAwarded,
      newBalance: updatedSub.pointsBalance,
      visitId: log.id
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// ── POST /scan-store  ─────────────────────────────────────────────────────────
// Same as /scan but for stores. Uses admin password auth.

router.post("/scan-store", async (req: Request, res: Response) => {
  const adminPassword = req.headers["x-admin-password"] as string;
  if (adminPassword !== (process.env.ADMIN_PASSWORD || "admin123"))
    return res.status(401).json({ success: false, message: "Unauthorized" });

  const { qrPayload, storeId } = req.body as { qrPayload?: string; storeId?: number };
  if (!qrPayload || !storeId)
    return res.status(400).json({ success: false, message: "qrPayload and storeId are required" });

  const match = qrPayload.match(/^LOYALTY-(\d+)-(\d+)$/);
  if (!match) return res.status(400).json({ success: false, message: "Invalid QR code format" });

  const userId = parseInt(match[1]);
  const phone  = match[2];

  try {
    const [user, store] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.store.findUnique({ where: { id: storeId } })
    ]);
    if (!user)  return res.status(404).json({ success: false, message: "User not found" });
    if (!store) return res.status(404).json({ success: false, message: "Store not found" });
    if (user.phone.replace(/\D/g, "") !== phone)
      return res.status(400).json({ success: false, message: "QR code does not match user" });

    await prisma.userStore.upsert({
      where:  { userId_storeId: { userId, storeId } },
      create: { userId, storeId, pointsBalance: 0 },
      update: {}
    });

    const pointsAwarded = store.points ?? 10;

    const [updatedSub, log] = await prisma.$transaction([
      prisma.userStore.update({
        where: { userId_storeId: { userId, storeId } },
        data:  { pointsBalance: { increment: pointsAwarded } }
      }),
      prisma.visitLog.create({
        data: { userId, storeId, pointsAwarded }
      })
    ]);

    return res.json({
      success: true,
      message: `${pointsAwarded} points awarded to ${user.name} at ${store.name}`,
      userName: user.name,
      pointsAwarded,
      newBalance: updatedSub.pointsBalance
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// ── POST /redeem-offer  ───────────────────────────────────────────────────────
// Staff scans offer redemption QR (REDEEM-{offerId}-{userId}-{ts}).
// One-time use, expires after 10 minutes. Requires manager auth.

router.post("/redeem-offer", requireManager, async (req: Request, res: Response) => {
  const { qrPayload } = req.body as { qrPayload?: string };
  if (!qrPayload) return res.status(400).json({ success: false, message: "qrPayload is required" });

  const match = qrPayload.match(/^REDEEM-(\d+)-(\d+)-(\d+)$/);
  if (!match) return res.status(400).json({ success: false, message: "Invalid redemption QR format" });

  const offerId = parseInt(match[1]);
  const userId  = parseInt(match[2]);
  const ts      = parseInt(match[3]);
  const restaurant = (req as any).restaurant;

  const ageSeconds = Math.floor(Date.now() / 1000) - ts;
  if (ageSeconds > 600)
    return res.status(400).json({ success: false, message: "QR code has expired (10 min limit)" });

  try {
    const existing = await prisma.offerRedemption.findUnique({ where: { qrPayload } });
    if (existing) return res.status(409).json({ success: false, message: "This offer has already been redeemed" });

    const offer = await prisma.restaurantOffer.findFirst({
      where: { id: offerId, restaurantId: restaurant.id }
    });
    if (!offer) return res.status(404).json({ success: false, message: "Offer not found for this restaurant" });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    await prisma.offerRedemption.create({
      data: { userId, offerId, offerType: "restaurant", qrPayload }
    });

    return res.json({
      success: true,
      message: `Offer "${offer.title}" redeemed for ${user.name}`,
      userName: user.name,
      offerTitle: offer.title,
      discount: offer.discount
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// ── POST /redeem-points  ──────────────────────────────────────────────────────
// User redeems accumulated points for a discount at a specific place.
// Rate: 100 points = $1. Minimum: 100 points.
// Deducts from balance and returns a one-time redemption QR.

router.post("/redeem-points", async (req: Request, res: Response) => {
  const { userId, restaurantId, storeId, pointsToRedeem } = req.body as {
    userId: number;
    restaurantId?: number;
    storeId?: number;
    pointsToRedeem: number;
  };

  if (!userId || !pointsToRedeem)
    return res.status(400).json({ success: false, message: "userId and pointsToRedeem are required" });
  if (!restaurantId && !storeId)
    return res.status(400).json({ success: false, message: "restaurantId or storeId is required" });
  if (pointsToRedeem < MIN_REDEEM_POINTS)
    return res.status(400).json({ success: false, message: `Minimum redemption is ${MIN_REDEEM_POINTS} points` });
  if (pointsToRedeem % MIN_REDEEM_POINTS !== 0)
    return res.status(400).json({ success: false, message: `Points must be a multiple of ${MIN_REDEEM_POINTS}` });

  try {
    let currentBalance = 0;

    if (restaurantId) {
      const sub = await prisma.userRestaurant.findUnique({
        where: { userId_restaurantId: { userId, restaurantId } }
      });
      if (!sub) return res.status(404).json({ success: false, message: "Not subscribed to this restaurant" });
      currentBalance = sub.pointsBalance;
    } else if (storeId) {
      const sub = await prisma.userStore.findUnique({
        where: { userId_storeId: { userId, storeId } }
      });
      if (!sub) return res.status(404).json({ success: false, message: "Not subscribed to this store" });
      currentBalance = sub.pointsBalance;
    }

    if (currentBalance < pointsToRedeem)
      return res.status(400).json({
        success: false,
        message: `Not enough points. You have ${currentBalance}, need ${pointsToRedeem}.`
      });

    const discountDollars = pointsToRedeem / POINTS_PER_DOLLAR;
    const ts = Math.floor(Date.now() / 1000);
    const placeId = restaurantId ?? storeId;
    const placeType = restaurantId ? "R" : "S";
    const qrPayload = `POINTS-${userId}-${placeType}${placeId}-${pointsToRedeem}-${ts}`;

    // Deduct balance
    if (restaurantId) {
      await prisma.userRestaurant.update({
        where: { userId_restaurantId: { userId, restaurantId } },
        data:  { pointsBalance: { decrement: pointsToRedeem } }
      });
    } else if (storeId) {
      await prisma.userStore.update({
        where: { userId_storeId: { userId, storeId } },
        data:  { pointsBalance: { decrement: pointsToRedeem } }
      });
    }

    // Log as negative visit (redemption)
    await prisma.visitLog.create({
      data: {
        userId,
        restaurantId: restaurantId ?? null,
        storeId: storeId ?? null,
        pointsAwarded: -pointsToRedeem
      }
    });

    return res.json({
      success: true,
      message: `$${discountDollars.toFixed(2)} discount unlocked`,
      pointsRedeemed: pointsToRedeem,
      discountDollars,
      newBalance: currentBalance - pointsToRedeem,
      qrPayload   // show this QR to the cashier
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// ── GET /user-points  ─────────────────────────────────────────────────────────
// Returns the user's current points balance at a specific restaurant or store.

router.get("/user-points", async (req: Request, res: Response) => {
  const userId       = parseInt(req.query.userId as string);
  const restaurantId = req.query.restaurantId ? parseInt(req.query.restaurantId as string) : undefined;
  const storeId      = req.query.storeId      ? parseInt(req.query.storeId      as string) : undefined;

  if (isNaN(userId)) return res.status(400).json({ success: false, message: "userId is required" });

  try {
    let balance = 0;
    let visits  = 0;

    if (restaurantId !== undefined) {
      const sub = await prisma.userRestaurant.findUnique({
        where: { userId_restaurantId: { userId, restaurantId } }
      });
      balance = sub?.pointsBalance ?? 0;
      visits  = await prisma.visitLog.count({ where: { userId, restaurantId, pointsAwarded: { gt: 0 } } });
    } else if (storeId !== undefined) {
      const sub = await prisma.userStore.findUnique({
        where: { userId_storeId: { userId, storeId } }
      });
      balance = sub?.pointsBalance ?? 0;
      visits  = await prisma.visitLog.count({ where: { userId, storeId, pointsAwarded: { gt: 0 } } });
    }

    return res.json({ success: true, accumulated: balance, visits });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// ── GET /visit-history/:userId  ───────────────────────────────────────────────
// Returns a user's full visit history and total points ever earned.

router.get("/visit-history/:userId", async (req: Request, res: Response) => {
  const userId = parseInt(req.params.userId as string);
  try {
    const logs = await prisma.visitLog.findMany({
      where: { userId },
      orderBy: { scannedAt: "desc" },
      take: 50
    });
    // Total = sum of positive entries (earned, not redeemed)
    const totalPoints = logs
      .filter(l => l.pointsAwarded > 0)
      .reduce((sum, l) => sum + l.pointsAwarded, 0);
    return res.json({ success: true, totalPoints, visits: logs });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
