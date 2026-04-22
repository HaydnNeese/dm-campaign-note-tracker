import { getAiProvider } from "./aiProvider";
import type { EntityType } from "../../types";

export async function generateLoreName(type: EntityType, summary?: string): Promise<string> {
  console.log(`Generating name for type: ${type}${summary ? ` (Summary: ${summary})` : ""}`);
  try {
    const ai = getAiProvider();
    const res = await ai.complete({
      messages: [
        {
          role: "system",
          content: `You are a master world-builder and D&D dungeon master. Generate a highly unique, evocative, and thematic name for a ${type}. 
${summary ? `The user provided this context: "${summary}". Use it to inspire the name.` : "Avoid common cliches and generic fantasy tropes."}
Return ONLY the name, no extra text, quotes, or explanations.`,
        },
      ],
      temperature: 1.0,
    });
    console.log(`Generated name: ${res}`);
    return res.trim();
  } catch (err) {
    console.error("Error in generateLoreName:", err);
    throw err;
  }
}

export async function generateLoreDetails(
  name: string,
  type: EntityType,
  summary?: string,
  taggedEntities?: { name: string; type: string; summary?: string; content?: string }[]
): Promise<string> {
  const ai = getAiProvider();

  let typeSpecificInstructions = "";
  if (type === "NPC") {
    typeSpecificInstructions = "Include a concise D&D stat block or key combat/social statistics.";
  } else if (type === "LOCATION") {
    typeSpecificInstructions = "Include potential game mechanics, environmental hazards, or skill check ideas.";
  } else if (type === "ITEM") {
    typeSpecificInstructions = "Include magical properties, statistics, or mechanical benefits.";
  } else if (type === "QUEST") {
    typeSpecificInstructions = "Include potential rewards such as gold, items, or narrative boons.";
  }

  let taggedContext = "";
  if (taggedEntities && taggedEntities.length > 0) {
    taggedContext = "Also, take into account these related lore pieces:\n" + 
      taggedEntities.map(e => `- ${e.name} (${e.type}): ${e.summary || e.content?.substring(0, 100) || "No details available"}`).join("\n");
  }

  const res = await ai.complete({
    messages: [
      {
        role: "system",
        content: `You are a creative D&D writer and dungeon master. Write a rich, atmospheric description for a ${type} named "${name}".
${summary ? `Incorporate these details provided by the user: "${summary}".` : ""}
${taggedContext}
${typeSpecificInstructions}
Keep it to 2-3 paragraphs. Focus on sensory details, interesting hooks, and practical DM information.
Return ONLY the description text.`,
      },
    ],
    temperature: 0.7,
  });
  return res.trim();
}

export async function optimizeLoreDetails(text: string): Promise<string> {
  const ai = getAiProvider();
  const res = await ai.complete({
    messages: [
      {
        role: "system",
        content: `You are an editor for a D&D campaign. Optimize and refine the following lore description to be more immersive, professional, and clear.
Preserve the core facts but improve the vocabulary and flow.
Return ONLY the optimized text.`,
      },
      {
        role: "user",
        content: text,
      },
    ],
    temperature: 0.3,
  });
  return res.trim();
}
