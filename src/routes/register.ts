import { Router, Request, Response } from "express";
import { PrismaClient } from "../generated/prisma";

const router = Router();
const prisma = new PrismaClient();

// Default values assigned to self-registered businesses
const DEFAULTS = {
  icon:    "🏪",
  color:   "indigo",
  points:  10,
  tier:    "Bronze",
  cuisine: "Other",
};

function generateManagerCode(name: string): string {
  const slug = name.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${slug}${rand}`;
}

// ── POST /register/restaurant ─────────────────────────────────────────────────
// Self-registration for restaurant owners. No auth required.
// Returns the generated managerCode so the owner can log in to the manager portal.

router.post("/restaurant", async (req: Request, res: Response) => {
  const { name, email, address, managerPhone, referredBy } = req.body as {
    name: string;
    email: string;
    address: string;
    managerPhone: string;
    referredBy?: string;
  };

  if (!name || !email || !address || !managerPhone)
    return res.status(400).json({ success: false, message: "name, email, address, and managerPhone are required" });

  const managerCode = generateManagerCode(name);

  try {
    const restaurant = await prisma.restaurant.create({
      data: {
        name,
        email,
        address,
        managerPhone,
        referredBy: referredBy ?? "",
        managerCode,
        icon:    DEFAULTS.icon,
        color:   DEFAULTS.color,
        cuisine: DEFAULTS.cuisine,
        points:  DEFAULTS.points,
        tier:    DEFAULTS.tier,
      },
    });

    return res.json({
      success: true,
      message: `${name} registered successfully!`,
      restaurantId: restaurant.id,
      managerCode,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// ── POST /register/store ──────────────────────────────────────────────────────
// Self-registration for store owners. No auth required.

router.post("/store", async (req: Request, res: Response) => {
  const { name, email, address, managerPhone, referredBy } = req.body as {
    name: string;
    email: string;
    address: string;
    managerPhone: string;
    referredBy?: string;
  };

  if (!name || !email || !address || !managerPhone)
    return res.status(400).json({ success: false, message: "name, email, address, and managerPhone are required" });

  const managerCode = generateManagerCode(name);

  try {
    const store = await prisma.store.create({
      data: {
        name,
        email,
        address,
        managerPhone,
        referredBy: referredBy ?? "",
        icon:   DEFAULTS.icon,
        color:  DEFAULTS.color,
        points: DEFAULTS.points,
        tier:   DEFAULTS.tier,
      },
    });

    return res.json({
      success: true,
      message: `${name} registered successfully!`,
      storeId: store.id,
      managerCode,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// ── GET /register/registrations ───────────────────────────────────────────────
// Admin view: list all self-registered businesses with their contact info.

router.get("/registrations", async (req: Request, res: Response) => {
  const adminPassword = req.headers["x-admin-password"] as string;
  if (adminPassword !== (process.env.ADMIN_PASSWORD || "admin123"))
    return res.status(401).json({ success: false, message: "Unauthorized" });

  try {
    const [restaurants, stores] = await Promise.all([
      prisma.restaurant.findMany({
        select: { id: true, name: true, email: true, address: true, managerPhone: true, referredBy: true, managerCode: true },
        orderBy: { id: "desc" },
      }),
      prisma.store.findMany({
        select: { id: true, name: true, email: true, address: true, managerPhone: true, referredBy: true },
        orderBy: { id: "desc" },
      }),
    ]);
    return res.json({ success: true, restaurants, stores });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
