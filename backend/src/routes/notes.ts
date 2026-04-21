import { Router, Response, NextFunction } from "express";
import prisma from "../lib/prisma";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { validate } from "../validation/validate";
import { createNoteSchema, updateNoteSchema } from "../validation/schemas";

const router = Router();

// All note routes require authentication
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
 * Helper: upsert mentions for a note.
 * Clears existing mentions and inserts fresh ones.
 */
async function syncMentions(
  noteId: string,
  mentions: Array<{
    entityId: string;
    startIndex: number;
    endIndex: number;
    displayText: string;
  }>
) {
  // Delete all existing mentions for this note
  await prisma.noteEntityMention.deleteMany({ where: { noteId } });

  // Insert fresh mention rows
  if (mentions.length > 0) {
    await prisma.noteEntityMention.createMany({
      data: mentions.map((m) => ({ ...m, noteId })),
    });
  }
}

// ─── GET /campaigns/:campaignId/notes ────────────────────────
router.get(
  "/campaigns/:campaignId/notes",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const campaignId = req.params.campaignId as string;
      const campaign = await verifyCampaignOwnership(campaignId, req.userId!);
      if (!campaign) {
        res.status(404).json({ error: "Campaign not found" });
        return;
      }

      const notes = await prisma.note.findMany({
        where: { campaignId },
        include: { 
          mentions: {
            include: {
              entity: {
                select: { id: true, name: true, type: true }
              }
            }
          } 
        },
        orderBy: { updatedAt: "desc" },
      });
      res.json({ notes });
    } catch (err) {
      next(err);
    }
  }
);

// ─── POST /campaigns/:campaignId/notes ───────────────────────
router.post(
  "/campaigns/:campaignId/notes",
  validate(createNoteSchema),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const campaignId = req.params.campaignId as string;
      const campaign = await verifyCampaignOwnership(campaignId, req.userId!);
      if (!campaign) {
        res.status(404).json({ error: "Campaign not found" });
        return;
      }

      const { mentions, ...noteData } = req.body;

      const note = await prisma.note.create({
        data: { ...noteData, campaignId },
      });

      // Sync mentions
      await syncMentions(note.id, mentions);

      // Return note with mentions
      const noteWithMentions = await prisma.note.findUnique({
        where: { id: note.id },
        include: { mentions: true },
      });

      res.status(201).json({ note: noteWithMentions });
    } catch (err) {
      next(err);
    }
  }
);

// ─── PATCH /notes/:id ────────────────────────────────────────
router.patch(
  "/notes/:id",
  validate(updateNoteSchema),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      // Verify note belongs to user's campaign
      const note = await prisma.note.findUnique({
        where: { id },
        include: { campaign: { select: { userId: true } } },
      });
      if (!note || note.campaign.userId !== req.userId) {
        res.status(404).json({ error: "Note not found" });
        return;
      }

      const { mentions, ...noteData } = req.body;

      const updated = await prisma.note.update({
        where: { id },
        data: noteData,
      });

      // If mentions were provided, sync them
      if (mentions !== undefined) {
        await syncMentions(updated.id, mentions);
      }

      const noteWithMentions = await prisma.note.findUnique({
        where: { id: updated.id },
        include: { mentions: true },
      });

      res.json({ note: noteWithMentions });
    } catch (err) {
      next(err);
    }
  }
);

// ─── DELETE /notes/:id ───────────────────────────────────────
router.delete(
  "/notes/:id",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const note = await prisma.note.findUnique({
        where: { id },
        include: { campaign: { select: { userId: true } } },
      });
      if (!note || note.campaign.userId !== req.userId) {
        res.status(404).json({ error: "Note not found" });
        return;
      }

      await prisma.note.delete({ where: { id } });
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);

export default router;
