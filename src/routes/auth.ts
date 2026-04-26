import { Router } from "express";
import prisma from "../lib/prisma";

const router = Router();

// POST /register
router.post("/register", async (req, res) => {
  const { name, phone, zipCode, birthDate } = req.body;

  if (!name || !phone || !zipCode || !birthDate) {
    res.json({ success: false, message: "All fields are required." });
    return;
  }

  const cleanPhone = phone.replace(/\D/g, "");

  const existing = await prisma.user.findUnique({ where: { phone: cleanPhone } });
  if (existing) {
    res.json({ success: false, message: "A user with this phone number already exists." });
    return;
  }

  const user = await prisma.user.create({
    data: { name, phone: cleanPhone, zipCode, birthDate },
  });

  res.json({ success: true, message: "Registration successful.", userId: user.id });
});

// POST /login
router.post("/login", async (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    res.json({ success: false, message: "Phone number is required.", user: null });
    return;
  }

  const cleanPhone = phone.replace(/\D/g, "");

  const user = await prisma.user.findUnique({ where: { phone: cleanPhone } });
  if (!user) {
    res.json({ success: false, message: "No account found with that phone number.", user: null });
    return;
  }

  res.json({
    success: true,
    message: "Login successful.",
    user: {
      id: user.id,
      name: user.name,
      phone: user.phone,
      zipCode: user.zipCode,
      birthDate: user.birthDate,
    },
  });
});

export default router;
