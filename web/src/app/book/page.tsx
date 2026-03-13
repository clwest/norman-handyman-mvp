"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { createBookingRequest } from "@/lib/api";

export default function BookPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);

    try {
      await createBookingRequest({
        customer_name: form.get("name") as string,
        customer_email: form.get("email") as string,
        customer_phone: form.get("phone") as string,
        customer_address: form.get("address") as string,
        description: form.get("description") as string,
        preferred_date: (form.get("preferred_date") as string) || undefined,
      });
      router.push("/book/confirmation");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Header />

      <section className="py-16">
        <div className="max-w-2xl mx-auto px-6">
          <h1 className="text-3xl font-bold text-navy mb-2">
            Request an Appointment
          </h1>
          <p className="text-dark/60 mb-8">
            Tell us what you need help with and we&apos;ll confirm your appointment
            within one business day.
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="name" className="block font-medium text-navy mb-1">
                Your name *
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-steel focus:border-steel outline-none"
                placeholder="Full name"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="email" className="block font-medium text-navy mb-1">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-steel focus:border-steel outline-none"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label htmlFor="phone" className="block font-medium text-navy mb-1">
                  Phone *
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-steel focus:border-steel outline-none"
                  placeholder="(405) 555-0123"
                />
              </div>
            </div>

            <div>
              <label htmlFor="address" className="block font-medium text-navy mb-1">
                Address
              </label>
              <input
                id="address"
                name="address"
                type="text"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-steel focus:border-steel outline-none"
                placeholder="Street address in Norman, OK"
              />
            </div>

            <div>
              <label htmlFor="description" className="block font-medium text-navy mb-1">
                What do you need help with? *
              </label>
              <textarea
                id="description"
                name="description"
                required
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-steel focus:border-steel outline-none resize-y"
                placeholder="Describe the job — the more detail, the better we can prepare."
              />
            </div>

            <div>
              <label htmlFor="preferred_date" className="block font-medium text-navy mb-1">
                Preferred date (optional)
              </label>
              <input
                id="preferred_date"
                name="preferred_date"
                type="date"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-steel focus:border-steel outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gold text-navy font-bold text-lg py-4 rounded-lg hover:brightness-110 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Submitting..." : "Submit Request"}
            </button>

            <p className="text-sm text-dark/50 text-center">
              We&apos;ll review your request and call or email to confirm details.
              No payment required at this step.
            </p>
          </form>
        </div>
      </section>

      <Footer />
    </>
  );
}
