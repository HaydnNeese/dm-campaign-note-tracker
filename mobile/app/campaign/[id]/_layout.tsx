import { Tabs } from "expo-router";
import { FontAwesome5 } from "@expo/vector-icons";
import { TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import CampaignSelector from "@/components/CampaignSelector";

export default function CampaignTabLayout() {
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#A78BFA",
        tabBarInactiveTintColor: "#6B7280",
        tabBarStyle: {
          backgroundColor: "#1E293B",
          borderTopColor: "#334155",
          borderTopWidth: 1,
          paddingBottom: 4,
          height: 88,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
        headerStyle: {
          backgroundColor: "#0F172A",
        },
        headerTintColor: "#F9FAFB",
        headerTitleStyle: {
          fontWeight: "700",
        },
        headerTitle: () => <CampaignSelector />,
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.replace("/(app)")} style={{ marginLeft: 16 }}>
            <FontAwesome5 name="arrow-left" size={20} color="#F9FAFB" />
          </TouchableOpacity>
        ),
      }}
    >
      <Tabs.Screen
        name="notes"
        options={{
          title: "Notes",
          tabBarIcon: ({ color, size }) => <FontAwesome5 name="scroll" size={size - 4} color={color} />,
        }}
      />
      <Tabs.Screen
        name="lore"
        options={{
          title: "Lore",
          tabBarIcon: ({ color, size }) => <FontAwesome5 name="book-open" size={size - 4} color={color} />,
        }}
      />
      <Tabs.Screen
        name="adventurers"
        options={{
          title: "Adventurers",
          tabBarIcon: ({ color, size }) => <FontAwesome5 name="users" size={size - 4} color={color} />,
        }}
      />
    </Tabs>
  );
}
