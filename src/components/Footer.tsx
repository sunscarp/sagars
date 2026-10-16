"use client";

import { useState } from "react";
import Link from "next/link";
import { useContactInfo } from "@/hooks/useContactInfo";

function InstagramIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FacebookIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
    </svg>
  );
}

export default function Footer() {
  const { info } = useContactInfo();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;

    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/send-contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Newsletter Subscriber",
          subject: "Newsletter Subscription",
          email: trimmed,
          message: `New newsletter subscription request from ${trimmed}.`,
        }),
      });

      if (!res.ok) throw new Error("Request failed");

      setStatus("success");
      setMessage("Thank you — you're on the list.");
      setEmail("");
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  };

  const socials = [
    { href: info.instagramJewellery, label: "Instagram #1", Icon: InstagramIcon },
    { href: info.instagramHomeDecor, label: "Instagram #2", Icon: InstagramIcon },
    { href: info.facebookJewellery, label: "Facebook #1", Icon: FacebookIcon },
  ];

  const headingClass = "text-[11px] uppercase tracking-[0.2em] text-[#F5EBDD]";
  const linkClass = "text-[13px] text-white/70 transition-colors hover:text-white";

  return (
    <footer className="relative w-full overflow-hidden" style={{ backgroundColor: "#061B2A", color: "#F5EBDD" }}>
      <div
        aria-hidden
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/hero.jpeg')", transform: "scale(1.8)", transformOrigin: "center" }}
      />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ background: "linear-gradient(180deg, rgba(6,27,42,0.86) 0%, rgba(6,27,42,0.92) 100%)" }}
      />
      <div className="relative mx-auto max-w-[1600px] px-5 py-14 sm:px-[3%] sm:py-20">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-10">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="block">
              <span
                className="block text-[22px] leading-none text-[#F5EBDD] sm:text-[24px]"
                style={{ fontFamily: "var(--font-cormorant)", letterSpacing: "0.14em" }}
              >
                THE SAGAR&rsquo;S
              </span>
              <span className="mt-1.5 block text-[10px] uppercase tracking-[0.46em] text-[#9fb3c0]">
                Design House
              </span>
            </Link>
            <p className="mt-5 max-w-xs text-[13px] leading-[1.9] text-white/65">
              Timeless ethnic wear and bespoke tailoring, crafted with attention to every detail.
            </p>
            <div className="mt-6 flex items-center gap-3">
              {socials.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="grid h-9 w-9 place-items-center border border-white/20 text-white/80 transition-colors hover:border-white/60 hover:text-white"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className={headingClass}>Quick Links</h4>
            <ul className="mt-5 space-y-3">
              <li><Link href="/shop" className={linkClass}>Shop All</Link></li>
              <li><Link href="/about-us" className={linkClass}>About Us</Link></li>
              <li><Link href="/what-makes-us-special" className={linkClass}>What Makes Us Special</Link></li>
              <li><Link href="/services" className={linkClass}>Services</Link></li>
              <li><Link href="/orders" className={linkClass}>Track Your Order</Link></li>
            </ul>
          </div>

          {/* Customer Care */}
          <div>
            <h4 className={headingClass}>Customer Care</h4>
            <ul className="mt-5 space-y-3">
              <li><Link href="/faq" className={linkClass}>FAQ &amp; Contact</Link></li>
              <li><Link href="/shipping-policy" className={linkClass}>Shipping Policy</Link></li>
              <li><Link href="/refund-policy" className={linkClass}>Returns &amp; Refunds</Link></li>
              <li><Link href="/product-care" className={linkClass}>Product Care</Link></li>
              <li><Link href="/privacy-policy" className={linkClass}>Privacy Policy</Link></li>
              <li><Link href="/tos" className={linkClass}>Terms &amp; Conditions</Link></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className={headingClass}>Stay Connected</h4>
            <p className="mt-5 text-[13px] leading-relaxed text-white/65">
              Subscribe for new arrivals, styling notes and offers.
            </p>
            <form onSubmit={handleSubscribe} className="mt-5">
              <div className="flex items-stretch border border-white/25 focus-within:border-white/60">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email address"
                  aria-label="Email address"
                  className="min-w-0 flex-1 bg-transparent px-4 py-3 text-[13px] text-white placeholder:text-white/40 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="shrink-0 border-l border-white/25 px-4 text-[10px] uppercase tracking-[0.2em] text-[#F5EBDD] transition-colors hover:bg-white hover:text-[#061B2A] disabled:opacity-50"
                >
                  {status === "loading" ? "..." : "Join"}
                </button>
              </div>
              {message && (
                <p
                  className={`mt-3 text-[12px] ${status === "success" ? "text-[#9ed0b0]" : "text-[#e3a5a5]"}`}
                  role="status"
                >
                  {message}
                </p>
              )}
            </form>

            <div className="mt-7 space-y-2 text-[13px] text-white/65">
              <a
                href={`https://wa.me/${info.phone.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block transition-colors hover:text-white"
              >
                {info.phone}
              </a>
              <a href={`mailto:${info.email}`} className="block transition-colors hover:text-white">
                {info.email}
              </a>
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-white/15 pt-6 text-[11px] tracking-[0.05em] text-white/45">
          <span>© {new Date().getFullYear()} The Sagar&rsquo;s Design House. All rights reserved.</span>
          <span>SST No.: {info.sstNo} · {info.legalName}</span>
        </div>
      </div>
    </footer>
  );
}
