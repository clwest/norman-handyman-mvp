import { siteConfig } from "@/lib/site-config";

export default function Footer() {
  return (
    <footer className="bg-navy text-white/80 mt-20">
      <div className="max-w-6xl mx-auto px-6 py-12 grid md:grid-cols-3 gap-8 text-sm">
        <div>
          <h3 className="font-bold text-white text-lg mb-2">{siteConfig.name}</h3>
          <p>{siteConfig.tagline}</p>
          <p className="mt-2">{siteConfig.serviceArea}</p>
        </div>
        <div>
          <h4 className="font-semibold text-white mb-2">Contact</h4>
          <p>Phone: {siteConfig.phone}</p>
          <p>Email: {siteConfig.email}</p>
          <p className="mt-2">{siteConfig.hours}</p>
        </div>
        <div>
          <h4 className="font-semibold text-white mb-2">Quick Links</h4>
          <ul className="space-y-1">
            <li><a href="/book" className="hover:text-gold transition-colors">Request Appointment</a></li>
            <li><a href="/#services" className="hover:text-gold transition-colors">Services</a></li>
            <li><a href="/#faq" className="hover:text-gold transition-colors">FAQ</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 text-center py-4 text-xs text-white/50">
        &copy; {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
      </div>
    </footer>
  );
}
