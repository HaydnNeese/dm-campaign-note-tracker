// ─── Zod schemas for AI output validation ───────────────────

import { z } from "zod";

const entityTypeEnum = z.enum(["NPC", "LOCATION", "ITEM", "QUEST", "FACTION", "KEY_EVENT"]);

export const extractedEntitySchema = z.object({
  name: z.string().min(1),
  mentionText: z.string().min(1),
  entityType: entityTypeEnum,
  matchedEntityId: z.string().uuid().nullable(),
  isNewSuggestion: z.boolean(),
});

export const questUpdateSchema = z.object({
  title: z.string().min(1),
  status: z.enum(["new_hook", "progressed", "completed", "changed"]),
  details: z.string(),
});

export const processSessionResponseSchema = z.object({
  summary: z.string().min(1),
  extractedEntities: z.array(extractedEntitySchema),
  questUpdates: z.array(questUpdateSchema),
});

export type ExtractedEntity = z.infer<typeof extractedEntitySchema>;
export type QuestUpdate = z.infer<typeof questUpdateSchema>;
export type ProcessSessionResponse = z.infer<typeof processSessionResponseSchema>;

export const recapResponseSchema = z.object({
  recap: z.string().min(1),
});

export type RecapResponse = z.infer<typeof recapResponseSchema>;
