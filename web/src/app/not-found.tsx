import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function NotFound() {
  return (
    <>
      <Header />
      <section className="py-20">
        <div className="max-w-xl mx-auto px-6 text-center">
          <h1 className="text-6xl font-bold text-navy mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-dark mb-4">
            Page not found
          </h2>
          <p className="text-dark/60 mb-8">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="bg-navy text-white font-semibold px-6 py-3 rounded-lg hover:brightness-125 transition"
            >
              Go Home
            </Link>
            <Link
              href="/book"
              className="bg-gold text-navy font-semibold px-6 py-3 rounded-lg hover:brightness-110 transition"
            >
              Request Appointment
            </Link>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
