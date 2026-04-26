import { Request, Response, NextFunction } from "express";
import prisma from "./prisma";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const password = req.headers["x-admin-password"];
  if (password !== ADMIN_PASSWORD) {
    res.status(401).json({ success: false, message: "Invalid admin password." });
    return;
  }
  next();
}

export async function requireManager(req: Request, res: Response, next: NextFunction) {
  const restaurantId = parseInt(req.headers["x-restaurant-id"] as string);
  const managerCode = req.headers["x-manager-code"] as string;

  if (!restaurantId || !managerCode) {
    res.status(401).json({ success: false, message: "Missing manager credentials." });
    return;
  }

  const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
  if (!restaurant || restaurant.managerCode !== managerCode) {
    res.status(401).json({ success: false, message: "Invalid restaurant ID or manager code." });
    return;
  }

  (req as any).restaurant = restaurant;
  next();
}
