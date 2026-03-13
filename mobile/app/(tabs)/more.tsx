import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { clearToken } from "../../lib/api";
import { colors } from "../../lib/colors";

const menuItems = [
  { icon: "document-text" as const, label: "Booking Requests", route: "/booking-requests" },
  { icon: "cash" as const, label: "Expenses", route: "/(tabs)/expenses" },
  { icon: "cube" as const, label: "Supplies", route: "/(tabs)/supplies" },
  { icon: "settings" as const, label: "Settings", route: null },
];

export default function MoreTab() {
  const router = useRouter();

  function handleLogout() {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await clearToken();
          router.replace("/");
        },
      },
    ]);
  }

  return (
    <View style={styles.container}>
      {menuItems.map((item) => (
        <TouchableOpacity
          key={item.label}
          style={styles.row}
          onPress={() => {
            if (item.route) router.push(item.route);
            else Alert.alert("Coming Soon", `${item.label} screen is coming in the next update.`);
          }}
        >
          <Ionicons name={item.icon} size={22} color={colors.steel} style={styles.icon} />
          <Text style={styles.label}>{item.label}</Text>
          <Ionicons name="chevron-forward" size={18} color="#ccc" />
        </TouchableOpacity>
      ))}

      <TouchableOpacity style={styles.logoutRow} onPress={handleLogout}>
        <Ionicons name="log-out" size={22} color={colors.red} style={styles.icon} />
        <Text style={[styles.label, { color: colors.red }]}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.warmGray, paddingTop: 12 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  logoutRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  icon: { marginRight: 14 },
  label: { flex: 1, fontSize: 16, color: colors.dark },
});
