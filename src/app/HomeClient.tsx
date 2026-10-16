"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useCategories, Category, MAIN_TEXT_SIZES } from "@/hooks/useCategories";
import { useMarquee } from "@/hooks/useMarquee";
import { useHeroContent } from "@/hooks/useHeroContent";
import ReviewCarousel from "@/components/ReviewCarousel";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase";
import { resolvePricing } from "@/utils/pricing";
import { getProductSlug } from "@/utils/productSlug";
import ProductImage from "@/components/ProductImage";
import PriceText from "@/components/PriceText";
import Image from "next/image";

// Editorial image for the New Collection split section (ethnic wear).
const COLLECTION_IMAGE =
  "https://www.wforwoman.com/cdn/shop/files/22AUW18129-119206_1.jpg?v=1753188628&width=1500";

type Product = {
  ID: number;
  Description: string;
  ProductName?: string;
  ImageUrl1: string;
  Price?: number;
  OriginalPrice?: number;
  Product: string;
  StockType?: string;
  IsCustomizable?: boolean;
  DiscountPercent?: number;
  IsFeatured?: boolean;
  ImageUrl1Medium?: string;
  ImageUrl1Thumb?: string;
  createdAt?: any;
  SKU?: string;
};

function CategoryCard({ cat }: { cat: Category }) {
  return (
    <Link
      href={`/shop?category=${encodeURIComponent(cat.name)}`}
      className="group block overflow-hidden rounded-[22px]"
    >
      <div
        className="relative aspect-[3/4] flex flex-col"
        style={{ backgroundColor: cat.bgColor || '#F1EEE7' }}
      >
        {cat.image && (
          <div className="relative flex-1 overflow-hidden">
            <Image
              src={cat.image}
              alt={cat.name}
              fill
              className="object-cover transition-all duration-500 group-hover:blur-sm"
              sizes="(min-width: 1024px) 25vw, (min-width: 768px) 50vw, 100vw"
            />
          </div>
        )}
        <div className="flex items-center justify-center p-4 text-center min-h-[80px]">
          <span
            style={{ fontFamily: cat.mainTextFont || "var(--font-dm-sans)", wordBreak: 'keep-all' }}
            className={"text-[#171813] leading-[1.05] max-w-full " + (MAIN_TEXT_SIZES[cat.mainTextSize || 4] || MAIN_TEXT_SIZES[4])}
          >
            {cat.name}
          </span>
        </div>
      </div>
    </Link>
  );
}

function ProductCard({ product }: { product: Product }) {
  const p = product;
  const isNew = p.createdAt && (Date.now() - p.createdAt.toDate()) < 30 * 24 * 60 * 60 * 1000;
  const pr = resolvePricing({ Price: p.Price, OriginalPrice: p.OriginalPrice, DiscountPercent: p.DiscountPercent });
  return (
    <Link
      href={`/product/${encodeURIComponent(getProductSlug(p))}`}
      className="group block min-w-0"
    >
      <div className="relative aspect-[3/4] overflow-hidden rounded-[22px] bg-[#F1EEE7]">
        {isNew && (
          <span className="absolute top-3 left-3 z-10 bg-white text-[#171813] text-[10px] font-medium px-2.5 py-1 uppercase tracking-[0.12em] rounded-full">New</span>
        )}
        <ProductImage
          src={p.ImageUrl1}
          srcMedium={(p as any).ImageUrl1Medium}
          srcThumb={(p as any).ImageUrl1Thumb}
          size="medium"
          objectFit="cover"
          quality={90}
          sizes="(min-width: 768px) 25vw, 45vw"
          alt={p.Description}
          className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700"
        />
        <span
          aria-hidden
          className="absolute top-3 right-3 grid place-items-center w-[44px] h-[44px] rounded-full bg-[#171813] text-white opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </span>
      </div>
      <div className="pt-3.5 flex items-start justify-between gap-3 px-1">
        <div className="min-w-0">
          <span
            className="block truncate text-[#171813] text-[19px] sm:text-[22px] leading-tight"
            style={{ fontFamily: "var(--font-cormorant)" }}
          >
            {p.ProductName || p.Description}
          </span>
          {p.SKU && <span className="block text-[11px] text-[#9B998F] mt-0.5">{p.SKU}</span>}
        </div>
        <div className="text-right shrink-0">
          {pr.discount > 0 && (
            <PriceText amount={pr.original} strikeThrough className="block line-through text-[#9B998F] text-[11px]" />
          )}
          <PriceText amount={pr.selling} className={"block text-[13px] font-bold " + (pr.discount > 0 ? "text-[#C52020]" : "text-[#171813]")} />
        </div>
      </div>
    </Link>
  );
}

