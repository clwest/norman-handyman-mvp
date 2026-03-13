// ============================================================
// Site Configuration — Update with real business details
// This is the SINGLE source of truth for brand/contact info.
// When Kurt provides real details, update here and everything
// (header, footer, emails, SEO, JSON-LD) updates automatically.
// ============================================================

export const siteConfig = {
  // Business identity
  name: "Norman Handyman Services",
  tagline: "Reliable home repairs done right.",
  legalName: "Norman Handyman Services", // for footer copyright

  // Contact — update with real Twilio/Google Voice number + email
  phone: "(405) 555-0123",
  email: "info@normanhandyman.com",

  // Location
  serviceArea: "Norman, OK and nearby neighborhoods",
  city: "Norman",
  state: "OK",
  zip: "73069",

  // Hours
  hours: "Mon\u2013Fri 8am\u20135pm, Sat by appointment",

  // Trust signals — set to true only if verified
  licensed: true,
  insured: true,
};

export const colors = {
  navy: "#0B1F3A",
  steel: "#2C5E8A",
  gold: "#C9A227",
  warmGray: "#F4F5F7",
  dark: "#111827",
};
