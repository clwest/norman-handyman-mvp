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
import { getInvoices } from "../../lib/api";
import { colors } from "../../lib/colors";

interface Invoice {
  id: number;
  status: string;
  total: string;
  customer_name: string;
  due_date: string | null;
}

const statusColor: Record<string, string> = {
  DRAFT: "#999",
  SENT: colors.steel,
  PAID: colors.green,
  OVERDUE: colors.red,
  VOID: "#666",
};

export default function InvoicesTab() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getInvoices();
      setInvoices(data.results || data);
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
      data={invoices}
      keyExtractor={(item) => String(item.id)}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
      ListEmptyComponent={<Text style={styles.empty}>No invoices yet</Text>}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push(`/invoices/${item.id}`)}
        >
          <View style={styles.row}>
            <Text style={styles.title}>Invoice #{item.id}</Text>
            <View style={[styles.badge, { backgroundColor: statusColor[item.status] || colors.lightGray }]}>
              <Text style={styles.badgeText}>{item.status}</Text>
            </View>
          </View>
          <View style={styles.row}>
            <Text style={styles.sub}>{item.customer_name}</Text>
            <Text style={styles.amount}>${item.total}</Text>
          </View>
        </TouchableOpacity>
      )}
    />
  );
}

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
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  title: { fontSize: 16, fontWeight: "600", color: colors.dark },
  sub: { fontSize: 14, color: "#666" },
  amount: { fontSize: 16, fontWeight: "bold", color: colors.navy },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { color: colors.white, fontSize: 11, fontWeight: "bold" },
});
