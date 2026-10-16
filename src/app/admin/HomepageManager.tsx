"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase";
import { useHomeContent, type HomeContent } from "@/hooks/useHomeContent";
import { uploadHomeImage } from "@/utils/uploadImage";
import { resolvePricing } from "@/utils/pricing";

const INPUT_CLS =
  "w-full rounded-lg border border-[#E1DFDC] bg-[#F1EEE7]/50 px-3.5 py-2.5 text-sm text-[#171813] placeholder-[#9B998F] focus:outline-none focus:ring-2 focus:ring-[#595B53]/40 focus:border-[#595B53] transition-all";

type ProductOption = {
  ID: number;
  ProductName?: string;
  Description?: string;
  ImageUrl1?: string;
  ImageUrl1Thumb?: string;
  ImageUrl1Medium?: string;
  Price?: number;
  OriginalPrice?: number;
  DiscountPercent?: number;
};

function ImageSlot({
  value,
  onChange,
  folder,
  aspectClass,
  label,
}: {
  value: string;
  onChange: (url: string) => void;
  folder: string;
  aspectClass: string;
  label: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const url = await uploadHomeImage(file, folder);
      onChange(url);
    } catch (e: any) {
      setError(e?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <label className="block text-[10px] font-semibold text-[#595B53] uppercase tracking-wider mb-2">
        {label}
      </label>
      <div className={`relative w-full ${aspectClass} overflow-hidden rounded-lg border border-[#E1DFDC] bg-[#F1EEE7]`}>
        {value ? (
          <img src={value} alt={label} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <svg className="h-8 w-8 text-[#C4C1B9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A1.5 1.5 0 0021.75 19.5V4.5A1.5 1.5 0 0020.25 3H3.75A1.5 1.5 0 002.25 4.5v15A1.5 1.5 0 003.75 21z" />
            </svg>
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70">
            <div className="h-6 w-6 border-2 border-[#171813] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
      <div className="mt-2 flex items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          disabled={uploading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="px-3 py-1.5 rounded-lg border border-[#E1DFDC] text-xs font-medium text-[#171813] hover:bg-[#F1EEE7] disabled:opacity-50"
        >
          {uploading ? "Uploading..." : value ? "Change" : "Upload"}
        </button>
        {value && !uploading && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-xs text-red-500 hover:text-red-700"
          >
            Remove
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function ProductPicker({
  title,
  hint,
  products,
  selectedIds,
  onChange,
}: {
  title: string;
  hint: string;
  products: ProductOption[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
}) {
  const [query, setQuery] = useState("");

  const byId = useMemo(() => {
    const map = new Map<number, ProductOption>();
    products.forEach((p) => map.set(p.ID, p));
    return map;
  }, [products]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const selected = new Set(selectedIds);
    return products
      .filter((p) => !selected.has(p.ID))
      .filter((p) => {
        if (!q) return true;
        const name = (p.ProductName || p.Description || "").toLowerCase();
        return name.includes(q) || String(p.ID).includes(q);
      })
      .slice(0, 12);
  }, [products, query, selectedIds]);

  const move = (index: number, dir: -1 | 1) => {
    const next = [...selectedIds];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div className="bg-white rounded-xl border border-[#E1DFDC] p-6">
      <h3 className="text-sm font-semibold text-[#171813]">{title}</h3>
      <p className="text-xs text-[#595B53] mt-1 mb-4">{hint}</p>

      {/* Selected */}
      {selectedIds.length === 0 ? (
        <p className="text-xs text-[#9B998F] py-3">No products selected.</p>
      ) : (
        <ul className="divide-y divide-[#F1EEE7] border border-[#F1EEE7] rounded-lg overflow-hidden">
          {selectedIds.map((id, i) => {
            const p = byId.get(id);
            const price = p
              ? resolvePricing({ Price: p.Price, OriginalPrice: p.OriginalPrice, DiscountPercent: p.DiscountPercent }).selling
              : 0;
            return (
              <li key={id} className="flex items-center gap-3 px-3 py-2.5">
                <div className="h-12 w-10 shrink-0 overflow-hidden rounded bg-[#F1EEE7]">
                  {p?.ImageUrl1Thumb || p?.ImageUrl1 ? (
                    <img src={p.ImageUrl1Thumb || p.ImageUrl1} alt="" className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[#171813]">
                    {p?.ProductName || p?.Description || `Product #${id}`}
                  </p>
                  <p className="text-xs text-[#595B53]">
                    {p ? `RM${price.toFixed(2)}` : "Not in inventory"}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    title="Move up"
                    className="p-1.5 rounded text-[#9B998F] hover:text-[#171813] hover:bg-[#F1EEE7] disabled:opacity-30"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => move(i, 1)}
                    disabled={i === selectedIds.length - 1}
                    title="Move down"
                    className="p-1.5 rounded text-[#9B998F] hover:text-[#171813] hover:bg-[#F1EEE7] disabled:opacity-30"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange(selectedIds.filter((x) => x !== id))}
                    title="Remove"
                    className="p-1.5 rounded text-red-400 hover:text-red-600 hover:bg-red-50"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Search + add */}
      <div className="mt-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search inventory to add…"
          className={INPUT_CLS}
        />
        {products.length === 0 ? (
          <p className="mt-2 text-xs text-[#9B998F]">No inventory products found.</p>
        ) : results.length === 0 ? (
          <p className="mt-2 text-xs text-[#9B998F]">{query.trim() ? "No matching products." : "All products selected."}</p>
        ) : (
          <div className="mt-2 max-h-64 overflow-y-auto rounded-lg border border-[#F1EEE7]">
            {results.map((p) => (
              <button
                key={p.ID}
                type="button"
                onClick={() => onChange([...selectedIds, p.ID])}
                className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-[#F1EEE7]"
              >
                <div className="h-10 w-8 shrink-0 overflow-hidden rounded bg-[#F1EEE7]">
                  {p.ImageUrl1Thumb || p.ImageUrl1 ? (
                    <img src={p.ImageUrl1Thumb || p.ImageUrl1} alt="" className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <span className="min-w-0 flex-1 truncate text-sm text-[#171813]">
                  {p.ProductName || p.Description || `Product #${p.ID}`}
                </span>
                <span className="shrink-0 text-xs font-medium text-[#171813]">Add</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function HomepageManager() {
  const { content, loading, saveHomeContent } = useHomeContent();
  const [draft, setDraft] = useState<HomeContent | null>(null);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !draft) setDraft({ ...content });
  }, [loading, content, draft]);

  useEffect(() => {
    if (!db) {
      setProductsLoading(false);
      return;
    }
    getDocs(collection(db!, "inventory"))
      .then((snap) => setProducts(snap.docs.map((d) => d.data() as ProductOption)))
      .catch(() => {})
      .finally(() => setProductsLoading(false));
  }, []);

  if (loading || !draft) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-[#171813] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const experience = draft.experienceImages;
  const setExperienceAt = (index: number, url: string) => {
    const next = [...experience];
    next[index] = url;
    setDraft({ ...draft, experienceImages: next });
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await saveHomeContent({
        experienceImages: experience.filter(Boolean),
        tailoringImage: draft.tailoringImage,
        featuredProductIds: draft.featuredProductIds,
        favouriteProductIds: draft.favouriteProductIds,
      });
      setMessage("Homepage content saved successfully!");
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
          <h2 className="text-lg font-semibold text-[#171813]">Homepage</h2>
          <p className="text-sm text-[#595B53] mt-1">
            Manage the images and product selections shown in the homepage sections.
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

      {/* Choose Your Experience */}
      <div className="bg-white rounded-xl border border-[#E1DFDC] p-6">
        <h3 className="text-sm font-semibold text-[#171813]">Choose Your Experience</h3>
        <p className="text-xs text-[#595B53] mt-1 mb-4">
          Three cards shown below the hero. Upload an image for each card.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[0, 1, 2].map((i) => (
            <ImageSlot
              key={i}
              label={`Card ${i + 1}`}
              value={experience[i] || ""}
              onChange={(url) => setExperienceAt(i, url)}
              folder={`homepage/experience/${i + 1}`}
              aspectClass="aspect-[3/4]"
            />
          ))}
        </div>
      </div>

      {/* Top Picks of the Season */}
      <ProductPicker
        title="Top Picks of the Season"
        hint="Products featured in the “Featured Collection” section. The homepage displays the first 4, in this order."
        products={products}
        selectedIds={draft.featuredProductIds}
        onChange={(ids) => setDraft({ ...draft, featuredProductIds: ids })}
      />

      {/* Tailoring section image */}
      <div className="bg-white rounded-xl border border-[#E1DFDC] p-6">
        <h3 className="text-sm font-semibold text-[#171813]">Tailoring &amp; Personalised Services</h3>
        <p className="text-xs text-[#595B53] mt-1 mb-4">
          The large image beside the tailoring heading. The four service items below it are fixed.
        </p>
        <div className="max-w-xs">
          <ImageSlot
            label="Section image"
            value={draft.tailoringImage}
            onChange={(url) => setDraft({ ...draft, tailoringImage: url })}
            folder="homepage/tailoring"
            aspectClass="aspect-[4/5]"
          />
        </div>
      </div>

      {/* Our Favourites */}
      <ProductPicker
        title="The Sagar's Most Loved"
        hint="Products shown in the “Our Favourites” carousel, in this order."
        products={products}
        selectedIds={draft.favouriteProductIds}
        onChange={(ids) => setDraft({ ...draft, favouriteProductIds: ids })}
      />

      {productsLoading && (
        <p className="text-xs text-[#9B998F]">Loading inventory…</p>
      )}
    </div>
  );
}
