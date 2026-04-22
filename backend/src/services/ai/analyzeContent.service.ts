import prisma from "../../lib/prisma";
import { getAiProvider } from "./aiProvider";
import { buildProcessSessionPrompt } from "./promptBuilders";
import { parseProcessSessionResponse } from "./responseParsers";
import type { ProcessSessionResponse } from "./schemas";

export async function analyzeGeneralContent(
  campaignId: string,
  title: string,
  content: string
): Promise<ProcessSessionResponse> {
  // 1. Load existing entities for context
  const entities = await prisma.entity.findMany({
    where: { campaignId },
    select: { id: true, name: true, type: true },
  });

  // 2. Build prompt
  const messages = buildProcessSessionPrompt(title, content, entities);

  // 3. Call AI provider
  const ai = getAiProvider();
  const rawResponse = await ai.complete({
    messages,
    temperature: 0.3,
    maxTokens: 2048,
    jsonMode: true,
  });

  // 4. Parse and validate
  return parseProcessSessionResponse(rawResponse);
}
