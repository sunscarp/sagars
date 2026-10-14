"use client";

import { useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  asPage?: boolean;
};

const FAQ_ITEMS = [
  {
    q: "What is the material of the clothing?",
    a: "Our clothing is made from a blend of breathable cotton and polyester for comfort and durability.",
  },
  {
    q: "What are the available sizes?",
    a: "We offer sizes S, M, L, and XL. Check each product page for exact measurements.",
  },
  {
    q: "What is the return policy?",
    a: "You can return items within 14 days of delivery in original condition for a refund.",
  },
  {
    q: "How long does shipping take?",
    a: "Standard shipping typically takes 3-7 business days depending on your location.",
  },
  {
    q: "Do you offer international shipping?",
    a: "Yes — we ship internationally. Shipping costs and times vary by country.",
  },
];

export default function FAQModal({ open, onClose, asPage }: Props) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [askDirect, setAskDirect] = useState(false);

  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<string | null>(null);

  if (!open) return null;

  const toggle = (i: number) => setExpanded(expanded === i ? null : i);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setSent(null);

    try {
      const res = await fetch("/api/send-contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, subject, email, message }),
      });

      if (res.ok) {
        setSent("Message sent — we'll get back to you soon.");
        setName("");
        setSubject("");
        setEmail("");
        setMessage("");
        setAskDirect(false);
        // clear success message after a short delay
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

  if (asPage) {
    return (
      <div className="px-4 py-6 max-w-3xl mx-auto font-light">
        <div className="relative bg-white border border-[#D8D5CD] p-6 md:p-8 shadow-lg text-[#171813] rounded-[22px]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl md:text-4xl text-[#171813]" style={{ fontFamily: "var(--font-cormorant)" }}>FAQ</h2>
            <button onClick={onClose} className="font-semibold text-[#595B53] hover:text-[#171813] cursor-pointer">Back</button>
          </div>

          {sent && (
            <div className="mb-4 px-4 py-2 bg-green-50 text-green-800 font-semibold">{sent}</div>
          )}

          {!askDirect ? (
            <div>
              <div className="space-y-3">
                {FAQ_ITEMS.map((it, i) => (
                  <div key={i} className="border border-[#D8D5CD] bg-white overflow-hidden rounded-xl">
                    <button
                      onClick={() => toggle(i)}
                      className="w-full text-left px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center text-[#171813] hover:bg-[#F1EEE7] transition transform active:scale-[0.995] cursor-pointer"
                    >
                      <span className="font-semibold">{i + 1}. {it.q}</span>
                      <span className="text-lg text-[#9B998F]">{expanded === i ? '−' : '+'}</span>
                    </button>
                    {expanded === i && (
                      <div className="px-4 sm:px-6 pb-4 pt-0 text-sm text-[#595B53] bg-white">
                        {it.a}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-6 text-right">
                <button
                  onClick={() => setAskDirect(true)}
                  className="px-4 py-2 rounded-full bg-[#171813] text-white font-semibold hover:opacity-95 transition shadow-sm cursor-pointer"
                >
                  Ask Directly
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#171813] mb-1">Name</label>
                <input value={name} onChange={e => setName(e.target.value)} className="w-full border border-[#D8D5CD] bg-white text-[#171813] px-3 py-2 rounded-lg focus:border-[#171813]" required />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#171813] mb-1">Subject</label>
                <input value={subject} onChange={e => setSubject(e.target.value)} className="w-full border border-[#D8D5CD] bg-white text-[#171813] px-3 py-2 rounded-lg focus:border-[#171813]" required />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#171813] mb-1">Email</label>
                <input value={email} onChange={e => setEmail(e.target.value)} type="email" className="w-full border border-[#D8D5CD] bg-white text-[#171813] px-3 py-2 rounded-lg focus:border-[#171813]" required />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#171813] mb-1">Query</label>
                <textarea value={message} onChange={e => setMessage(e.target.value)} className="w-full border border-[#D8D5CD] bg-white text-[#171813] px-3 py-2 rounded-lg focus:border-[#171813]" rows={5} required />
              </div>

              {sent && <div className="text-sm text-[#595B53]">{sent}</div>}

              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setAskDirect(false)} className="px-4 py-2 rounded-full border border-[#D8D5CD] text-[#595B53] hover:bg-[#F1EEE7] cursor-pointer transition">Back</button>
                <button type="submit" disabled={sending} className="px-4 py-2 rounded-full bg-[#171813] text-white font-semibold hover:opacity-95 shadow-sm cursor-pointer">{sending ? 'Sending...' : 'Submit'}</button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="relative w-[90%] max-w-xl bg-white border border-[#D8D5CD] p-6 shadow-lg text-[#171813] rounded-[22px]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl text-[#171813]" style={{ fontFamily: "var(--font-cormorant)" }}>FAQ</h2>
          <button onClick={onClose} className="text-[#595B53] hover:text-[#171813] cursor-pointer transition">✕</button>
        </div>

        {sent && (
          <div className="mb-4 px-4 py-2 rounded-lg bg-[#F1EEE7] text-[#171813] font-semibold">{sent}</div>
        )}

        {!askDirect ? (
          <div>
            <div className="space-y-3">
              {FAQ_ITEMS.map((it, i) => (
                <div key={i} className="border border-[#D8D5CD] bg-[#F1EEE7] overflow-hidden rounded-xl">
                  <button
                    onClick={() => toggle(i)}
                    className="w-full text-left px-6 py-4 flex justify-between items-center text-[#171813] hover:bg-[#E1DFDC] transition transform active:scale-[0.995] cursor-pointer"
                  >
                    <span className="font-semibold">{i + 1}. {it.q}</span>
                    <span className="text-lg text-[#9B998F]">{expanded === i ? '−' : '+'}</span>
                  </button>
                  {expanded === i && (
                    <div className="px-6 pb-4 pt-0 text-sm text-[#595B53] bg-[#F1EEE7]">
                      {it.a}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4 text-right">
              <button
                onClick={() => setAskDirect(true)}
                className="px-4 py-2 rounded-full bg-[#171813] text-white font-semibold hover:opacity-95 transition shadow-sm cursor-pointer"
              >
                Ask Directly
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-[#171813] mb-1">Name</label>
              <input value={name} onChange={e => setName(e.target.value)} className="w-full border border-[#D8D5CD] bg-white text-[#171813] px-3 py-2 rounded-lg focus:border-[#171813]" required />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#171813] mb-1">Subject</label>
              <input value={subject} onChange={e => setSubject(e.target.value)} className="w-full border border-[#D8D5CD] bg-white text-[#171813] px-3 py-2 rounded-lg focus:border-[#171813]" required />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#171813] mb-1">Email</label>
              <input value={email} onChange={e => setEmail(e.target.value)} type="email" className="w-full border border-[#D8D5CD] bg-white text-[#171813] px-3 py-2 rounded-lg focus:border-[#171813]" required />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#171813] mb-1">Query</label>
              <textarea value={message} onChange={e => setMessage(e.target.value)} className="w-full border border-[#D8D5CD] bg-white text-[#171813] px-3 py-2 rounded-lg focus:border-[#171813]" rows={4} required />
            </div>

            {sent && <div className="text-sm text-[#595B53]">{sent}</div>}

            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setAskDirect(false)} className="px-4 py-2 rounded-full border border-[#D8D5CD] text-[#595B53] hover:bg-[#F1EEE7] cursor-pointer transition">Back</button>
              <button type="submit" disabled={sending} className="px-4 py-2 rounded-full bg-[#171813] text-white font-semibold hover:opacity-95 shadow-sm cursor-pointer">{sending ? 'Sending...' : 'Submit'}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
