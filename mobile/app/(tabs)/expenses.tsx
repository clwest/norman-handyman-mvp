import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { getExpenses, createExpense } from "../../lib/api";
import { colors } from "../../lib/colors";

interface Expense {
  id: number;
  description: string;
  amount: string;
  category: string;
  date: string;
  job: number | null;
}

const CATEGORIES = ["MATERIALS", "TOOLS", "FUEL", "SUBCONTRACTOR", "OTHER"];

export default function ExpensesTab() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  // Form state
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("MATERIALS");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getExpenses();
      setExpenses(data.results || data);
    } catch {
      // fail silently
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSave() {
    if (!desc || !amount) {
      Alert.alert("Required", "Please enter a description and amount.");
      return;
    }
    setSaving(true);
    try {
      await createExpense({
        description: desc,
        amount: parseFloat(amount).toFixed(2),
        category,
        date: new Date().toISOString().split("T")[0],
      });
      setShowAdd(false);
      setDesc("");
      setAmount("");
      setCategory("MATERIALS");
      load();
    } catch {
      Alert.alert("Error", "Failed to save expense");
    } finally {
      setSaving(false);
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
    <View style={styles.container}>
      <FlatList
        data={expenses}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        ListEmptyComponent={
          <Text style={styles.empty}>No expenses yet. Tap &quot;Add Expense&quot; to log a receipt.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.title}>{item.description}</Text>
              <Text style={styles.amount}>${parseFloat(item.amount).toFixed(2)}</Text>
            </View>
            <Text style={styles.sub}>{item.category} &middot; {item.date}</Text>
          </View>
        )}
      />

      <TouchableOpacity style={styles.fab} onPress={() => setShowAdd(true)}>
        <Text style={styles.fabText}>+ Add Expense</Text>
      </TouchableOpacity>

      <Modal visible={showAdd} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.modal}>
            <ScrollView>
              <Text style={styles.modalTitle}>Add Expense</Text>
              <Text style={styles.helper}>Keep it simple — you can add details later.</Text>

              <Text style={styles.label}>Description *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Outlet covers from Home Depot"
                value={desc}
                onChangeText={setDesc}
              />

              <Text style={styles.label}>Amount *</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={setAmount}
              />

              <Text style={styles.label}>Category</Text>
              <View style={styles.categoryRow}>
                {CATEGORIES.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.categoryPill, category === c && styles.categoryActive]}
                    onPress={() => setCategory(c)}
                  >
                    <Text style={[styles.categoryText, category === c && styles.categoryTextActive]}>
                      {c}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: colors.lightGray }]}
                  onPress={() => setShowAdd(false)}
                >
                  <Text style={[styles.actionBtnText, { color: colors.dark }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, saving && { opacity: 0.6 }]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  <Text style={styles.actionBtnText}>
                    {saving ? "Saving..." : "Save Expense"}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
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
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 16, fontWeight: "600", color: colors.dark, flex: 1, marginRight: 8 },
  amount: { fontSize: 16, fontWeight: "bold", color: colors.navy },
  sub: { fontSize: 13, color: "#666", marginTop: 4 },
  fab: {
    position: "absolute",
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: colors.gold,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  fabText: { color: colors.navy, fontSize: 16, fontWeight: "bold" },
  modalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" },
  modal: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "80%",
  },
  modalTitle: { fontSize: 20, fontWeight: "bold", color: colors.navy, marginBottom: 4 },
  helper: { fontSize: 14, color: "#999", marginBottom: 16 },
  label: { fontSize: 14, fontWeight: "600", color: colors.dark, marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: colors.warmGray,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.dark,
  },
  categoryRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  categoryPill: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.warmGray,
  },
  categoryActive: { backgroundColor: colors.steel },
  categoryText: { fontSize: 12, color: "#666" },
  categoryTextActive: { color: colors.white, fontWeight: "bold" },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 20 },
  actionBtn: {
    flex: 1,
    backgroundColor: colors.gold,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  actionBtnText: { color: colors.white, fontSize: 16, fontWeight: "bold" },
});
