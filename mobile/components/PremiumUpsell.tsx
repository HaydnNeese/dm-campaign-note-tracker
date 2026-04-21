// ─── Premium upsell modal ───────────────────────────────────
// Shows when a non-premium user tries to access AI features.

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function PremiumUpsell({ visible, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <FontAwesome5 name="crown" size={32} color="#F59E0B" />
          </View>
          <Text style={styles.title}>Premium Feature</Text>
          <Text style={styles.desc}>
            AI session processing and recap generation require a premium
            subscription.
          </Text>

          <View style={styles.features}>
            <FeatureRow icon="brain" text="AI Session Analysis" />
            <FeatureRow icon="scroll" text="Player Recap Generation" />
            <FeatureRow icon="magic" text="Smart NPC Extraction" />
            <FeatureRow icon="link" text="Auto Link Suggestions" />
          </View>

          <TouchableOpacity style={styles.upgradeBtn}>
            <FontAwesome5 name="crown" size={14} color="#0F172A" />
            <Text style={styles.upgradeBtnText}>Upgrade to Premium</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>Maybe Later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function FeatureRow({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.featureRow}>
      <FontAwesome5 name={icon} size={14} color="#A78BFA" />
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    backgroundColor: "#1E293B",
    borderRadius: 20,
    padding: 28,
    width: "100%",
    maxWidth: 380,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F59E0B30",
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#F59E0B15",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#F9FAFB",
    marginBottom: 8,
  },
  desc: {
    fontSize: 15,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 20,
  },
  features: {
    alignSelf: "stretch",
    gap: 10,
    marginBottom: 24,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 8,
  },
  featureText: {
    fontSize: 15,
    color: "#E2E8F0",
    fontWeight: "500",
  },
  upgradeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#F59E0B",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignSelf: "stretch",
    marginBottom: 12,
  },
  upgradeBtnText: {
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "700",
  },
  closeBtn: {
    padding: 8,
  },
  closeBtnText: {
    color: "#6B7280",
    fontSize: 15,
  },
});
