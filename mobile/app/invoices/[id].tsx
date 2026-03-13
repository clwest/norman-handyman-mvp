import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Share,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { getInvoice, sendInvoice, markInvoicePaid, createCheckout } from "../../lib/api";
import { colors } from "../../lib/colors";

interface LineItem {
  description: string;
  qty: number;
  unit_price: string;
}

interface InvoiceDetail {
  id: number;
  status: string;
  total: string;
  tax_amount: string;
  line_items: LineItem[];
  customer_name: string;
  due_date: string | null;
  notes: string;
  paid_at: string | null;
}

export default function InvoiceDetailScreen() {
  const { id } = useLocalSearchParams();
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getInvoice(Number(id))
      .then(setInvoice)
      .catch(() => Alert.alert("Error", "Failed to load invoice"))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSend() {
    try {
      const updated = await sendInvoice(Number(id));
      setInvoice(updated);
      Alert.alert("Sent", "Invoice sent to customer.");
    } catch {
      Alert.alert("Error", "Failed to send invoice");
    }
  }

  async function handleMarkPaid() {
    Alert.alert("Mark Paid", "Mark this invoice as paid?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Mark Paid",
        onPress: async () => {
          try {
            const updated = await markInvoicePaid(Number(id));
            setInvoice(updated);
          } catch {
            Alert.alert("Error", "Failed to mark invoice paid");
          }
        },
      },
    ]);
  }

  async function handleCheckout() {
    try {
      const result = await createCheckout(Number(id));
      if (result.checkout_url) {
        await Share.share({ message: `Pay invoice: ${result.checkout_url}` });
      }
    } catch {
      Alert.alert("Error", "Failed to create checkout link");
    }
  }

  if (loading || !invoice) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.steel} />
      </View>
    );
  }

  const subtotal = (parseFloat(invoice.total) - parseFloat(invoice.tax_amount)).toFixed(2);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Invoice #{invoice.id}</Text>
        <View style={[styles.badge, { backgroundColor: statusColors[invoice.status] || "#999" }]}>
          <Text style={styles.badgeText}>{invoice.status}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Customer</Text>
        <Text style={styles.value}>{invoice.customer_name}</Text>
      </View>

      {/* Line Items */}
      <View style={styles.section}>
        <Text style={styles.label}>Line Items</Text>
        {invoice.line_items.map((item, i) => (
          <View key={i} style={styles.lineItem}>
            <Text style={styles.lineDesc}>{item.description}</Text>
            <Text style={styles.lineAmount}>
              {item.qty} x ${parseFloat(item.unit_price).toFixed(2)}
            </Text>
          </View>
        ))}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal</Text>
          <Text style={styles.totalValue}>${subtotal}</Text>
        </View>
        {parseFloat(invoice.tax_amount) > 0 && (
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tax</Text>
            <Text style={styles.totalValue}>${parseFloat(invoice.tax_amount).toFixed(2)}</Text>
          </View>
        )}
        <View style={[styles.totalRow, styles.grandTotal]}>
          <Text style={styles.grandTotalLabel}>Total</Text>
          <Text style={styles.grandTotalValue}>${parseFloat(invoice.total).toFixed(2)}</Text>
        </View>
      </View>

      {invoice.due_date && (
        <View style={styles.section}>
          <Text style={styles.label}>Due Date</Text>
          <Text style={styles.value}>{invoice.due_date}</Text>
        </View>
      )}

      {invoice.paid_at && (
        <View style={styles.section}>
          <Text style={styles.label}>Paid At</Text>
          <Text style={[styles.value, { color: colors.green }]}>{invoice.paid_at}</Text>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        {invoice.status === "DRAFT" && (
          <TouchableOpacity style={styles.actionBtn} onPress={handleSend}>
            <Text style={styles.actionBtnText}>Send to Customer</Text>
          </TouchableOpacity>
        )}
        {(invoice.status === "SENT" || invoice.status === "OVERDUE") && (
          <>
            <TouchableOpacity style={styles.actionBtn} onPress={handleCheckout}>
              <Text style={styles.actionBtnText}>Create Payment Link</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.green }]}
              onPress={handleMarkPaid}
            >
              <Text style={styles.actionBtnText}>Mark as Paid</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const statusColors: Record<string, string> = {
  DRAFT: "#999",
  SENT: colors.steel,
  PAID: colors.green,
  OVERDUE: colors.red,
  VOID: "#666",
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.warmGray },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    backgroundColor: colors.white,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { fontSize: 20, fontWeight: "bold", color: colors.dark },
  badge: { borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { color: colors.white, fontSize: 12, fontWeight: "bold" },
  section: {
    backgroundColor: colors.white,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
  },
  label: { fontSize: 12, color: "#999", textTransform: "uppercase", marginBottom: 6 },
  value: { fontSize: 16, color: colors.dark },
  lineItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  lineDesc: { fontSize: 15, color: colors.dark, flex: 1 },
  lineAmount: { fontSize: 15, color: "#666" },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    marginTop: 4,
  },
  totalLabel: { fontSize: 14, color: "#666" },
  totalValue: { fontSize: 14, color: colors.dark },
  grandTotal: { borderTopWidth: 1, borderTopColor: colors.lightGray, paddingTop: 8, marginTop: 4 },
  grandTotalLabel: { fontSize: 16, fontWeight: "bold", color: colors.navy },
  grandTotalValue: { fontSize: 16, fontWeight: "bold", color: colors.navy },
  actions: { padding: 16, gap: 10 },
  actionBtn: {
    backgroundColor: colors.gold,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  actionBtnText: { color: colors.white, fontSize: 16, fontWeight: "bold" },
});
