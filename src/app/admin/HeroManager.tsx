"use client";

import React, { useState, useEffect } from "react";
import { useHeroContent, type HeroContent } from "@/hooks/useHeroContent";

const INPUT_CLS = "w-full rounded-lg border border-[#E1DFDC] bg-[#F1EEE7]/50 px-3.5 py-2.5 text-sm text-[#171813] placeholder-[#9B998F] focus:outline-none focus:ring-2 focus:ring-[#595B53]/40 focus:border-[#595B53] transition-all";

export default function HeroManager() {
  const { content, loading, saveHeroContent } = useHeroContent();
  const [draft, setDraft] = useState<HeroContent | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !draft) setDraft({ ...content });
  }, [loading, content, draft]);

  if (loading || !draft) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-[#171813] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await saveHeroContent({ tagline: draft.tagline.trim() || "Tradition Meets Modern Elegance" });
      setMessage("Hero tagline saved successfully!");
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
        <div>
          <h2 className="text-lg font-semibold text-[#171813]">Hero Content</h2>
          <p className="text-sm text-[#595B53] mt-1">
            Edit the tagline shown beneath the brand name on the homepage hero.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2 bg-[#171813] text-white text-sm font-medium rounded-lg hover:bg-[#171813] disabled:opacity-50 transition-colors"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {message && (
        <div className={`p-3 rounded-lg text-sm ${message.includes("Error") ? "bg-red-50 text-red-700 border border-red-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>
          {message}
        </div>
      )}

      <div className="bg-white rounded-xl border border-[#E1DFDC] p-6 space-y-5">
        <div>
          <label className="block text-xs font-semibold text-[#595B53] uppercase tracking-wider mb-1">Hero Tagline</label>
          <input
            type="text"
            value={draft.tagline}
            onChange={(e) => setDraft({ ...draft, tagline: e.target.value })}
            className={INPUT_CLS}
            placeholder="e.g. Tradition Meets Modern Elegance"
          />
        </div>

        <div className="border-t border-[#F1EEE7] pt-5">
          <p className="text-xs font-medium text-[#595B53] uppercase tracking-wider mb-3">Preview</p>
          <div className="rounded-lg bg-gradient-to-b from-[#0e2432] to-[#0b1f2e] px-6 py-10 text-center text-white">
            <p className="text-2xl tracking-[0.045em]" style={{ fontFamily: "var(--font-cormorant)" }}>
              THE SAGAR&rsquo;S
            </p>
            <p className="mt-1 text-xs uppercase" style={{ letterSpacing: "0.52em" }}>Design House</p>
            <p className="mt-6 text-[11px] uppercase text-white/75" style={{ letterSpacing: "0.34em" }}>
              {draft.tagline || "Tradition Meets Modern Elegance"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
