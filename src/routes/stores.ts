import { Router } from "express";
import prisma from "../lib/prisma";

const router = Router();

function formatStore(s: { id: number; name: string; icon: string; color: string; points: number; tier: string }) {
  return { Id: s.id, Name: s.name, Icon: s.icon, Color: s.color, Points: s.points, Tier: s.tier };
}

// GET /stores — active stores only (shown to users for browsing/adding)
router.get("/stores", async (_req, res) => {
  const stores = await prisma.store.findMany({ where: { active: true }, orderBy: { name: "asc" } });
  res.json({ success: true, stores: stores.map(formatStore) });
});

// GET /user-stores?userId= — stores the user has subscribed to
router.get("/user-stores", async (req, res) => {
  const userId = parseInt(req.query.userId as string);
  if (isNaN(userId)) {
    res.json({ success: false, stores: [] });
    return;
  }

  const rows = await prisma.userStore.findMany({
    where: { userId, store: { active: true } },
    include: { store: true },
  });

  res.json({ success: true, stores: rows.map((r) => formatStore(r.store)) });
});

// POST /user-stores/add
router.post("/user-stores/add", async (req, res) => {
  const { userId, storeId } = req.body;
  if (!userId || !storeId) {
    res.json({ success: false, message: "userId and storeId are required." });
    return;
  }

  await prisma.userStore.upsert({
    where: { userId_storeId: { userId, storeId } },
    update: {},
    create: { userId, storeId },
  });

  res.json({ success: true, message: "Store added." });
});

// POST /user-stores/remove
router.post("/user-stores/remove", async (req, res) => {
  const { userId, storeId } = req.body;
  if (!userId || !storeId) {
    res.json({ success: false, message: "userId and storeId are required." });
    return;
  }

  await prisma.userStore.deleteMany({ where: { userId, storeId } });
  res.json({ success: true, message: "Store removed." });
});

export default router;
