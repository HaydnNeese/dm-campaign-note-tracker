import { View, Text, StyleSheet } from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";

export default function AdventurersScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🛡️</Text>
      <Text style={styles.title}>Adventurers</Text>
      <Text style={styles.subtitle}>Coming soon! You'll be able to manage your campaign's player characters here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0F172A",
    paddingHorizontal: 32,
  },
  emoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  title: {
    color: "#F9FAFB",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    color: "#9CA3AF",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
});
