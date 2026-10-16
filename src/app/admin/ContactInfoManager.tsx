"use client";

import React, { useState, useEffect } from "react";
import { useContactInfo, type ContactInfo } from "@/hooks/useContactInfo";

const INPUT_CLS = "w-full rounded-lg border border-[#E1DFDC] bg-[#F1EEE7]/50 px-3.5 py-2.5 text-sm text-[#171813] placeholder-[#9B998F] focus:outline-none focus:ring-2 focus:ring-[#595B53]/40 focus:border-[#595B53] transition-all";
const TEXTAREA_CLS = "w-full rounded-lg border border-[#E1DFDC] bg-[#F1EEE7]/50 px-3.5 py-2.5 text-sm text-[#171813] placeholder-[#9B998F] focus:outline-none focus:ring-2 focus:ring-[#595B53]/40 focus:border-[#595B53] transition-all min-h-[100px]";

export default function ContactInfoManager() {
  const { info, loading, saveContactInfo } = useContactInfo();
  const [draft, setDraft] = useState<ContactInfo | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !draft) setDraft({ ...info });
  }, [loading, info, draft]);

  if (loading || !draft) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-[#171813] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const update = (field: keyof ContactInfo, value: string) => {
    setDraft({ ...draft, [field]: value });
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await saveContactInfo(draft);
      setMessage("Contact info saved successfully!");
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
        <h2 className="text-lg font-semibold text-[#171813]">Contact Info</h2>
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

      <div className="bg-white rounded-xl border border-[#E1DFDC] p-6 space-y-5">
        <div>
          <h3 className="text-sm font-semibold text-[#595B53] mb-3">Contact Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#595B53] uppercase tracking-wider mb-1">Phone</label>
              <input type="text" value={draft.phone} onChange={(e) => update("phone", e.target.value)} className={INPUT_CLS} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#595B53] uppercase tracking-wider mb-1">Email</label>
              <input type="text" value={draft.email} onChange={(e) => update("email", e.target.value)} className={INPUT_CLS} />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-xs font-semibold text-[#595B53] uppercase tracking-wider mb-1">Address</label>
            <textarea value={draft.address} onChange={(e) => update("address", e.target.value)} className={TEXTAREA_CLS} rows={4} />
          </div>
          <div className="mt-4">
            <label className="block text-xs font-semibold text-[#595B53] uppercase tracking-wider mb-1">Business Hours</label>
            <input type="text" value={draft.hours} onChange={(e) => update("hours", e.target.value)} className={INPUT_CLS} />
          </div>
        </div>

        <div className="border-t border-[#F1EEE7] pt-5">
          <h3 className="text-sm font-semibold text-[#595B53] mb-3">Social Links</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#595B53] uppercase tracking-wider mb-1">Instagram #1</label>
              <input type="url" value={draft.instagramJewellery} onChange={(e) => update("instagramJewellery", e.target.value)} className={INPUT_CLS} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#595B53] uppercase tracking-wider mb-1">Instagram #2</label>
              <input type="url" value={draft.instagramHomeDecor} onChange={(e) => update("instagramHomeDecor", e.target.value)} className={INPUT_CLS} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#595B53] uppercase tracking-wider mb-1">Facebook #1</label>
              <input type="url" value={draft.facebookJewellery} onChange={(e) => update("facebookJewellery", e.target.value)} className={INPUT_CLS} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#595B53] uppercase tracking-wider mb-1">Facebook #2</label>
              <input type="url" value={draft.facebookHomeDecor} onChange={(e) => update("facebookHomeDecor", e.target.value)} className={INPUT_CLS} />
            </div>
          </div>
        </div>

        <div className="border-t border-[#F1EEE7] pt-5">
          <h3 className="text-sm font-semibold text-[#595B53] mb-3">SST Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#595B53] uppercase tracking-wider mb-1">SST No.</label>
              <input type="text" value={draft.sstNo} onChange={(e) => update("sstNo", e.target.value)} className={INPUT_CLS} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#595B53] uppercase tracking-wider mb-1">Legal Name</label>
              <input type="text" value={draft.legalName} onChange={(e) => update("legalName", e.target.value)} className={INPUT_CLS} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#595B53] uppercase tracking-wider mb-1">Trade Name</label>
              <input type="text" value={draft.tradeName} onChange={(e) => update("tradeName", e.target.value)} className={INPUT_CLS} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
