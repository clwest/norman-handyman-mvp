import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Share,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { createInvoice, sendInvoice, createCheckout } from "../../lib/api";
import { colors } from "../../lib/colors";

interface LineItem {
  description: string;
  qty: string;
  unit_price: string;
}

const DEFAULT_NOTES =
  "Thank you for choosing Norman Handyman Services. If you have any questions about this invoice, reply to this message or call us.";

export default function CreateInvoiceScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const jobId = Number(params.jobId);
  const customerId = Number(params.customerId);
  const jobTitle = (params.jobTitle as string) || "Job";

  // If coming from estimate, pre-populate line items
  const prefillItems = params.lineItems
    ? (JSON.parse(params.lineItems as string) as LineItem[])
    : [{ description: "", qty: "1", unit_price: "" }];

  const [items, setItems] = useState<LineItem[]>(prefillItems);
  const [notes, setNotes] = useState(DEFAULT_NOTES);
  const [taxRate, setTaxRate] = useState("0");
  const [saving, setSaving] = useState(false);

  function addItem() {
    setItems([...items, { description: "", qty: "1", unit_price: "" }]);
  }

  function updateItem(index: number, field: keyof LineItem, value: string) {
    setItems(items.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  }

  function removeItem(index: number) {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  }

  function calcSubtotal() {
    return items.reduce((sum, item) => {
      const qty = parseFloat(item.qty) || 0;
      const price = parseFloat(item.unit_price) || 0;
      return sum + qty * price;
    }, 0);
  }

  function calcTotal() {
    const sub = calcSubtotal();
    const tax = sub * (parseFloat(taxRate) || 0) / 100;
    return (sub + tax).toFixed(2);
  }

  async function handleSave(action: "draft" | "send" | "checkout") {
    const validItems = items.filter((i) => i.description && i.unit_price);
    if (validItems.length === 0) {
      Alert.alert("Required", "Add at least one line item.");
      return;
    }

    setSaving(true);
    try {
      const lineItems = validItems.map((i) => ({
        description: i.description,
        qty: parseInt(i.qty) || 1,
        unit_price: parseFloat(i.unit_price).toFixed(2),
      }));

      const invoice = await createInvoice({
        job: jobId,
        customer: customerId,
        line_items: lineItems,
        tax_rate: (parseFloat(taxRate) || 0) / 100,
        notes,
      });

      if (action === "send") {
        await sendInvoice(invoice.id);
        Alert.alert("Sent", "Invoice created and sent to customer.", [
          { text: "OK", onPress: () => router.back() },
        ]);
      } else if (action === "checkout") {
        const result = await createCheckout(invoice.id);
        if (result.checkout_url) {
          await Share.share({ message: `Pay your invoice: ${result.checkout_url}` });
        }
        router.back();
      } else {
        Alert.alert("Saved", "Invoice saved as draft.", [
          { text: "OK", onPress: () => router.back() },
        ]);
      }
    } catch {
      Alert.alert("Error", "Failed to save invoice");
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView style={styles.container}>
        <Text style={styles.jobTitle}>{jobTitle}</Text>

        <Text style={styles.sectionTitle}>Line Items</Text>
        {items.map((item, i) => (
          <View key={i} style={styles.lineItemRow}>
            <View style={{ flex: 1 }}>
              <TextInput
                style={styles.input}
                placeholder="Description"
                value={item.description}
                onChangeText={(v) => updateItem(i, "description", v)}
              />
              <View style={styles.qtyPriceRow}>
                <TextInput
                  style={[styles.input, styles.qtyInput]}
                  placeholder="Qty"
                  keyboardType="number-pad"
                  value={item.qty}
                  onChangeText={(v) => updateItem(i, "qty", v)}
                />
                <TextInput
                  style={[styles.input, styles.priceInput]}
                  placeholder="Unit Price"
                  keyboardType="decimal-pad"
                  value={item.unit_price}
                  onChangeText={(v) => updateItem(i, "unit_price", v)}
                />
              </View>
            </View>
            {items.length > 1 && (
              <TouchableOpacity onPress={() => removeItem(i)} style={styles.removeBtn}>
                <Text style={styles.removeBtnText}>X</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}

        <TouchableOpacity style={styles.addItemBtn} onPress={addItem}>
          <Text style={styles.addItemBtnText}>+ Add Line Item</Text>
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={styles.label}>Tax Rate (%)</Text>
          <TextInput
            style={[styles.input, { marginBottom: 0 }]}
            placeholder="0"
            keyboardType="decimal-pad"
            value={taxRate}
            onChangeText={setTaxRate}
          />
        </View>

        <View style={styles.totalSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>${calcSubtotal().toFixed(2)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tax</Text>
            <Text style={styles.totalValue}>
              ${(calcSubtotal() * (parseFloat(taxRate) || 0) / 100).toFixed(2)}
            </Text>
          </View>
          <View style={[styles.totalRow, styles.grandTotal]}>
            <Text style={styles.grandLabel}>Total</Text>
            <Text style={styles.grandValue}>${calcTotal()}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Notes</Text>
        <TextInput
          style={[styles.input, styles.notesInput]}
          multiline
          value={notes}
          onChangeText={setNotes}
        />

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.steel }]}
            onPress={() => handleSave("draft")}
            disabled={saving}
          >
            <Text style={styles.actionBtnText}>Save Draft</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, saving && { opacity: 0.6 }]}
            onPress={() => handleSave("checkout")}
            disabled={saving}
          >
            <Text style={styles.actionBtnText}>
              {saving ? "Saving..." : "Create & Share Link"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.warmGray, padding: 16 },
  jobTitle: { fontSize: 14, color: "#999", marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "bold", color: colors.navy, marginBottom: 10, marginTop: 16 },
  lineItemRow: {
    flexDirection: "row",
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    alignItems: "flex-start",
  },
  input: {
    backgroundColor: colors.warmGray,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.dark,
    marginBottom: 6,
  },
  qtyPriceRow: { flexDirection: "row", gap: 8 },
  qtyInput: { width: 60 },
  priceInput: { flex: 1 },
  removeBtn: {
    marginLeft: 8,
    marginTop: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.lightGray,
    alignItems: "center",
    justifyContent: "center",
  },
  removeBtnText: { color: "#999", fontWeight: "bold", fontSize: 12 },
  addItemBtn: {
    borderWidth: 1,
    borderColor: colors.steel,
    borderStyle: "dashed",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 8,
  },
  addItemBtnText: { color: colors.steel, fontWeight: "600" },
  section: {
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 14,
    marginTop: 8,
  },
  label: { fontSize: 13, color: "#999", marginBottom: 6 },
  totalSection: {
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 14,
    marginTop: 8,
  },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  totalLabel: { fontSize: 14, color: "#666" },
  totalValue: { fontSize: 14, color: colors.dark },
  grandTotal: { borderTopWidth: 1, borderTopColor: colors.lightGray, paddingTop: 8, marginTop: 4 },
  grandLabel: { fontSize: 16, fontWeight: "bold", color: colors.navy },
  grandValue: { fontSize: 20, fontWeight: "bold", color: colors.navy },
  notesInput: { minHeight: 80, textAlignVertical: "top" },
  actions: { flexDirection: "row", gap: 10, marginTop: 16 },
  actionBtn: {
    flex: 1,
    backgroundColor: colors.gold,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  actionBtnText: { color: colors.white, fontSize: 16, fontWeight: "bold" },
});
