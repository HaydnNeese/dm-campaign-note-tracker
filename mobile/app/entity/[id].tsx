// ─── Entity detail screen (with "Mentioned In" section) ─────

import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { FontAwesome5 } from "@expo/vector-icons";
import { useAuthStore } from "@/stores/authStore";
import { useEntityDetail, useDeleteEntity } from "@/hooks/useEntities";
import MentionText from "@/components/MentionText";
import { API_BASE_URL } from "@/constants/Config";
import type { EntityType } from "@/types";

/** Convert a server-relative imageUrl to a full URL for display */
function toFullImageUrl(imageUrl: string | null): string | null {
  if (!imageUrl) return null;
  if (imageUrl.startsWith("http")) return imageUrl;
  return `${API_BASE_URL}${imageUrl}`;
}

const TYPE_META: Record<string, { icon: string; color: string; label: string }> = {
  NPC: { icon: "user-friends", color: "#F59E0B", label: "NPC" },
  LOCATION: { icon: "map-marker-alt", color: "#10B981", label: "Location" },
  ITEM: { icon: "gem", color: "#3B82F6", label: "Item" },
  QUEST: { icon: "exclamation-circle", color: "#EF4444", label: "Quest" },
  FACTION: { icon: "flag", color: "#8B5CF6", label: "Faction" },
  KEY_EVENT: { icon: "calendar-alt", color: "#EC4899", label: "Event" },
};

