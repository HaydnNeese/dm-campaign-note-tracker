// ─── Premium access middleware ──────────────────────────────
// Simple premium gate. Currently reads user.isPremium flag.
// Replace with real subscription/billing check when ready.

import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth";
import prisma from "../lib/prisma";

/**
 * Middleware: requires the authenticated user to have premium access.
 * Must be placed AFTER authMiddleware.
 */
export async function requirePremium(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { isPremium: true },
    });

    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    if (!user.isPremium) {
      res.status(403).json({
        error: "Premium access required",
        code: "PREMIUM_REQUIRED",
        message: "This feature requires a premium subscription.",
      });
      return;
    }

    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Helper: check premium status without blocking.
 * Returns boolean — useful for conditional logic in routes.
 */
export async function checkPremiumStatus(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isPremium: true },
  });
  return user?.isPremium ?? false;
}
