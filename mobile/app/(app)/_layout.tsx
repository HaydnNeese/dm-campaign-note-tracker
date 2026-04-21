import { Tabs } from "expo-router";
import { FontAwesome5 } from "@expo/vector-icons";

export default function AppTabLayout() {
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
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Campaigns",
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="book-open" size={size - 4} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="cog" size={size - 4} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
