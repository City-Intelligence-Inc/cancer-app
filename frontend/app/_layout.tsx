import React from "react";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { SessionProvider } from "../context/SessionContext";
import ErrorBoundary from "../components/ErrorBoundary";
import { colors } from "../utils/theme";
import { useFonts } from "expo-font";
import { Ionicons } from "@expo/vector-icons";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ ...Ionicons.font });
  if (!fontsLoaded) return null;

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
