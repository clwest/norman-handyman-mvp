import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const services = [
  {
    title: "Electrical",
    body: "Fixture and fan replacements, lighting upgrades, switches and outlets, basic troubleshooting, and safety improvements.",
    examples: [
      "Replace light fixture or ceiling fan",
      "Upgrade interior/exterior lighting",
      "Switch and outlet replacement",
      "GFCI/AFCI safety checks",
    ],
  },
  {
    title: "Repairs & Fixes",
    body: "Small home repairs that make a big difference\u2014done cleanly and correctly so you don\u2019t have to revisit the same issue.",
    examples: [
      "Drywall patching and touch-ups",
      "Doors that stick or won\u2019t latch",
      "Trim, hardware, and minor carpentry",
      "Caulking and sealing",
    ],
  },
  {
    title: "Installations",
    body: "Professional installs with proper mounting, alignment, and cleanup\u2014especially helpful for heavier items.",
    examples: [
      "TV mounts and shelving",
      "Blinds and curtain rods",
      "Bathroom accessories",
      "Smart home basics",
    ],
  },
  {
    title: "Maintenance",
    body: "Prevent the little issues from becoming big ones. Great for homeowners who want a reliable go-to professional.",
    examples: [
      "Seasonal home checkup",
      "Weatherstripping and drafts",
      "Minor safety fixes",
      "Move-in / pre-sale punch lists",
    ],
  },
];

const howItWorks = [
  {
    step: "1",
    title: "Request a visit",
    body: "Tell us what you need help with, add photos if you\u2019d like, and choose a preferred time window.",
  },
  {
    step: "2",
    title: "We confirm details",
    body: "We\u2019ll review your request, confirm the scope, and lock in a time that works for you.",
  },
  {
    step: "3",
    title: "Job done right",
    body: "We arrive on time, treat your home with care, and complete the work with attention to detail.",
  },
  {
    step: "4",
    title: "Easy payment",
    body: "You\u2019ll receive an invoice with a secure online payment link. Pay by card\u2014simple and convenient.",
  },
];

const faqs = [
  {
    q: "How does pricing work?",
    a: "We provide a clear, written estimate before any work begins. No surprises. If the scope changes during the job, we\u2019ll discuss it with you first.",
  },
  {
    q: "What areas do you serve?",
    a: "We\u2019re based in Norman, Oklahoma and serve Norman and nearby neighborhoods. If you\u2019re just outside the area, send a request and we\u2019ll let you know availability.",
  },
  {
    q: "How quickly can you come out?",
    a: "Most requests are confirmed within one business day. For urgent needs, mention it in your request and we\u2019ll do our best to prioritize.",
  },
  {
    q: "Do I need to be home during the work?",
    a: "For most jobs, yes\u2014at least at the start. We\u2019ll discuss access and any special instructions when we confirm the appointment.",
  },
  {
    q: "How do I pay?",
    a: "After the job is complete, you\u2019ll receive an invoice with a secure online payment link. Pay by card from your phone or computer.",
  },
  {
    q: "Are you licensed and insured?",
    a: "Yes. We carry general liability insurance and have decades of hands-on trade experience, including electrical work.",
  },
];

