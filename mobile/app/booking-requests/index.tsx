import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { getBookingRequests } from "../../lib/api";
import { colors } from "../../lib/colors";

interface Booking {
  id: number;
  customer_name: string;
  description: string;
  status: string;
  preferred_date: string | null;
  created_at: string;
}

export default function BookingRequestsList() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getBookingRequests();
      setBookings(data.results || data);
    } catch {
      // fail silently
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.steel} />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      data={bookings}
      keyExtractor={(item) => String(item.id)}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
      ListEmptyComponent={<Text style={styles.empty}>No booking requests</Text>}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push(`/booking-requests/${item.id}`)}
        >
          <View style={styles.row}>
            <Text style={styles.title}>{item.customer_name}</Text>
            <View style={[styles.badge, { backgroundColor: statusColors[item.status] || "#999" }]}>
              <Text style={styles.badgeText}>{item.status}</Text>
            </View>
          </View>
          <Text style={styles.sub} numberOfLines={2}>{item.description}</Text>
        </TouchableOpacity>
      )}
    />
  );
}

const statusColors: Record<string, string> = {
  NEW: colors.gold,
  CONTACTED: colors.steel,
  SCHEDULED: colors.green,
  CLOSED: "#999",
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.warmGray, paddingHorizontal: 16, paddingTop: 12 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  empty: { textAlign: "center", color: "#999", marginTop: 40 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 16, fontWeight: "600", color: colors.dark, flex: 1, marginRight: 8 },
  sub: { fontSize: 14, color: "#666", marginTop: 4 },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { color: colors.white, fontSize: 11, fontWeight: "bold" },
});
