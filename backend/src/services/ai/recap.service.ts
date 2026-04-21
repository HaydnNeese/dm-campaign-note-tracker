// ─── Recap generation service ───────────────────────────────
// Generates player-friendly session recaps from DM notes.

import prisma from "../../lib/prisma";
import { getAiProvider } from "./aiProvider";
import { buildRecapPrompt } from "./promptBuilders";
import { parseRecapResponse } from "./responseParsers";

export interface RecapResult {
  id: string;
  noteId: string;
  content: string;
  createdAt: Date;
}

/**
 * Generate a player-friendly recap from a session note.
 */
export async function generateRecap(noteId: string): Promise<RecapResult> {
  // 1. Load note
  const note = await prisma.note.findUnique({
    where: { id: noteId },
  });

  if (!note) throw new Error("Note not found");

  // 2. Build prompt
  const messages = buildRecapPrompt(note.title, note.content);

  // 3. Call AI provider
  const ai = getAiProvider();
  const rawResponse = await ai.complete({
    messages,
    temperature: 0.5,
    maxTokens: 1500,
    jsonMode: true,
  });

  // 4. Parse and validate
  const parsed = parseRecapResponse(rawResponse);

  // 5. Save (keep latest per note)
  await prisma.sessionRecap.deleteMany({ where: { noteId } });

  const recap = await prisma.sessionRecap.create({
    data: {
      noteId,
      content: parsed.recap,
    },
  });

  return {
    id: recap.id,
    noteId: recap.noteId,
    content: recap.content,
    createdAt: recap.createdAt,
  };
}

/**
 * Get the latest recap for a note, if one exists.
 */
export async function getRecap(noteId: string): Promise<RecapResult | null> {
  const recap = await prisma.sessionRecap.findFirst({
    where: { noteId },
    orderBy: { createdAt: "desc" },
  });

  if (!recap) return null;

  return {
    id: recap.id,
    noteId: recap.noteId,
    content: recap.content,
    createdAt: recap.createdAt,
  };
}