export default function Home() {
  return (
    <>
      <Header />

      {/* Hero */}
      <section className="bg-navy text-white py-20 md:py-28">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
            Premium handyman &amp; electrical help for Norman homeowners.
          </h1>
          <p className="text-lg md:text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            On-time, respectful service with clear estimates and quality
            workmanship. Request an appointment and we&apos;ll confirm your time
            window quickly.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/book"
              className="bg-gold text-navy font-bold text-lg px-8 py-4 rounded-lg hover:brightness-110 transition"
            >
              Request an Appointment
            </Link>
            <a
              href="#services"
              className="border-2 border-white/30 text-white font-semibold text-lg px-8 py-4 rounded-lg hover:border-white/60 transition"
            >
              See Services
            </a>
          </div>
          <div className="mt-10 flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm text-white/70">
            <span>Decades of trade experience</span>
            <span>Clear, written estimates</span>
            <span>Respectful, clean work</span>
            <span>Reliable scheduling</span>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 bg-warm-gray">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-navy mb-12">
            How it works
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            {howItWorks.map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-12 h-12 rounded-full bg-steel text-white font-bold text-xl flex items-center justify-center mx-auto mb-4">
                  {s.step}
                </div>
                <h3 className="font-semibold text-lg text-navy mb-2">
                  {s.title}
                </h3>
                <p className="text-dark/70 text-base">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="py-16">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-navy mb-4">
            Services
          </h2>
          <p className="text-center text-dark/60 mb-12 max-w-2xl mx-auto">
            A practical mix of repairs, installations, and maintenance&mdash;focused
            on safety, reliability, and long-term fixes.
          </p>
          <div className="grid md:grid-cols-2 gap-8">
            {services.map((svc) => (
              <div
                key={svc.title}
                className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition"
              >
                <h3 className="text-xl font-bold text-navy mb-2">
                  {svc.title}
                </h3>
                <p className="text-dark/70 mb-4">{svc.body}</p>
                <ul className="space-y-1">
                  {svc.examples.map((ex) => (
                    <li key={ex} className="text-sm text-dark/60 flex items-start gap-2">
                      <span className="text-gold mt-0.5">&#10003;</span>
                      {ex}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-dark/50 mt-8">
            Not sure if your project fits? Request an appointment and describe the
            job&mdash;we&apos;ll confirm the right approach before we schedule.
          </p>
        </div>
      </section>

      {/* Service Area */}
      <section className="py-16 bg-warm-gray">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-navy mb-4">Service area</h2>
          <p className="text-dark/70">
            Based in Norman, Oklahoma. We primarily serve Norman and nearby
            neighborhoods. If you&apos;re just outside the area, send a
            request&mdash;we&apos;ll let you know availability.
          </p>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-navy mb-4">
            What homeowners say
          </h2>
          <p className="text-center text-dark/50 text-sm mb-10">
            Early customers&mdash;thank you for trusting us and sharing feedback.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote:
                  "On time, professional, and the work was done cleanly. Exactly what we wanted.",
                name: "Homeowner in Norman",
              },
              {
                quote:
                  "Clear estimate, great communication, and everything works perfectly.",
                name: "Norman homeowner",
              },
              {
                quote:
                  "Respectful in our home and fixed it right the first time.",
                name: "Homeowner",
              },
            ].map((t) => (
              <blockquote
                key={t.name}
                className="border-l-4 border-gold pl-4 italic text-dark/70"
              >
                <p className="mb-2">&ldquo;{t.quote}&rdquo;</p>
                <cite className="text-sm not-italic font-semibold text-navy">
                  &mdash; {t.name}
                </cite>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-16 bg-warm-gray">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-navy mb-10">FAQ</h2>
          <div className="space-y-6">
            {faqs.map((faq) => (
              <details
                key={faq.q}
                className="bg-white rounded-lg p-5 shadow-sm group"
              >
                <summary className="font-semibold text-navy cursor-pointer list-none flex items-center justify-between">
                  {faq.q}
                  <span className="text-steel ml-2 group-open:rotate-180 transition-transform">
                    &#9662;
                  </span>
                </summary>
                <p className="mt-3 text-dark/70">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-navy text-white text-center">
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-4">
            Ready to get your project started?
          </h2>
          <p className="text-white/70 mb-8">
            Tell us what you need and we&apos;ll confirm your appointment quickly.
          </p>
          <Link
            href="/book"
            className="inline-block bg-gold text-navy font-bold text-lg px-8 py-4 rounded-lg hover:brightness-110 transition"
          >
            Request an Appointment
          </Link>
        </div>
      </section>

      <Footer />
    </>
  );
}
