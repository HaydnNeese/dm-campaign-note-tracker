import { Router, Response, NextFunction } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { requirePremium } from "../middleware/premium";
import {
  generateLoreName,
  generateLoreDetails,
  optimizeLoreDetails,
} from "../services/ai/lore.service";
import { analyzeGeneralContent } from "../services/ai/analyzeContent.service";
import prisma from "../lib/prisma";

const router = Router();

router.use(authMiddleware);

router.post("/name", async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { type, summary } = req.body;
    const name = await generateLoreName(type, summary);
    res.json({ name });
  } catch (err) {
    next(err);
  }
});

router.post("/details", async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, type, summary, taggedEntityIds } = req.body;

    let taggedEntities: any[] = [];
    if (taggedEntityIds && taggedEntityIds.length > 0) {
      taggedEntities = await prisma.entity.findMany({
        where: {
          id: { in: taggedEntityIds },
          campaign: { userId: req.userId! },
        },
        select: { name: true, type: true, summary: true, content: true },
      });
    }

    const details = await generateLoreDetails(name, type, summary, taggedEntities);
    res.json({ details });
  } catch (err) {
    next(err);
  }
});

router.post("/analyze", async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { title, content, campaignId } = req.body;
    
    // Verify campaign belongs to user
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, userId: req.userId! }
    });
    
    if (!campaign) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    const result = await analyzeGeneralContent(campaignId, title, content);
    res.json({ result });
  } catch (err) {
    next(err);
  }
});

router.post("/optimize", async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { text } = req.body;
    const optimizedText = await optimizeLoreDetails(text);
    res.json({ optimizedText });
  } catch (err) {
    next(err);
  }
});

export default router;
