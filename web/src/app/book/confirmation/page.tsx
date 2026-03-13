import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { siteConfig } from "@/lib/site-config";

export default function BookingConfirmation() {
  return (
    <>
      <Header />

      <section className="py-20">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 text-3xl flex items-center justify-center mx-auto mb-6">
            &#10003;
          </div>
          <h1 className="text-3xl font-bold text-navy mb-4">
            Request received!
          </h1>
          <p className="text-dark/70 text-lg mb-8 max-w-lg mx-auto">
            Thank you for reaching out. We&apos;ll review your request and contact
            you within one business day to confirm details and schedule your
            appointment.
          </p>

          <div className="bg-warm-gray rounded-xl p-6 text-left space-y-3 mb-8">
            <h2 className="font-semibold text-navy">What happens next?</h2>
            <ol className="list-decimal list-inside space-y-2 text-dark/70">
              <li>We review your request and assess the scope.</li>
              <li>We&apos;ll call or email to confirm the job and schedule a time.</li>
              <li>We arrive on time, do the work, and clean up.</li>
              <li>You receive an invoice with a secure payment link.</li>
            </ol>
          </div>

          <p className="text-dark/50 text-sm mb-6">
            Questions? Call us at{" "}
            <a href={`tel:${siteConfig.phone}`} className="text-steel font-medium">
              {siteConfig.phone}
            </a>{" "}
            or email{" "}
            <a href={`mailto:${siteConfig.email}`} className="text-steel font-medium">
              {siteConfig.email}
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
