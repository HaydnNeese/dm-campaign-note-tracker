// ─── MentionText ────────────────────────────────────────────
// Renders note content with @mentions as tappable highlighted links.
// Tapping a mention navigates to the Entity Detail screen.

import { Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import type { NoteEntityMention } from "@/types";

interface Props {
  content: string;
  mentions: NoteEntityMention[];
  style?: any;
}

export default function MentionText({ content, mentions, style }: Props) {
  const router = useRouter();

  if (!mentions.length) {
    return <Text style={[styles.text, style]}>{content}</Text>;
  }

  // Sort mentions by startIndex so we can render left-to-right
  const sorted = [...mentions].sort((a, b) => a.startIndex - b.startIndex);

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  sorted.forEach((mention, i) => {
    // Plain text before this mention
    if (mention.startIndex > lastIndex) {
      parts.push(
        <Text key={`text-${i}`} style={[styles.text, style]}>
          {content.slice(lastIndex, mention.startIndex)}
        </Text>
      );
    }

    // The mention itself — tappable
    parts.push(
      <Text
        key={`mention-${mention.id}`}
        style={styles.mention}
        onPress={() => router.push(`/entity/${mention.entityId}` as any)}
      >
        {content.slice(mention.startIndex, mention.endIndex)}
      </Text>
    );

    lastIndex = mention.endIndex;
  });

  // Remaining text after last mention
  if (lastIndex < content.length) {
    parts.push(
      <Text key="text-end" style={[styles.text, style]}>
        {content.slice(lastIndex)}
      </Text>
    );
  }

  return <Text style={[styles.text, style]}>{parts}</Text>;
}

const styles = StyleSheet.create({
  text: {
    fontSize: 16,
    color: "#E2E8F0",
    lineHeight: 26,
  },
  mention: {
    color: "#A78BFA",
    fontWeight: "700",
    // Slight background tint
    backgroundColor: "#A78BFA15",
    borderRadius: 4,
    paddingHorizontal: 2,
  },
});
