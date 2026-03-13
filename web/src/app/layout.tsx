import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { siteConfig } from "@/lib/site-config";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: `${siteConfig.name} — ${siteConfig.tagline}`,
    template: `%s | ${siteConfig.name}`,
  },
  description:
    "On-time, respectful handyman and electrical services for Norman, Oklahoma homeowners. Clear estimates, quality workmanship, easy online payment.",
  keywords: [
    "handyman Norman OK",
    "electrician Norman Oklahoma",
    "home repair Norman",
    "handyman services Norman",
    "electrical repair Norman OK",
  ],
  openGraph: {
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description:
      "Premium handyman and electrical services for Norman, Oklahoma homeowners. Request an appointment online.",
    type: "website",
    locale: "en_US",
    siteName: siteConfig.name,
  },
  robots: {
    index: true,
    follow: true,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "HomeAndConstructionBusiness",
  name: siteConfig.name,
  description: siteConfig.tagline,
  telephone: siteConfig.phone,
  email: siteConfig.email,
  areaServed: {
    "@type": "City",
    name: "Norman",
    addressRegion: "OK",
    addressCountry: "US",
  },
  address: {
    "@type": "PostalAddress",
    addressLocality: "Norman",
    addressRegion: "OK",
    addressCountry: "US",
  },
  openingHours: siteConfig.hours,
  priceRange: "$$",
  serviceType: [
    "Handyman Services",
    "Electrical Repair",
    "Home Repair",
    "Installation Services",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${inter.variable} antialiased`}>{children}</body>
    </html>
  );
}
