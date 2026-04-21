// ─── Settings screen ────────────────────────────────────────

import { View, Text, TouchableOpacity, StyleSheet, Alert, Platform } from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import { useAuthStore } from "@/stores/authStore";

export default function SettingsScreen() {
  const { user, activeCampaign, logout } = useAuthStore();

  const handleLogout = () => {
    if (Platform.OS === "web") {
      // Alert.alert buttons don't work on web
      if (window.confirm("Are you sure you want to sign out?")) {
        logout();
      }
    } else {
      Alert.alert("Logout", "Are you sure you want to sign out?", [
        { text: "Cancel", style: "cancel" },
        { text: "Sign Out", style: "destructive", onPress: logout },
      ]);
    }
  };

  return (
    <View style={styles.container}>
      {/* User info */}
      <View style={styles.section}>
        <View style={styles.avatar}>
          <FontAwesome5 name="user-shield" size={28} color="#A78BFA" />
        </View>
        <Text style={styles.email}>{user?.email}</Text>
        <Text style={styles.meta}>
          Member since {user ? new Date(user.createdAt).toLocaleDateString() : ""}
        </Text>
      </View>

      {/* Active campaign */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Active Campaign</Text>
        <Text style={styles.cardValue}>
          {activeCampaign?.name || "None selected"}
        </Text>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <FontAwesome5 name="sign-out-alt" size={16} color="#F87171" />
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
    padding: 24,
  },
  section: {
    alignItems: "center",
    marginBottom: 32,
    marginTop: 20,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#1E293B",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "#7C3AED",
  },
  email: {
    fontSize: 18,
    fontWeight: "700",
    color: "#F9FAFB",
    marginBottom: 4,
  },
  meta: {
    fontSize: 13,
    color: "#6B7280",
  },
  card: {
    backgroundColor: "#1E293B",
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#334155",
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 17,
    fontWeight: "700",
    color: "#F9FAFB",
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#1E293B",
    borderWidth: 1,
    borderColor: "#F8717130",
    marginTop: 16,
  },
  logoutText: {
    color: "#F87171",
    fontSize: 16,
    fontWeight: "600",
  },
});
