"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/firebase";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCategories } from "@/hooks/useCategories";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useCartSidebar } from "@/context/CartSidebarContext";
import { resolvePricing } from "@/utils/pricing";
import { getProductSlug } from "@/utils/productSlug";
import ProductImage from "@/components/ProductImage";
import PriceText from "@/components/PriceText";

type Product = {
  ID: number;
  Description: string;
  ImageUrl1: string;
  ImageUrl2?: string;
  ImageUrl3?: string;
  ImageUrl4?: string;
  ImageUrl5?: string;
  ImageUrl6?: string;
  Price?: number;
  OriginalPrice?: number;
  ProductName: string;
  Category?: string;
  Subcategory?: string;
  Stock?: number;
  StockS?: number;
  StockM?: number;
  StockL?: number;
  StockXL?: number;
  VariantStock?: Record<string, number>;
  Sizes?: string[];
  StockType?: string;
  IsCustomizable?: boolean;
  DiscountPercent?: number;
  IsFeatured?: boolean;
  SoldOut?: boolean;
  ImageUrl1Medium?: string;
  ImageUrl1Thumb?: string;
  ImageUrl2Medium?: string;
  ImageUrl2Thumb?: string;
  ImageUrl3Medium?: string;
  ImageUrl3Thumb?: string;
  ImageUrl4Medium?: string;
  ImageUrl4Thumb?: string;
  ImageUrl5Medium?: string;
  ImageUrl5Thumb?: string;
  ImageUrl6Medium?: string;
  ImageUrl6Thumb?: string;
  createdAt?: any;
  SKU?: string;
};

type Subcat = { name: string; order?: number };

