"use client";

import { useState } from "react";
import Link from "next/link";
import { siteConfig } from "@/lib/site-config";

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="bg-navy text-white relative">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold tracking-tight">
          {siteConfig.name}
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link href="/#services" className="hover:text-gold transition-colors">
            Services
          </Link>
          <Link href="/#how-it-works" className="hover:text-gold transition-colors">
            How It Works
          </Link>
          <Link href="/#faq" className="hover:text-gold transition-colors">
            FAQ
          </Link>
          {siteConfig.phone && (
            <a href={`tel:${siteConfig.phone}`} className="hover:text-gold transition-colors">
              {siteConfig.phone}
            </a>
          )}
          <Link
            href="/book"
            className="bg-gold text-navy font-semibold px-5 py-2 rounded-lg hover:brightness-110 transition"
          >
            Request Appointment
          </Link>
        </nav>

        {/* Mobile: CTA always visible + hamburger */}
        <div className="flex items-center gap-3 md:hidden">
          <Link
            href="/book"
            className="bg-gold text-navy font-semibold text-sm px-4 py-2 rounded-lg hover:brightness-110 transition"
          >
            Book Now
          </Link>
          <button
            onClick={() => setOpen(!open)}
            className="p-2 hover:bg-white/10 rounded-lg transition"
            aria-label="Menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {open ? (
                <path d="M6 6l12 12M6 18L18 6" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <nav className="md:hidden border-t border-white/10 bg-navy px-6 py-4 space-y-3 text-base">
          <Link href="/#services" onClick={() => setOpen(false)} className="block py-2 hover:text-gold transition-colors">
            Services
          </Link>
          <Link href="/#how-it-works" onClick={() => setOpen(false)} className="block py-2 hover:text-gold transition-colors">
            How It Works
          </Link>
          <Link href="/#faq" onClick={() => setOpen(false)} className="block py-2 hover:text-gold transition-colors">
            FAQ
          </Link>
          {siteConfig.phone && (
            <a href={`tel:${siteConfig.phone}`} className="block py-2 hover:text-gold transition-colors">
              Call: {siteConfig.phone}
            </a>
          )}
        </nav>
      )}
    </header>
  );
}
