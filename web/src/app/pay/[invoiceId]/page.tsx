"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getPublicInvoice, createPublicCheckout, type PublicInvoice } from "@/lib/api";

export default function PayInvoicePage() {
  const params = useParams();
  const invoiceId = params.invoiceId as string;
  const [invoice, setInvoice] = useState<PublicInvoice | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    getPublicInvoice(invoiceId)
      .then(setInvoice)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [invoiceId]);

  if (loading) {
    return (
      <>
        <Header />
        <div className="py-20 text-center text-dark/50">Loading invoice...</div>
        <Footer />
      </>
    );
  }

  if (error || !invoice) {
    return (
      <>
        <Header />
        <div className="py-20 text-center">
          <h1 className="text-2xl font-bold text-navy mb-4">Invoice not found</h1>
          <p className="text-dark/60">{error || "This invoice could not be loaded."}</p>
        </div>
        <Footer />
      </>
    );
  }

  const isPaid = invoice.status === "PAID";
  const subtotal = (
    parseFloat(invoice.total) - parseFloat(invoice.tax_amount)
  ).toFixed(2);

  return (
    <>
      <Header />

      <section className="py-16">
        <div className="max-w-xl mx-auto px-6">
          {isPaid ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center mb-8">
              <div className="text-green-600 text-4xl mb-2">&#10003;</div>
              <h1 className="text-2xl font-bold text-green-800">
                Invoice Paid
              </h1>
              <p className="text-green-700 mt-1">
                Thank you for your payment.
              </p>
            </div>
          ) : (
            <h1 className="text-2xl font-bold text-navy mb-6">
              Invoice #{invoice.id}
            </h1>
          )}

          {/* Line items */}
          <div className="border border-gray-200 rounded-xl overflow-hidden mb-6">
            <table className="w-full text-sm">
              <thead className="bg-warm-gray">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-navy">
                    Description
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-navy w-16">
                    Qty
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-navy w-24">
                    Price
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoice.line_items.map((item, i) => (
                  <tr key={i} className="border-t border-gray-100">
                    <td className="px-4 py-3">{item.description}</td>
                    <td className="px-4 py-3 text-right">{item.qty}</td>
                    <td className="px-4 py-3 text-right">
                      ${parseFloat(item.unit_price).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="border-t border-gray-200 px-4 py-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-dark/60">Subtotal</span>
                <span>${subtotal}</span>
              </div>
              {parseFloat(invoice.tax_amount) > 0 && (
                <div className="flex justify-between">
                  <span className="text-dark/60">Tax</span>
                  <span>${parseFloat(invoice.tax_amount).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-navy text-base pt-2 border-t border-gray-100">
                <span>Total</span>
                <span>${parseFloat(invoice.total).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {invoice.due_date && !isPaid && (
            <p className="text-sm text-dark/50 mb-4">
              Due by: {new Date(invoice.due_date).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          )}

          {invoice.notes && (
            <p className="text-sm text-dark/60 bg-warm-gray rounded-lg p-4 mb-6">
              {invoice.notes}
            </p>
          )}

          {!isPaid && (
            <div className="mt-6">
              <button
                onClick={async () => {
                  setPaying(true);
                  try {
                    const { checkout_url } = await createPublicCheckout(invoiceId);
                    window.location.href = checkout_url;
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "Payment failed");
                    setPaying(false);
                  }
                }}
                disabled={paying}
                className="w-full bg-gold text-navy font-bold text-lg py-4 rounded-lg hover:brightness-110 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {paying ? "Redirecting to payment..." : `Pay $${parseFloat(invoice.total).toFixed(2)} Now`}
              </button>
              <p className="text-center text-sm text-dark/50 mt-3">
                Secure payment powered by Stripe. You&apos;ll be redirected to complete payment.
              </p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </>
  );
}