const SORTS = [
  { value: "recommended", label: "Recommended" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
];

function sellingOf(p: Product) {
  return resolvePricing({
    Price: p.Price,
    OriginalPrice: p.OriginalPrice,
    DiscountPercent: p.DiscountPercent,
  }).selling;
}

function ShopCard({
  p,
  href,
  out,
  isNew,
  pr,
  discountPct,
  adding,
  onQuickAdd,
}: {
  p: Product;
  href: string;
  out: boolean;
  isNew: any;
  pr: ReturnType<typeof resolvePricing>;
  discountPct: number;
  adding: boolean;
  onQuickAdd: (p: Product) => void;
}) {
  const images = [
    { src: p.ImageUrl1, medium: p.ImageUrl1Medium, thumb: p.ImageUrl1Thumb },
    { src: p.ImageUrl2, medium: p.ImageUrl2Medium, thumb: p.ImageUrl2Thumb },
    { src: p.ImageUrl3, medium: p.ImageUrl3Medium, thumb: p.ImageUrl3Thumb },
    { src: p.ImageUrl4, medium: p.ImageUrl4Medium, thumb: p.ImageUrl4Thumb },
    { src: p.ImageUrl5, medium: p.ImageUrl5Medium, thumb: p.ImageUrl5Thumb },
    { src: p.ImageUrl6, medium: p.ImageUrl6Medium, thumb: p.ImageUrl6Thumb },
  ].filter((img) => !!img.src);

  const [idx, setIdx] = useState(0);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (!hovered || images.length < 2) {
      setIdx(0);
      return;
    }

    let current = 1 % images.length;
    setIdx(current); // jump to next image immediately on hover
    let delay = 900;
    let timeout = 0;

    const tick = () => {
      timeout = window.setTimeout(() => {
        current = (current + 1) % images.length;
        setIdx(current);
        delay = 350; // then cycle quickly
        tick();
      }, delay);
    };
    tick();

    return () => window.clearTimeout(timeout);
  }, [hovered, images.length]);

  return (
    <article
      className="group relative min-w-0"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="relative">
        {/* Image */}
        <div className="relative aspect-[3/4] overflow-hidden rounded-[20px] bg-[#f2f0ed] md:rounded-[28px]">
          <Link href={href} aria-label={p.ProductName} className="absolute inset-0 z-[1] block">
            {images.map((img, i) => (
              <div
                key={i}
                className={`absolute inset-0 transition-opacity duration-700 ${
                  i === idx ? "opacity-100" : "opacity-0"
                }`}
              >
                <ProductImage
                  src={img.src}
                  srcMedium={img.medium}
                  srcThumb={img.thumb}
                  size="medium"
                  objectFit="cover"
                  quality={85}
                  sizes="(max-width: 767px) 47vw, 24vw"
                  alt={p.ProductName}
                  priority={i === 0}
                  className="h-full w-full scale-110"
                />
              </div>
            ))}
          </Link>

          {/* Badges */}
          {isNew && !out && (
            <span className="absolute left-3 top-3 z-10 rounded-full bg-white px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-[#111]">
              New
            </span>
          )}
          {out && (
            <span className="absolute left-3 top-3 z-10 rounded-full bg-white px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-[#111]">
              Sold out
            </span>
          )}

          {/* Quick add */}
          <button
            type="button"
            onClick={() => onQuickAdd(p)}
            disabled={out}
            aria-label={out ? `${p.ProductName} is sold out` : `Add ${p.ProductName} to bag`}
            className="absolute right-2.5 top-2.5 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-[#050505] text-white transition-opacity duration-200 focus-visible:outline-none focus-visible:opacity-100 group-hover:opacity-100 group-focus-within:opacity-100 disabled:opacity-40 md:h-[52px] md:w-[52px] md:opacity-0"
          >
            {adding ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white md:h-5 md:w-5" />
            ) : (
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4 md:h-5 md:w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                aria-hidden
              >
                <path d="M12 4v16M4 12h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3 pt-3.5">
        <div className="min-w-0">
          <Link
            href={href}
            className="block text-[19px] leading-[1.15] text-[#111] transition-colors hover:text-[#595b53] md:text-[24px] lg:text-[27px]"
            style={{ fontFamily: "var(--font-cormorant)", fontWeight: 500 }}
          >
            {p.ProductName}
          </Link>
          {discountPct > 0 && (
            <p className="mt-1 text-[13px] font-bold text-[#c90000] md:text-[15px]">
              {discountPct}% off
            </p>
          )}
        </div>
        <div className="max-w-[45%] text-right md:max-w-[155px]">
          {pr.discount > 0 && (
            <del className="block text-[12px] text-[#888] md:text-[14px]">
              <PriceText amount={pr.original} className="text-inherit" />
            </del>
          )}
          <span
            className={`block text-[14px] font-bold md:text-[17px] ${
              pr.discount > 0 ? "text-[#c90000]" : "text-[#111]"
            }`}
          >
            <PriceText amount={pr.selling} className="text-inherit" />
          </span>
        </div>
      </div>
    </article>
  );
}

