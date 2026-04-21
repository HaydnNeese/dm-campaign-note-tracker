// ─── Prompt builders ────────────────────────────────────────
// Constructs structured prompts for the AI provider.

import type { AiMessage } from "./aiProvider";

interface EntityContext {
  id: string;
  name: string;
  type: string;
}

/**
 * Build the prompt for Process Session.
 * Tells the model exactly what to return as JSON.
 */
export function buildProcessSessionPrompt(
  noteTitle: string,
  noteContent: string,
  entities: EntityContext[]
): AiMessage[] {
  const entityList =
    entities.length > 0
      ? entities
          .map((e) => `- ${e.name} (${e.type}, id: ${e.id})`)
          .join("\n")
      : "(no entities exist yet)";

  return [
    {
      role: "system",
      content: `You are a D&D session analysis assistant. You help Dungeon Masters organize their notes after a session.

You will receive a session note and a list of existing campaign entities.

Your job:
1. Summarize the session concisely (2-4 sentences).
2. Extract major entity names mentioned in the note (NPCs, Locations, Items, Quests, Factions, Key Events). For each, provide:
   - "name": The formal name of the entity.
   - "mentionText": The EXACT text span as it appears in the note content (case-sensitive if possible). This is CRITICAL for linking.
   - "entityType": One of the allowed types.
   - "matchedEntityId": The UUID from the existing list, or null if no match.
   - "isNewSuggestion": true if it's not in the existing list.
3. Identify quest developments: new quest hooks, quest progress, completions, or status changes.

Return ONLY valid JSON matching this exact shape:
{
  "summary": "string",
  "extractedEntities": [
    { "name": "string", "mentionText": "string", "entityType": "NPC" | "LOCATION" | "ITEM" | "QUEST" | "FACTION" | "KEY_EVENT", "matchedEntityId": "string | null", "isNewSuggestion": boolean }
  ],
  "questUpdates": [
    { "title": "string", "status": "new_hook" | "progressed" | "completed" | "changed", "details": "string" }
  ]
}

Rules:
- matchedEntityId must be a valid UUID from the entity list or null
- Do not invent entity IDs
- If no items exist for a category, return an empty array
- Return ONLY the JSON object, no markdown or explanation`,
    },
    {
      role: "user",
      content: `## Session Note
**Title:** ${noteTitle}

**Content:**
${noteContent}

## Existing Campaign Entities
${entityList}`,
    },
  ];
}

/**
 * Build the prompt for Session Recap generation.
 * Produces a clean, player-friendly summary.
 */
export function buildRecapPrompt(
  noteTitle: string,
  noteContent: string
): AiMessage[] {
  return [
    {
      role: "system",
      content: `You are a D&D session recap writer. You transform DM session notes into clean, engaging player-friendly recaps.

Rules:
- Write in past tense, narrative style
- Preserve important names, locations, and events
- Remove DM-only planning language, private notes, and meta commentary
- Keep it concise but atmospheric (3-6 paragraphs)
- Make it readable and shareable with players
- Do not add information that isn't in the notes

Return ONLY valid JSON:
{
  "recap": "the full recap text here"
}`,
    },
    {
      role: "user",
      content: `## Session Note to Recap
**Title:** ${noteTitle}

**Content:**
${noteContent}`,
    },
  ];
}
