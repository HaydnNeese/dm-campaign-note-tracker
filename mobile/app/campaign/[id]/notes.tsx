// ─── Notes list screen ──────────────────────────────────────

import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { FontAwesome5 } from "@expo/vector-icons";
import { useAuthStore } from "@/stores/authStore";
import { useNotes, useDeleteNote } from "@/hooks/useNotes";
import type { Note, EntityType } from "@/types";

// Icon + color per entity type
const TYPE_META: Record<string, { icon: string; color: string }> = {
  NPC: { icon: "user-friends", color: "#F59E0B" },
  LOCATION: { icon: "map-marker-alt", color: "#10B981" },
  ITEM: { icon: "gem", color: "#3B82F6" },
  QUEST: { icon: "exclamation-circle", color: "#EF4444" },
  FACTION: { icon: "flag", color: "#8B5CF6" },
  KEY_EVENT: { icon: "calendar-alt", color: "#EC4899" },
};
export default function NotesScreen() {
  const router = useRouter();
  const activeCampaign = useAuthStore((s) => s.activeCampaign);
  const { data: notes, isLoading, refetch } = useNotes(activeCampaign?.id);
  const deleteMutation = useDeleteNote(activeCampaign?.id || "");

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

  const handleDelete = (id: string, title: string) => {
    Alert.alert("Delete Note", `Delete "${title}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteMutation.mutate(id),
      },
    ]);
  };

  const renderNote = ({ item }: { item: Note }) => {
    // Unique entities mentioned in the note
    const uniqueEntities = new Map<string, { id: string; name: string; type: any }>();
    item.mentions.forEach((m) => {
      if (m.entity) {
        uniqueEntities.set(m.entity.id, m.entity);
      }
    });
    const entityList = Array.from(uniqueEntities.values());

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/note/${item.id}` as any)}
        onLongPress={() => handleDelete(item.id, item.title)}
      >
        <View style={styles.cardHeader}>
          <FontAwesome5 name="scroll" size={14} color="#A78BFA" />
          <Text style={styles.cardTitle}>{item.title}</Text>
        </View>
        <Text style={styles.cardContent} numberOfLines={2}>
          {item.content || "No content"}
        </Text>

        {entityList.length > 0 && (
          <View style={styles.mentionsContainer}>
            {entityList.map((ent) => {
              const meta = TYPE_META[ent.type as any] || { icon: "circle", color: "#6B7280" };
              return (
                <View key={ent.id} style={[styles.mentionPill, { borderColor: meta.color + "40", backgroundColor: meta.color + "10" }]}>
                  <FontAwesome5 name={meta.icon as any} size={10} color={meta.color} />
                  <Text style={[styles.mentionName, { color: meta.color }]}>{ent.name}</Text>
                </View>
              );
            })}
          </View>
        )}

        <View style={styles.footerRow}>
          <Text style={styles.date}>
            {new Date(item.updatedAt).toLocaleDateString()}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {!notes?.length && !isLoading ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📝</Text>
          <Text style={styles.emptyText}>No notes yet</Text>
          <Text style={styles.emptySubtext}>
            Tap + to create your first session note
          </Text>
        </View>
      ) : (
        <FlatList
          data={notes}
          keyExtractor={(item) => item.id}
          renderItem={renderNote}
          contentContainerStyle={styles.list}
          refreshing={isLoading}
          onRefresh={refetch}
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/note/new")}
      >
        <FontAwesome5 name="plus" size={20} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F172A" },
  list: { padding: 16 },
  card: {
    backgroundColor: "#1E293B",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#334155",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#F9FAFB",
    flex: 1,
  },
  cardContent: {
    fontSize: 14,
    color: "#9CA3AF",
    marginBottom: 8,
  },
  mentionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 8,
  },
  mentionPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  mentionName: {
    fontSize: 11,
    fontWeight: "600",
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  date: {
    fontSize: 12,
    color: "#4B5563",
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
