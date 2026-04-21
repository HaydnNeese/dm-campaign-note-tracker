import { Router, Response, NextFunction } from "express";
import prisma from "../lib/prisma";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { validate } from "../validation/validate";
import { createCampaignSchema, updateCampaignSchema } from "../validation/schemas";
import { getCampaignTimeline } from "../services/timeline";

const router = Router();

// All campaign routes require authentication
router.use(authMiddleware);

// ─── GET /campaigns ──────────────────────────────────────────
router.get(
  "/",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const campaigns = await prisma.campaign.findMany({
        where: { userId: req.userId },
        orderBy: { updatedAt: "desc" },
      });
      res.json({ campaigns });
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET /campaigns/:id/timeline ─────────────────────────────
router.get(
  "/:id/timeline",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;

      // Verify campaign ownership
      const campaign = await prisma.campaign.findFirst({
        where: { id, userId: req.userId },
        select: { id: true },
      });
      if (!campaign) {
        res.status(404).json({ error: "Campaign not found" });
        return;
      }

      const timeline = await getCampaignTimeline(id);
      res.json({ timeline });
    } catch (err) {
      next(err);
    }
  }
);

// ─── POST /campaigns ─────────────────────────────────────────
router.post(
  "/",
  validate(createCampaignSchema),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const campaign = await prisma.campaign.create({
        data: { ...req.body, userId: req.userId! },
      });
      res.status(201).json({ campaign });
    } catch (err) {
      next(err);
    }
  }
);

// ─── PATCH /campaigns/:id ────────────────────────────────────
router.patch(
  "/:id",
  validate(updateCampaignSchema),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      // Verify ownership
      const existing = await prisma.campaign.findFirst({
        where: { id, userId: req.userId },
      });
      if (!existing) {
        res.status(404).json({ error: "Campaign not found" });
        return;
      }

      const campaign = await prisma.campaign.update({
        where: { id },
        data: req.body,
      });
      res.json({ campaign });
    } catch (err) {
      next(err);
    }
  }
);

// ─── DELETE /campaigns/:id ───────────────────────────────────
router.delete(
  "/:id",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const existing = await prisma.campaign.findFirst({
        where: { id, userId: req.userId },
      });
      if (!existing) {
        res.status(404).json({ error: "Campaign not found" });
        return;
      }

      await prisma.campaign.delete({ where: { id } });
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);

export default router;
