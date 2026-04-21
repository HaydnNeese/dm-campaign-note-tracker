// ─── Recap display component ────────────────────────────────
// Shows AI-generated player recap with copy/share actions.

import { View, Text, TouchableOpacity, StyleSheet, Share, Platform } from "react-native";
import * as Clipboard from "expo-clipboard";
import { FontAwesome5 } from "@expo/vector-icons";
import type { RecapResult } from "@/types";
import { useState } from "react";

interface Props {
  recap: RecapResult;
}

export default function RecapView({ recap }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (Platform.OS === "web") {
      await navigator.clipboard.writeText(recap.content);
    } else {
      await Clipboard.setStringAsync(recap.content);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    try {
      if (Platform.OS === "web") {
        if (navigator.share) {
          await navigator.share({ text: recap.content });
        } else {
          handleCopy(); // Fallback to copy on web
        }
      } else {
        await Share.share({ message: recap.content });
      }
    } catch {
      // User cancelled share
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <FontAwesome5 name="scroll" size={16} color="#A78BFA" />
        <Text style={styles.title}>Player Recap</Text>
      </View>

      <Text style={styles.content}>{recap.content}</Text>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={handleCopy}>
          <FontAwesome5
            name={copied ? "check" : "copy"}
            size={14}
            color={copied ? "#10B981" : "#A78BFA"}
          />
          <Text
            style={[
              styles.actionText,
              copied && { color: "#10B981" },
            ]}
          >
            {copied ? "Copied!" : "Copy"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
          <FontAwesome5 name="share-alt" size={14} color="#A78BFA" />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.timestamp}>
        Generated {new Date(recap.createdAt).toLocaleString()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#1E293B",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#334155",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: "#A78BFA",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  content: {
    fontSize: 16,
    color: "#E2E8F0",
    lineHeight: 26,
    marginBottom: 16,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 8,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#0F172A",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#334155",
  },
  actionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#A78BFA",
  },
  timestamp: {
    fontSize: 12,
    color: "#4B5563",
  },
});
