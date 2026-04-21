// ─── Response parsers ───────────────────────────────────────
// Validates and sanitizes raw LLM output into safe app structures.

import {
  processSessionResponseSchema,
  recapResponseSchema,
  type ProcessSessionResponse,
  type RecapResponse,
} from "./schemas";

/**
 * Extract JSON from raw LLM text.
 * Handles cases where the model wraps JSON in markdown code fences.
 */
function extractJson(raw: string): string {
  let cleaned = raw.trim();
  // Strip markdown code fences
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  }
  return cleaned.trim();
}

/**
 * Parse and validate Process Session response.
 * Throws if the AI output doesn't match expected shape.
 */
export function parseProcessSessionResponse(raw: string): ProcessSessionResponse {
  const jsonStr = extractJson(raw);
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new Error(`AI returned invalid JSON: ${jsonStr.slice(0, 200)}`);
  }

  const result = processSessionResponseSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(
      `AI output validation failed: ${result.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join(", ")}`
    );
  }

  return result.data;
}

/**
 * Parse and validate Recap response.
 */
export function parseRecapResponse(raw: string): RecapResponse {
  const jsonStr = extractJson(raw);
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new Error(`AI returned invalid JSON: ${jsonStr.slice(0, 200)}`);
  }

  const result = recapResponseSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(
      `AI recap validation failed: ${result.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join(", ")}`
    );
  }

  return result.data;
}
