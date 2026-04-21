import { Router, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma";
import { config } from "../config";
import { validate } from "../validation/validate";
import { registerSchema, loginSchema } from "../validation/schemas";
import { authMiddleware, AuthRequest } from "../middleware/auth";

const router = Router();

// ─── POST /auth/register ────────────────────────────────────
router.post(
  "/register",
  validate(registerSchema),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;

      // Check for existing user
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        res.status(409).json({ error: "Email already in use" });
        return;
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: { email, passwordHash },
        select: { id: true, email: true, isPremium: true, createdAt: true },
      });

      const token = jwt.sign({ userId: user.id }, config.jwtSecret, {
        expiresIn: "7d",
      });

      res.status(201).json({ user, token });
    } catch (err) {
      next(err);
    }
  }
);

// ─── POST /auth/login ───────────────────────────────────────
router.post(
  "/login",
  validate(loginSchema),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
      }

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
      }

      const token = jwt.sign({ userId: user.id }, config.jwtSecret, {
        expiresIn: "7d",
      });

      res.json({
        user: { id: user.id, email: user.email, isPremium: user.isPremium, createdAt: user.createdAt },
        token,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET /auth/me ────────────────────────────────────────────
router.get(
  "/me",
  authMiddleware,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.userId },
        select: { id: true, email: true, isPremium: true, createdAt: true },
      });
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res.json({ user });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