function CategorySkeleton({ className }: { className?: string }) {
  return (
    <div className={`aspect-[3/4] rounded-[22px] bg-[#F1EEE7] animate-pulse ${className || ""}`} />
  );
}

function ProductSkeleton({ className }: { className?: string }) {
  return (
    <div className="min-w-0">
      <div className={`aspect-[3/4] rounded-[22px] bg-[#F1EEE7] animate-pulse w-full ${className || ""}`} />
      <div className="h-3 w-3/4 bg-[#E1DFDC] animate-pulse mt-4" />
      <div className="h-3 w-1/3 bg-[#E1DFDC] animate-pulse mt-2" />
    </div>
  );
}

export default function HomeClient({ initialHeroTagline }: { initialHeroTagline: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoaded, setProductsLoaded] = useState(false);

  const { categories: firestoreCategories, loading: categoriesLoading } = useCategories();
  const { items: marqueeItems } = useMarquee();
  const { content: heroContent } = useHeroContent(initialHeroTagline);
  const categoryNames = firestoreCategories.map((c) => c.name);

  const carouselRef = useRef<HTMLDivElement>(null);
  const leftBtnRef = useRef<HTMLButtonElement>(null);
  const rightBtnRef = useRef<HTMLButtonElement>(null);

  const productsCarouselRef = useRef<HTMLDivElement>(null);
  const productsLeftBtnRef = useRef<HTMLButtonElement>(null);
  const productsRightBtnRef = useRef<HTMLButtonElement>(null);

  const updateArrows = useCallback(() => {
    const el = carouselRef.current;
    const leftBtn = leftBtnRef.current;
    const rightBtn = rightBtnRef.current;
    if (!el || !leftBtn || !rightBtn) return;
    const atStart = el.scrollLeft <= 4;
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
    leftBtn.classList.toggle("opacity-100", !atStart);
    leftBtn.classList.toggle("opacity-30", atStart);
    leftBtn.classList.toggle("cursor-pointer", !atStart);
    leftBtn.classList.toggle("cursor-default", atStart);
    rightBtn.classList.toggle("opacity-100", !atEnd);
    rightBtn.classList.toggle("opacity-30", atEnd);
    rightBtn.classList.toggle("cursor-pointer", !atEnd);
    rightBtn.classList.toggle("cursor-default", atEnd);
  }, []);

  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;

    el.scrollLeft = 0;

    const run = () => requestAnimationFrame(() => requestAnimationFrame(() => updateArrows()));

    const ro = new ResizeObserver(run);
    ro.observe(el);

    const onPageshow = () => {
      el.scrollLeft = 0;
      requestAnimationFrame(() => requestAnimationFrame(() => updateArrows()));
    };
    window.addEventListener("pageshow", onPageshow);

    el.addEventListener("scroll", updateArrows, { passive: true });
    window.addEventListener("resize", updateArrows);

    run();

    return () => {
      ro.disconnect();
      window.removeEventListener("pageshow", onPageshow);
      el.removeEventListener("scroll", updateArrows);
      window.removeEventListener("resize", updateArrows);
    };
  }, [updateArrows, firestoreCategories]);

  const updateProductsArrows = useCallback(() => {
    const el = productsCarouselRef.current;
    const leftBtn = productsLeftBtnRef.current;
    const rightBtn = productsRightBtnRef.current;
    if (!el || !leftBtn || !rightBtn) return;
    const atStart = el.scrollLeft <= 4;
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
    leftBtn.classList.toggle("opacity-100", !atStart);
    leftBtn.classList.toggle("opacity-30", atStart);
    leftBtn.classList.toggle("cursor-pointer", !atStart);
    leftBtn.classList.toggle("cursor-default", atStart);
    rightBtn.classList.toggle("opacity-100", !atEnd);
    rightBtn.classList.toggle("opacity-30", atEnd);
    rightBtn.classList.toggle("cursor-pointer", !atEnd);
    rightBtn.classList.toggle("cursor-default", atEnd);
  }, []);

  const scrollProductsCarousel = (dir: "left" | "right") => {
    const el = productsCarouselRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("a");
    if (!card) return;
    const gap = 12;
    const scrollAmount = (card.offsetWidth + gap) * 2;
    el.scrollBy({ left: dir === "left" ? -scrollAmount : scrollAmount, behavior: "smooth" });
    requestAnimationFrame(() => requestAnimationFrame(() => updateProductsArrows()));
  };

  useEffect(() => {
    const el = productsCarouselRef.current;
    if (!el) return;

    el.scrollLeft = 0;

    const run = () => requestAnimationFrame(() => requestAnimationFrame(() => updateProductsArrows()));

    const ro = new ResizeObserver(run);
    ro.observe(el);

    const onPageshow = () => {
      el.scrollLeft = 0;
      requestAnimationFrame(() => requestAnimationFrame(() => updateProductsArrows()));
    };
    window.addEventListener("pageshow", onPageshow);

    el.addEventListener("scroll", updateProductsArrows, { passive: true });
    window.addEventListener("resize", updateProductsArrows);

    run();

    return () => {
      ro.disconnect();
      window.removeEventListener("pageshow", onPageshow);
      el.removeEventListener("scroll", updateProductsArrows);
      window.removeEventListener("resize", updateProductsArrows);
    };
  }, [updateProductsArrows, productsLoaded]);

  const scrollCarousel = (dir: "left" | "right") => {
    const el = carouselRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("a");
    if (!card) return;
    const gap = 12;
    const scrollAmount = (card.offsetWidth + gap) * 2;
    el.scrollBy({ left: dir === "left" ? -scrollAmount : scrollAmount, behavior: "smooth" });
    requestAnimationFrame(() => requestAnimationFrame(() => updateArrows()));
  };

  useEffect(() => {
    const fetchProducts = async () => {
      if (!db) { setProductsLoaded(true); return; }
      try {
        const snap = await getDocs(collection(db!, "inventory"));
        setProducts(snap.docs.map(d => d.data() as Product));
      } catch (e) {
        console.error("Failed to load products:", e);
      } finally {
        setProductsLoaded(true);
      }
    };
    fetchProducts();
  }, []);

  const doubledMarquee = [...marqueeItems, ...marqueeItems];

  const scrollToNewCollection = () => {
    const el = document.getElementById("new-collection");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      {/* Hero */}
      <section className="relative isolate w-full overflow-hidden bg-[#0b1f2e]">
        {/* Ocean background */}
        <div
          aria-hidden
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/hero.jpeg')", transform: "scale(1.8)", transformOrigin: "center bottom" }}
        />
        {/* Readability overlay — keeps the water texture visible */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(6,18,30,0.55) 0%, rgba(6,18,30,0.28) 42%, rgba(6,18,30,0.64) 100%)",
          }}
        />

        {/* Content */}
        <div className="relative z-10 mx-auto flex min-h-[510px] w-full max-w-[1600px] flex-col items-center justify-center px-5 pb-24 pt-[calc(var(--navbar-height,68px)+24px)] text-center text-white sm:min-h-[540px] lg:min-h-[600px] xl:min-h-[660px]">
          <h1
            className="mt-0 text-[42px] leading-none text-white sm:text-[54px] md:text-[64px]"
            style={{ fontFamily: "var(--font-cormorant)", letterSpacing: "0.045em" }}
          >
            THE SAGAR&rsquo;S
          </h1>

          <span className="mt-1 text-[14px] uppercase text-white/90 sm:text-[17px] md:text-[19px]" style={{ letterSpacing: "0.52em" }}>
            Design House
          </span>

          <p className="mt-8 text-[11px] uppercase text-white/75 sm:text-[12px] md:text-[13px]" style={{ letterSpacing: "0.34em" }}>
            {heroContent.tagline}
          </p>

          <Link
            href="/shop"
            className="group mt-10 inline-flex h-[36px] w-[165px] items-center justify-center gap-2 border border-white/90 bg-transparent text-[10px] uppercase tracking-[0.3em] text-white transition-colors duration-300 hover:bg-[#f7f4ee] hover:text-[#0b1f2e] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/80"
          >
            Shop Now
            <svg
              className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 12h16m0 0l-6-6m6 6l-6 6" />
            </svg>
          </Link>
        </div>

        {/* Scroll indicator */}
        <button
          type="button"
          onClick={scrollToNewCollection}
          aria-label="Scroll to new collection"
          className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2 rounded-sm text-white/75 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/70"
        >
          <span aria-hidden className="hero-scroll-line block h-7 w-px bg-current" />
          <span className="text-[8px] uppercase tracking-[0.3em]">Scroll</span>
        </button>
      </section>

      {/* New Collection — editorial split */}
      <section id="new-collection" className="w-full bg-white">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Left: fabric / ethnic image */}
          <div className="relative min-h-[340px] overflow-hidden bg-[#e7e2d8] sm:min-h-[440px] md:min-h-[560px]">
            <Image
              src={COLLECTION_IMAGE}
              alt="Close-up detail of flowing ethnic fabric"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>

          {/* Right: content */}
          <div className="flex items-center justify-center bg-[#f1eee7] px-7 py-16 sm:px-12 md:py-24">
            <div className="max-w-[440px] text-center">
              <span className="text-[11px] uppercase text-[#6a7684]" style={{ letterSpacing: "0.32em" }}>
                New Collection
              </span>
              <span aria-hidden className="mx-auto mt-4 block h-px w-12 bg-[#0e2432]/30" />
              <h2
                className="mt-6 text-[40px] leading-[1.02] text-[#0e2432] sm:text-[56px] lg:text-[68px]"
                style={{ fontFamily: "var(--font-cormorant)", letterSpacing: "0.02em" }}
              >
                ETHNIC WEAR
              </h2>
              <p className="mt-5 text-[13px] leading-[1.9] text-[#6a7684]">
                Handwoven sarees, heirloom silhouettes and a modern ethnic edit — crafted
                to be worn now and treasured for years.
              </p>
              <Link
                href="/shop"
                className="group mt-8 inline-flex items-center gap-3 border-b border-[#0e2432]/25 pb-1 text-[11px] uppercase text-[#0e2432] transition-colors hover:border-[#0e2432] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0e2432]/60"
                style={{ letterSpacing: "0.28em" }}
              >
                Explore the collection
                <svg
                  className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 12h16m0 0l-6-6m6 6l-6 6" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Category Marquee */}
      <div className="w-full bg-white py-3.5 border-t border-b border-[#D8D5CD] overflow-hidden">
        <div className="animate-marquee text-[11px] text-[#595B53] tracking-[0.18em] uppercase font-medium">
          {[...categoryNames, "Handmade with love", "Supporting Malaysian artisans", "Eco-friendly craft",
            ...categoryNames, "Handmade with love", "Supporting Malaysian artisans", "Eco-friendly craft"
          ].map((cat, i) => (
            <span key={i} className="mx-7 inline-block whitespace-nowrap">{cat}</span>
          ))}
        </div>
      </div>

      {/* Categories */}
      <section id="categories" className="px-5 sm:px-[3%] pt-14 sm:pt-20 bg-white">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex items-end justify-between gap-4 mb-8 sm:mb-10">
            <div>
              <span className="mh-eyebrow">Shop by category</span>
              <h2
                className="text-[32px] sm:text-[46px] leading-[1.05] text-[#171813] mt-2"
                style={{ fontFamily: "var(--font-cormorant)" }}
              >
                Find your favourite
              </h2>
            </div>
            <Link href="/shop" className="hidden sm:inline-flex mh-link shrink-0">
              View all
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 12h16m0 0l-6-6m6 6l-6 6" />
              </svg>
            </Link>
          </div>

          {categoriesLoading ? (
            <>
              {/* Mobile: 2-col grid */}
              <div className="lg:hidden grid grid-cols-2 gap-4 sm:gap-5">
                {[0, 1, 2, 3, 4, 5].map(i => (
                  <CategorySkeleton key={i} />
                ))}
              </div>
              {/* Desktop: 4 across */}
              <div className="hidden lg:grid grid-cols-4 gap-3">
                {[0, 1, 2, 3].map(i => (
                  <CategorySkeleton key={i} />
                ))}
              </div>
            </>
          ) : (
            <>
              {/* Mobile: 2-col grid */}
              <div className="lg:hidden grid grid-cols-2 gap-4 sm:gap-5">
                {firestoreCategories.map(cat => (
                  <CategoryCard key={cat.id} cat={cat} />
                ))}
              </div>

              {/* Desktop: carousel showing 4 at a time */}
              <div className="hidden lg:block relative">
                <button
                  ref={leftBtnRef}
                  onClick={() => scrollCarousel("left")}
                  className="absolute left-0 top-0 bottom-0 z-10 w-14 flex items-center justify-center transition-opacity duration-300 opacity-30 cursor-default"
                  aria-label="Scroll left"
                >
                  <span className="w-10 h-10 rounded-full bg-white shadow-sm border border-[#D8D5CD] flex items-center justify-center hover:bg-[#F1EEE7] transition-colors">
                    <svg className="w-4 h-4 text-[#171813]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                    </svg>
                  </span>
                </button>
                <button
                  ref={rightBtnRef}
                  onClick={() => scrollCarousel("right")}
                  className="absolute right-0 top-0 bottom-0 z-10 w-14 flex items-center justify-center transition-opacity duration-300 opacity-100 cursor-pointer"
                  aria-label="Scroll right"
                >
                  <span className="w-10 h-10 rounded-full bg-white shadow-sm border border-[#D8D5CD] flex items-center justify-center hover:bg-[#F1EEE7] transition-colors">
                    <svg className="w-4 h-4 text-[#171813]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </button>
                <div
                  ref={carouselRef}
                  className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth"
                  style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                  {firestoreCategories.map(cat => (
                    <div key={cat.id} className="flex-none w-[calc(25%-18px)]">
                      <CategoryCard cat={cat} />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Most Loved */}
      {(() => {
        const featured = products.filter(p => p.IsFeatured);
        const mobileFeatured = featured.slice(0, 4);
        return (
          <section className="px-5 sm:px-[3%] pt-14 sm:pt-20 pb-10 sm:pb-16 bg-white">
            <div className="max-w-[1600px] mx-auto">
              <div className="flex items-end justify-between gap-4 mb-8 sm:mb-10">
                <div>
                  <span className="mh-eyebrow">The current edit</span>
                  <h2
                    className="text-[32px] sm:text-[46px] leading-[1.05] text-[#171813] mt-2"
                    style={{ fontFamily: "var(--font-cormorant)" }}
                  >
                    Most loved pieces
                  </h2>
                </div>
                <Link href="/shop" className="hidden sm:inline-flex mh-link shrink-0">
                  View all
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 12h16m0 0l-6-6m6 6l-6 6" />
                  </svg>
                </Link>
              </div>

              {!productsLoaded ? (
                <>
                  {/* Mobile: 2x2 grid, max 4 */}
                  <div className="lg:hidden grid grid-cols-2 gap-4 sm:gap-5">
                    {[0, 1, 2, 3].map(i => (
                      <ProductSkeleton key={i} />
                    ))}
                  </div>
                  {/* Desktop: 4 across */}
                  <div className="hidden lg:grid grid-cols-4 gap-5">
                    {[0, 1, 2, 3].map(i => (
                      <ProductSkeleton key={i} />
                    ))}
                  </div>
                </>
              ) : featured.length === 0 ? null : (
                <>
                  {/* Mobile: 2x2 grid, max 4 */}
                  <div className="lg:hidden grid grid-cols-2 gap-4 sm:gap-5">
                    {mobileFeatured.map((p) => (
                      <ProductCard key={p.ID} product={p} />
                    ))}
                  </div>

                  {/* Desktop: carousel showing 4 at a time */}
                  <div className="hidden lg:block relative">
                    <button
                      ref={productsLeftBtnRef}
                      onClick={() => scrollProductsCarousel("left")}
                      className="absolute left-0 top-0 bottom-0 z-10 w-14 flex items-center justify-center transition-opacity duration-300 opacity-30 cursor-default"
                      aria-label="Scroll left"
                    >
                      <span className="w-10 h-10 rounded-full bg-white shadow-sm border border-[#D8D5CD] flex items-center justify-center hover:bg-[#F1EEE7] transition-colors">
                        <svg className="w-4 h-4 text-[#171813]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                        </svg>
                      </span>
                    </button>
                    <button
                      ref={productsRightBtnRef}
                      onClick={() => scrollProductsCarousel("right")}
                      className="absolute right-0 top-0 bottom-0 z-10 w-14 flex items-center justify-center transition-opacity duration-300 opacity-100 cursor-pointer"
                      aria-label="Scroll right"
                    >
                      <span className="w-10 h-10 rounded-full bg-white shadow-sm border border-[#D8D5CD] flex items-center justify-center hover:bg-[#F1EEE7] transition-colors">
                        <svg className="w-4 h-4 text-[#171813]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </button>
                    <div
                      ref={productsCarouselRef}
                      className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth"
                      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                    >
                      {featured.map((p) => (
                        <div key={p.ID} className="flex-none w-[calc(25%-18px)]">
                          <ProductCard product={p} />
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>
        );
      })()}

      {/* New Arrivals */}
      {products.length > 6 && (
        <section className="px-5 sm:px-[3%] pt-6 sm:pt-10 pb-14 sm:pb-20 bg-white">
          <div className="max-w-[1600px] mx-auto">
            <div className="flex items-end justify-between gap-4 mb-8 sm:mb-10">
              <div>
                <span className="mh-eyebrow">Just landed</span>
                <h2
                  className="text-[32px] sm:text-[46px] leading-[1.05] text-[#171813] mt-2"
                  style={{ fontFamily: "var(--font-cormorant)" }}
                >
                  New arrivals
                </h2>
              </div>
              <Link href="/shop" className="hidden sm:inline-flex mh-link shrink-0">
                View all
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 12h16m0 0l-6-6m6 6l-6 6" />
                </svg>
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 sm:gap-x-6 gap-y-8 sm:gap-y-9">
              {products.slice(6, 9).map((p) => (
                <ProductCard key={p.ID} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Bottom Promotional Marquee */}
      <div className="w-full bg-[#F1EEE7] py-3.5 overflow-hidden">
        <div className="animate-marquee text-[11px] text-[#171813] tracking-[0.18em] uppercase font-medium">
          {doubledMarquee.map((text, i) => (
            <span key={i} className="mx-7 inline-block whitespace-nowrap">{text}</span>
          ))}
        </div>
      </div>

      <ReviewCarousel />

      {/* Handmade tag */}
      <div className="w-full bg-white pb-14 sm:pb-20">
        <p
          className="text-center text-[#595B53] text-sm tracking-[0.15em]"
          style={{ fontFamily: "var(--font-cormorant)" }}
        >
          Handmade with love
        </p>
      </div>
    </>
  );
}
