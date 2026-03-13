import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { getDashboard } from "../../lib/api";
import { colors } from "../../lib/colors";

interface DashboardData {
  todayJobs: Array<{ id: number; title: string; status: string; scheduled_date: string; customer_name?: string }>;
  newBookings: Array<{ id: number; customer_name: string; description: string; created_at: string }>;
  unpaidInvoices: Array<{ id: number; customer_name?: string; total: string; status: string }>;
}

export default function TodayScreen() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const d = await getDashboard();
      setData(d);
    } catch {
      // silently fail on dashboard load
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.steel} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Today's Jobs */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Today&apos;s Jobs ({data?.todayJobs.length || 0})
        </Text>
        {data?.todayJobs.length === 0 ? (
          <Text style={styles.empty}>No jobs scheduled today</Text>
        ) : (
          data?.todayJobs.map((job) => (
            <TouchableOpacity
              key={job.id}
              style={styles.card}
              onPress={() => router.push(`/jobs/${job.id}`)}
            >
              <Text style={styles.cardTitle}>{job.title}</Text>
              <Text style={styles.cardSub}>
                {job.customer_name || "Customer"} &middot; {job.status}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* New Booking Requests */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          New Requests ({data?.newBookings.length || 0})
        </Text>
        {data?.newBookings.length === 0 ? (
          <Text style={styles.empty}>No new booking requests</Text>
        ) : (
          data?.newBookings.map((b) => (
            <TouchableOpacity
              key={b.id}
              style={styles.card}
              onPress={() => router.push(`/booking-requests/${b.id}`)}
            >
              <Text style={styles.cardTitle}>{b.customer_name}</Text>
              <Text style={styles.cardSub} numberOfLines={2}>
                {b.description}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Unpaid Invoices */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Unpaid Invoices ({data?.unpaidInvoices.length || 0})
        </Text>
        {data?.unpaidInvoices.length === 0 ? (
          <Text style={styles.empty}>All invoices paid</Text>
        ) : (
          data?.unpaidInvoices.map((inv) => (
            <TouchableOpacity
              key={inv.id}
              style={styles.card}
              onPress={() => router.push(`/invoices/${inv.id}`)}
            >
              <Text style={styles.cardTitle}>
                Invoice #{inv.id} &mdash; ${inv.total}
              </Text>
              <Text style={styles.cardSub}>
                {inv.customer_name || "Customer"} &middot; {inv.status}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.warmGray },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  section: { paddingHorizontal: 16, paddingTop: 20 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.navy,
    marginBottom: 10,
  },
  empty: { color: "#999", fontSize: 14, marginBottom: 8 },
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
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.dark,
    marginBottom: 4,
  },
  cardSub: { fontSize: 14, color: "#666" },
});
