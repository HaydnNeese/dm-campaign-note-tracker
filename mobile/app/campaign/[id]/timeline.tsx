// ─── Campaign Timeline screen ──────────────────────────────
// Chronological feed of session history, major events, and NPC appearances.

import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { FontAwesome5 } from "@expo/vector-icons";
import { useTimeline } from "@/hooks/useTimeline";
import type { CampaignTimelineItem, TimelineLoreMention } from "@/types";

// Icon + color per entity type
const TYPE_META: Record<string, { icon: string; color: string }> = {
  NPC: { icon: "user-friends", color: "#F59E0B" },
  LOCATION: { icon: "map-marker-alt", color: "#10B981" },
  ITEM: { icon: "gem", color: "#3B82F6" },
  QUEST: { icon: "exclamation-circle", color: "#EF4444" },
  FACTION: { icon: "flag", color: "#8B5CF6" },
  KEY_EVENT: { icon: "calendar-alt", color: "#EC4899" },
};

// ─── Helpers ────────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function relativeDate(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60_000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
}

function LoreChip({
  mention,
  onPress,
}: {
  mention: TimelineLoreMention;
  onPress: () => void;
}) {
  const meta = TYPE_META[mention.type] || { icon: "link", color: "#A78BFA" };
  return (
    <TouchableOpacity
      style={[styles.loreChip, { backgroundColor: meta.color + "15", borderColor: meta.color + "40" }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <FontAwesome5 name={meta.icon} size={10} color={meta.color} />
      <Text style={[styles.loreChipText, { color: meta.color }]}>{mention.name}</Text>
    </TouchableOpacity>
  );
}

// ─── Timeline Card ──────────────────────────────────────────

function TimelineCard({
  item,
  onPressNote,
  onPressMention,
}: {
  item: CampaignTimelineItem;
  onPressNote: (noteId: string) => void;
  onPressMention: (entityId: string) => void;
}) {
  return (
    <View style={styles.cardRow}>
      {/* Timeline rail */}
      <View style={styles.rail}>
        <View style={styles.dot} />
        <View style={styles.line} />
      </View>

      {/* Card body */}
      <TouchableOpacity
        style={styles.card}
        onPress={() => onPressNote(item.noteId)}
        activeOpacity={0.7}
      >
        {/* Header */}
        <View style={styles.cardHeader}>
          <FontAwesome5 name="scroll" size={13} color="#A78BFA" />
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.noteTitle}
          </Text>
        </View>

        {/* Date row */}
        <View style={styles.dateRow}>
          <Text style={styles.relativeDate}>{relativeDate(item.createdAt)}</Text>
          <Text style={styles.exactDate}>{formatDate(item.createdAt)}</Text>
        </View>

        {/* Summary */}
        {item.summary ? (
          <Text style={styles.summary} numberOfLines={3}>
            {item.summary}
          </Text>
        ) : null}

        {/* Major Events */}
        {item.majorEvents.length > 0 && (
          <View style={styles.eventsSection}>
            <View style={styles.sectionHeader}>
              <FontAwesome5 name="bolt" size={11} color="#FBBF24" />
              <Text style={styles.sectionLabel}>Key Events</Text>
            </View>
            {item.majorEvents.map((event, i) => (
              <View key={i} style={styles.eventRow}>
                <Text style={styles.eventBullet}>•</Text>
                <Text style={styles.eventText} numberOfLines={2}>
                  {event}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Lore Mentions */}
        {item.loreMentions.length > 0 ? (
          <View style={styles.loreSection}>
            <View style={styles.sectionHeader}>
              <FontAwesome5 name="link" size={11} color="#A78BFA" />
              <Text style={styles.sectionLabel}>
                Lore Mentions ({item.loreMentions.length})
              </Text>
            </View>
            <View style={styles.loreList}>
              {item.loreMentions.map((mention) => (
                <LoreChip
                  key={mention.entityId}
                  mention={mention}
                  onPress={() => onPressMention(mention.entityId)}
                />
              ))}
            </View>
          </View>
        ) : (
          <View style={styles.noLoreRow}>
            <FontAwesome5 name="link" size={10} color="#4B5563" />
            <Text style={styles.noLoreText}>No lore mentioned</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

// ─── Main Screen ────────────────────────────────────────────

export default function TimelineScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const router = useRouter();
  const { data: timeline, isLoading, refetch } = useTimeline(id);

  const handlePressNote = (noteId: string) => {
    router.push(`/note/${noteId}` as any);
  };

  const handlePressMention = (entityId: string) => {
    router.push(`/entity/${entityId}` as any);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#A78BFA" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!timeline?.length ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>⏳</Text>
          <Text style={styles.emptyText}>No sessions yet</Text>
          <Text style={styles.emptySubtext}>
            Create notes in this campaign to build your timeline
          </Text>
        </View>
      ) : (
        <FlatList
          data={timeline}
          keyExtractor={(item) => item.noteId}
          renderItem={({ item }) => (
            <TimelineCard
              item={item}
              onPressNote={handlePressNote}
              onPressMention={handlePressMention}
            />
          )}
          contentContainerStyle={styles.list}
          refreshing={isLoading}
          onRefresh={refetch}
          ListHeaderComponent={
            <View style={styles.headerBanner}>
              <FontAwesome5 name="hourglass-half" size={16} color="#A78BFA" />
              <Text style={styles.headerBannerText}>
                {timeline.length} session{timeline.length !== 1 ? "s" : ""}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F172A" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0F172A",
  },
  list: { padding: 16, paddingBottom: 32 },

  // ── Header banner
  headerBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1E293B",
  },
  headerBannerText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#9CA3AF",
  },

  // ── Timeline rail + card row
  cardRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  rail: {
    width: 28,
    alignItems: "center",
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#7C3AED",
    borderWidth: 2,
    borderColor: "#A78BFA",
    marginTop: 18,
    zIndex: 1,
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: "#334155",
    marginTop: -1,
  },

  // ── Card
  card: {
    flex: 1,
    backgroundColor: "#1E293B",
    borderRadius: 14,
    padding: 16,
    marginBottom: 8,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: "#334155",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#F9FAFB",
    flex: 1,
  },

  // ── Dates
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  relativeDate: {
    fontSize: 12,
    fontWeight: "600",
    color: "#A78BFA",
  },
  exactDate: {
    fontSize: 12,
    color: "#4B5563",
  },

  // ── Summary
  summary: {
    fontSize: 14,
    color: "#9CA3AF",
    lineHeight: 20,
    marginBottom: 12,
  },

  // ── Events section
  eventsSection: {
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  eventRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    marginLeft: 4,
    marginBottom: 3,
  },
  eventBullet: {
    fontSize: 14,
    color: "#FBBF24",
    lineHeight: 20,
  },
  eventText: {
    fontSize: 13,
    color: "#D1D5DB",
    lineHeight: 20,
    flex: 1,
  },

  // ── Lore section
  loreSection: {
    marginTop: 2,
  },
  loreList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 2,
  },
  loreChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  loreChipText: {
    fontSize: 12,
    fontWeight: "600",
  },

  // ── No Lore row
  noLoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  noLoreText: {
    fontSize: 12,
    color: "#4B5563",
    fontStyle: "italic",
  },

  // ── Empty state
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyEmoji: { fontSize: 56, marginBottom: 12 },
  emptyText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#F9FAFB",
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 15,
    color: "#9CA3AF",
    textAlign: "center",
  },
});
