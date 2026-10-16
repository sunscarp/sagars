"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { db } from "@/firebase";
import { collection, query, getDocs } from "firebase/firestore";
import ProductImage from "@/components/ProductImage";
import PriceText from "@/components/PriceText";
import { resolvePricing } from "@/utils/pricing";
import { getProductSlug } from "@/utils/productSlug";
import { useCategories } from "@/hooks/useCategories";

interface Product {
  id?: string;
  ProductName?: string;
  Description?: string;
  Category?: string;
  Product?: string;
  Price?: number | string;
  OriginalPrice?: number | string;
  DiscountPercent?: number | string;
  ImageUrl1?: string;
  ImageUrl1Medium?: string;
  ImageUrl1Thumb?: string;
  [key: string]: unknown;
}

interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
}

export default function SearchOverlay({ open, onClose }: SearchOverlayProps) {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [visible, setVisible] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { categories } = useCategories();

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [open]);

  useEffect(() => {
    if (open && !loaded && db) {
      getDocs(query(collection(db, "inventory"))).then((snap) => {
        const items = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Product[];
        setAllProducts(items);
        setLoaded(true);
      });
    }
  }, [open, loaded]);

  useEffect(() => {
    if (!open) {
      setSearchTerm("");
      setResults([]);
    }
  }, [open]);

  const filterProducts = useCallback(
    (term: string) => {
      if (!term.trim()) {
        setResults([]);
        setIsSearching(false);
        return;
      }
      const lower = term.toLowerCase();
      const filtered = allProducts.filter((p) => {
        const fields = [p.ProductName, p.Description, p.Category, p.Product];
        return fields.some((f) => f && f.toString().toLowerCase().includes(lower));
      });
      setResults(filtered);
      setIsSearching(false);
    },
    [allProducts]
  );

  const handleSearch = useCallback(
    (term: string) => {
      setSearchTerm(term);
      setIsSearching(true);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => filterProducts(term), 300);
    },
    [filterProducts]
  );

  const applyChip = useCallback(
    (term: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      setSearchTerm(term);
      setIsSearching(true);
      filterProducts(term);
      inputRef.current?.focus();
    },
    [filterProducts]
  );

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const productName = (p: Product) =>
    p.ProductName || p.Description || p.Product || "Unnamed Product";

  const chips = categories.slice(0, 4).map((c) => c.name);
  const trimmed = searchTerm.trim();

  let statusText = "";
  if (isSearching) statusText = "Searching…";
  else if (trimmed && results.length > 0) statusText = `Matching products (${results.length})`;
  else if (trimmed && loaded && results.length === 0)
    statusText = "No matching products. Try another name or fabric.";

  return (
    <div
      className={`fixed inset-0 z-[200] ${visible ? "pointer-events-auto" : "pointer-events-none"}`}
      onClick={onClose}
    >
      {/* Scrim */}
      <div
        className={`absolute inset-0 bg-black/20 transition-opacity duration-300 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Panel — centered card just below the header */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search products"
        onClick={(e) => e.stopPropagation()}
        style={{
          top: "calc(var(--navbar-height, 68px) + 20px)",
          width: "min(860px, calc(100% - 32px))",
          maxHeight: "calc(100dvh - var(--navbar-height, 68px) - 40px)",
          borderRadius: 28,
        }}
        className={`absolute left-1/2 -translate-x-1/2 overflow-auto border border-[#a9a9a9] bg-white px-5 pb-7 pt-9 text-[#111] shadow-none transition-all duration-300 ease-out sm:px-[30px] ${
          visible ? "translate-y-0 opacity-100" : "-translate-y-2.5 opacity-0"
        }`}
      >
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close search"
          className="absolute right-3 top-2 flex h-10 w-10 items-center justify-center transition-colors hover:bg-[#f1eee7]"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        {/* Search form */}
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            if (debounceRef.current) clearTimeout(debounceRef.current);
            filterProducts(searchTerm);
          }}
          className="flex items-center gap-4 border-b border-[#dedede] pb-4 transition-colors duration-200 focus-within:border-[#111] sm:gap-5"
        >
          <button
            type="submit"
            aria-label="Search"
            className="flex h-11 w-11 flex-none items-center justify-center text-[#111]"
          >
            <svg className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 28 28" aria-hidden>
              <circle cx="12" cy="12" r="8.5" />
              <path d="m18.5 18.5 7 7" />
            </svg>
          </button>
          <label htmlFor="mhh-query" className="sr-only">
            Search products
          </label>
          <input
            id="mhh-query"
            ref={inputRef}
            type="search"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search products"
            autoComplete="off"
            maxLength={80}
            className="min-w-0 flex-1 border-0 bg-transparent py-2 text-[18px] leading-normal text-[#111] outline-none placeholder:text-[#999] focus:outline-none sm:text-[22px]"
          />
        </form>

        {/* Suggested searches */}
        <div aria-label="Suggested searches" className="flex flex-wrap gap-3 pt-5">
          {chips.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => applyChip(chip)}
              className="min-w-[90px] flex-1 rounded-full border border-[#999] px-3.5 py-2 text-center text-[13px] leading-tight text-[#111] transition-colors hover:border-[#111] sm:text-sm"
            >
              {chip}
            </button>
          ))}
          <Link
            href="/shop"
            onClick={onClose}
            className="min-w-[90px] flex-1 rounded-full border border-[#e22424] px-3.5 py-2 text-center text-[13px] leading-tight text-[#111] transition-colors hover:border-[#111] sm:text-sm"
          >
            Sale
          </Link>
        </div>

        {/* Status */}
        {statusText && (
          <p role="status" aria-live="polite" className="mt-4 text-sm text-[#666]">
            {statusText}
          </p>
        )}

        {/* Results */}
        {!isSearching && results.length > 0 && (
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            {results.map((product) => {
              const pricing = resolvePricing({
                Price: product.Price,
                OriginalPrice: product.OriginalPrice,
                DiscountPercent: product.DiscountPercent,
              });
              const slug = encodeURIComponent(getProductSlug(product));

              return (
                <Link
                  key={product.id}
                  href={`/product/${slug}`}
                  onClick={onClose}
                  className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-[#f7f6f4]"
                >
                  <ProductImage
                    src={product.ImageUrl1 as string}
                    srcMedium={product.ImageUrl1Medium as string}
                    srcThumb={product.ImageUrl1Thumb as string}
                    size="thumb"
                    alt={productName(product)}
                    className="relative h-[84px] w-16 flex-none overflow-hidden rounded-[10px] border border-[#e5e5e5]"
                  />
                  <span className="min-w-0">
                    <span className="block text-[15px] leading-snug text-[#111] [overflow-wrap:anywhere]">
                      {productName(product)}
                    </span>
                    <PriceText
                      amount={pricing.selling}
                      className="mt-1 block text-[13px] font-bold text-[#111]"
                    />
                  </span>
                </Link>
              );
            })}

            <Link
              href="/shop"
              onClick={onClose}
              className="col-span-full py-3 text-center text-sm text-[#111] underline underline-offset-[5px]"
            >
              View all products
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
