// ─── Process Session result display ─────────────────────────
// Renders AI analysis: summary, NPCs, suggested links, quest updates.

import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import type { ProcessSessionResult, EntityType, QuestUpdate } from "@/types";

const TYPE_META: Record<string, { icon: string; color: string; label: string }> = {
  NPC: { icon: "user-friends", color: "#F59E0B", label: "NPC" },
  LOCATION: { icon: "map-marker-alt", color: "#10B981", label: "Location" },
  ITEM: { icon: "gem", color: "#3B82F6", label: "Item" },
  QUEST: { icon: "exclamation-circle", color: "#EF4444", label: "Quest" },
  FACTION: { icon: "flag", color: "#8B5CF6", label: "Faction" },
  KEY_EVENT: { icon: "calendar-alt", color: "#EC4899", label: "Event" },
};

const STATUS_META: Record<string, { label: string; color: string; icon: string }> = {
  new_hook: { label: "New Hook", color: "#3B82F6", icon: "plus-circle" },
  progressed: { label: "Progressed", color: "#F59E0B", icon: "arrow-right" },
  completed: { label: "Completed", color: "#10B981", icon: "check-circle" },
  changed: { label: "Changed", color: "#A78BFA", icon: "exchange-alt" },
};

interface Props {
  result: ProcessSessionResult;
  onAddLink?: (entityId: string, text: string) => void;
  onCreateEntity?: (name: string, type: string) => void;
  existingMentionEntityIds?: string[];
  existingEntities?: { id: string; name: string }[];
  existingQuests?: { id: string; name: string }[];
  onCreateQuest?: (title: string, details: string) => void;
  onUpdateQuest?: (entityId: string, status: string, details: string) => void;
}

