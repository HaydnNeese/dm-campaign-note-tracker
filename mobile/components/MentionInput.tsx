// ─── MentionInput ───────────────────────────────────────────
// Smart text input that detects "@" and shows an entity dropdown.
// On entity selection, inserts "@EntityName" and tracks mention data.

import { useState, useRef, useCallback } from "react";
import {
  View,
  TextInput,
  FlatList,
  TouchableOpacity,
  Text,
  StyleSheet,
  type NativeSyntheticEvent,
  type TextInputSelectionChangeEventData,
  type TextInputKeyPressEventData,
} from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import type { Entity, EntityType, MentionInput as MentionData } from "@/types";

const TYPE_META: Record<string, { icon: string; color: string }> = {
  NPC: { icon: "user-friends", color: "#F59E0B" },
  LOCATION: { icon: "map-marker-alt", color: "#10B981" },
  ITEM: { icon: "gem", color: "#3B82F6" },
  QUEST: { icon: "exclamation-circle", color: "#EF4444" },
  FACTION: { icon: "flag", color: "#8B5CF6" },
  KEY_EVENT: { icon: "calendar-alt", color: "#EC4899" },
};

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  entities: Entity[];
  mentions: MentionData[];
  onMentionsChange: (mentions: MentionData[]) => void;
  placeholder?: string;
  style?: any;
}

export default function MentionInputComponent({
  value,
  onChangeText,
  entities,
  mentions,
  onMentionsChange,
  placeholder,
  style,
}: Props) {
  const inputRef = useRef<TextInput>(null);

  // Track cursor position
  const [cursorPos, setCursorPos] = useState(0);

  // Active @mention query state
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionStart, setMentionStart] = useState(-1); // index of '@' character

  const handleSelectionChange = useCallback(
    (e: NativeSyntheticEvent<TextInputSelectionChangeEventData>) => {
      const pos = e.nativeEvent.selection.start;
      setCursorPos(pos);
    },
    []
  );

  const handleTextChange = useCallback(
    (newText: string) => {
      onChangeText(newText);

      // Adjust existing mentions when text changes before them
      const lengthDiff = newText.length - value.length;
      if (lengthDiff !== 0 && mentions.length > 0) {
        // Find where the edit happened (approximate: use cursor position)
        const editPos = cursorPos;
        const adjusted = mentions
          .map((m) => {
            // If edit is before this mention, shift it
            if (editPos <= m.startIndex) {
              return {
                ...m,
                startIndex: m.startIndex + lengthDiff,
                endIndex: m.endIndex + lengthDiff,
              };
            }
            // If edit is inside this mention, remove it (mention was modified)
            if (editPos > m.startIndex && editPos <= m.endIndex) {
              return null;
            }
            return m;
          })
          .filter(Boolean) as MentionData[];
        onMentionsChange(adjusted);
      }

      // Detect @mention trigger
      // Look backwards from cursor to find an unmatched '@'
      const textBeforeCursor = newText.slice(0, cursorPos + lengthDiff);
      const lastAt = textBeforeCursor.lastIndexOf("@");

      if (lastAt >= 0) {
        // Check there's no space between @ and cursor (simple heuristic)
        const queryText = textBeforeCursor.slice(lastAt + 1);
        // Allow spaces in entity names but stop at newlines
        if (!queryText.includes("\n") && queryText.length <= 50) {
          // Check this @ isn't part of an already-completed mention
          const isExistingMention = mentions.some(
            (m) => m.startIndex === lastAt
          );
          if (!isExistingMention) {
            setMentionQuery(queryText);
            setMentionStart(lastAt);
            return;
          }
        }
      }

      setMentionQuery(null);
      setMentionStart(-1);
    },
    [value, cursorPos, mentions, onChangeText, onMentionsChange]
  );

  const handleSelectEntity = useCallback(
    (entity: Entity) => {
      const displayText = entity.name;
      const mentionStr = `@${displayText}`;

      // Replace @query with @EntityName
      const before = value.slice(0, mentionStart);
      const after = value.slice(mentionStart + 1 + (mentionQuery?.length || 0));
      const newText = `${before}${mentionStr} ${after}`;

      // Create mention data
      const newMention: MentionData = {
        entityId: entity.id,
        startIndex: mentionStart,
        endIndex: mentionStart + mentionStr.length,
        displayText,
      };

      onChangeText(newText);
      onMentionsChange([...mentions, newMention]);

      // Clear dropdown
      setMentionQuery(null);
      setMentionStart(-1);
    },
    [value, mentionStart, mentionQuery, mentions, onChangeText, onMentionsChange]
  );

  // Filter entities by query
  const filteredEntities =
    mentionQuery !== null
      ? entities.filter((e) =>
          e.name.toLowerCase().includes((mentionQuery || "").toLowerCase())
        )
      : [];

  const showDropdown = mentionQuery !== null && filteredEntities.length > 0;

  return (
    <View style={styles.wrapper}>
      <TextInput
        ref={inputRef}
        style={[styles.input, style]}
        value={value}
        onChangeText={handleTextChange}
        onSelectionChange={handleSelectionChange}
        placeholder={placeholder}
        placeholderTextColor="#4B5563"
        multiline
        textAlignVertical="top"
      />

      {/* Entity dropdown */}
      {showDropdown && (
        <View style={styles.dropdown}>
          <View style={styles.dropdownHeader}>
            <FontAwesome5 name="at" size={12} color="#A78BFA" />
            <Text style={styles.dropdownTitle}>Mention an entity</Text>
          </View>
          <FlatList
            data={filteredEntities}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="always"
            style={styles.dropdownList}
            renderItem={({ item }) => {
              const meta = TYPE_META[item.type];
              return (
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => handleSelectEntity(item)}
                >
                  <View
                    style={[
                      styles.dropdownIcon,
                      { backgroundColor: meta.color + "20" },
                    ]}
                  >
                    <FontAwesome5
                      name={meta.icon}
                      size={12}
                      color={meta.color}
                    />
                  </View>
                  <View style={styles.dropdownText}>
                    <Text style={styles.dropdownName}>{item.name}</Text>
                    <Text style={styles.dropdownType}>{item.type}</Text>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "relative",
    flex: 1,
  },
  input: {
    fontSize: 16,
    color: "#E2E8F0",
    lineHeight: 24,
    flex: 1,
    minHeight: 300,
    padding: 0,
  },
  dropdown: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: 220,
    backgroundColor: "#1E293B",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#7C3AED",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    overflow: "hidden",
  },
  dropdownHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
  },
  dropdownTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#A78BFA",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  dropdownList: {
    maxHeight: 180,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: "#334155",
  },
  dropdownIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  dropdownText: {
    flex: 1,
  },
  dropdownName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#F9FAFB",
  },
  dropdownType: {
    fontSize: 11,
    color: "#6B7280",
    textTransform: "uppercase",
  },
});
