// ─── Campaign Timeline service ─────────────────────────────
// Aggregates note history into a chronological campaign feed.

import prisma from "../lib/prisma";

// ─── Types ──────────────────────────────────────────────────

export interface TimelineLoreMention {
  entityId: string;
  name: string;
  type: string;
}

export interface CampaignTimelineItem {
  noteId: string;
  noteTitle: string;
  createdAt: string; // ISO date string
  summary: string | null;
  majorEvents: string[];
  loreMentions: TimelineLoreMention[];
}

// ─── Major event extraction (deterministic fallback) ────────

const MIN_LINE_LENGTH = 20; // ignore very short fragments
const MAX_EVENTS = 3;

/**
 * Extract 1–3 meaningful event bullets from raw note content.
 * Splits by double-newline (paragraphs) first, then single newlines.
 * Filters out very short fragments and returns the first few chunks.
 */
export function extractMajorEvents(content: string): string[] {
  if (!content || content.trim().length === 0) return [];

  // Try paragraph splits first (double newline)
  let chunks = content
    .split(/\n\s*\n/)
    .map((c) => c.trim())
    .filter((c) => c.length >= MIN_LINE_LENGTH);

  // Fall back to single-line splits if paragraphs are sparse
  if (chunks.length === 0) {
    chunks = content
      .split(/\n/)
      .map((c) => c.trim())
      .filter((c) => c.length >= MIN_LINE_LENGTH);
  }

  // Truncate each chunk to a reasonable bullet length
  return chunks.slice(0, MAX_EVENTS).map((chunk) => {
    // Remove leading markdown bullets/numbers
    const cleaned = chunk.replace(/^[-*•]\s*|^\d+[.)]\s*/g, "").trim();
    // Cap at 200 chars
    return cleaned.length > 200 ? cleaned.slice(0, 197) + "..." : cleaned;
  });
}

// ─── Content preview (fallback for summary) ─────────────────

const PREVIEW_LENGTH = 200;

function contentPreview(content: string): string | null {
  if (!content || content.trim().length === 0) return null;
  const trimmed = content.trim();
  return trimmed.length > PREVIEW_LENGTH
    ? trimmed.slice(0, PREVIEW_LENGTH - 3) + "..."
    : trimmed;
}

// ─── Main timeline query ────────────────────────────────────

/**
 * Build the campaign timeline.
 * Single efficient query with includes — no N+1.
 */
export async function getCampaignTimeline(
  campaignId: string
): Promise<CampaignTimelineItem[]> {
  const notes = await prisma.note.findMany({
    where: { campaignId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      content: true,
      createdAt: true,
      // Phase 4 AI results (optional — may not exist for every note)
      processResults: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          summary: true,
          questUpdatesJson: true,
        },
      },
      // NPC mentions via NoteEntityMention → Entity
      mentions: {
        select: {
          entity: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
        },
      },
    },
  });

  return notes.map((note) => {
    // ── Summary: prefer AI summary, fallback to content preview
    const aiResult = note.processResults[0] ?? null;
    const summary = aiResult?.summary ?? contentPreview(note.content);

    // ── Major events: prefer AI quest updates, fallback to extraction
    let majorEvents: string[] = [];
    if (aiResult?.questUpdatesJson) {
      try {
        const questUpdates = aiResult.questUpdatesJson as Array<{
          title: string;
          status: string;
          details: string;
        }>;
        if (questUpdates.length > 0) {
          majorEvents = questUpdates
            .slice(0, MAX_EVENTS)
            .map((q) => `${q.title}: ${q.details}`);
        }
      } catch {
        // Malformed JSON — fall through to deterministic extraction
      }
    }
    if (majorEvents.length === 0) {
      majorEvents = extractMajorEvents(note.content);
    }

    // ── Lore mentions: deduplicate and include all types
    const seen = new Set<string>();
    const loreMentions: TimelineLoreMention[] = [];
    for (const mention of note.mentions) {
      if (!seen.has(mention.entity.id)) {
        seen.add(mention.entity.id);
        loreMentions.push({
          entityId: mention.entity.id,
          name: mention.entity.name,
          type: mention.entity.type,
        });
      }
    }
    // Sort loreMentions: NPCs first, then alphabetical? Or just as encountered
    loreMentions.sort((a, b) => {
      if (a.type === "NPC" && b.type !== "NPC") return -1;
      if (a.type !== "NPC" && b.type === "NPC") return 1;
      return a.name.localeCompare(b.name);
    });

    return {
      noteId: note.id,
      noteTitle: note.title,
      createdAt: note.createdAt.toISOString(),
      summary,
      majorEvents,
      loreMentions,
    };
  });
}
