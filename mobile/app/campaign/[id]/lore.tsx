// ─── Entities list screen ───────────────────────────────────

import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { FontAwesome5 } from "@expo/vector-icons";
import { useAuthStore } from "@/stores/authStore";
import { useEntities, useDeleteEntity } from "@/hooks/useEntities";
import { API_BASE_URL } from "@/constants/Config";
import type { Entity, EntityType } from "@/types";

// Icon + color per entity type
const TYPE_META: Record<string, { icon: string; color: string; label: string }> = {
  NPC: { icon: "user-friends", color: "#F59E0B", label: "NPC" },
  LOCATION: { icon: "map-marker-alt", color: "#10B981", label: "Location" },
  ITEM: { icon: "gem", color: "#3B82F6", label: "Item" },
  QUEST: { icon: "exclamation-circle", color: "#EF4444", label: "Quest" },
  FACTION: { icon: "flag", color: "#8B5CF6", label: "Faction" },
  KEY_EVENT: { icon: "calendar-alt", color: "#EC4899", label: "Event" },
};

const FILTER_TABS: (EntityType | "ALL")[] = ["ALL", "NPC", "LOCATION", "ITEM", "QUEST", "FACTION", "KEY_EVENT"];

/** Convert a server-relative imageUrl to a full URL for display */
function toFullImageUrl(imageUrl: string | null): string | null {
  if (!imageUrl) return null;
  if (imageUrl.startsWith("http")) return imageUrl;
  return `${API_BASE_URL}${imageUrl}`;
}

export default function EntitiesScreen() {
  const router = useRouter();
  const activeCampaign = useAuthStore((s) => s.activeCampaign);
  const { data: entities, isLoading, refetch } = useEntities(activeCampaign?.id);
  const deleteMutation = useDeleteEntity(activeCampaign?.id || "");
  const [filter, setFilter] = useState<EntityType | "ALL">("ALL");

  if (!activeCampaign) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyEmoji}>🗺️</Text>
        <Text style={styles.emptyText}>No campaign selected</Text>
        <Text style={styles.emptySubtext}>
          Select a campaign from the Campaigns tab first
        </Text>
      </View>
    );
  }

  const filtered =
    filter === "ALL"
      ? entities
      : entities?.filter((e) => e.type === filter);

  const handleDelete = (id: string, name: string) => {
    Alert.alert("Delete Entity", `Delete "${name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteMutation.mutate(id),
      },
    ]);
  };

  const renderEntity = ({ item }: { item: Entity }) => {
    const meta = TYPE_META[item.type];
    const thumbUrl = toFullImageUrl(item.imageUrl);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/entity/${item.id}` as any)}
        onLongPress={() => handleDelete(item.id, item.name)}
      >
        {thumbUrl ? (
          <Image source={{ uri: thumbUrl }} style={styles.thumbnail} />
        ) : (
          <View style={[styles.typeIcon, { backgroundColor: meta.color + "20" }]}>
            <FontAwesome5 name={meta.icon} size={16} color={meta.color} />
          </View>
        )}
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <Text style={styles.cardType}>{meta.label}</Text>
          {item.summary ? (
            <Text style={styles.cardSummary} numberOfLines={1}>
              {item.summary}
            </Text>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {FILTER_TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.filterTab, filter === tab && styles.filterTabActive]}
            onPress={() => setFilter(tab)}
          >
            <Text
              style={[
                styles.filterText,
                filter === tab && styles.filterTextActive,
              ]}
            >
              {tab === "ALL" ? "ALL" : TYPE_META[tab].label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {!filtered?.length && !isLoading ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🐉</Text>
          <Text style={styles.emptyText}>No lore yet</Text>
          <Text style={styles.emptySubtext}>
            Tap + to add NPCs, locations, items, or quests
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderEntity}
          contentContainerStyle={styles.list}
          refreshing={isLoading}
          onRefresh={refetch}
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          const params = filter !== "ALL" ? `?type=${filter}` : "";
          router.push(`/entity/new${params}`);
        }}
      >
        <FontAwesome5 name="plus" size={20} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F172A" },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
  },
  filterTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#1E293B",
  },
  filterTabActive: {
    backgroundColor: "#7C3AED",
  },
  filterText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#9CA3AF",
  },
  filterTextActive: {
    color: "#FFFFFF",
  },
  list: { padding: 16, paddingTop: 4 },
  card: {
    flexDirection: "row",
    backgroundColor: "#1E293B",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#334155",
    alignItems: "center",
    gap: 12,
  },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  thumbnail: {
    width: 40,
    height: 40,
    borderRadius: 10,
  },
  cardBody: { flex: 1 },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#F9FAFB",
  },
  cardType: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  cardSummary: {
    fontSize: 13,
    color: "#9CA3AF",
    marginTop: 2,
  },
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0F172A",
    paddingHorizontal: 32,
  },
  emptyEmoji: { fontSize: 56, marginBottom: 12 },
  emptyText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#F9FAFB",
    marginBottom: 4,
  },
  emptySubtext: { fontSize: 15, color: "#9CA3AF", textAlign: "center" },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    backgroundColor: "#7C3AED",
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
});