function ShopContent() {
  const { categories: firestoreCategories } = useCategories();
  const router = useRouter();
  const { user } = useAuth();
  const { addItem } = useCart();
  const { openCart } = useCartSidebar();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [subcategory, setSubcategory] = useState<string | null>(null);
  const [sort, setSort] = useState<string>("recommended");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [inStockOnly, setInStockOnly] = useState(false);

  const [filterOpen, setFilterOpen] = useState(false);
  const [addingId, setAddingId] = useState<string | number | null>(null);

  const params = useSearchParams();
  const search = params.get("search")?.toLowerCase() || "";

  useEffect(() => {
    const fetchProducts = async () => {
      if (!db) {
        setLoading(false);
        return;
      }
      const snap = await getDocs(collection(db!, "inventory"));
      setProducts(snap.docs.map((d) => d.data() as Product));
      setLoading(false);
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    const cat = params.get("category");
    const sub = params.get("subcategory");
    if (cat) {
      setActiveCategory(cat);
      if (sub) setSubcategory(sub);
    }
  }, [params]);

  useEffect(() => {
    if (!filterOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [filterOpen]);

  const isOutOfStock = (p: Product) => {
    const ready = p.StockType === "ready_stock";
    return (
      (ready && p.Stock !== undefined && Number(p.Stock) === 0) || !!p.SoldOut
    );
  };

  const filtered = useMemo(() => {
    const min = minPrice.trim() === "" ? -Infinity : Number(minPrice);
    const max = maxPrice.trim() === "" ? Infinity : Number(maxPrice);
    return products.filter((p) => {
      if (activeCategory && (p.Category ?? null) !== activeCategory) return false;
      if (subcategory && (p.Subcategory ?? null) !== subcategory) return false;
      if (search && !(p.Description || "").toLowerCase().includes(search)) return false;
      if (inStockOnly && isOutOfStock(p)) return false;
      const s = sellingOf(p);
      if (isFinite(min) && s < min) return false;
      if (isFinite(max) && s > max) return false;
      return true;
    });
  }, [products, activeCategory, subcategory, search, inStockOnly, minPrice, maxPrice]);

  const sorted = useMemo(() => {
    const s = [...filtered];
    if (sort === "price-asc") return s.sort((a, b) => sellingOf(a) - sellingOf(b));
    if (sort === "price-desc") return s.sort((a, b) => sellingOf(b) - sellingOf(a));
    if (sort === "newest")
      return s.sort(
        (a, b) =>
          (b.createdAt?.toDate?.()?.getTime?.() ?? 0) -
          (a.createdAt?.toDate?.()?.getTime?.() ?? 0)
      );
    return s;
  }, [filtered, sort]);

  const pillCategories = useMemo(() => {
    const base = firestoreCategories.map((c) => c.name);
    const extras = products.map((p) => p.Category ?? "").filter(Boolean);
    return Array.from(new Set([...base, ...extras]));
  }, [firestoreCategories, products]);

  const activeSubcats: Subcat[] = useMemo(() => {
    const cat = firestoreCategories.find((c) => c.name === activeCategory);
    return (cat?.subcategories || []).slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [firestoreCategories, activeCategory]);

  const selectCategory = (name: string | null) => {
    setActiveCategory(name);
    setSubcategory(null);
  };

  const clearFilters = () => {
    setActiveCategory(null);
    setSubcategory(null);
    setSort("recommended");
    setMinPrice("");
    setMaxPrice("");
    setInStockOnly(false);
  };

  const needsOptions = (p: Product) => {
    const cat = (p.Category ?? "").toLowerCase();
    const hasSizes = Array.isArray(p.Sizes) && p.Sizes.length > 0;
    const isGeneralStock =
      !hasSizes || cat.includes("purse") || cat.includes("earring");
    return (
      !!p.IsCustomizable ||
      (!!p.VariantStock && Object.keys(p.VariantStock).length > 0) ||
      !isGeneralStock
    );
  };

  const handleQuickAdd = async (p: Product) => {
    const href = `/product/${encodeURIComponent(getProductSlug(p))}`;
    if (needsOptions(p) || isOutOfStock(p)) {
      router.push(href);
      return;
    }
    if (!user?.email || !db) {
      sessionStorage.setItem(
        "postAuthAction",
        JSON.stringify({
          type: "ADD_TO_CART",
          payload: { productId: p.ID, quantity: 1, size: "One Size" },
          redirectTo: "/shop",
        })
      );
      router.push("/sign-in");
      return;
    }
    try {
      setAddingId(p.ID);
      const cartRef = collection(db, "Cart");
      const q = query(
        cartRef,
        where("UserMail", "==", user.email),
        where("ID", "==", p.ID),
        where("Size", "==", "One Size"),
        where("Color", "==", "")
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const ref = snap.docs[0].ref;
        await updateDoc(ref, {
          Quantity: (snap.docs[0].data().Quantity || 0) + 1,
          ["Added On"]: serverTimestamp(),
        });
      } else {
        await addDoc(cartRef, {
          ID: p.ID,
          Quantity: 1,
          Size: "One Size",
          Color: "",
          UserMail: user.email,
          ["Added On"]: serverTimestamp(),
        });
      }
      addItem(String(p.ID));
      openCart();
    } catch (e) {
      console.error("Quick add failed", e);
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <main className="mx-auto max-w-[1600px] px-5 pt-8 pb-24 sm:px-8 md:pt-12 lg:px-12">
        {/* Breadcrumb */}
        <nav className="mb-5 text-[13px] text-[#595b53]" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-[#111]">
            Home
          </Link>
          <span className="px-1.5">/</span>
          <span className="text-[#111]">{activeCategory || "Shop"}</span>
        </nav>

        {/* Category pills */}
        <div
          className="flex gap-7 overflow-x-auto border-b border-[#e1dfdc] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="tablist"
          aria-label="Product categories"
        >
          <button
            type="button"
            onClick={() => selectCategory(null)}
            aria-current={activeCategory === null ? "page" : undefined}
            className={`flex-none border-b border-transparent pb-4 text-[13px] font-medium uppercase tracking-[0.08em] transition-colors md:text-[15px] ${
              activeCategory === null
                ? "border-[#111] text-[#111]"
                : "text-[#858585] hover:text-[#111]"
            }`}
          >
            View all
          </button>
          {pillCategories.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => selectCategory(name)}
              aria-current={activeCategory === name ? "page" : undefined}
              className={`flex-none border-b border-transparent pb-4 text-[13px] font-medium uppercase tracking-[0.08em] transition-colors md:text-[15px] ${
                activeCategory === name
                  ? "border-[#111] text-[#111]"
                  : "text-[#858585] hover:text-[#111]"
              }`}
            >
              {name}
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between pt-5 pb-7">
          <span className="text-[14px] text-[#111] md:text-[15px]">
            {loading ? "…" : `${sorted.length} ${sorted.length === 1 ? "Product" : "Products"}`}
          </span>
          <button
            type="button"
            onClick={() => setFilterOpen(true)}
            aria-label="Filter and sort products"
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 text-[14px] font-medium text-[#111] md:text-[15px]"
          >
            <span className="hidden md:inline">Filter &amp; sort</span>
            <svg
              viewBox="0 0 24 24"
              width="22"
              height="22"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden
            >
              <path d="M3 7h18M3 17h18" />
              <path d="M8 4v6M16 14v6" strokeWidth="3" />
            </svg>
          </button>
        </div>

        {/* Grid */}
        {loading ? (
          <p className="py-20 text-center text-sm text-[#595b53]">Loading products…</p>
        ) : sorted.length === 0 ? (
          <div className="py-24 text-center">
            <p
              className="text-[24px] text-[#111]"
              style={{ fontFamily: "var(--font-cormorant)" }}
            >
              Nothing here yet
            </p>
            <p className="mt-2 text-sm text-[#595b53]">
              Try another category or clear the filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-11 md:grid-cols-4 md:gap-x-6 md:gap-y-14">
            {sorted.map((p) => {
              const pr = resolvePricing({
                Price: p.Price,
                OriginalPrice: p.OriginalPrice,
                DiscountPercent: p.DiscountPercent,
              });
              const out = isOutOfStock(p);
              const isNew =
                p.createdAt &&
                Date.now() - (p.createdAt.toDate?.()?.getTime?.() ?? 0) <
                  30 * 24 * 60 * 60 * 1000;
              const discountPct =
                pr.discount > 0
                  ? Math.round(
                      ((pr.original - pr.selling) / (pr.original || 1)) * 100
                    )
                  : 0;
              const href = `/product/${encodeURIComponent(getProductSlug(p))}`;

              return (
                <ShopCard
                  key={p.ID}
                  p={p}
                  href={href}
                  out={out}
                  isNew={isNew}
                  pr={pr}
                  discountPct={discountPct}
                  adding={addingId === p.ID}
                  onQuickAdd={handleQuickAdd}
                />
              );
            })}
          </div>
        )}
      </main>

      {/* Filter & sort drawer */}
      <div
        className={`fixed inset-0 z-[200] ${filterOpen ? "" : "pointer-events-none"}`}
        aria-hidden={!filterOpen}
      >
        <div
          className={`absolute inset-0 bg-black/30 transition-opacity duration-300 ${
            filterOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setFilterOpen(false)}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Filter and sort"
          className={`absolute right-0 top-0 flex h-full w-full max-w-[570px] flex-col bg-white transition-transform duration-300 ease-out ${
            filterOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex flex-none items-center justify-between border-b border-[#e1dfdc] px-6 py-5">
            <h2
              className="text-[26px] leading-tight text-[#111] md:text-[32px]"
              style={{ fontFamily: "var(--font-cormorant)" }}
            >
              Filter &amp; sort
            </h2>
            <button
              type="button"
              onClick={() => setFilterOpen(false)}
              aria-label="Close filters"
              className="flex h-11 w-11 items-center justify-center text-[#111]"
            >
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="grid gap-6">
              {/* Sort */}
              <label className="grid gap-2 text-[14px] text-[#111]">
                <span>Sort by</span>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="min-h-[45px] w-full rounded-[7px] border border-[#e1dfdc] bg-white px-3 text-[16px] text-[#111] outline-none focus:border-[#111]"
                >
                  {SORTS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>

              {/* Price */}
              <div className="grid gap-2">
                <span className="text-[14px] text-[#111]">Price (RM)</span>
                <div className="grid grid-cols-2 gap-3.5">
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    placeholder="Minimum"
                    className="min-h-[45px] w-full rounded-[7px] border border-[#e1dfdc] bg-white px-3 text-[15px] text-[#111] outline-none focus:border-[#111]"
                  />
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="Maximum"
                    className="min-h-[45px] w-full rounded-[7px] border border-[#e1dfdc] bg-white px-3 text-[15px] text-[#111] outline-none focus:border-[#111]"
                  />
                </div>
              </div>

              {/* Category */}
              <div className="grid gap-2">
                <span className="text-[14px] text-[#111]">Category</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => selectCategory(null)}
                    className={`rounded-full border px-3.5 py-1.5 text-[13px] transition-colors ${
                      activeCategory === null
                        ? "border-[#111] bg-[#111] text-white"
                        : "border-[#c9c7c3] text-[#111] hover:border-[#111]"
                    }`}
                  >
                    All
                  </button>
                  {pillCategories.map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => selectCategory(name)}
                      className={`rounded-full border px-3.5 py-1.5 text-[13px] transition-colors ${
                        activeCategory === name
                          ? "border-[#111] bg-[#111] text-white"
                          : "border-[#c9c7c3] text-[#111] hover:border-[#111]"
                      }`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subcategory */}
              {activeSubcats.length > 0 && (
                <div className="grid gap-2">
                  <span className="text-[14px] text-[#111]">Type</span>
                  <div className="flex flex-wrap gap-2">
                    {activeSubcats.map((s) => (
                      <button
                        key={s.name}
                        type="button"
                        onClick={() =>
                          setSubcategory(subcategory === s.name ? null : s.name)
                        }
                        className={`rounded-full border px-3.5 py-1.5 text-[13px] transition-colors ${
                          subcategory === s.name
                            ? "border-[#111] bg-[#111] text-white"
                            : "border-[#c9c7c3] text-[#111] hover:border-[#111]"
                        }`}
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Availability */}
              <label className="flex items-center gap-2.5 text-[14px] text-[#111]">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="h-4 w-4 accent-[#111]"
                />
                Available products only
              </label>
            </div>
          </div>

          <div className="flex-none border-t border-[#e1dfdc] px-6 py-5">
            <button
              type="button"
              onClick={() => setFilterOpen(false)}
              className="w-full rounded-[10px] border border-[#111] bg-[#111] px-5 py-[15px] text-center text-[15px] font-medium tracking-[0.5px] text-white"
            >
              Apply filters
            </button>
            <button
              type="button"
              onClick={clearFilters}
              className="mt-3 w-full text-center text-[14px] text-[#555] underline underline-offset-4"
            >
              Clear filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white text-[#171813]">
          Loading...
        </div>
      }
    >
      <ShopContent />
    </Suspense>
  );
}
