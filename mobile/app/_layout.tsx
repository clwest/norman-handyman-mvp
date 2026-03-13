import { Stack } from "expo-router";
import { colors } from "../lib/colors";

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.navy },
        headerTintColor: colors.white,
        headerTitleStyle: { fontWeight: "bold" },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="jobs/[id]" options={{ title: "Job Details" }} />
      <Stack.Screen name="invoices/[id]" options={{ title: "Invoice Details" }} />
      <Stack.Screen
        name="booking-requests/index"
        options={{ title: "Booking Requests" }}
      />
      <Stack.Screen
        name="booking-requests/[id]"
        options={{ title: "Booking Request" }}
      />
    </Stack>
  );
}
