// ─── Session AI routes ──────────────────────────────────────
// POST /notes/:id/process-session  — AI-analyze a session note
// GET  /notes/:id/process-session  — fetch latest result
// POST /notes/:id/generate-recap   — generate player recap
// GET  /notes/:id/recap            — fetch latest recap

import { Router, Response, NextFunction } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { requirePremium } from "../middleware/premium";
import prisma from "../lib/prisma";
import {
  processSession,
  getProcessResult,
  generateRecap,
  getRecap,
} from "../services/ai";

const router = Router();

// All routes require auth
router.use(authMiddleware);

/**
 * Helper: verify note belongs to user's campaign
 */
async function verifyNoteOwnership(noteId: string, userId: string) {
  return prisma.note.findFirst({
    where: {
      id: noteId,
      campaign: { userId },
    },
    select: { id: true },
  });
}

// ─── POST /notes/:id/process-session ─────────────────────────
router.post(
  "/:id/process-session",
  requirePremium,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const noteId = req.params.id as string;

      // Verify ownership
      const note = await verifyNoteOwnership(noteId, req.userId!);
      if (!note) {
        res.status(404).json({ error: "Note not found" });
        return;
      }

      // Process with AI
      const result = await processSession(noteId);
      res.json({ result });
    } catch (err: any) {
      next(err);
    }
  }
);

// ─── GET /notes/:id/process-session ──────────────────────────
router.get(
  "/:id/process-session",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const noteId = req.params.id as string;

      const note = await verifyNoteOwnership(noteId, req.userId!);
      if (!note) {
        res.status(404).json({ error: "Note not found" });
        return;
      }

      const result = await getProcessResult(noteId);
      res.json({ result }); // null if not processed yet
    } catch (err) {
      next(err);
    }
  }
);

// ─── POST /notes/:id/generate-recap ─────────────────────────
router.post(
  "/:id/generate-recap",
  requirePremium,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const noteId = req.params.id as string;

      const note = await verifyNoteOwnership(noteId, req.userId!);
      if (!note) {
        res.status(404).json({ error: "Note not found" });
        return;
      }

      const recap = await generateRecap(noteId);
      res.json({ recap });
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET /notes/:id/recap ────────────────────────────────────
router.get(
  "/:id/recap",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const noteId = req.params.id as string;

      const note = await verifyNoteOwnership(noteId, req.userId!);
      if (!note) {
        res.status(404).json({ error: "Note not found" });
        return;
      }

      const recap = await getRecap(noteId);
      res.json({ recap }); // null if not generated yet
    } catch (err) {
      next(err);
    }
  }
);

export default router;
