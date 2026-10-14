"use client";

import React, { useState, useEffect } from "react";
import { usePolicies, type PoliciesData, type PolicyPage } from "@/hooks/usePolicies";
import RichTextEditor from "@/components/RichTextEditor";

const PAGE_KEYS: { key: keyof PoliciesData; label: string }[] = [
  { key: "privacyPolicy", label: "Privacy Policy" },
  { key: "refundPolicy", label: "Refund Policy" },
  { key: "shippingPolicy", label: "Shipping Policy" },
  { key: "tos", label: "Terms & Conditions" },
  { key: "aboutUs", label: "About Us" },
  { key: "cancellationRefund", label: "Cancellation & Refund" },
  { key: "shippingReturn", label: "Shipping & Return" },
  { key: "faq", label: "FAQs" },
  { key: "whatMakesKriaSpecial", label: "What Makes The Sagar's Design House Special" },
  { key: "productCare", label: "Product Care" },
];

const INPUT_CLS = "w-full rounded-lg border border-[#E1DFDC] bg-[#F1EEE7]/50 px-3.5 py-2.5 text-sm text-[#171813] placeholder-[#9B998F] focus:outline-none focus:ring-2 focus:ring-[#595B53]/40 focus:border-[#595B53] transition-all";

export default function PoliciesManager() {
  const { policies, loading, savePolicies } = usePolicies();
  const [activePage, setActivePage] = useState<keyof PoliciesData>("privacyPolicy");
  const [draft, setDraft] = useState<PoliciesData | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && policies && !draft) setDraft({ ...policies });
  }, [loading, policies, draft]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-[#171813] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const page = draft?.[activePage];
  if (!page) return null;

  const updatePage = (updated: PolicyPage) => {
    if (!draft) return;
    setDraft({ ...draft, [activePage]: updated });
  };

  const updateSection = (index: number, field: "heading" | "body", value: string) => {
    const sections = [...page.sections];
    sections[index] = { ...sections[index], [field]: value };
    updatePage({ ...page, sections });
  };

  const addSection = () => {
    updatePage({ ...page, sections: [...page.sections, { heading: "", body: "" }] });
  };

  const removeSection = (index: number) => {
    updatePage({ ...page, sections: page.sections.filter((_, i) => i !== index) });
  };

  const moveSection = (index: number, dir: "up" | "down") => {
    const sections = [...page.sections];
    const target = dir === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= sections.length) return;
    [sections[index], sections[target]] = [sections[target], sections[index]];
    updatePage({ ...page, sections });
  };

  const handleSave = async () => {
    if (!draft) return;
    setSaving(true);
    setMessage(null);
    try {
      await savePolicies(draft);
      setMessage("Policies saved successfully!");
    } catch (e: any) {
      setMessage("Error saving: " + (e?.message || e));
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#171813]">Policies</h2>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2 bg-[#171813] text-white text-sm font-medium rounded-lg hover:bg-[#171813] disabled:opacity-50 transition-colors"
        >
          {saving ? "Saving..." : "Save All"}
        </button>
      </div>

      {message && (
        <div className={`p-3 rounded-lg text-sm ${message.includes("Error") ? "bg-red-50 text-red-700 border border-red-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>
          {message}
        </div>
      )}

      {/* Page tabs */}
      <div className="flex gap-2 flex-wrap border-b border-[#E1DFDC] pb-3">
        {PAGE_KEYS.map((pk) => (
          <button
            key={pk.key}
            onClick={() => setActivePage(pk.key)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activePage === pk.key
                ? "bg-[#171813] text-white"
                : "bg-white text-[#595B53] border border-[#E1DFDC] hover:bg-[#F1EEE7]"
            }`}
          >
            {pk.label}
          </button>
        ))}
      </div>

      {/* Page editor */}
      <div className="bg-white rounded-xl border border-[#E1DFDC] p-6 space-y-4">
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#595B53] uppercase tracking-wider mb-1">Title</label>
            <input
              type="text"
              value={page.title}
              onChange={(e) => updatePage({ ...page, title: e.target.value })}
              className={INPUT_CLS}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#595B53] uppercase tracking-wider mb-1">Subtitle</label>
            <input
              type="text"
              value={page.subtitle}
              onChange={(e) => updatePage({ ...page, subtitle: e.target.value })}
              className={INPUT_CLS}
            />
          </div>
        </div>

        <div className="border-t border-[#F1EEE7] pt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-[#595B53]">Sections</h3>
            <button onClick={addSection} className="text-xs px-3 py-1.5 bg-[#F1EEE7] text-[#595B53] rounded-lg hover:bg-[#E1DFDC] transition-colors">
              + Add Section
            </button>
          </div>

          <div className="space-y-4">
            {page.sections.map((section, i) => (
              <div key={i} className="border border-[#E1DFDC] rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[#9B998F]">Section {i + 1}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => moveSection(i, "up")}
                      disabled={i === 0}
                      className="p-1 text-[#9B998F] hover:text-[#595B53] disabled:opacity-30"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                    </button>
                    <button
                      onClick={() => moveSection(i, "down")}
                      disabled={i === page.sections.length - 1}
                      className="p-1 text-[#9B998F] hover:text-[#595B53] disabled:opacity-30"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </button>
                    <button
                      onClick={() => removeSection(i)}
                      className="p-1 text-red-400 hover:text-red-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#595B53] mb-1">Heading</label>
                  <input
                    type="text"
                    value={section.heading}
                    onChange={(e) => updateSection(i, "heading", e.target.value)}
                    className={INPUT_CLS}
                    placeholder="Section heading..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#595B53] mb-1">Body</label>
                  <RichTextEditor
                    value={section.body}
                    onChange={(val) => updateSection(i, "body", val)}
                    minHeight={120}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
