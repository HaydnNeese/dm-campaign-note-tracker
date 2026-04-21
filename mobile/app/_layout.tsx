import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

export default function RootLayout() {
  const user = useAuthStore((s) => s.user);
  const loadUser = useAuthStore((s) => s.loadUser);
  const isLoading = useAuthStore((s) => s.isLoading);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(app)" || segments[0] === "campaign";
    if (!user && inAuthGroup) {
      router.replace("/login");
    } else if (user && (segments[0] === "login" || segments[0] === "register")) {
      router.replace("/(app)");
    }
  }, [user, segments, isLoading, router]);

  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(app)" />
        <Stack.Screen name="campaign/[id]" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
      </Stack>
    </QueryClientProvider>
  );
}
