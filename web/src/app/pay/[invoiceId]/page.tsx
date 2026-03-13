"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getPublicInvoice, createPublicCheckout, type PublicInvoice } from "@/lib/api";
import { siteConfig } from "@/lib/site-config";

export default function PayInvoicePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const invoiceId = params.invoiceId as string;
  const justPaid = searchParams.get("paid") === "1";

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
        <section className="py-20">
          <div className="max-w-xl mx-auto px-6 text-center">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-48 mx-auto" />
              <div className="h-4 bg-gray-200 rounded w-64 mx-auto" />
              <div className="h-40 bg-gray-100 rounded-xl" />
            </div>
          </div>
        </section>
        <Footer />
      </>
    );
  }

  if (error || !invoice) {
    return (
      <>
        <Header />
        <section className="py-20">
          <div className="max-w-xl mx-auto px-6 text-center">
            <div className="text-5xl mb-4">&#128269;</div>
            <h1 className="text-2xl font-bold text-navy mb-4">Invoice not found</h1>
            <p className="text-dark/60 mb-6">
              {error === "Invoice not found"
                ? "This invoice doesn\u2019t exist or may have been removed."
                : error || "This invoice could not be loaded. Please try again."}
            </p>
            <p className="text-sm text-dark/50 mb-8">
              If you believe this is an error, please contact us at{" "}
              <a href={`tel:${siteConfig.phone}`} className="text-steel font-medium">
                {siteConfig.phone}
              </a>
            </p>
            <Link
              href="/"
              className="inline-block text-steel font-semibold hover:underline"
            >
              &larr; Back to home
            </Link>
          </div>
        </section>
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
          {/* Payment success banner (returned from Stripe) */}
          {justPaid && !isPaid && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 text-center mb-6">
              <h2 className="text-lg font-semibold text-blue-800 mb-1">
                Payment processing
              </h2>
              <p className="text-blue-700 text-sm">
                Your payment is being confirmed. This page will update shortly.
                Refresh in a moment if the status doesn&apos;t change.
              </p>
            </div>
          )}

          {isPaid ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center mb-8">
              <div className="text-green-600 text-4xl mb-2">&#10003;</div>
              <h1 className="text-2xl font-bold text-green-800">
                Invoice Paid
              </h1>
              <p className="text-green-700 mt-1">
                Thank you for your payment. A confirmation has been sent to your email.
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

          {!isPaid && !justPaid && (
            <div className="mt-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-4 text-sm">
                  {error}
                </div>
              )}
              <button
                onClick={async () => {
                  setPaying(true);
                  setError("");
                  try {
                    const { checkout_url } = await createPublicCheckout(invoiceId);
                    window.location.href = checkout_url;
                  } catch (err) {
                    setError(
                      err instanceof Error
                        ? err.message
                        : "Unable to start payment. Please try again or contact us."
                    );
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
