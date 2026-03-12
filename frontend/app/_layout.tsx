import React from "react";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { SessionProvider } from "../context/SessionContext";
import ErrorBoundary from "../components/ErrorBoundary";
import { colors } from "../utils/theme";

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <SessionProvider>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background },
              animation: "slide_from_right",
            }}
          />
        </SessionProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
