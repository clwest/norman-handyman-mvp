import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getBookingRequest, convertToJob } from "../../lib/api";
import { colors } from "../../lib/colors";

interface BookingDetail {
  id: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  description: string;
  preferred_date: string | null;
  status: string;
  created_at: string;
}

export default function BookingRequestDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [converting, setConverting] = useState(false);

  useEffect(() => {
    getBookingRequest(Number(id))
      .then(setBooking)
      .catch(() => Alert.alert("Error", "Failed to load booking request"))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleConvert() {
    Alert.alert(
      "Convert to Job",
      "This will create a customer and a new job from this booking request.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Convert",
          onPress: async () => {
            setConverting(true);
            try {
              const job = await convertToJob(Number(id));
              Alert.alert("Success", `Job created: ${job.title}`, [
                { text: "View Job", onPress: () => router.push(`/jobs/${job.id}`) },
                { text: "OK" },
              ]);
            } catch {
              Alert.alert("Error", "Failed to convert booking to job");
            } finally {
              setConverting(false);
            }
          },
        },
      ]
    );
  }

  if (loading || !booking) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.steel} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{booking.customer_name}</Text>
        <View style={[styles.badge, { backgroundColor: statusColors[booking.status] || "#999" }]}>
          <Text style={styles.badgeText}>{booking.status}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Description</Text>
        <Text style={styles.value}>{booking.description}</Text>
      </View>

      {booking.customer_phone ? (
        <View style={styles.section}>
          <Text style={styles.label}>Phone</Text>
          <Text style={styles.value}>{booking.customer_phone}</Text>
        </View>
      ) : null}

      {booking.customer_email ? (
        <View style={styles.section}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{booking.customer_email}</Text>
        </View>
      ) : null}

      {booking.customer_address ? (
        <View style={styles.section}>
          <Text style={styles.label}>Address</Text>
          <Text style={styles.value}>{booking.customer_address}</Text>
        </View>
      ) : null}

      {booking.preferred_date ? (
        <View style={styles.section}>
          <Text style={styles.label}>Preferred Date</Text>
          <Text style={styles.value}>{booking.preferred_date}</Text>
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.label}>Submitted</Text>
        <Text style={styles.value}>
          {new Date(booking.created_at).toLocaleDateString()}
        </Text>
      </View>

      {/* Actions */}
      {booking.status === "NEW" && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionBtn, converting && styles.disabled]}
            onPress={handleConvert}
            disabled={converting}
          >
            <Text style={styles.actionBtnText}>
              {converting ? "Converting..." : "Convert to Job"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const statusColors: Record<string, string> = {
  NEW: colors.gold,
  CONTACTED: colors.steel,
  SCHEDULED: colors.green,
  CLOSED: "#999",
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
  title: { fontSize: 20, fontWeight: "bold", color: colors.dark, flex: 1, marginRight: 8 },
  badge: { borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { color: colors.white, fontSize: 12, fontWeight: "bold" },
  section: {
    backgroundColor: colors.white,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
  },
  label: { fontSize: 12, color: "#999", textTransform: "uppercase", marginBottom: 4 },
  value: { fontSize: 16, color: colors.dark },
  actions: { padding: 16, gap: 10 },
  actionBtn: {
    backgroundColor: colors.gold,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  disabled: { opacity: 0.6 },
  actionBtnText: { color: colors.white, fontSize: 16, fontWeight: "bold" },
});
