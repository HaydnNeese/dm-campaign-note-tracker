// ─── New note screen (with @mention support) ───────────────

import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter, Stack } from "expo-router";
import { useAuthStore } from "@/stores/authStore";
import { useCreateNote } from "@/hooks/useNotes";
import { useEntities } from "@/hooks/useEntities";
import MentionInput from "@/components/MentionInput";
import type { MentionInput as MentionData } from "@/types";

export default function NewNoteScreen() {
  const router = useRouter();
  const activeCampaign = useAuthStore((s) => s.activeCampaign);
  const createMutation = useCreateNote(activeCampaign?.id || "");
  const { data: entities } = useEntities(activeCampaign?.id);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mentions, setMentions] = useState<MentionData[]>([]);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert("Error", "Title is required");
      return;
    }
    if (!activeCampaign) {
      Alert.alert("Error", "No campaign selected");
      return;
    }
    try {
      await createMutation.mutateAsync({
        title: title.trim(),
        content,
        mentions,
      });
      router.back();
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <Stack.Screen
        options={{
          headerShown: true,
          title: "New Note",
          headerStyle: { backgroundColor: "#0F172A" },
          headerTintColor: "#F9FAFB",
        }}
      />
      <ScrollView
        contentContainerStyle={styles.inner}
        keyboardShouldPersistTaps="always"
      >
        <TextInput
          style={styles.titleInput}
          placeholder="Note title..."
          placeholderTextColor="#6B7280"
          value={title}
          onChangeText={setTitle}
          autoFocus
        />

        {/* Hint */}
        <Text style={styles.hint}>Type @ to mention an entity</Text>

        {/* Smart mention input */}
        <MentionInput
          value={content}
          onChangeText={setContent}
          entities={entities || []}
          mentions={mentions}
          onMentionsChange={setMentions}
          placeholder="Write your session notes here..."
        />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveBtn, createMutation.isPending && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={createMutation.isPending}
        >
          <Text style={styles.saveText}>
            {createMutation.isPending ? "Saving..." : "Save Note"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F172A" },
  inner: { padding: 20, flexGrow: 1 },
  titleInput: {
    fontSize: 24,
    fontWeight: "800",
    color: "#F9FAFB",
    marginBottom: 8,
    padding: 0,
  },
  hint: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 12,
    fontStyle: "italic",
  },
  footer: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#334155",
    backgroundColor: "#1E293B",
  },
  cancelBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#334155",
    alignItems: "center",
  },
  cancelText: { color: "#9CA3AF", fontWeight: "600", fontSize: 16 },
  saveBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#7C3AED",
    alignItems: "center",
  },
  saveText: { color: "#FFFFFF", fontWeight: "700", fontSize: 16 },
});
