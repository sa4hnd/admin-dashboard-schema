import React from "react";
import { Stack } from "expo-router";
import { colors } from "@/constants/theme";

export default function ConfigLayout() {
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
      <Stack.Screen name="index" options={{ title: "Config" }} />
    </Stack>
  );
}
