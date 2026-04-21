import { Router, Response, NextFunction } from "express";
import prisma from "../lib/prisma";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { validate } from "../validation/validate";
import { createEntitySchema, updateEntitySchema } from "../validation/schemas";

const router = Router();

// All entity routes require authentication
router.use(authMiddleware);

/**
 * Helper: verify the campaign belongs to the authenticated user.
 */
async function verifyCampaignOwnership(campaignId: string, userId: string) {
  return prisma.campaign.findFirst({
    where: { id: campaignId, userId },
    select: { id: true },
  });
}

/**
 * Helper: sync entity-to-entity mentions.
 * Clears existing mentions and inserts fresh ones.
 */
async function syncEntityMentions(
  sourceEntityId: string,
  mentions: Array<{
    targetEntityId: string;
    startIndex: number;
    endIndex: number;
    displayText: string;
  }>
) {
  await prisma.entityMention.deleteMany({ where: { sourceEntityId } });
  if (mentions.length > 0) {
    await prisma.entityMention.createMany({
      data: mentions.map((m) => ({ ...m, sourceEntityId })),
    });
  }
}

// ─── GET /campaigns/:campaignId/entities ─────────────────────
router.get(
  "/:campaignId/entities",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const campaignId = req.params.campaignId as string;
      const campaign = await verifyCampaignOwnership(campaignId, req.userId!);
      if (!campaign) {
        res.status(404).json({ error: "Campaign not found" });
        return;
      }

      const { type } = req.query;
      const entities = await prisma.entity.findMany({
        where: {
          campaignId,
          ...(type ? { type: type as any } : {}),
        },
        include: { entityMentions: true },
        orderBy: { updatedAt: "desc" },
      });
      res.json({ entities });
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET /entities/:id ───────────────────────────────────────
// Returns full entity detail including "mentioned in" data
router.get(
  "/entities/:id",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const entity = await prisma.entity.findUnique({
        where: { id },
        include: {
          campaign: { select: { userId: true } },
          entityMentions: true, // mentions this entity makes
          // Notes that mention this entity
          mentions: {
            include: {
              note: { select: { id: true, title: true, updatedAt: true } },
            },
          },
          // Other entities that mention this entity
          mentionedIn: {
            include: {
              sourceEntity: { select: { id: true, name: true, type: true } },
            },
          },
        },
      });

      if (!entity || entity.campaign.userId !== req.userId) {
        res.status(404).json({ error: "Entity not found" });
        return;
      }

      // Build "mentioned in" lists
      const mentionedInNotes = entity.mentions.map((m) => ({
        noteId: m.note.id,
        noteTitle: m.note.title,
        noteUpdatedAt: m.note.updatedAt,
      }));

      const mentionedInEntities = entity.mentionedIn.map((m) => ({
        entityId: m.sourceEntity.id,
        entityName: m.sourceEntity.name,
        entityType: m.sourceEntity.type,
      }));

      // Remove internal relation data, return clean response
      const { campaign, mentions, mentionedIn, ...entityData } = entity;

      res.json({
        entity: {
          ...entityData,
          mentionedInNotes,
          mentionedInEntities,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── POST /campaigns/:campaignId/entities ────────────────────
router.post(
  "/:campaignId/entities",
  validate(createEntitySchema),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const campaignId = req.params.campaignId as string;
      const campaign = await verifyCampaignOwnership(campaignId, req.userId!);
      if (!campaign) {
        res.status(404).json({ error: "Campaign not found" });
        return;
      }

      const { mentions, ...entityData } = req.body;

      const entity = await prisma.entity.create({
        data: { ...entityData, campaignId },
      });

      // Sync entity mentions
      await syncEntityMentions(entity.id, mentions);

      const entityWithMentions = await prisma.entity.findUnique({
        where: { id: entity.id },
        include: { entityMentions: true },
      });

      res.status(201).json({ entity: entityWithMentions });
    } catch (err) {
      next(err);
    }
  }
);

// ─── PATCH /entities/:id ─────────────────────────────────────
router.patch(
  "/entities/:id",
  validate(updateEntitySchema),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      // Verify entity belongs to user's campaign
      const entity = await prisma.entity.findUnique({
        where: { id },
        include: { campaign: { select: { userId: true } } },
      });
      if (!entity || entity.campaign.userId !== req.userId) {
        res.status(404).json({ error: "Entity not found" });
        return;
      }

      const { mentions, ...entityData } = req.body;

      const updated = await prisma.entity.update({
        where: { id },
        data: entityData,
      });

      // If mentions were provided, sync them
      if (mentions !== undefined) {
        await syncEntityMentions(updated.id, mentions);
      }

      const entityWithMentions = await prisma.entity.findUnique({
        where: { id: updated.id },
        include: { entityMentions: true },
      });

      res.json({ entity: entityWithMentions });
    } catch (err) {
      next(err);
    }
  }
);

// ─── DELETE /entities/:id ────────────────────────────────────
router.delete(
  "/entities/:id",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const entity = await prisma.entity.findUnique({
        where: { id },
        include: { campaign: { select: { userId: true } } },
      });
      if (!entity || entity.campaign.userId !== req.userId) {
        res.status(404).json({ error: "Entity not found" });
        return;
      }

      await prisma.entity.delete({ where: { id } });
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);

export default router;
