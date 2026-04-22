// ─── Entity edit screen ─────────────────────────────────────

import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { FontAwesome5 } from "@expo/vector-icons";
import { useAuthStore } from "@/stores/authStore";
import { useEntities, useUpdateEntity } from "@/hooks/useEntities";
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

/** Convert a server-relative imageUrl to a full URL for display */
function toFullImageUrl(imageUrl: string | null): string | null {
  if (!imageUrl) return null;
  if (imageUrl.startsWith("http")) return imageUrl;
  return `${API_BASE_URL}${imageUrl}`;
}

export default function EditEntityScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const activeCampaign = useAuthStore((s) => s.activeCampaign);
  const { data: entities, isLoading } = useEntities(activeCampaign?.id);
  const updateMutation = useUpdateEntity(activeCampaign?.id || "");

  const entity = entities?.find((e) => e.id === id);

  const [name, setName] = useState("");
  const [type, setType] = useState<EntityType>("NPC");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (entity) {
      setName(entity.name);
      setType(entity.type);
      setSummary(entity.summary);
      setContent(entity.content);
      const fullUrl = toFullImageUrl(entity.imageUrl);
      setImageUri(fullUrl);
      setOriginalImageUrl(fullUrl);
    }
  }, [entity?.id]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Name is required");
      return;
    }
    setSaving(true);
    try {
      let imageUrl: string | null | undefined;

      if (imageUri === null && originalImageUrl !== null) {
        // User removed the image
        imageUrl = null;
      } else if (imageUri && imageUri !== originalImageUrl) {
        // User picked a new image — upload it
        imageUrl = await uploadImage(imageUri);
      }
      // else: image unchanged, don't send imageUrl field

      await updateMutation.mutateAsync({
        id: id!,
        data: {
          name: name.trim(),
          type,
          summary: summary.trim(),
          content,
          ...(imageUrl !== undefined ? { imageUrl } : {}),
        },
      });
      router.back();
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || !entity) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <Stack.Screen
        options={{
          headerShown: true,
          title: `Edit ${entity?.name || "Lore"}`,
          headerStyle: { backgroundColor: "#0F172A" },
          headerTintColor: "#F9FAFB",
        }}
      />
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
                    type === t.value && {
                      borderColor: t.color,
                      backgroundColor: t.color + "15",
                    },
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
          value={name}
          onChangeText={setName}
          placeholder="Lore name"
          placeholderTextColor="#6B7280"
        />

        <Text style={styles.label}>Summary</Text>
        <TextInput
          style={styles.input}
          value={summary}
          onChangeText={setSummary}
          placeholder="Brief description"
          placeholderTextColor="#6B7280"
        />

        <Text style={styles.label}>Details</Text>
        <TextInput
          style={[styles.input, styles.inputMulti]}
          value={content}
          onChangeText={setContent}
          multiline
          textAlignVertical="top"
          placeholder="Full description..."
          placeholderTextColor="#6B7280"
        />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveBtn, (saving || updateMutation.isPending) && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving || updateMutation.isPending}
        >
          <Text style={styles.saveText}>
            {saving ? "Uploading..." : updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F172A" },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0F172A",
  },
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