export default function ProcessResultView({
  result,
  onAddLink,
  onCreateEntity,
  existingMentionEntityIds = [],
  existingEntities = [],
  existingQuests = [],
  onCreateQuest,
  onUpdateQuest,
}: Props) {
  const router = useRouter();
  const [actedQuests, setActedQuests] = useState<Record<number, "created" | "updated">>({});
  const [actedLore, setActedLore] = useState<Record<number, boolean>>({});

  const handleLoreAction = (index: number, name: string, type: string) => {
    if (onCreateEntity) {
      onCreateEntity(name, type);
      setActedLore((prev) => ({ ...prev, [index]: true }));
    }
  };

  const handleQuestAction = (index: number, quest: QuestUpdate) => {
    const matchedQuest = existingQuests.find(
      (q) => q.name.toLowerCase() === quest.title.toLowerCase()
    );

    if (matchedQuest) {
      if (onUpdateQuest) {
        onUpdateQuest(matchedQuest.id, quest.status, quest.details);
        setActedQuests((prev) => ({ ...prev, [index]: "updated" }));
      }
    } else {
      if (onCreateQuest) {
        onCreateQuest(quest.title, quest.details);
        setActedQuests((prev) => ({ ...prev, [index]: "created" }));
      }
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.inner}>
      {/* Summary */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <FontAwesome5 name="book" size={14} color="#A78BFA" />
          <Text style={styles.sectionTitle}>Session Summary</Text>
        </View>
        <Text style={styles.summaryText}>{result.summary}</Text>
      </View>

      {/* Extracted Entities */}
      {result.extractedEntities.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FontAwesome5 name="dragon" size={14} color="#F59E0B" />
            <Text style={styles.sectionTitle}>Detected Lore</Text>
          </View>
          {result.extractedEntities.map((ent, i) => {
            const meta = ent.entityType
              ? TYPE_META[ent.entityType]
              : { icon: "question", color: "#6B7280" };
            const matchedEntity = existingEntities.find(
              (e) => e.name.toLowerCase() === ent.name.toLowerCase()
            );
            const actualEntityId = ent.matchedEntityId || matchedEntity?.id;

            const isAlreadyLinked =
              actualEntityId &&
              existingMentionEntityIds.includes(actualEntityId);

            return (
              <TouchableOpacity
                key={i}
                style={styles.itemCard}
                disabled={!actualEntityId}
                onPress={() =>
                  actualEntityId &&
                  router.push(`/entity/${actualEntityId}` as any)
                }
              >
                <View style={[styles.itemIcon, { backgroundColor: meta.color + "20" }]}>
                  <FontAwesome5 name={meta.icon} size={14} color={meta.color} />
                </View>
                <View style={styles.itemBody}>
                  <Text style={styles.itemName}>{ent.name}</Text>
                  <Text style={styles.itemSub}>
                    {meta.label}
                    {ent.isNewSuggestion ? " — New Suggestion" : " — Existing"}
                  </Text>
                </View>
                {actualEntityId && !isAlreadyLinked && onAddLink ? (
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={(e) => {
                      e.stopPropagation();
                      onAddLink(actualEntityId, ent.mentionText || ent.name);
                    }}
                  >
                    <FontAwesome5 name="link" size={12} color="#A78BFA" />
                    <Text style={styles.actionBtnText}>Link</Text>
                  </TouchableOpacity>
                ) : actualEntityId && isAlreadyLinked ? (
                  <View style={styles.linkedBadge}>
                    <FontAwesome5 name="check" size={10} color="#10B981" />
                    <Text style={styles.linkedBadgeText}>Linked</Text>
                  </View>
                ) : actedLore[i] ? (
                  <View style={styles.linkedBadge}>
                    <FontAwesome5 name="check" size={10} color="#10B981" />
                    <Text style={styles.linkedBadgeText}>Created</Text>
                  </View>
                ) : ent.isNewSuggestion && onCreateEntity ? (
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleLoreAction(i, ent.name, ent.entityType);
                    }}
                  >
                    <FontAwesome5 name="plus" size={12} color="#A78BFA" />
                    <Text style={styles.actionBtnText}>Create</Text>
                  </TouchableOpacity>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Quest Updates */}
      {result.questUpdates.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FontAwesome5 name="exclamation-circle" size={14} color="#EF4444" />
            <Text style={styles.sectionTitle}>Quest Updates</Text>
          </View>
          {result.questUpdates.map((quest, i) => {
            const meta = STATUS_META[quest.status] || STATUS_META.changed;
            const matchedQuest = existingQuests.find(
              (q) => q.name.toLowerCase() === quest.title.toLowerCase()
            );
            const actionState = actedQuests[i];

            return (
              <View key={i} style={styles.questCard}>
                <View style={styles.questHeader}>
                  <FontAwesome5 name={meta.icon} size={12} color={meta.color} />
                  <Text style={styles.questTitle}>{quest.title}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: meta.color + "20" }]}>
                    <Text style={[styles.statusText, { color: meta.color }]}>
                      {meta.label}
                    </Text>
                  </View>
                </View>
                <Text style={styles.questDetails}>{quest.details}</Text>
                
                {/* Action Button */}
                <View style={styles.questActionRow}>
                  {actionState === "created" ? (
                    <View style={styles.linkedBadge}>
                      <FontAwesome5 name="check" size={10} color="#10B981" />
                      <Text style={styles.linkedBadgeText}>Created</Text>
                    </View>
                  ) : actionState === "updated" ? (
                    <View style={styles.linkedBadge}>
                      <FontAwesome5 name="check" size={10} color="#10B981" />
                      <Text style={styles.linkedBadgeText}>Updated</Text>
                    </View>
                  ) : (
                    matchedQuest && onUpdateQuest ? (
                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => handleQuestAction(i, quest)}
                      >
                        <FontAwesome5 name="pen" size={12} color="#A78BFA" />
                        <Text style={styles.actionBtnText}>Update Quest</Text>
                      </TouchableOpacity>
                    ) : !matchedQuest && onCreateQuest ? (
                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => handleQuestAction(i, quest)}
                      >
                        <FontAwesome5 name="plus" size={12} color="#A78BFA" />
                        <Text style={styles.actionBtnText}>Create Quest</Text>
                      </TouchableOpacity>
                    ) : null
                  )}
                </View>
              </View>
            );
          })}
        </View>
      )}

      <Text style={styles.timestamp}>
        Processed {new Date(result.createdAt).toLocaleString()}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F172A" },
  inner: { padding: 16, paddingBottom: 32 },
  section: { marginBottom: 24 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#F9FAFB",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  summaryText: {
    fontSize: 16,
    color: "#E2E8F0",
    lineHeight: 26,
    backgroundColor: "#1E293B",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#334155",
  },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E293B",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#334155",
    gap: 12,
  },
  itemIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  itemBody: { flex: 1 },
  itemName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#F9FAFB",
  },
  itemBadge: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  badgeNew: { color: "#3B82F6" },
  badgeExisting: { color: "#10B981" },
  itemSub: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  questCard: {
    backgroundColor: "#1E293B",
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#334155",
  },
  questHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  questTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#F9FAFB",
  },
  statusBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },
  questDetails: {
    fontSize: 14,
    color: "#9CA3AF",
    lineHeight: 20,
    marginBottom: 8,
  },
  questActionRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 4,
  },
  timestamp: {
    fontSize: 12,
    color: "#4B5563",
    textAlign: "center",
    marginTop: 8,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#1E293B",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#7C3AED40",
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#A78BFA",
  },
  linkedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#10B98115",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#10B98140",
  },
  linkedBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#10B981",
  },
});
