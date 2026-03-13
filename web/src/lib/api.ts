const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

export interface BookingRequestPayload {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  description: string;
  preferred_date?: string;
  photo_urls?: string[];
}

export interface PublicInvoice {
  id: number;
  status: string;
  line_items: { description: string; qty: number; unit_price: string }[];
  total: string;
  tax_amount: string;
  due_date: string | null;
  notes: string;
  created_at: string;
}

export async function createBookingRequest(payload: BookingRequestPayload) {
  const res = await fetch(`${API_BASE}/booking-requests/public/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Request failed (${res.status})`);
  }
  return res.json();
}

export async function getPublicInvoice(invoiceId: string): Promise<PublicInvoice> {
  const res = await fetch(`${API_BASE}/invoices/public/${invoiceId}/`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(res.status === 404 ? "Invoice not found" : `Error ${res.status}`);
  }
  return res.json();
}
