"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { usePolicies } from "@/hooks/usePolicies";

export default function FAQPage() {
  const router = useRouter();
  const { policies, loading } = usePolicies();
  const page = policies.faq;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const COMMON_SUBJECT = "Website Inquiry (FAQ)";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setSent(null);

    try {
      const res = await fetch("/api/send-contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, subject: COMMON_SUBJECT, email, message }),
      });

      if (res.ok) {
        setSent("Message sent — we'll get back to you soon.");
        setName("");
        setEmail("");
        setMessage("");
        setTimeout(() => setSent(null), 4000);
      } else {
        const json = await res.json();
        setSent(json?.error || "Failed to send message.");
      }
    } catch (err: any) {
      setSent(err?.message || "Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="px-4 py-10 md:px-10 md:py-14 text-[#171813] flex justify-center">
      <div className="w-full max-w-4xl space-y-8">
        <div className="bg-white border border-[#D8D5CD] shadow-sm p-6 md:p-10 space-y-8">
          <header className="space-y-3">
            <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-sm text-[#595B53] hover:text-[#171813] hover:underline cursor-pointer">
              <span aria-hidden="true">←</span><span>Back</span>
            </button>
            <div>
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">{page.title}</h1>
              <p className="mt-2 text-sm md:text-base text-[#595B53] max-w-2xl">{page.subtitle}</p>
            </div>
          </header>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-[#171813] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            page.sections.map((s, i) => (
              <section key={i} className="space-y-2">
                <h2 className="text-xl md:text-2xl font-semibold">{s.heading}</h2>
                <div className="text-sm md:text-base text-[#595B53] leading-relaxed" dangerouslySetInnerHTML={{ __html: s.body }} />
              </section>
            ))
          )}
        </div>

        {/* Contact Form */}
        <div className="bg-white border border-[#D8D5CD] shadow-sm p-6 md:p-10 space-y-6">
          <div>
            <h2 className="text-xl md:text-2xl font-semibold">Still have questions?</h2>
            <p className="text-sm md:text-base text-[#595B53] mt-1">Fill out the form and we will respond within 24 hours.</p>
          </div>

          {sent && (
            <div className="px-4 py-3 rounded-lg text-sm font-medium bg-[#F1EEE7] text-[#171813] border border-[#D8D5CD]">
              {sent}
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#595B53] mb-1">Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 text-sm rounded-lg border border-[#D8D5CD] bg-[#FFFFFF] text-[#171813] outline-none focus:border-[#171813] transition-colors"
                  placeholder="Your name"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#595B53] mb-1">Email</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  className="w-full px-4 py-3 text-sm rounded-lg border border-[#D8D5CD] bg-[#FFFFFF] text-[#171813] outline-none focus:border-[#171813] transition-colors"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#595B53] mb-1">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-4 py-3 text-sm rounded-lg border border-[#D8D5CD] bg-[#FFFFFF] text-[#171813] outline-none focus:border-[#171813] transition-colors resize-none"
                rows={5}
                placeholder="How can we help you?"
                required
              />
            </div>
            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={sending}
                className="px-8 py-3 text-sm font-bold tracking-wide rounded-xl bg-[#171813] text-white hover:bg-[#171813] disabled:opacity-50 transition-all"
              >
                {sending ? "Sending..." : "Send Message"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
