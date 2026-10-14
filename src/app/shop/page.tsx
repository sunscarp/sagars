"use client";

import { useEffect, useState, Suspense } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCategories } from "@/hooks/useCategories";
import { resolvePricing } from "@/utils/pricing";
import { getProductSlug } from "@/utils/productSlug";
import ProductImage from "@/components/ProductImage";
import PriceText from "@/components/PriceText";

type Product = {
  ID: number;
  Description: string;
  ImageUrl1: string;
  Price?: number;
  OriginalPrice?: number;
  ProductName: string;
  Category?: string;
  Subcategory?: string;
  Stock?: number;
  StockType?: string;
  IsCustomizable?: boolean;
  DiscountPercent?: number;
  IsFeatured?: boolean;
  ImageUrl1Medium?: string;
  ImageUrl1Thumb?: string;
  createdAt?: any;
  SKU?: string;
};

function ShopContent() {
  const { categories: firestoreCategories } = useCategories();
  const defaultCategories = firestoreCategories.map((c) => c.name);
  const [products, setProducts] = useState<Product[]>([]);
  const [filter, setFilter] = useState<string | null>(null);
  const [subcategoryFilter, setSubcategoryFilter] = useState<string | null>(null);
  const [sort, setSort] = useState<string>("relevance");
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [showMobileSort, setShowMobileSort] = useState(false);
  const [showFilterPopover, setShowFilterPopover] = useState(false);
  const [mobileSubView, setMobileSubView] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const params = useSearchParams();
  const search = params.get("search")?.toLowerCase() || "";

  const formatCurrency = (n: number) => {
    return n.toLocaleString("en-MY", { maximumFractionDigits: 0 });
  };

  useEffect(() => {
    const fetchProducts = async () => {
      if (!db) return;
      const snap = await getDocs(collection(db!, "inventory"));
      setProducts(snap.docs.map(d => d.data() as Product));
    };
    fetchProducts();
  }, []);

  const filtered = products.filter(p => {
    if (filter && (p.Category ?? null) !== filter) return false;
    if (subcategoryFilter && (p.Subcategory ?? null) !== subcategoryFilter) return false;
    if (search && !p.Description.toLowerCase().includes(search)) return false;
    return true;
  });

  const sorted = (() => {
    const s = [...filtered];
    if (sort === "price-asc") return s.sort((a, b) => resolvePricing({ Price: a.Price, OriginalPrice: a.OriginalPrice, DiscountPercent: a.DiscountPercent }).selling - resolvePricing({ Price: b.Price, OriginalPrice: b.OriginalPrice, DiscountPercent: b.DiscountPercent }).selling);
    if (sort === "price-desc") return s.sort((a, b) => resolvePricing({ Price: b.Price, OriginalPrice: b.OriginalPrice, DiscountPercent: b.DiscountPercent }).selling - resolvePricing({ Price: a.Price, OriginalPrice: a.OriginalPrice, DiscountPercent: a.DiscountPercent }).selling);
    return s;
  })();

  const categories = Array.from(new Set([...defaultCategories, ...products.map(p => p.Category ?? "")]));

  useEffect(() => {
    try {
      const cat = params.get("category");
      const sub = params.get("subcategory");
      if (cat) {
        setFilter(cat);
        setSelectedSubcategory(cat);
        if (sub) setSubcategoryFilter(sub);
      }
    } catch (e) {
      // ignore
    }
  }, [params]);

  return (
    <div className="bg-[#FFFFFF] min-h-screen">
      <main className="px-5 sm:px-[3%] pt-8 md:pt-12 pb-24 max-w-[1400px] mx-auto">
        <div className="mb-6 md:mb-10">
          <span className="mh-eyebrow">Shop</span>
          <h1 className="text-[34px] sm:text-[46px] leading-[1.05] text-[#171813] mt-2" style={{ fontFamily: "var(--font-cormorant)" }}>
            All products
          </h1>
          <div className="mt-2 text-[13px] text-[#595B53]">Showing {sorted.length} products</div>
        </div>

        {/* Mobile bottom toolbar */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#FFFFFF] border-t border-[#D8D5CD]">
          <div className="max-w-6xl mx-auto flex divide-x divide-white px-0 py-0">
            <button
              onClick={() => { setShowFilterPopover(false); setShowMobileSort(s => !s); }}
              className="flex-1 flex items-center justify-center gap-2 text-sm bg-[#FFFFFF] text-[#171813] px-4 py-3 hover:bg-[#FFFFFF]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4">
                <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M10 6h6M6 12h10M8 18h8" />
              </svg>
              <span>Sort By</span>
            </button>

            <button
              onClick={() => { setShowMobileSort(false); setMobileSubView(null); setShowFilterPopover(s => !s); }}
              aria-expanded={showFilterPopover}
              aria-controls="filter-popover"
              className="flex-1 flex items-center justify-center gap-2 text-sm bg-[#FFFFFF] text-[#171813] px-4 py-3 hover:bg-[#FFFFFF]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4">
                <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M3 5h18M6 12h12M10 19h4" />
              </svg>
              <span>Filters</span>
            </button>
          </div>

          {/* Mobile sort popover */}
          {showMobileSort && (
            <div className="absolute bottom-full mb-1 left-1/2 transform -translate-x-1/2 bg-[#FFFFFF] shadow-lg p-3 w-[calc(100vw-32px)] sm:w-72 z-[9999] border border-[#D8D5CD]">
              <div className="text-sm font-semibold mb-2 text-[#171813]">Sort</div>
              <div className="space-y-1">
                <button
                  onClick={() => { setSort("relevance"); setShowMobileSort(false); }}
                  className={`w-full text-left px-2 py-1 text-sm ${sort === "relevance" ? "bg-[#171813] text-white" : "text-[#171813] hover:bg-[#FFFFFF]"}`}
                >
                  Relevance
                </button>
                <button
                  onClick={() => { setSort("price-asc"); setShowMobileSort(false); }}
                  className={`w-full text-left px-2 py-1 text-sm ${sort === "price-asc" ? "bg-[#171813] text-white" : "text-[#171813] hover:bg-[#FFFFFF]"}`}
                >
                  Price: Low to High
                </button>
                <button
                  onClick={() => { setSort("price-desc"); setShowMobileSort(false); }}
                  className={`w-full text-left px-2 py-1 text-sm ${sort === "price-desc" ? "bg-[#171813] text-white" : "text-[#171813] hover:bg-[#FFFFFF]"}`}
                >
                  Price: High to Low
                </button>
              </div>
            </div>
          )}

          {/* Mobile filter popover */}
          {showFilterPopover && (
            <div id="filter-popover" className="absolute bottom-full mb-1 left-1/2 transform -translate-x-1/2 bg-[#FFFFFF] shadow-lg p-4 w-[calc(100vw-32px)] sm:w-72 z-[9999] border border-[#D8D5CD] max-h-[70vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {mobileSubView && (
                    <button onClick={() => setMobileSubView(null)} className="text-[#171813] text-sm font-medium">← Back</button>
                  )}
                  <div className="text-sm font-semibold text-[#171813]">{mobileSubView || 'Filters'}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setFilter(null); setSort("relevance"); setSelectedSubcategory(null); setSubcategoryFilter(null); setMobileSubView(null); }}
                    className="text-sm bg-[#F1EEE7] text-[#171813] px-2 py-1 cursor-pointer hover:bg-[#D8D5CD]"
                  >
                    Reset
                  </button>
                  <button onClick={() => { setShowFilterPopover(false); setMobileSubView(null); }} className="text-[#595B53] text-sm cursor-pointer">Close</button>
                </div>
              </div>

              {!mobileSubView ? (
                <div className="space-y-1">
                  <button
                    onClick={() => { setFilter(null); setSelectedSubcategory(null); setSubcategoryFilter(null); setShowFilterPopover(false); }}
                    className={`w-full text-left px-3 py-2 text-sm ${filter === null ? 'bg-[#171813] text-white' : 'text-[#171813] hover:bg-[#FFFFFF]'}`}
                  >
                    All
                  </button>

                  {firestoreCategories.map(cat => {
                    const hasSubs = (cat.subcategories || []).length > 0;
                    const isActive = filter === cat.name;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => {
                          if (hasSubs) {
                            setMobileSubView(cat.name);
                            setFilter(cat.name);
                            setSubcategoryFilter(null);
                          } else {
                            setFilter(cat.name);
                            setSelectedSubcategory(cat.name);
                            setSubcategoryFilter(null);
                            setShowFilterPopover(false);
                          }
                        }}
                        className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between ${isActive ? 'bg-[#171813] text-white' : 'text-[#171813] hover:bg-[#F1EEE7]'}`}
                      >
                        <span>{cat.name}</span>
                        {hasSubs && (
                          <svg className="w-3 h-3 text-[#9B998F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        )}
                      </button>
                    );
                  })}

                  {categories.filter(c => c && !firestoreCategories.some(fc => fc.name === c)).map(c => (
                    <button
                      key={c}
                      onClick={() => { setFilter(c); setSelectedSubcategory(c); setSubcategoryFilter(null); setShowFilterPopover(false); }}
                      className={`w-full text-left px-3 py-2 text-sm ${filter === c ? 'bg-[#171813] text-white' : 'text-[#171813] hover:bg-[#F1EEE7]'}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-1">
                  {(() => {
                    const cat = firestoreCategories.find(c => c.name === mobileSubView);
                    const subs = (cat?.subcategories || []).sort((a: any, b: any) => a.order - b.order);
                    return subs.map((sub: any) => (
                      <button
                        key={sub.name}
                        onClick={() => { setSubcategoryFilter(sub.name); setShowFilterPopover(false); setMobileSubView(null); }}
                        className={`w-full text-left px-3 py-2 text-sm ${subcategoryFilter === sub.name ? 'bg-[#595B53] text-white' : 'text-[#171813] hover:bg-[#F1EEE7]'}`}
                      >
                        {sub.name}
                      </button>
                    ));
                  })()}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="md:flex md:items-start md:gap-6">
          {/* Sidebar - desktop only */}
          <aside className="hidden md:block w-64 shrink-0 md:-ml-6">
            <div className="bg-white border border-[#D8D5CD] rounded-[22px] p-5 sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <div className="text-[11px] uppercase tracking-[0.16em] text-[#595B53] font-medium">Filters</div>
                <button
                  onClick={() => { setFilter(null); setSort('relevance'); setSelectedSubcategory(null); setSubcategoryFilter(null); }}
                  className="text-xs text-[#595B53] hover:underline"
                >
                  Reset
                </button>
              </div>

              <div className="space-y-0.5">
                <button
                  onClick={() => { setFilter(null); setSelectedSubcategory(null); setSubcategoryFilter(null); }}
                  className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${filter === null ? 'bg-[#171813] text-white' : 'text-[#171813] hover:bg-[#F1EEE7]'}`}
                >
                  All
                </button>

                {firestoreCategories.map(cat => {
                  const isActive = filter === cat.name;
                  const catSubs = (cat.subcategories || []).sort((a: any, b: any) => a.order - b.order);
                  const hasSubs = catSubs.length > 0;
                  return (
                    <div key={cat.id}>
                      <button
                        onClick={() => { if (isActive) { setFilter(null); setSubcategoryFilter(null); } else { setFilter(cat.name); setSelectedSubcategory(cat.name); setSubcategoryFilter(null); } }}
                        className={`w-full text-left px-3 py-2 text-sm transition-colors flex items-center justify-between rounded-lg ${isActive ? 'bg-[#171813] text-white' : 'text-[#171813] hover:bg-[#F1EEE7]'}`}
                      >
                        <span>{cat.name}</span>
                        {hasSubs && (
                          <svg className={`w-3 h-3 transition-transform ${isActive ? 'rotate-180 text-white/70' : 'text-[#9B998F]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        )}
                      </button>
                      {isActive && hasSubs && (
                        <div className="pl-4 pb-1 space-y-0.5">
                          {catSubs.map((sub: any) => (
                            <button
                              key={sub.name}
                              onClick={() => setSubcategoryFilter(sub.name)}
                              className={`block w-full text-left px-3 py-1 text-xs transition-colors ${subcategoryFilter === sub.name ? 'text-[#171813] font-medium' : 'text-[#171813] hover:text-[#171813]'}`}
                            >
                              {sub.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {categories.filter(c => c && !firestoreCategories.some(fc => fc.name === c)).map(c => (
                  <button
                    key={c}
                    onClick={() => { setFilter(c); setSelectedSubcategory(c); setSubcategoryFilter(null); }}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors rounded-lg ${filter === c ? 'bg-[#171813] text-white' : 'text-[#171813] hover:bg-[#F1EEE7]'}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Main content area */}
          <div className="flex-1">
            {/* Desktop sort toolbar */}
            <div className="hidden md:flex items-center gap-4 mb-6 justify-end">
              <div className="relative">
                <button
                  onClick={() => setSortOpen((s) => !s)}
                  className="flex items-center gap-2 text-sm bg-white text-[#171813] px-3 py-2 hover:bg-[#F1EEE7] cursor-pointer border border-[#D8D5CD] rounded-lg"
                  aria-expanded={sortOpen}
                >
                  <span>Sort</span>
                  <span className="text-xs text-[#595B53]">
                    {sort === "price-asc"
                      ? "Price: Low to High"
                      : sort === "price-desc"
                      ? "Price: High to Low"
                      : "Relevance"}
                  </span>
                  <svg
                    className={`w-4 h-4 transform ${sortOpen ? "rotate-180" : "rotate-0"}`}
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
                  </svg>
                </button>

                {sortOpen && (
                  <div className="absolute mt-2 left-0 bg-white border border-[#D8D5CD] shadow-lg p-2 w-56 z-30 rounded-xl">
                    <button
                      onClick={() => { setSort("relevance"); setSortOpen(false); }}
                      className={`w-full text-left px-2 py-1 text-sm ${sort === "relevance" ? "bg-[#171813] text-white" : "text-[#171813] hover:bg-[#FFFFFF]"}`}
                    >
                      Relevance
                    </button>
                    <button
                      onClick={() => { setSort("price-asc"); setSortOpen(false); }}
                      className={`w-full text-left px-2 py-1 mt-1 text-sm ${sort === "price-asc" ? "bg-[#171813] text-white" : "text-[#171813] hover:bg-[#FFFFFF]"}`}
                    >
                      Price: Low to High
                    </button>
                    <button
                      onClick={() => { setSort("price-desc"); setSortOpen(false); }}
                      className={`w-full text-left px-2 py-1 mt-1 text-sm ${sort === "price-desc" ? "bg-[#171813] text-white" : "text-[#171813] hover:bg-[#FFFFFF]"}`}
                    >
                      Price: High to Low
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 sm:gap-x-6 gap-y-8 sm:gap-y-9">
                {sorted.map(p => {
                const pr = resolvePricing({ Price: (p as any).Price, OriginalPrice: (p as any).OriginalPrice, DiscountPercent: p.DiscountPercent });
                
                const generalStock = (p as any).Stock;
                const outOfStock = (p as any).StockType === "ready_stock" && generalStock !== undefined && Number(generalStock) === 0;
                const soldOut = !!(p as any).SoldOut || outOfStock;
                const isNew = (p as any).createdAt && (Date.now() - (p as any).createdAt.toDate()) < 30 * 24 * 60 * 60 * 1000;
                return (
                <Link key={p.ID} href={`/product/${encodeURIComponent(getProductSlug(p))}`} className="group block min-w-0">
                  <div className="relative w-full overflow-hidden rounded-[22px] aspect-[3/4] bg-[#F1EEE7]">
                    {isNew && (
                      <span className="absolute top-3 left-3 z-10 bg-white text-[#171813] text-[10px] font-medium px-2.5 py-1 uppercase tracking-[0.12em] rounded-full">New</span>
                    )}
                    {outOfStock && (
                      <span className="absolute top-3 left-3 z-10 bg-[#171813] text-white text-[10px] font-medium px-2.5 py-1 uppercase tracking-[0.12em] rounded-full">
                        Out of stock
                      </span>
                    )}
                    {!outOfStock && soldOut && (
                      <span className="absolute top-3 left-3 z-10 bg-white text-[#171813] text-[10px] font-medium px-2.5 py-1 uppercase tracking-[0.12em] rounded-full">Sold out</span>
                    )}
                    <ProductImage
                      src={p.ImageUrl1}
                      srcMedium={(p as any).ImageUrl1Medium}
                      srcThumb={(p as any).ImageUrl1Thumb}
                      size="medium"
                      objectFit="cover"
                      quality={90}
                      sizes="(min-width: 768px) 25vw, 45vw"
                      alt={p.ProductName}
                      className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700"
                    />
                  </div>

                  <div className="pt-3.5 px-1 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3
                        className="truncate text-[19px] sm:text-[22px] leading-tight text-[#171813]"
                        style={{ fontFamily: "var(--font-cormorant)" }}
                      >
                        {p.ProductName}
                      </h3>
                      {(p as any).SKU && <p className="text-[11px] text-[#9B998F] mt-0.5">{(p as any).SKU}</p>}
                      {p.IsCustomizable && <p className="text-[11px] text-[#595B53] mt-1">Customisable</p>}
                    </div>
                    <div className="text-right shrink-0">
                      {pr.discount > 0 && (
                        <PriceText amount={pr.original} strikeThrough className="block text-[11px] text-[#9B998F] line-through" />
                      )}
                      <PriceText amount={pr.selling} className={"block text-[13px] font-bold " + (pr.discount > 0 ? "text-[#C52020]" : "text-[#171813]")} />
                    </div>
                  </div>
                </Link>
              )})}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FFFFFF] flex items-center justify-center text-[#171813]">Loading...</div>}>
      <ShopContent />
    </Suspense>
  );
}