export default function EntityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const activeCampaign = useAuthStore((s) => s.activeCampaign);
  const { data: entity, isLoading } = useEntityDetail(id);
  const deleteMutation = useDeleteEntity(activeCampaign?.id || "");

  const handleDelete = () => {
    Alert.alert("Delete Entity", `Delete "${entity?.name}"? This cannot be undone.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteMutation.mutateAsync(id!);
          router.back();
        },
      },
    ]);
  };

  if (isLoading || !entity) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  const meta = TYPE_META[entity.type];
  const fullImageUrl = toFullImageUrl(entity.imageUrl);

  // Convert entityMentions to MentionText format
  const mentionsForText = (entity.entityMentions || []).map((m) => ({
    id: m.id,
    noteId: "",
    entityId: m.targetEntityId,
    startIndex: m.startIndex,
    endIndex: m.endIndex,
    displayText: m.displayText,
    createdAt: m.createdAt,
  }));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.inner}>
      <Stack.Screen
        options={{
          title: entity.name,
          headerStyle: { backgroundColor: "#0F172A" },
          headerTintColor: "#F9FAFB",
          headerRight: () => (
            <View style={{ flexDirection: "row", gap: 16 }}>
              <TouchableOpacity
                onPress={() => router.push(`/entity/edit/${entity.id}` as any)}
              >
                <FontAwesome5 name="edit" size={18} color="#A78BFA" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete}>
                <FontAwesome5 name="trash" size={18} color="#F87171" />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      {/* Header: image + name/badge */}
      <View style={styles.headerRow}>
        {fullImageUrl ? (
          <Image source={{ uri: fullImageUrl }} style={styles.entityImage} />
        ) : null}
        <View style={styles.headerInfo}>
          <View style={[styles.typeBadge, { backgroundColor: meta.color + "20" }]}>
            <FontAwesome5 name={meta.icon} size={12} color={meta.color} />
            <Text style={[styles.typeBadgeText, { color: meta.color }]}>
              {meta.label}
            </Text>
          </View>
          <Text style={styles.name}>{entity.name}</Text>
        </View>
      </View>

      {/* Summary */}
      {entity.summary ? (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Summary</Text>
          <Text style={styles.sectionContent}>{entity.summary}</Text>
        </View>
      ) : null}

      {/* Details — with tappable @mentions */}
      {entity.content ? (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Details</Text>
          <View style={styles.contentBox}>
            <MentionText content={entity.content} mentions={mentionsForText} />
          </View>
        </View>
      ) : null}

      {/* ─── MENTIONED IN: NOTES ──────────────────────────── */}
      {entity.mentionedInNotes && entity.mentionedInNotes.length > 0 && (
        <View style={styles.mentionedSection}>
          <Text style={styles.mentionedLabel}>
            <FontAwesome5 name="scroll" size={12} color="#A78BFA" />
            {"  "}Mentioned in Notes
          </Text>
          {entity.mentionedInNotes.map((item) => (
            <TouchableOpacity
              key={item.noteId}
              style={styles.mentionedCard}
              onPress={() => router.push(`/note/${item.noteId}` as any)}
            >
              <FontAwesome5 name="scroll" size={14} color="#A78BFA" />
              <View style={styles.mentionedCardBody}>
                <Text style={styles.mentionedCardTitle}>{item.noteTitle}</Text>
                <Text style={styles.mentionedCardDate}>
                  {new Date(item.noteUpdatedAt).toLocaleDateString()}
                </Text>
              </View>
              <FontAwesome5 name="chevron-right" size={12} color="#4B5563" />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* ─── MENTIONED IN: ENTITIES ───────────────────────── */}
      {entity.mentionedInEntities && entity.mentionedInEntities.length > 0 && (
        <View style={styles.mentionedSection}>
          <Text style={styles.mentionedLabel}>
            <FontAwesome5 name="link" size={12} color="#A78BFA" />
            {"  "}Mentioned in Entities
          </Text>
          {entity.mentionedInEntities.map((item) => {
            const itemMeta = TYPE_META[item.entityType];
            return (
              <TouchableOpacity
                key={item.entityId}
                style={styles.mentionedCard}
                onPress={() => router.push(`/entity/${item.entityId}` as any)}
              >
                <View
                  style={[
                    styles.mentionedIcon,
                    { backgroundColor: itemMeta.color + "20" },
                  ]}
                >
                  <FontAwesome5
                    name={itemMeta.icon}
                    size={12}
                    color={itemMeta.color}
                  />
                </View>
                <View style={styles.mentionedCardBody}>
                  <Text style={styles.mentionedCardTitle}>{item.entityName}</Text>
                  <Text style={styles.mentionedCardType}>{item.entityType}</Text>
                </View>
                <FontAwesome5 name="chevron-right" size={12} color="#4B5563" />
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Entities this entity links TO */}
      {entity.entityMentions && entity.entityMentions.length > 0 && (
        <View style={styles.mentionedSection}>
          <Text style={styles.mentionedLabel}>
            <FontAwesome5 name="at" size={12} color="#6B7280" />
            {"  "}Links To
          </Text>
          {entity.entityMentions.map((m) => (
            <TouchableOpacity
              key={m.id}
              style={styles.mentionChip}
              onPress={() => router.push(`/entity/${m.targetEntityId}` as any)}
            >
              <FontAwesome5 name="at" size={12} color="#A78BFA" />
              <Text style={styles.mentionChipText}>{m.displayText}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Meta */}
      <View style={styles.metaSection}>
        <Text style={styles.metaText}>
          Created {new Date(entity.createdAt).toLocaleDateString()}
        </Text>
        <Text style={styles.metaText}>
          Updated {new Date(entity.updatedAt).toLocaleDateString()}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F172A" },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0F172A",
  },
  inner: { padding: 20, paddingBottom: 40 },
  // Header with image + name
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
    marginBottom: 24,
  },
  entityImage: {
    width: 120,
    height: 120,
    borderRadius: 16,
  },
  headerInfo: {
    flex: 1,
    gap: 6,
    paddingTop: 2,
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  name: {
    fontSize: 24,
    fontWeight: "800",
    color: "#F9FAFB",
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  sectionContent: {
    fontSize: 16,
    color: "#E2E8F0",
    lineHeight: 26,
    backgroundColor: "#1E293B",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#334155",
  },
  contentBox: {
    backgroundColor: "#1E293B",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#334155",
  },
  // ─── Mentioned In sections ────────────────────────
  mentionedSection: {
    marginBottom: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#334155",
  },
  mentionedLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#A78BFA",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
  },
  mentionedCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E293B",
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#334155",
    gap: 12,
  },
  mentionedIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  mentionedCardBody: {
    flex: 1,
  },
  mentionedCardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#F9FAFB",
  },
  mentionedCardDate: {
    fontSize: 12,
    color: "#6B7280",
  },
  mentionedCardType: {
    fontSize: 11,
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  mentionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#1E293B",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 6,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#334155",
  },
  mentionChipText: {
    fontSize: 14,
    color: "#A78BFA",
    fontWeight: "600",
  },
  metaSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#334155",
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: "#4B5563",
  },
});
