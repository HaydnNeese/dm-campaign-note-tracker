// ─── New entity screen ──────────────────────────────────────

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
import { useRouter, useLocalSearchParams } from "expo-router";
import { FontAwesome5 } from "@expo/vector-icons";
import { useAuthStore } from "@/stores/authStore";
import { useCreateEntity } from "@/hooks/useEntities";
import { useNotes, useUpdateNote } from "@/hooks/useNotes";
import { uploadImage } from "@/services/uploads";
import EntityImagePicker from "@/components/EntityImagePicker";
import { API_BASE_URL } from "@/constants/Config";
import type { EntityType } from "@/types";

const ENTITY_TYPES: { value: EntityType; label: string; icon: string; color: string }[] = [
  { value: "NPC", label: "NPC", icon: "user-friends", color: "#F59E0B" },
  { value: "LOCATION", label: "Location", icon: "map-marker-alt", color: "#10B981" },
  { value: "ITEM", label: "Item", icon: "gem", color: "#3B82F6" },
  { value: "QUEST", label: "Quest", icon: "exclamation-circle", color: "#EF4444" },
];

export default function NewEntityScreen() {
  const router = useRouter();
  const { name: initialName, type: initialType, sourceNoteId, sourceText } = useLocalSearchParams<{name?: string, type?: string, sourceNoteId?: string, sourceText?: string}>();

  const activeCampaign = useAuthStore((s) => s.activeCampaign);
  const createMutation = useCreateEntity(activeCampaign?.id || "");
  
  const { data: notes } = useNotes(activeCampaign?.id || "");
  const updateNoteMutation = useUpdateNote(activeCampaign?.id || "");

  const [name, setName] = useState(initialName || "");
  const [type, setType] = useState<EntityType>((initialType as EntityType) || "NPC");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Name is required");
      return;
    }
    if (!activeCampaign) {
      Alert.alert("Error", "No campaign selected");
      return;
    }
    setSaving(true);
    try {
      // Upload image first if one was picked
      let imageUrl: string | null = null;
      if (imageUri) {
        imageUrl = await uploadImage(imageUri);
      }

      const newEntity = await createMutation.mutateAsync({
        name: name.trim(),
        type,
        summary: summary.trim(),
        content,
        imageUrl,
      });

      // Automatically link to note if created from AI suggestion
      if (sourceNoteId && sourceText && notes) {
        const note = notes.find(n => n.id === sourceNoteId);
        if (note) {
          const lowerContent = note.content.toLowerCase();
          const lowerText = sourceText.toLowerCase();
          const startIndex = lowerContent.indexOf(lowerText);
          
          if (startIndex !== -1) {
            const endIndex = startIndex + sourceText.length;
            const isOverlapping = note.mentions.some(
              (m) => startIndex < m.endIndex && endIndex > m.startIndex
            );
            
            if (!isOverlapping) {
              const newMention = {
                entityId: newEntity.id,
                startIndex,
                endIndex,
                displayText: note.content.substring(startIndex, endIndex),
              };
              await updateNoteMutation.mutateAsync({
                id: sourceNoteId,
                data: {
                  title: note.title,
                  content: note.content,
                  mentions: [...note.mentions, newMention]
                }
              });
            }
          }
        }
      }

      router.back();
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.inner}>
        {/* Image + Type row */}
        <View style={styles.topRow}>
          <EntityImagePicker imageUri={imageUri} onImageChange={setImageUri} />
          <View style={styles.topRowRight}>
            <Text style={styles.label}>Type</Text>
            <View style={styles.typeRow}>
              {ENTITY_TYPES.map((t) => (
                <TouchableOpacity
                  key={t.value}
                  style={[
                    styles.typeBtn,
                    type === t.value && { borderColor: t.color, backgroundColor: t.color + "15" },
                  ]}
                  onPress={() => setType(t.value)}
                >
                  <FontAwesome5
                    name={t.icon}
                    size={16}
                    color={type === t.value ? t.color : "#6B7280"}
                  />
                  <Text
                    style={[
                      styles.typeLabel,
                      type === t.value && { color: t.color },
                    ]}
                  >
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Gundren Rockseeker"
          placeholderTextColor="#6B7280"
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>Summary</Text>
        <TextInput
          style={styles.input}
          placeholder="Brief description..."
          placeholderTextColor="#6B7280"
          value={summary}
          onChangeText={setSummary}
        />

        <Text style={styles.label}>Details</Text>
        <TextInput
          style={[styles.input, styles.inputMulti]}
          placeholder="Full description, backstory, stats..."
          placeholderTextColor="#6B7280"
          value={content}
          onChangeText={setContent}
          multiline
          textAlignVertical="top"
        />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveBtn, (saving || createMutation.isPending) && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving || createMutation.isPending}
        >
          <Text style={styles.saveText}>
            {saving ? "Uploading..." : createMutation.isPending ? "Saving..." : "Create Entity"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F172A" },
  inner: { padding: 20 },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
    marginTop: 4,
  },
  topRowRight: {
    flex: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 16,
  },
  typeRow: {
    flexDirection: "row",
    gap: 8,
  },
  typeBtn: {
    flex: 1,
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#334155",
    backgroundColor: "#1E293B",
    gap: 4,
  },
  typeLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6B7280",
  },
  input: {
    backgroundColor: "#1E293B",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#334155",
  },
  inputMulti: { height: 140, textAlignVertical: "top" },
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
