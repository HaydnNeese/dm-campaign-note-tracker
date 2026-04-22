import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Pressable,
} from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import { useRouter, useSegments } from "expo-router";
import { useCampaigns } from "@/hooks/useCampaigns";
import { useAuthStore } from "@/stores/authStore";
import type { Campaign } from "@/types";

export default function CampaignSelector() {
  const [modalVisible, setModalVisible] = useState(false);
  const { data: campaigns } = useCampaigns();
  const { activeCampaign, setActiveCampaign } = useAuthStore();
  const router = useRouter();
  const segments = useSegments();

  // Determine current tab to stay on it after switch
  // segments for campaign screens look like ["campaign", "[id]", "notes"]
  const currentTab = segments[segments.length - 1] || "notes";

  const handleSelect = (campaign: Campaign) => {
    setActiveCampaign(campaign);
    setModalVisible(false);
    // Navigate to the same tab in the new campaign
    router.replace(`/campaign/${campaign.id}/${currentTab}` as any);
  };

  if (!activeCampaign) return null;

  return (
    <>
      <TouchableOpacity
        style={styles.headerButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.campaignName} numberOfLines={1}>
          {activeCampaign.name}
        </Text>
        <FontAwesome5 name="chevron-down" size={12} color="#A78BFA" />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <SafeAreaView style={{ flex: 1 }}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Switch Campaign</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <FontAwesome5 name="times" size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <FlatList
                data={campaigns}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.campaignItem,
                      item.id === activeCampaign.id && styles.activeItem,
                    ]}
                    onPress={() => handleSelect(item)}
                  >
                    <View style={styles.campaignInfo}>
                      <FontAwesome5
                        name="book"
                        size={16}
                        color={item.id === activeCampaign.id ? "#A78BFA" : "#4B5563"}
                      />
                      <Text
                        style={[
                          styles.campaignItemName,
                          item.id === activeCampaign.id && styles.activeItemText,
                        ]}
                      >
                        {item.name}
                      </Text>
                    </View>
                    {item.id === activeCampaign.id && (
                      <FontAwesome5 name="check" size={14} color="#A78BFA" />
                    )}
                  </TouchableOpacity>
                )}
                contentContainerStyle={styles.listContent}
              />
            </SafeAreaView>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  headerButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#1E293B",
  },
  campaignName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#F9FAFB",
    maxWidth: 200,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxHeight: "70%",
    backgroundColor: "#0F172A",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#334155",
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#F9FAFB",
  },
  listContent: {
    padding: 10,
  },
  campaignItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  activeItem: {
    backgroundColor: "#1E293B",
    borderColor: "#7C3AED40",
    borderWidth: 1,
  },
  campaignInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  campaignItemName: {
    fontSize: 16,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  activeItemText: {
    color: "#F9FAFB",
    fontWeight: "600",
  },
});
