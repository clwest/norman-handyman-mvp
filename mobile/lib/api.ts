import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE =
  process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

const TOKEN_KEY = "auth_token";

export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function setToken(token: string): Promise<void> {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

async function authFetch(path: string, options: RequestInit = {}) {
  const token = await getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Token ${token}`;
  }
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

// Auth
export async function login(username: string, password: string) {
  const res = await fetch(`${API_BASE.replace("/api", "")}/api-token-auth/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error("Invalid credentials");
  const data = await res.json();
  await setToken(data.token);
  return data.token;
}

// Dashboard
export async function getDashboard() {
  const [todayJobs, newBookings, unpaidInvoices] = await Promise.all([
    authFetch("/jobs/?status=SCHEDULED&ordering=scheduled_date"),
    authFetch("/booking-requests/?status=NEW"),
    authFetch("/invoices/?status=SENT"),
  ]);
  return {
    todayJobs: todayJobs.results || todayJobs,
    newBookings: newBookings.results || newBookings,
    unpaidInvoices: unpaidInvoices.results || unpaidInvoices,
  };
}

// Booking Requests
export const getBookingRequests = () => authFetch("/booking-requests/");
export const getBookingRequest = (id: number) => authFetch(`/booking-requests/${id}/`);
export const convertToJob = (id: number) =>
  authFetch(`/booking-requests/${id}/convert_to_job/`, { method: "POST" });

// Jobs
export const getJobs = () => authFetch("/jobs/");
export const getJob = (id: number) => authFetch(`/jobs/${id}/`);
export const startJob = (id: number) =>
  authFetch(`/jobs/${id}/start/`, { method: "POST" });
export const completeJob = (id: number) =>
  authFetch(`/jobs/${id}/complete/`, { method: "POST" });

// Invoices
export const getInvoices = () => authFetch("/invoices/");
export const getInvoice = (id: number) => authFetch(`/invoices/${id}/`);
export const createInvoice = (data: Record<string, unknown>) =>
  authFetch("/invoices/", { method: "POST", body: JSON.stringify(data) });
export const sendInvoice = (id: number) =>
  authFetch(`/invoices/${id}/send_invoice/`, { method: "POST" });
export const markInvoicePaid = (id: number) =>
  authFetch(`/invoices/${id}/mark_paid/`, { method: "POST" });
export const createCheckout = (id: number) =>
  authFetch(`/invoices/${id}/create_checkout/`, { method: "POST" });

// Estimates
export const getEstimates = () => authFetch("/estimates/");
export const createEstimate = (data: Record<string, unknown>) =>
  authFetch("/estimates/", { method: "POST", body: JSON.stringify(data) });
export const sendEstimate = (id: number) =>
  authFetch(`/estimates/${id}/send_estimate/`, { method: "POST" });

// Expenses
export const getExpenses = () => authFetch("/expenses/");
export const createExpense = (data: Record<string, unknown>) =>
  authFetch("/expenses/", { method: "POST", body: JSON.stringify(data) });

// Supplies
export const getSupplies = () => authFetch("/supplies/");
export const updateSupply = (id: number, data: Record<string, unknown>) =>
  authFetch(`/supplies/${id}/`, { method: "PATCH", body: JSON.stringify(data) });
