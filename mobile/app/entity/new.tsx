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
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams, Stack } from "expo-router";
import { FontAwesome5 } from "@expo/vector-icons";
import { useAuthStore } from "@/stores/authStore";
import { useEntities, useCreateEntity } from "@/hooks/useEntities";
import { useNotes, useUpdateNote } from "@/hooks/useNotes";
import { uploadImage } from "@/services/uploads";
import EntityImagePicker from "@/components/EntityImagePicker";
import * as loreAi from "@/services/loreAi";
import type { EntityType } from "@/types";

const ENTITY_TYPES: { value: EntityType; label: string; icon: string; color: string }[] = [
  { value: "NPC", label: "NPC", icon: "user-friends", color: "#F59E0B" },
  { value: "LOCATION", label: "Location", icon: "map-marker-alt", color: "#10B981" },
  { value: "ITEM", label: "Item", icon: "gem", color: "#3B82F6" },
  { value: "QUEST", label: "Quest", icon: "exclamation-circle", color: "#EF4444" },
  { value: "FACTION", label: "Faction", icon: "flag", color: "#8B5CF6" },
  { value: "KEY_EVENT", label: "Event", icon: "calendar-alt", color: "#EC4899" },
];

const SUMMARY_PLACEHOLDERS: Record<EntityType, string> = {
  NPC: "Race, gender, personality, appearance...",
  LOCATION: "Climate, region, landmarks, atmosphere...",
  ITEM: "Type of item, theme (evil, holy, quirky), powers...",
  QUEST: "Type (fetch, kill, recover), danger level, rewards...",
  FACTION: "Ideology, power level, members, goals...",
  KEY_EVENT: "Historical impact, participants, outcome...",
};

const NAME_PLACEHOLDERS: Record<EntityType, string> = {
  NPC: "e.g. Gundren Rockseeker",
  LOCATION: "e.g. Phandalin, Cragmaw Hideout",
  ITEM: "e.g. Spider Staff, Gauntlets of Ogre Power",
  QUEST: "e.g. Find the Lost Mine, Rescue Sildar Hallwinter",
  FACTION: "e.g. The Lords' Alliance, The Zhentarim",
  KEY_EVENT: "e.g. The Cataclysm, The Battle of Neverwinter",
};

const DETAILS_PLACEHOLDERS: Record<EntityType, string> = {
  NPC: "Full description, backstory, stats, and role in the story...",
  LOCATION: "Layout, inhabitants, history, and key features of this place...",
  ITEM: "Magic properties, weight, value, and legendary history...",
  QUEST: "Objectives, requirements, obstacles, and potential outcomes...",
  FACTION: "Hierarchical structure, significant members, and secret agendas...",
  KEY_EVENT: "Chronological timeline, key figures involved, and long-term consequences...",
};

