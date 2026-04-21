/**
 * Mention parser utility.
 *
 * For the MVP, the frontend sends structured mention data alongside note content.
 * This utility provides a helper to detect @mentions in raw text as a fallback,
 * and a type definition for structured mentions.
 */

export interface MentionInput {
  entityId: string;
  startIndex: number;
  endIndex: number;
  displayText: string;
}

/**
 * Detect @mention patterns in plain text.
 * Pattern: @Entity Name (word characters and spaces until end of mention).
 * Returns raw matches — caller must resolve entity IDs separately.
 */
export function detectRawMentions(
  text: string
): Array<{ displayText: string; startIndex: number; endIndex: number }> {
  const regex = /@([\w][\w\s]*[\w])/g;
  const results: Array<{ displayText: string; startIndex: number; endIndex: number }> = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    results.push({
      displayText: match[1],
      startIndex: match.index,
      endIndex: match.index + match[0].length,
    });
  }

  return results;
}
