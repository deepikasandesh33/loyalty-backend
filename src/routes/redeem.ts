import { Router, Request, Response } from "express";
import { PrismaClient } from "../generated/prisma";
import { requireManager } from "../lib/auth";

const router = Router();
const prisma = new PrismaClient();

// ── POST /scan  ───────────────────────────────────────────────────────────────
// Called by restaurant/store staff when they scan a customer's loyalty QR code.
// QR payload format: LOYALTY-{userId}-{phone}
// Awards points to the user for this visit.
// Requires manager auth (x-restaurant-id + x-manager-code headers).

router.post("/scan", requireManager, async (req: Request, res: Response) => {
  const { qrPayload } = req.body as { qrPayload?: string };

  if (!qrPayload) {
    return res.status(400).json({ success: false, message: "qrPayload is required" });
  }

  // Parse LOYALTY-{userId}-{phone}
  const match = qrPayload.match(/^LOYALTY-(\d+)-(\d+)$/);
  if (!match) {
    return res.status(400).json({ success: false, message: "Invalid QR code format" });
  }

  const userId = parseInt(match[1]);
  const phone = match[2];
  const restaurant = (req as any).restaurant;

  try {
    // Verify user exists and phone matches
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    if (user.phone.replace(/\D/g, "") !== phone) {
      return res.status(400).json({ success: false, message: "QR code does not match user" });
    }

    // Check user is subscribed to this restaurant
    const subscription = await prisma.userRestaurant.findUnique({
      where: { userId_restaurantId: { userId, restaurantId: restaurant.id } }
    });
    if (!subscription) {
      return res.status(403).json({
        success: false,
        message: `${user.name} is not subscribed to ${restaurant.name}`
      });
    }

    // Award points
    const pointsAwarded = restaurant.points ?? 10;
    const log = await prisma.visitLog.create({
      data: { userId, restaurantId: restaurant.id, pointsAwarded }
    });

    return res.json({
      success: true,
      message: `${pointsAwarded} points awarded to ${user.name}`,
      userId: user.id,
      userName: user.name,
      pointsAwarded,
      visitId: log.id
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// ── POST /redeem-offer  ───────────────────────────────────────────────────────
// Called by staff when they scan a customer's offer redemption QR code.
// QR payload format: REDEEM-{offerId}-{userId}-{timestamp}
// Marks the offer as redeemed — each QR payload can only be used once.
// Requires manager auth.

router.post("/redeem-offer", requireManager, async (req: Request, res: Response) => {
  const { qrPayload } = req.body as { qrPayload?: string };

  if (!qrPayload) {
    return res.status(400).json({ success: false, message: "qrPayload is required" });
  }

  // Parse REDEEM-{offerId}-{userId}-{timestamp}
  const match = qrPayload.match(/^REDEEM-(\d+)-(\d+)-(\d+)$/);
  if (!match) {
    return res.status(400).json({ success: false, message: "Invalid redemption QR format" });
  }

  const offerId = parseInt(match[1]);
  const userId = parseInt(match[2]);
  const ts = parseInt(match[3]);
  const restaurant = (req as any).restaurant;

  // Reject QR codes older than 10 minutes
  const ageSeconds = Math.floor(Date.now() / 1000) - ts;
  if (ageSeconds > 600) {
    return res.status(400).json({ success: false, message: "QR code has expired (10 min limit)" });
  }

  try {
    // Check already redeemed
    const existing = await prisma.offerRedemption.findUnique({ where: { qrPayload } });
    if (existing) {
      return res.status(409).json({ success: false, message: "This offer has already been redeemed" });
    }

    // Verify the offer belongs to this restaurant
    const offer = await prisma.restaurantOffer.findFirst({
      where: { id: offerId, restaurantId: restaurant.id }
    });
    if (!offer) {
      return res.status(404).json({ success: false, message: "Offer not found for this restaurant" });
    }

    // Verify user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Record redemption
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

// ── GET /visit-history/:userId  ───────────────────────────────────────────────
// Returns a user's visit history and total points earned.

router.get("/visit-history/:userId", async (req: Request, res: Response) => {
  const userId = parseInt(req.params.userId as string);
  try {
    const logs = await prisma.visitLog.findMany({
      where: { userId },
      orderBy: { scannedAt: "desc" },
      take: 50
    });
    const totalPoints = logs.reduce((sum, l) => sum + l.pointsAwarded, 0);
    return res.json({ success: true, totalPoints, visits: logs });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
