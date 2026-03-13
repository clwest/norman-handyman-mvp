import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Linking,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getJob, startJob, completeJob } from "../../lib/api";
import { colors } from "../../lib/colors";

interface JobDetail {
  id: number;
  title: string;
  description: string;
  status: string;
  customer: number;
  customer_name: string;
  scheduled_date: string | null;
  scheduled_time: string | null;
  completed_at: string | null;
  notes: string;
}

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getJob(Number(id))
      .then(setJob)
      .catch(() => Alert.alert("Error", "Failed to load job"))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleStart() {
    try {
      const updated = await startJob(Number(id));
      setJob(updated);
    } catch {
      Alert.alert("Error", "Failed to start job");
    }
  }

  async function handleComplete() {
    Alert.alert("Complete Job", "Mark this job as completed?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Complete",
        onPress: async () => {
          try {
            const updated = await completeJob(Number(id));
            setJob(updated);
          } catch {
            Alert.alert("Error", "Failed to complete job");
          }
        },
      },
    ]);
  }

  if (loading || !job) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.steel} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{job.title}</Text>
        <View style={[styles.badge, { backgroundColor: statusColors[job.status] || "#999" }]}>
          <Text style={styles.badgeText}>{job.status}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Customer</Text>
        <Text style={styles.value}>{job.customer_name}</Text>
      </View>

      {job.scheduled_date && (
        <View style={styles.section}>
          <Text style={styles.label}>Scheduled</Text>
          <Text style={styles.value}>
            {job.scheduled_date}
            {job.scheduled_time ? ` at ${job.scheduled_time}` : ""}
          </Text>
        </View>
      )}

      {job.description ? (
        <View style={styles.section}>
          <Text style={styles.label}>Description</Text>
          <Text style={styles.value}>{job.description}</Text>
        </View>
      ) : null}

      {job.notes ? (
        <View style={styles.section}>
          <Text style={styles.label}>Notes</Text>
          <Text style={styles.value}>{job.notes}</Text>
        </View>
      ) : null}

      {/* Actions */}
      <View style={styles.actions}>
        {job.status === "SCHEDULED" && (
          <TouchableOpacity style={styles.actionBtn} onPress={handleStart}>
            <Text style={styles.actionBtnText}>Start Job</Text>
          </TouchableOpacity>
        )}
        {job.status === "IN_PROGRESS" && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.green }]}
            onPress={handleComplete}
          >
            <Text style={styles.actionBtnText}>Complete Job</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.steel }]}
          onPress={() =>
            router.push({
              pathname: "/estimates/create",
              params: { jobId: job.id, customerId: job.customer, jobTitle: job.title },
            })
          }
        >
          <Text style={styles.actionBtnText}>Create Estimate</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.navy }]}
          onPress={() =>
            router.push({
              pathname: "/invoices/create",
              params: { jobId: job.id, customerId: job.customer, jobTitle: job.title },
            })
          }
        >
          <Text style={styles.actionBtnText}>Create Invoice</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: "#6B7280" }]}
          onPress={() => Linking.openURL(`tel:`)}
        >
          <Text style={styles.actionBtnText}>Call Customer</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const statusColors: Record<string, string> = {
  SCHEDULED: colors.steel,
  IN_PROGRESS: colors.gold,
  COMPLETED: colors.green,
  CANCELED: colors.red,
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.warmGray },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    backgroundColor: colors.white,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
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
  actionBtnText: { color: colors.white, fontSize: 16, fontWeight: "bold" },
});
