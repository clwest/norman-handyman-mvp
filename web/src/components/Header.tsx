import Link from "next/link";
import { siteConfig } from "@/lib/site-config";

export default function Header() {
  return (
    <header className="bg-navy text-white">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold tracking-tight">
          {siteConfig.name}
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link href="/#services" className="hover:text-gold transition-colors">
            Services
          </Link>
          <Link href="/#how-it-works" className="hover:text-gold transition-colors">
            How It Works
          </Link>
          <Link href="/#faq" className="hover:text-gold transition-colors">
            FAQ
          </Link>
          <Link
            href="/book"
            className="bg-gold text-navy font-semibold px-5 py-2 rounded-lg hover:brightness-110 transition"
          >
            Request Appointment
          </Link>
        </nav>
      </div>
    </header>
  );
}
