// ─── Note view / edit screen (with AI features) ────────────
// View mode: mentions as tappable links + AI actions
// Edit mode: MentionInput with entity dropdown

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
import { useNotes, useUpdateNote, useDeleteNote } from "@/hooks/useNotes";
import { useEntities, useCreateEntity, useUpdateEntity } from "@/hooks/useEntities";
import MentionInput from "@/components/MentionInput";
import MentionText from "@/components/MentionText";
import ProcessResultView from "@/components/ProcessResultView";
import RecapView from "@/components/RecapView";
import PremiumUpsell from "@/components/PremiumUpsell";
import * as sessionAi from "@/services/sessionAi";
import type { MentionInput as MentionData, ProcessSessionResult, RecapResult } from "@/types";

export default function NoteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { activeCampaign, user } = useAuthStore();
  const { data: notes, isLoading } = useNotes(activeCampaign?.id);
  const { data: entities } = useEntities(activeCampaign?.id);
  const createEntityMutation = useCreateEntity(activeCampaign?.id || "");
  const updateEntityMutation = useUpdateEntity(activeCampaign?.id || "");
  const updateMutation = useUpdateNote(activeCampaign?.id || "");
  const deleteMutation = useDeleteNote(activeCampaign?.id || "");

  const note = notes?.find((n) => n.id === id);

  // Edit state
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mentions, setMentions] = useState<MentionData[]>([]);

  // AI state
  const [tab, setTab] = useState<"note" | "analysis" | "recap">("note");
  const [processResult, setProcessResult] = useState<ProcessSessionResult | null>(null);
  const [recapResult, setRecapResult] = useState<RecapResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRecapping, setIsRecapping] = useState(false);
  const [showUpsell, setShowUpsell] = useState(false);

  // Populate fields when note loads
  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setMentions(
        note.mentions.map((m) => ({
          entityId: m.entityId,
          startIndex: m.startIndex,
          endIndex: m.endIndex,
          displayText: m.displayText,
        }))
      );
    }
  }, [note?.id]);

  // Load existing AI results on mount
  useEffect(() => {
    if (id) {
      sessionAi.getProcessResult(id).then(setProcessResult).catch(() => { });
      sessionAi.getRecap(id).then(setRecapResult).catch(() => { });
    }
  }, [id]);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert("Error", "Title is required");
      return;
    }
    try {
      await updateMutation.mutateAsync({
        id: id!,
        data: { title: title.trim(), content, mentions },
      });
      setEditing(false);
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  const handleDelete = () => {
    Alert.alert("Delete Note", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteMutation.mutateAsync(id!);
          router.back();
        },
      },
    ]);
  };

  const handleProcessSession = async () => {
    if (!user?.isPremium) {
      setShowUpsell(true);
      return;
    }
    setIsAnalyzing(true);
    setTab("analysis");
    try {
      const result = await sessionAi.processSession(id!);
      setProcessResult(result);
    } catch (err: any) {
      if (err.message?.includes("Premium")) {
        setShowUpsell(true);
      } else {
        Alert.alert("Error", `Analysis failed: ${err.message}`);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };
  const handleGenerateRecap = async () => {
    if (!user?.isPremium) {
      setShowUpsell(true);
      return;
    }
    setIsRecapping(true);
    setTab("recap");
    try {
      const recap = await sessionAi.generateRecap(id!);
      setRecapResult(recap);
    } catch (err: any) {
      if (err.message?.includes("Premium")) {
        setShowUpsell(true);
      } else {
        Alert.alert("Error", `Recap failed: ${err.message}`);
      }
    } finally {
      setIsRecapping(false);
    }
  };

  const handleCreateEntity = (name: string, type: string) => {
    router.push(`/entity/new?name=${encodeURIComponent(name)}&type=${type}&sourceNoteId=${id}&sourceText=${encodeURIComponent(name)}` as any);
  };

  const handleAddLink = async (entityId: string, text: string) => {
    if (!note) return;

    // Find where the text exists in the content
    const lowerContent = note.content.toLowerCase();
    const lowerText = text.toLowerCase();
    let startIndex = lowerContent.indexOf(lowerText);

    // Fallback if the AI suggested something that isn't functionally an exact match
    if (startIndex === -1) {
      Alert.alert("Match not found", `Could not find exact text "${text}" in the note to create a link.`);
      return;
    }

    const endIndex = startIndex + text.length;

    // Make sure we aren't overlapping with an existing mention
    const isOverlapping = note.mentions.some(
      (m) => startIndex < m.endIndex && endIndex > m.startIndex
    );

    if (isOverlapping) {
      Alert.alert("Already linked", "This text is already part of an existing link.");
      return;
    }

    const newMention = {
      entityId,
      startIndex,
      endIndex,
      displayText: note.content.substring(startIndex, endIndex),
    };

    try {
      await updateMutation.mutateAsync({
        id: id!,
        data: {
          title: note.title,
          content: note.content,
          mentions: [...note.mentions, newMention]
        },
      });
      Alert.alert("Success", "Link added successfully!");
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  const handleCreateQuest = async (title: string, details: string) => {
    try {
      await createEntityMutation.mutateAsync({
        name: title,
        type: "QUEST",
        summary: details,
        content: `**Initial hook via AI analysis:**\n${details}`,
      });
    } catch (err: any) {
      Alert.alert("Error creating quest", err.message);
    }
  };

  const handleUpdateQuest = async (entityId: string, status: string, details: string) => {
    try {
      const existingEntity = entities?.find((e) => e.id === entityId);
      if (!existingEntity) return;

      const dateStr = new Date().toLocaleDateString();
      const statusText = status.charAt(0).toUpperCase() + status.slice(1).replace("_", " ");
      const newContent = `${existingEntity.content}\n\n**Update (${dateStr} - ${statusText}):**\n${details}`.trim();

      await updateEntityMutation.mutateAsync({
        id: entityId,
        data: {
          content: newContent,
        },
      });
    } catch (err: any) {
      Alert.alert("Error updating quest", err.message);
    }
  };

  if (isLoading || !note) {
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
          title: editing ? "Edit Note" : note.title,
          headerStyle: { backgroundColor: "#0F172A" },
          headerTintColor: "#F9FAFB",
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 16 }}>
              <FontAwesome5 name="arrow-left" size={18} color="#F9FAFB" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={{ flexDirection: "row", gap: 16, paddingRight: 16 }}>
              {!editing && (
                <TouchableOpacity onPress={() => setEditing(true)}>
                  <FontAwesome5 name="edit" size={18} color="#A78BFA" />
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={handleDelete}>
                <FontAwesome5 name="trash" size={18} color="#F87171" />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      {editing ? (
        /* ─── Edit mode ─── */
        <>
          <ScrollView
            contentContainerStyle={styles.inner}
            keyboardShouldPersistTaps="always"
          >
            <TextInput
              style={styles.titleInput}
              value={title}
              onChangeText={setTitle}
              placeholder="Title"
              placeholderTextColor="#6B7280"
            />
            <Text style={styles.hint}>Type @ to mention an entity</Text>
            <MentionInput
              value={content}
              onChangeText={setContent}
              entities={entities || []}
              mentions={mentions}
              onMentionsChange={setMentions}
              placeholder="Note content..."
            />
          </ScrollView>
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => {
                setTitle(note.title);
                setContent(note.content);
                setMentions(
                  note.mentions.map((m) => ({
                    entityId: m.entityId,
                    startIndex: m.startIndex,
                    endIndex: m.endIndex,
                    displayText: m.displayText,
                  }))
                );
                setEditing(false);
              }}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, updateMutation.isPending && { opacity: 0.6 }]}
              onPress={handleSave}
              disabled={updateMutation.isPending}
            >
              <Text style={styles.saveText}>
                {updateMutation.isPending ? "Saving..." : "Save"}
              </Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        /* ─── View mode ─── */
        <>
          {/* Tab bar */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tab, tab === "note" && styles.tabActive]}
              onPress={() => setTab("note")}
            >
              <FontAwesome5
                name="scroll"
                size={12}
                color={tab === "note" ? "#A78BFA" : "#6B7280"}
              />
              <Text style={[styles.tabText, tab === "note" && styles.tabTextActive]}>
                Note
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, tab === "analysis" && styles.tabActive]}
              onPress={() => setTab("analysis")}
            >
              <FontAwesome5
                name="brain"
                size={12}
                color={tab === "analysis" ? "#A78BFA" : "#6B7280"}
              />
              <Text
                style={[styles.tabText, tab === "analysis" && styles.tabTextActive]}
              >
                Analysis
              </Text>
              {processResult && <View style={styles.tabDot} />}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, tab === "recap" && styles.tabActive]}
              onPress={() => setTab("recap")}
            >
              <FontAwesome5
                name="book-reader"
                size={12}
                color={tab === "recap" ? "#A78BFA" : "#6B7280"}
              />
              <Text style={[styles.tabText, tab === "recap" && styles.tabTextActive]}>
                Recap
              </Text>
              {recapResult && <View style={styles.tabDot} />}
            </TouchableOpacity>
          </View>

          {/* Tab content */}
          {tab === "note" && (
            <ScrollView contentContainerStyle={styles.inner}>
              <Text style={styles.viewTitle}>{note.title}</Text>
              <Text style={styles.viewDate}>
                Updated {new Date(note.updatedAt).toLocaleString()}
              </Text>
              {note.content ? (
                <MentionText content={note.content} mentions={note.mentions} />
              ) : (
                <Text style={styles.emptyContent}>No content yet</Text>
              )}

              {/* AI action buttons */}
              <View style={styles.aiActions}>
                <TouchableOpacity
                  style={styles.aiBtn}
                  onPress={handleProcessSession}
                >
                  <FontAwesome5 name="brain" size={14} color="#A78BFA" />
                  <Text style={styles.aiBtnText}>Process Session</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.aiBtn}
                  onPress={handleGenerateRecap}
                >
                  <FontAwesome5 name="book-reader" size={14} color="#A78BFA" />
                  <Text style={styles.aiBtnText}>Generate Recap</Text>
                </TouchableOpacity>
              </View>

              {/* Linked entities */}
              {note.mentions.length > 0 && (
                <View style={styles.mentionsSection}>
                  <Text style={styles.mentionsLabel}>Linked Entities</Text>
                  {note.mentions.map((m) => (
                    <TouchableOpacity
                      key={m.id}
                      style={styles.mentionChip}
                      onPress={() => router.push(`/entity/${m.entityId}` as any)}
                    >
                      <FontAwesome5 name="at" size={12} color="#A78BFA" />
                      <Text style={styles.mentionChipText}>{m.displayText}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </ScrollView>
          )}

          {tab === "analysis" && (
            isAnalyzing ? (
              <View style={styles.aiLoadingWrap}>
                <ActivityIndicator size="large" color="#7C3AED" />
                <Text style={styles.aiLoadingText}>Analyzing session...</Text>
              </View>
            ) : processResult ? (
              <ProcessResultView
                result={processResult}
                onAddLink={handleAddLink}
                onCreateEntity={handleCreateEntity}
                existingMentionEntityIds={note.mentions.map(m => m.entityId)}
                existingQuests={entities?.filter(e => e.type === "QUEST").map(e => ({ id: e.id, name: e.name })) || []}
                existingEntities={entities?.map(e => ({ id: e.id, name: e.name })) || []}
                onCreateQuest={handleCreateQuest}
                onUpdateQuest={handleUpdateQuest}
              />
            ) : (
              <View style={styles.emptyTab}>
                <FontAwesome5 name="brain" size={40} color="#334155" />
                <Text style={styles.emptyTabText}>No analysis yet</Text>
                <TouchableOpacity
                  style={styles.aiBtn}
                  onPress={handleProcessSession}
                >
                  <FontAwesome5 name="brain" size={14} color="#A78BFA" />
                  <Text style={styles.aiBtnText}>Process Session</Text>
                </TouchableOpacity>
              </View>
            )
          )}

          {tab === "recap" && (
            isRecapping ? (
              <View style={styles.aiLoadingWrap}>
                <ActivityIndicator size="large" color="#7C3AED" />
                <Text style={styles.aiLoadingText}>Generating recap...</Text>
              </View>
            ) : recapResult ? (
              <ScrollView contentContainerStyle={styles.inner}>
                <RecapView recap={recapResult} />
              </ScrollView>
            ) : (
              <View style={styles.emptyTab}>
                <FontAwesome5 name="book-reader" size={40} color="#334155" />
                <Text style={styles.emptyTabText}>No recap yet</Text>
                <TouchableOpacity
                  style={styles.aiBtn}
                  onPress={handleGenerateRecap}
                >
                  <FontAwesome5 name="book-reader" size={14} color="#A78BFA" />
                  <Text style={styles.aiBtnText}>Generate Recap</Text>
                </TouchableOpacity>
              </View>
            )
          )}
        </>
      )}

      <PremiumUpsell visible={showUpsell} onClose={() => setShowUpsell(false)} />
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
  inner: { padding: 20, flexGrow: 1, paddingBottom: 32 },
  // Tab bar
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#1E293B",
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: "#7C3AED",
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
  },
  tabTextActive: {
    color: "#A78BFA",
  },
  tabDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
  },
  // Edit mode
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
  // View mode
  viewTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#F9FAFB",
    marginBottom: 6,
  },
  viewDate: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 20,
  },
  emptyContent: {
    fontSize: 16,
    color: "#4B5563",
    fontStyle: "italic",
  },
  // AI actions
  aiActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 24,
    marginBottom: 8,
  },
  aiBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#1E293B",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#7C3AED40",
  },
  aiBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#A78BFA",
  },
  // AI loading
  aiLoadingWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  aiLoadingText: {
    fontSize: 16,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  // Empty tab
  emptyTab: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    paddingBottom: 40,
  },
  emptyTabText: {
    fontSize: 16,
    color: "#4B5563",
    fontWeight: "500",
  },
  // Mentions
  mentionsSection: {
    marginTop: 28,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#334155",
  },
  mentionsLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 10,
  },
  mentionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#1E293B",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 6,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#334155",
  },
  mentionChipText: {
    fontSize: 14,
    color: "#A78BFA",
    fontWeight: "600",
  },
});
