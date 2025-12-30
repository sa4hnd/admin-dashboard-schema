import React from "react";
import { Stack } from "expo-router";
import { colors } from "@/constants/theme";

export default function UsersLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg.primary },
        headerTintColor: colors.text.primary,
        headerTitleStyle: { fontWeight: "600" as const, fontSize: 17 },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.bg.primary },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="[userId]" options={{ title: "User Details" }} />
    </Stack>
  );
}
