import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Switch,
  Alert,
} from "react-native";
import { getSupplies, updateSupply } from "../../lib/api";
import { colors } from "../../lib/colors";

interface SupplyItem {
  id: number;
  name: string;
  quantity_on_hand: number;
  reorder_threshold: number;
  reorder_flag: boolean;
  unit: string;
  notes: string;
}

export default function SuppliesTab() {
  const [supplies, setSupplies] = useState<SupplyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getSupplies();
      setSupplies(data.results || data);
    } catch {
      // fail silently
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function toggleReorder(item: SupplyItem) {
    try {
      await updateSupply(item.id, { reorder_flag: !item.reorder_flag });
      setSupplies((prev) =>
        prev.map((s) => (s.id === item.id ? { ...s, reorder_flag: !s.reorder_flag } : s))
      );
    } catch {
      Alert.alert("Error", "Failed to update supply item");
    }
  }

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
      data={supplies}
      keyExtractor={(item) => String(item.id)}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
      ListEmptyComponent={
        <Text style={styles.empty}>
          Add your common items (switches, outlets, anchors) so you don&apos;t run out mid-job.
        </Text>
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{item.name}</Text>
              <Text style={styles.sub}>
                {item.quantity_on_hand} {item.unit} on hand
                {item.quantity_on_hand <= item.reorder_threshold ? " (low)" : ""}
              </Text>
            </View>
            <View style={styles.reorderCol}>
              <Text style={styles.reorderLabel}>Reorder</Text>
              <Switch
                value={item.reorder_flag}
                onValueChange={() => toggleReorder(item)}
                trackColor={{ false: colors.lightGray, true: colors.gold }}
                thumbColor={colors.white}
              />
            </View>
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.warmGray, paddingHorizontal: 16, paddingTop: 12 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  empty: { textAlign: "center", color: "#999", marginTop: 40, paddingHorizontal: 20 },
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
  row: { flexDirection: "row", alignItems: "center" },
  title: { fontSize: 16, fontWeight: "600", color: colors.dark },
  sub: { fontSize: 13, color: "#666", marginTop: 2 },
  reorderCol: { alignItems: "center" },
  reorderLabel: { fontSize: 11, color: "#999", marginBottom: 4 },
});
