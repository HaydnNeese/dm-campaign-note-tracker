// ─── Process Session service ────────────────────────────────
// Orchestrates: load note → load entities → prompt AI → validate → save result.

import prisma from "../../lib/prisma";
import { getAiProvider } from "./aiProvider";
import { buildProcessSessionPrompt } from "./promptBuilders";
import { parseProcessSessionResponse } from "./responseParsers";
import type { ProcessSessionResponse } from "./schemas";

export interface ProcessSessionResult {
  id: string;
  noteId: string;
  summary: string;
  extractedEntities: ProcessSessionResponse["extractedEntities"];
  questUpdates: ProcessSessionResponse["questUpdates"];
  createdAt: Date;
}

/**
 * Process a session note with AI.
 * Returns structured analysis and persists the result.
 */
export async function processSession(noteId: string): Promise<ProcessSessionResult> {
  // 1. Load note with campaign context
  const note = await prisma.note.findUnique({
    where: { id: noteId },
    include: {
      campaign: {
        include: {
          entities: {
            select: { id: true, name: true, type: true },
          },
        },
      },
    },
  });

  if (!note) throw new Error("Note not found");

  if (!note.content.trim()) {
    throw new Error("Note content is empty. Add some notes before analyzing.");
  }

  // 2. Build prompt with entity context
  const messages = buildProcessSessionPrompt(
    note.title,
    note.content,
    note.campaign.entities
  );

  // 3. Call AI provider
  const ai = getAiProvider();
  const rawResponse = await ai.complete({
    messages,
    temperature: 0.3,
    maxTokens: 2048,
    jsonMode: true,
  });

  // 4. Parse and validate
  const parsed = parseProcessSessionResponse(rawResponse);

  // 5. Save result (upsert: keep latest per note)
  // Delete previous results for this note
  await prisma.sessionProcessResult.deleteMany({
    where: { noteId },
  });

  const result = await prisma.sessionProcessResult.create({
    data: {
      noteId,
      summary: parsed.summary,
      extractedEntitiesJson: parsed.extractedEntities as any,
      questUpdatesJson: parsed.questUpdates as any,
    },
  });

  // 6. Update processedAt on note
  await prisma.note.update({
    where: { id: noteId },
    data: { processedAt: new Date() },
  });

  return {
    id: result.id,
    noteId: result.noteId,
    summary: result.summary,
    extractedEntities: parsed.extractedEntities,
    questUpdates: parsed.questUpdates,
    createdAt: result.createdAt,
  };
}

/**
 * Get the latest process result for a note, if one exists.
 */
export async function getProcessResult(noteId: string): Promise<ProcessSessionResult | null> {
  const result = await prisma.sessionProcessResult.findFirst({
    where: { noteId },
    orderBy: { createdAt: "desc" },
  });

  if (!result) return null;

  return {
    id: result.id,
    noteId: result.noteId,
    summary: result.summary,
    extractedEntities: result.extractedEntitiesJson as ProcessSessionResponse["extractedEntities"],
    questUpdates: result.questUpdatesJson as ProcessSessionResponse["questUpdates"],
    createdAt: result.createdAt,
  };
}
