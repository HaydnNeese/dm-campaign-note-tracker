import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useCampaigns } from "@/hooks/useCampaigns";
import { useAuthStore } from "@/stores/authStore";
import { FontAwesome5 } from "@expo/vector-icons";

export default function CampaignsScreen() {
  const { data: campaigns, isLoading } = useCampaigns();
  const setActiveCampaign = useAuthStore((s) => s.setActiveCampaign);
  const router = useRouter();

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#A78BFA" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={campaigns}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyEmoji}>🗺️</Text>
            <Text style={styles.emptyText}>No Campaigns Found</Text>
            <Text style={styles.emptySubtext}>Create a new campaign to get started.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => {
              setActiveCampaign(item);
              router.push(`/campaign/${item.id}/notes`);
            }}
          >
            <View style={styles.cardHeader}>
              <FontAwesome5 name="book" size={16} color="#A78BFA" />
              <Text style={styles.title}>{item.name}</Text>
            </View>
            {item.description && <Text style={styles.desc}>{item.description}</Text>}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F172A" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0F172A", paddingVertical: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: "#F9FAFB", fontSize: 18, fontWeight: "700", marginBottom: 4 },
  emptySubtext: { color: "#9CA3AF", fontSize: 14 },
  card: {
    backgroundColor: "#1E293B",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#334155"
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    gap: 8,
  },
  title: { color: "#F9FAFB", fontSize: 18, fontWeight: "bold" },
  desc: { color: "#9CA3AF", fontSize: 14 }
});
