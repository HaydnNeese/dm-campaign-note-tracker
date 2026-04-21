import { z } from "zod";

// ─── Auth ────────────────────────────────────────────────────
export const registerSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

// ─── Campaign ────────────────────────────────────────────────
export const createCampaignSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().max(2000).optional().default(""),
});

export const updateCampaignSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
});

// ─── Entity ──────────────────────────────────────────────────
export const entityMentionSchema = z.object({
  targetEntityId: z.string().uuid(),
  startIndex: z.number().int().min(0),
  endIndex: z.number().int().min(0),
  displayText: z.string().min(1),
});

export const createEntitySchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  type: z.enum(["NPC", "LOCATION", "ITEM", "QUEST", "FACTION", "KEY_EVENT"]),
  summary: z.string().max(1000).optional().default(""),
  content: z.string().optional().default(""),
  imageUrl: z.string().nullable().optional(),
  mentions: z.array(entityMentionSchema).optional().default([]),
});

export const updateEntitySchema = z.object({
  name: z.string().min(1).max(200).optional(),
  type: z.enum(["NPC", "LOCATION", "ITEM", "QUEST", "FACTION", "KEY_EVENT"]).optional(),
  summary: z.string().max(1000).optional(),
  content: z.string().optional(),
  imageUrl: z.string().nullable().optional(),
  mentions: z.array(entityMentionSchema).optional(),
});

// ─── Mention (sent from frontend with note save) ─────────────
export const mentionSchema = z.object({
  entityId: z.string().uuid(),
  startIndex: z.number().int().min(0),
  endIndex: z.number().int().min(0),
  displayText: z.string().min(1),
});

// ─── Note ────────────────────────────────────────────────────
export const createNoteSchema = z.object({
  title: z.string().min(1, "Title is required").max(300),
  content: z.string().optional().default(""),
  mentions: z.array(mentionSchema).optional().default([]),
});

export const updateNoteSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  content: z.string().optional(),
  mentions: z.array(mentionSchema).optional(),
});