export default function NewEntityScreen() {
  const router = useRouter();
  const { name: initialName, type: initialType, sourceNoteId, sourceText } = useLocalSearchParams<{ name?: string, type?: string, sourceNoteId?: string, sourceText?: string }>();

  const activeCampaign = useAuthStore((s) => s.activeCampaign);
  const createMutation = useCreateEntity(activeCampaign?.id || "");

  const { data: allEntities } = useEntities(activeCampaign?.id || "");
  const { data: notes } = useNotes(activeCampaign?.id || "");
  const updateNoteMutation = useUpdateNote(activeCampaign?.id || "");

  const [name, setName] = useState(initialName || "");
  const [type, setType] = useState<EntityType>((initialType as EntityType) || "NPC");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [selectedEntityIds, setSelectedEntityIds] = useState<string[]>([]);
  const [tagFilter, setTagFilter] = useState<EntityType | "ALL">("ALL");
  const [saving, setSaving] = useState(false);
  const [showConceptHelp, setShowConceptHelp] = useState(false);

  // AI states
  const [isGeneratingName, setIsGeneratingName] = useState(false);
  const [isGeneratingDetails, setIsGeneratingDetails] = useState(false);
  const [isOptimizingDetails, setIsOptimizingDetails] = useState(false);

  const handleGenerateName = async () => {
    setIsGeneratingName(true);
    try {
      const newName = await loreAi.generateName(type, summary);
      setName(newName);
    } catch (err: any) {
      Alert.alert("AI Unavailable", "Please wait, the AI servers are busy right now. Try again in a moment.");
    } finally {
      setIsGeneratingName(false);
    }
  };

  const handleGenerateDetails = async () => {
    if (!name.trim() && !summary.trim()) {
      Alert.alert("Context Needed", "Provide at least a name or a summary so the AI knows what to write about.");
      return;
    }
    setIsGeneratingDetails(true);
    try {
      const details = await loreAi.generateDetails(name, type, summary, selectedEntityIds);
      setContent(details);
    } catch (err: any) {
      Alert.alert("AI Unavailable", "Please wait, the AI servers are busy right now. Try again in a moment.");
    } finally {
      setIsGeneratingDetails(false);
    }
  };

  const handleOptimizeDetails = async () => {
    if (!content.trim()) {
      Alert.alert("No Content", "Write something first for the AI to optimize.");
      return;
    }
    setIsOptimizingDetails(true);
    try {
      const optimized = await loreAi.optimizeDetails(content);
      setContent(optimized);
    } catch (err: any) {
      Alert.alert("AI Unavailable", "Please wait, the AI servers are busy right now. Try again in a moment.");
    } finally {
      setIsOptimizingDetails(false);
    }
  };

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
      <Stack.Screen
        options={{
          headerShown: true,
          title: "New Lore",
          headerStyle: { backgroundColor: "#0F172A" },
          headerTintColor: "#F9FAFB",
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 16 }}>
              <FontAwesome5 name="arrow-left" size={18} color="#F9FAFB" />
            </TouchableOpacity>
          ),
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
                    type === t.value && { borderColor: t.color, backgroundColor: t.color + "15" },
                  ]}
                  onPress={() => {
                    setType(t.value);
                    setName("");
                    setSummary("");
                    setContent("");
                    setImageUri(null);
                  }}
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

        <View style={[styles.labelRow, { marginTop: 16, marginBottom: 8 }]}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={[styles.label, { marginTop: 0 }]}>Concept / Summary</Text>
            <View style={{ position: "relative", zIndex: 1000 }}>
              <TouchableOpacity
                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                onPress={() => setShowConceptHelp(!showConceptHelp)}
                style={{ marginLeft: 8 }}
              >
                <FontAwesome5 name="info-circle" size={14} color={showConceptHelp ? "#7C3AED" : "#6B7280"} />
              </TouchableOpacity>

              {showConceptHelp && (
                <View style={styles.tooltipContainer}>
                  <Text style={styles.tooltipTitle}>AI Context</Text>
                  <Text style={styles.tooltipText}>
                    Type a few keywords here (like "grumpy dwarf" or "floating castle") to guide the AI name and details generation!
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowConceptHelp(false)}
                    style={styles.tooltipBtn}
                  >
                    <Text style={styles.tooltipBtnText}>Got it!</Text>
                  </TouchableOpacity>
                  <View style={styles.tooltipArrow} />
                </View>
              )}
            </View>
          </View>
        </View>
        <TextInput
          style={styles.input}
          placeholder={SUMMARY_PLACEHOLDERS[type]}
          placeholderTextColor="#6B7280"
          value={summary}
          onChangeText={setSummary}
        />

        <View style={styles.labelRow}>
          <Text style={styles.label}>Name</Text>
          <TouchableOpacity
            style={styles.aiLink}
            onPress={handleGenerateName}
            disabled={isGeneratingName}
          >
            {isGeneratingName ? (
              <ActivityIndicator size="small" color="#A78BFA" />
            ) : (
              <>
                <FontAwesome5 name="magic" size={10} color="#A78BFA" />
                <Text style={styles.aiLinkText}>Generate</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
        <TextInput
          style={styles.input}
          placeholder={NAME_PLACEHOLDERS[type]}
          placeholderTextColor="#6B7280"
          value={name}
          onChangeText={setName}
        />

        <View style={styles.labelRow}>
          <Text style={styles.label}>Related Lore (Tags)</Text>
          <FontAwesome5 name="link" size={10} color="#6B7280" style={{ marginTop: 24 }} />
        </View>
        <View style={styles.tagSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterList}>
            <TouchableOpacity
              style={[styles.filterChip, tagFilter === "ALL" && styles.filterChipActive]}
              onPress={() => setTagFilter("ALL")}
            >
              <Text style={[styles.filterChipText, tagFilter === "ALL" && styles.filterChipTextActive]}>All</Text>
            </TouchableOpacity>
            {ENTITY_TYPES.map((t) => (
              <TouchableOpacity
                key={t.value}
                style={[
                  styles.filterChip,
                  tagFilter === t.value && { backgroundColor: t.color + "20", borderColor: t.color }
                ]}
                onPress={() => setTagFilter(t.value)}
              >
                <FontAwesome5 name={t.icon} size={10} color={tagFilter === t.value ? t.color : "#6B7280"} />
                <Text style={[styles.filterChipText, tagFilter === t.value && { color: t.color }]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagList}>
            {(allEntities || [])
              .filter(e => tagFilter === "ALL" || e.type === tagFilter)
              .filter(e => e.id !== (initialName ? "fake-id-to-avoid-self" : "")) // avoid self if editing (though this is "new")
              .map(entity => {
                const isSelected = selectedEntityIds.includes(entity.id);
                return (
                  <TouchableOpacity
                    key={entity.id}
                    style={[
                      styles.tagChip,
                      isSelected && { backgroundColor: "#7C3AED", borderColor: "#7C3AED" }
                    ]}
                    onPress={() => {
                      if (isSelected) {
                        setSelectedEntityIds(selectedEntityIds.filter(id => id !== entity.id));
                      } else {
                        setSelectedEntityIds([...selectedEntityIds, entity.id]);
                      }
                    }}
                  >
                    <FontAwesome5
                      name={isSelected ? "check" : "plus"}
                      size={10}
                      color={isSelected ? "#FFFFFF" : "#6B7280"}
                    />
                    <Text style={[styles.tagText, isSelected && { color: "#FFFFFF" }]}>
                      {entity.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
          </ScrollView>
          {(allEntities || []).length === 0 && (
            <Text style={styles.emptyTags}>No other lore to tag yet.</Text>
          )}
        </View>

        <View style={styles.labelRow}>
          <Text style={styles.label}>Details</Text>
          <View style={styles.aiActionRow}>
            <TouchableOpacity
              style={styles.aiLink}
              onPress={handleOptimizeDetails}
              disabled={isOptimizingDetails}
            >
              {isOptimizingDetails ? (
                <ActivityIndicator size="small" color="#A78BFA" />
              ) : (
                <>
                  <FontAwesome5 name="wand-magic-sparkles" size={10} color="#A78BFA" />
                  <Text style={styles.aiLinkText}>Optimize</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.aiLink}
              onPress={handleGenerateDetails}
              disabled={isGeneratingDetails}
            >
              {isGeneratingDetails ? (
                <ActivityIndicator size="small" color="#A78BFA" />
              ) : (
                <>
                  <FontAwesome5 name="brain" size={10} color="#A78BFA" />
                  <Text style={styles.aiLinkText}>Generate</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
        <TextInput
          style={[styles.input, styles.inputMulti, { flex: 1, minHeight: 200 }]}
          placeholder={DETAILS_PLACEHOLDERS[type]}
          placeholderTextColor="#6B7280"
          value={content}
          onChangeText={setContent}
          multiline
          textAlignVertical="top"
        />
        <View style={{ height: 20 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace("/");
            }
          }}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveBtn, (saving || createMutation.isPending) && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving || createMutation.isPending}
        >
          <Text style={styles.saveText}>
            {saving ? "Uploading..." : createMutation.isPending ? "Saving..." : "Add Lore"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F172A" },
  inner: { padding: 20, flexGrow: 1 },
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
    marginTop: 24,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tooltipContainer: {
    position: "absolute",
    top: 30,
    left: -140,
    width: 280,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
    zIndex: 2000,
  },
  tooltipArrow: {
    position: "absolute",
    top: -6,
    left: 140 - 6 + 8, // Center minus half arrow width plus icon offset
    width: 12,
    height: 12,
    backgroundColor: "#FFFFFF",
    transform: [{ rotate: "45deg" }],
  },
  tooltipTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
    marginBottom: 8,
  },
  tooltipText: {
    fontSize: 13,
    color: "#475569",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 16,
  },
  tooltipBtn: {
    backgroundColor: "#7C3AED",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  tooltipBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
  aiActionRow: {
    flexDirection: "row",
    gap: 12,
  },
  aiLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: "#1E293B",
    borderWidth: 1,
    borderColor: "#7C3AED40",
  },
  aiLinkText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#A78BFA",
    textTransform: "uppercase",
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
  tagSection: {
    marginTop: 4,
  },
  tagList: {
    flexDirection: "row",
  },
  tagChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E293B",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#334155",
    gap: 6,
  },
  tagText: {
    fontSize: 13,
    color: "#E2E8F0",
    fontWeight: "500",
  },
  emptyTags: {
    fontSize: 12,
    color: "#6B7280",
    fontStyle: "italic",
    marginTop: 4,
  },
  filterList: {
    flexDirection: "row",
    marginBottom: 12,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E293B",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#334155",
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: "#7C3AED20",
    borderColor: "#7C3AED",
  },
  filterChipText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
  },
  filterChipTextActive: {
    color: "#A78BFA",
  },
});
