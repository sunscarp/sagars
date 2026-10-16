"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useHeroContent } from "@/hooks/useHeroContent";
import { useHomeContent } from "@/hooks/useHomeContent";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase";
import { resolvePricing } from "@/utils/pricing";
import { getProductSlug } from "@/utils/productSlug";
import ProductImage from "@/components/ProductImage";
import PriceText from "@/components/PriceText";
import Image from "next/image";
import { Scissors, Shirt, Ruler, Gem } from "lucide-react";

const COLOR_HEX: Record<string, string> = {
  black: "#111111",
  white: "#ffffff",
  ivory: "#f5ebdd",
  cream: "#f5ebdd",
  beige: "#e8dcc8",
  red: "#b3261e",
  maroon: "#7b1e2b",
  green: "#2e6b4f",
  emerald: "#0f6b4f",
  blue: "#2b4d8a",
  navy: "#0e2432",
  yellow: "#e0b23a",
  gold: "#c9a227",
  pink: "#e2a0b4",
  rose: "#c96a7a",
  purple: "#6b3fa0",
  violet: "#6b3fa0",
  orange: "#d9762b",
  brown: "#6b4a2b",
  grey: "#8a8a8a",
  gray: "#8a8a8a",
  teal: "#2a7f7f",
  peach: "#f0b89a",
  lilac: "#b9a3d1",
  mustard: "#c8a13a",
  wine: "#6b1f34",
  magenta: "#b0308a",
  turquoise: "#3fb0a8",
};

function swatchColor(name: string) {
  return COLOR_HEX[name.trim().toLowerCase()] || "#cfc7b8";
}

type ProductItem = {
  ID: number;
  Description: string;
  ProductName?: string;
  ImageUrl1: string;
  Price?: number;
  OriginalPrice?: number;
  Product?: string;
  StockType?: string;
  IsCustomizable?: boolean;
  DiscountPercent?: number;
  IsFeatured?: boolean;
  Colors?: string[];
  ImageUrl1Medium?: string;
  ImageUrl1Thumb?: string;
  createdAt?: any;
  SKU?: string;
};

function ArrowGlyph({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 12h16m0 0l-6-6m6 6l-6 6" />
    </svg>
  );
}

function ProductCard({ product }: { product: ProductItem }) {
  const p = product;
  const pr = resolvePricing({ Price: p.Price, OriginalPrice: p.OriginalPrice, DiscountPercent: p.DiscountPercent });
  const colors = Array.isArray(p.Colors) ? p.Colors.filter(Boolean) : [];
  const shownColors = colors.slice(0, 4);

  return (
    <Link href={`/product/${encodeURIComponent(getProductSlug(p as any))}`} className="group block min-w-0">
      <div className="relative aspect-[3/4] overflow-hidden bg-[#efe7d9]">
        <ProductImage
          src={p.ImageUrl1}
          srcMedium={p.ImageUrl1Medium}
          srcThumb={p.ImageUrl1Thumb}
          size="medium"
          objectFit="cover"
          quality={90}
          sizes="(min-width: 1024px) 23vw, (min-width: 640px) 45vw, 90vw"
          alt={p.ProductName || p.Description}
          className="h-full w-full transition-transform duration-700 ease-out group-hover:scale-[1.03]"
        />
      </div>
      <div className="pt-4">
        <h3 className="text-[11px] uppercase tracking-[0.18em] text-[#242424] leading-snug">
          {p.ProductName || p.Description}
        </h3>
        <div className="mt-1.5">
          <PriceText amount={pr.selling} className="text-[13px] text-[#242424]" />
        </div>
        {shownColors.length > 0 && (
          <div className="mt-3 flex items-center gap-1.5" aria-label="Available colours">
            {shownColors.map((c, i) => (
              <span
                key={`${c}-${i}`}
                title={c}
                className="inline-block h-2.5 w-2.5 rounded-full border border-[#242424]/20"
                style={{ backgroundColor: swatchColor(c) }}
              />
            ))}
            {colors.length > shownColors.length && (
              <span className="ml-1 text-[10px] text-[#8a8478]">+{colors.length - shownColors.length}</span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}

function ProductCardSkeleton() {
  return (
    <div className="min-w-0">
      <div className="aspect-[3/4] w-full animate-pulse bg-[#e8dfd0]" />
      <div className="mt-4 h-3 w-3/4 bg-[#e1d8c8] animate-pulse" />
      <div className="mt-2 h-3 w-1/3 bg-[#e1dfdc] animate-pulse" />
    </div>
  );
}

export default function HomeClient({ initialHeroTagline }: { initialHeroTagline: string }) {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [productsLoaded, setProductsLoaded] = useState(false);
  const [favPage, setFavPage] = useState(0);

  const { content: heroContent } = useHeroContent(initialHeroTagline);
  const { content: homeContent } = useHomeContent();

  useEffect(() => {
    const fetchProducts = async () => {
      if (!db) { setProductsLoaded(true); return; }
      try {
        const snap = await getDocs(collection(db!, "inventory"));
        setProducts(snap.docs.map((d) => d.data() as ProductItem));
      } catch (e) {
        console.error("Failed to load products:", e);
      } finally {
        setProductsLoaded(true);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (els.length === 0) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion || typeof IntersectionObserver === "undefined") {
      els.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0, rootMargin: "0px 0px -8% 0px" }
    );

    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [productsLoaded]);

  const scrollToNewCollection = () => {
    const el = document.getElementById("new-collection");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const resolveByIds = (ids: number[]) => {
    const byId = new Map(products.map((p) => [p.ID, p]));
    return ids.map((id) => byId.get(id)).filter(Boolean) as ProductItem[];
  };

  const featured = products.filter((p) => p.IsFeatured);
  const featuredPicks = (() => {
    if (homeContent.featuredProductIds.length > 0) {
      return resolveByIds(homeContent.featuredProductIds).slice(0, 4);
    }
    const out: ProductItem[] = [...featured];
    for (const p of products) {
      if (out.length >= 4) break;
      if (!out.find((x) => x.ID === p.ID)) out.push(p);
    }
    return out.slice(0, 4);
  })();

  const allImages = products
    .map((p) => p.ImageUrl1Medium || p.ImageUrl1)
    .filter(Boolean) as string[];
  const experienceImages = [0, 1, 2].map(
    (i) => homeContent.experienceImages[i] || allImages[i] || ""
  );
  const tailoringImage =
    homeContent.tailoringImage || allImages[3] || allImages[0] || allImages[1];

  const favourites = (() => {
    if (homeContent.favouriteProductIds.length > 0) {
      return resolveByIds(homeContent.favouriteProductIds);
    }
    const out: ProductItem[] = [...featured];
    for (const p of products) {
      if (out.length >= 6) break;
      if (!out.find((x) => x.ID === p.ID)) out.push(p);
    }
    return out.slice(0, 6);
  })();
  const PER_PAGE = 3;
  const favPageCount = Math.max(1, Math.ceil(favourites.length / PER_PAGE));
  const safeFavPage = Math.min(favPage, favPageCount - 1);
  const favVisible = favourites.slice(safeFavPage * PER_PAGE, safeFavPage * PER_PAGE + PER_PAGE);

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
        {/* Readability overlay â€” keeps the water texture visible */}
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
            data-reveal
            className="reveal mt-0 text-[42px] leading-none text-white sm:text-[54px] md:text-[64px]"
            style={{ fontFamily: "var(--font-cormorant)", letterSpacing: "0.045em", transitionDelay: "0ms" }}
          >
            THE SAGAR&rsquo;S
          </h1>

          <span data-reveal className="reveal mt-1 text-[14px] uppercase text-white/90 sm:text-[17px] md:text-[19px]" style={{ letterSpacing: "0.52em", transitionDelay: "120ms" }}>
            Design House
          </span>

          <p data-reveal className="reveal mt-8 text-[11px] uppercase text-white/75 sm:text-[12px] md:text-[13px]" style={{ letterSpacing: "0.34em", transitionDelay: "220ms" }}>
            {heroContent.tagline}
          </p>

          <div data-reveal className="reveal mt-10" style={{ transitionDelay: "340ms" }}>
            <Link
              href="/shop"
              className="group inline-flex h-[36px] w-[165px] items-center justify-center gap-2 border border-white/90 bg-transparent text-[10px] uppercase tracking-[0.3em] text-white transition-colors duration-300 hover:bg-[#f7f4ee] hover:text-[#0b1f2e] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/80"
            >
              Shop Now
              <ArrowGlyph className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>

        <button
          type="button"
          onClick={scrollToNewCollection}
          className="absolute bottom-0 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center pb-4 text-white/80 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/60"
          aria-label="Scroll to Choose Your Experience"
        >
          <span aria-hidden className="hero-scroll-line block h-7 w-px bg-current" />
          <span className="mt-2 text-[8px] uppercase tracking-[0.3em]">Scroll</span>
        </button>
      </section>

      {/* Section 1 â€” Choose Your Experience */}
      <section id="new-collection" className="w-full bg-[#F5EBDD]">
        <div className="mx-auto max-w-[1600px] px-5 py-16 sm:px-[4%] sm:py-20 lg:py-24">
          <div data-reveal className="reveal mx-auto max-w-2xl text-center">
            <span className="mh-eyebrow">CHOOSE YOUR EXPERIENCE</span>
            <h2
              className="mt-3 text-[30px] leading-[1.05] text-[#242424] sm:text-[42px] lg:text-[52px]"
              style={{ fontFamily: "var(--font-cormorant)" }}
            >
              CHOOSE YOUR EXPERIENCE
            </h2>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-3 sm:mt-14 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              href="/shop"
              data-reveal
              className="reveal reveal-scale group relative block min-h-[420px] overflow-hidden sm:min-h-[480px] lg:min-h-[560px] lg:col-span-1"
              style={{ backgroundColor: "#0b1f2e", transitionDelay: "0ms" }}
            >
              {experienceImages[0] && (
                <Image
                  src={experienceImages[0]}
                  alt="Bespoke Experience"
                  fill
                  sizes="(min-width: 1024px) 33vw, 100vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                />
              )}
              <div
                aria-hidden
                className="absolute inset-0"
                style={{ background: "linear-gradient(180deg, rgba(6,18,30,0.30) 0%, rgba(6,18,30,0.20) 45%, rgba(6,18,30,0.86) 100%)" }}
              />
              <div className="absolute inset-x-0 bottom-0 z-10 p-6 text-white sm:p-8">
                <h3 className="text-[20px] leading-tight tracking-[0.14em] sm:text-[22px]" style={{ fontFamily: "var(--font-cormorant)" }}>
                  BESPOKE EXPERIENCE
                </h3>
                <p className="mt-3 max-w-[28ch] text-[13px] leading-relaxed text-white/80">
                  Explore our bespoke designs crafted just for you.
                </p>
                <span className="mt-6 inline-flex items-center gap-3 border border-white/70 px-5 py-3 text-[10px] uppercase tracking-[0.28em] transition-colors group-hover:bg-white group-hover:text-[#061B2A]">
                  Explore Designs
                  <ArrowGlyph className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>

            <Link
              href="/services"
              data-reveal
              className="reveal reveal-scale group relative block min-h-[420px] overflow-hidden sm:min-h-[480px] lg:min-h-[560px]"
              style={{ backgroundColor: "#0b1f2e", transitionDelay: "140ms" }}
            >
              {experienceImages[1] && (
                <Image
                  src={experienceImages[1]}
                  alt="Custom Design Services"
                  fill
                  sizes="(min-width: 1024px) 33vw, 100vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                />
              )}
              <div
                aria-hidden
                className="absolute inset-0"
                style={{ background: "linear-gradient(180deg, rgba(6,18,30,0.30) 0%, rgba(6,18,30,0.20) 45%, rgba(6,18,30,0.86) 100%)" }}
              />
              <div className="absolute inset-x-0 bottom-0 z-10 p-6 text-white sm:p-8">
                <h3 className="text-[20px] leading-tight tracking-[0.14em] sm:text-[22px]" style={{ fontFamily: "var(--font-cormorant)" }}>
                  CUSTOM DESIGN SERVICES
                </h3>
                <p className="mt-3 max-w-[28ch] text-[13px] leading-relaxed text-white/80">
                  Bring your vision to life with personalised designs.
                </p>
                <span className="mt-6 inline-flex items-center gap-3 border border-white/70 px-5 py-3 text-[10px] uppercase tracking-[0.28em] transition-colors group-hover:bg-white group-hover:text-[#061B2A]">
                  Explore Custom Designs
                  <ArrowGlyph className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>

            <Link
              href="/faq"
              data-reveal
              className="reveal reveal-scale group relative block min-h-[420px] overflow-hidden sm:min-h-[480px] lg:min-h-[560px] sm:col-span-2 lg:col-span-1"
              style={{ backgroundColor: "#0b1f2e", transitionDelay: "280ms" }}
            >
              {experienceImages[2] && (
                <Image
                  src={experienceImages[2]}
                  alt="Online Consultation"
                  fill
                  sizes="(min-width: 1024px) 33vw, 100vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                />
              )}
              <div
                aria-hidden
                className="absolute inset-0"
                style={{ background: "linear-gradient(180deg, rgba(6,18,30,0.30) 0%, rgba(6,18,30,0.20) 45%, rgba(6,18,30,0.86) 100%)" }}
              />
              <div className="absolute inset-x-0 bottom-0 z-10 p-6 text-white sm:p-8">
                <h3 className="text-[20px] leading-tight tracking-[0.14em] sm:text-[22px]" style={{ fontFamily: "var(--font-cormorant)" }}>
                  ONLINE CONSULTATION
                </h3>
                <p className="mt-3 max-w-[28ch] text-[13px] leading-relaxed text-white/80">
                  Let&rsquo;s create something beautiful together.
                </p>
                <span className="mt-6 inline-flex items-center gap-3 border border-white/70 px-5 py-3 text-[10px] uppercase tracking-[0.28em] transition-colors group-hover:bg-white group-hover:text-[#061B2A]">
                  Book a Consultation
                  <ArrowGlyph className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Section 2 â€” Featured Collection */}
      <section id="categories" className="w-full bg-[#F5EBDD] border-t border-[#D8D5CD]">
        <div className="mx-auto max-w-[1600px] px-5 py-16 sm:px-[3%] sm:py-20">
          <div data-reveal className="reveal mx-auto max-w-2xl text-center">
            <span className="mh-eyebrow">Featured Collection</span>
            <h2
              className="mt-3 text-[32px] sm:text-[46px] leading-[1.05] text-[#242424] break-words"
              style={{ fontFamily: "var(--font-cormorant)" }}
            >
              TOP PICKS OF THE SEASON
            </h2>
          </div>

          {!productsLoaded ? (
            <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-9 sm:mt-14 lg:grid-cols-4 lg:gap-x-6">
              {[0, 1, 2, 3].map((i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : featuredPicks.length === 0 ? (
            <p className="mt-14 text-center text-sm text-[#595B53]">New pieces coming soon.</p>
          ) : (
            <div data-reveal className="reveal mt-10 grid grid-cols-2 gap-x-4 gap-y-11 sm:mt-14 sm:gap-y-14 lg:grid-cols-4 lg:gap-x-6">
              {featuredPicks.map((p) => (
                <ProductCard key={p.ID} product={p} />
              ))}
            </div>
          )}

          <div data-reveal className="reveal mt-12 flex justify-center sm:mt-14">
            <Link
              href="/shop"
              className="group inline-flex items-center gap-3 border border-[#242424] px-8 py-4 text-[11px] uppercase tracking-[0.24em] text-[#242424] transition-colors hover:bg-[#242424] hover:text-[#F5EBDD]"
            >
              View All Designs
              <ArrowGlyph className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Section 3 â€” Tailoring & Personalised Services */}
      <section className="w-full overflow-hidden" style={{ backgroundColor: "#061B2A" }}>
        <div className="mx-auto max-w-[1600px] px-5 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            <div data-reveal className="reveal order-2 flex flex-col justify-center py-14 lg:order-1 lg:py-24 lg:pr-14">
              <span className="text-[11px] uppercase tracking-[0.22em] text-[#9fb3c0]">
                Tailoring by Lisha Enterprise
              </span>
              <h2
                className="mt-4 text-[32px] leading-[1.08] text-[#f7f4ee] sm:text-[46px]"
                style={{ fontFamily: "var(--font-cormorant)" }}
              >
                TAILORING &amp;
                <br />
                PERSONALISED SERVICES
              </h2>
              <p className="mt-5 max-w-[46ch] text-[14px] leading-[1.9] text-[#c7d2da]">
                Thoughtfully curated services to bring you a perfect fit, with attention to every detail.
              </p>
            </div>

            <div data-reveal className="reveal reveal-scale order-1 relative aspect-[16/9] self-start lg:order-2 lg:translate-x-[calc(48px_+_max(0px,50vw_-_800px))]">
              {tailoringImage ? (
                <Image
                  src={tailoringImage}
                  alt="Detailed tailoring and artisan fabric work"
                  fill
                  sizes="(min-width: 1024px) 55vw, 100vw"
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0" style={{ backgroundColor: "#0b1f2e" }} />
              )}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-y-0 left-0 w-[12.5%]"
                style={{ background: "linear-gradient(90deg, #061B2A 0%, rgba(6,27,42,0) 100%)" }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <div data-reveal className="reveal flex flex-col items-center border-b border-[#38505F] px-4 py-6 text-center last:border-b-0 sm:border-b-0" style={{ transitionDelay: "0ms" }}>
              <Scissors className="h-5 w-5 shrink-0 text-[#BBA17A]" strokeWidth={1.25} aria-hidden />
              <h3
                className="mt-3 min-h-[46px] text-[18px] font-normal uppercase leading-[1.25] tracking-[0.14em] text-[#F5F0E8]"
                style={{ fontFamily: "var(--font-cormorant)" }}
              >
                Master Tailoring Service
              </h3>
              <p className="mt-2 min-h-[56px] max-w-[240px] text-[13px] leading-[1.55] text-[#D0D7DC]/80">
                Expert tailoring with attention to fit, finish and the finer details.
              </p>
              <Link
                href="/services"
                className="group mt-auto inline-flex items-center gap-2 pt-4 text-[12px] font-medium uppercase tracking-[0.22em] text-[#F5F0E8] hover:text-white"
              >
                View Services
                <ArrowGlyph className="h-3 w-3 text-[#BBA17A] transition-transform duration-300 group-hover:translate-x-0.5" />
              </Link>
            </div>

            <div data-reveal className="reveal flex flex-col items-center border-b border-[#38505F] px-4 py-6 text-center last:border-b-0 sm:border-b-0 sm:border-l" style={{ transitionDelay: "100ms" }}>
              <Shirt className="h-5 w-5 shrink-0 text-[#BBA17A]" strokeWidth={1.25} aria-hidden />
              <h3
                className="mt-3 min-h-[46px] text-[18px] font-normal uppercase leading-[1.25] tracking-[0.14em] text-[#F5F0E8]"
                style={{ fontFamily: "var(--font-cormorant)" }}
              >
                Saree Pleating Service
              </h3>
              <p className="mt-2 min-h-[56px] max-w-[240px] text-[13px] leading-[1.55] text-[#D0D7DC]/80">
                Choose from two saree pleating options for a graceful and flawless drape.
              </p>
              <Link
                href="/services"
                className="group mt-auto inline-flex items-center gap-2 pt-4 text-[12px] font-medium uppercase tracking-[0.22em] text-[#F5F0E8] hover:text-white"
              >
                View Options
                <ArrowGlyph className="h-3 w-3 text-[#BBA17A] transition-transform duration-300 group-hover:translate-x-0.5" />
              </Link>
            </div>

            <div data-reveal className="reveal flex flex-col items-center border-b border-[#38505F] px-4 py-6 text-center last:border-b-0 sm:border-b-0 lg:border-l" style={{ transitionDelay: "200ms" }}>
              <Ruler className="h-5 w-5 shrink-0 text-[#BBA17A]" strokeWidth={1.25} aria-hidden />
              <h3
                className="mt-3 min-h-[46px] text-[18px] font-normal uppercase leading-[1.25] tracking-[0.14em] text-[#F5F0E8]"
                style={{ fontFamily: "var(--font-cormorant)" }}
              >
                Full Body Measurement Service
              </h3>
              <p className="mt-2 min-h-[56px] max-w-[240px] text-[13px] leading-[1.55] text-[#D0D7DC]/80">
                Personalised measurements for a comfortable, flattering fit.
              </p>
              <span
                className="mt-auto pt-3 text-[24px] leading-none text-[#BBA17A]"
                style={{ fontFamily: "var(--font-cormorant)" }}
              >
                RM 25
              </span>
            </div>

            <div data-reveal className="reveal flex flex-col items-center border-[#38505F] px-4 py-6 text-center sm:border-l" style={{ transitionDelay: "300ms" }}>
              <Gem className="h-5 w-5 shrink-0 text-[#BBA17A]" strokeWidth={1.25} aria-hidden />
              <h3
                className="mt-3 min-h-[46px] text-[18px] font-normal uppercase leading-[1.25] tracking-[0.14em] text-[#F5F0E8]"
                style={{ fontFamily: "var(--font-cormorant)" }}
              >
                Saree Accessorising Service
              </h3>
              <p className="mt-2 min-h-[56px] max-w-[240px] text-[13px] leading-[1.55] text-[#D0D7DC]/80">
                Thoughtfully curated accessories to complete your look.
              </p>
              <Link
                href="/shop"
                className="group mt-auto inline-flex items-center gap-2 pt-4 text-[12px] font-medium uppercase tracking-[0.22em] text-[#F5F0E8] hover:text-white"
              >
                Explore Accessories
                <ArrowGlyph className="h-3 w-3 text-[#BBA17A] transition-transform duration-300 group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4 â€” Our Favourites */}
      <section className="w-full" style={{ backgroundColor: "#F5EBDD" }}>
        <div className="mx-auto max-w-[1600px] px-5 py-4 sm:px-[3%] sm:py-6 lg:py-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.5fr)] lg:items-center lg:gap-12">
            <div data-reveal className="reveal">
              <span className="mh-eyebrow">Our Favourites</span>
              <h2
                className="mt-3 text-[30px] leading-[1.05] text-[#242424] sm:text-[44px]"
                style={{ fontFamily: "var(--font-cormorant)" }}
              >
                THE SAGAR&rsquo;S MOST LOVED
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-[#595B53]">
                Discover the designs our customers keep coming back to.
              </p>
              <Link
                href="/shop"
                className="group mt-7 inline-flex items-center gap-3 border border-[#242424] px-7 py-3.5 text-[11px] uppercase tracking-[0.22em] text-[#242424] transition-colors hover:bg-[#242424] hover:text-[#F5EBDD]"
              >
                Shop Customer Favourites
                <ArrowGlyph className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
              </Link>
            </div>

            <div data-reveal className="reveal reveal-scale relative" style={{ transitionDelay: "140ms" }}>
              {!productsLoaded ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {[0, 1, 2].map((i) => (
                    <ProductCardSkeleton key={i} />
                  ))}
                </div>
              ) : favourites.length === 0 ? (
                <p className="text-sm text-[#595B53]">Favourites coming soon.</p>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5">
                    {favVisible.map((p) => (
                      <ProductCard key={p.ID} product={p} />
                    ))}
                  </div>

                  {favPageCount > 1 && (
                    <div className="mt-8 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setFavPage((v) => Math.max(0, v - 1))}
                        disabled={safeFavPage === 0}
                        aria-label="Previous favourites"
                        className="grid h-10 w-10 place-items-center border border-[#242424]/30 text-[#242424] transition-colors hover:bg-[#242424] hover:text-[#F5EBDD] disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[#242424]"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>

                      <div className="flex items-center gap-2">
                        {Array.from({ length: favPageCount }).map((_, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setFavPage(i)}
                            aria-label={`Go to favourites page ${i + 1}`}
                            aria-current={safeFavPage === i ? "true" : undefined}
                            className={`h-1.5 w-1.5 rounded-full transition-colors ${safeFavPage === i ? "bg-[#242424]" : "bg-[#242424]/25"}`}
                          />
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => setFavPage((v) => Math.min(favPageCount - 1, v + 1))}
                        disabled={safeFavPage >= favPageCount - 1}
                        aria-label="Next favourites"
                        className="grid h-10 w-10 place-items-center border border-[#242424]/30 text-[#242424] transition-colors hover:bg-[#242424] hover:text-[#F5EBDD] disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[#242424]"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Section 5 â€” Ready to Get Started? */}
      <section className="w-full" style={{ backgroundColor: "#061B2A" }}>
        <div data-reveal className="reveal mx-auto flex max-w-3xl flex-col items-center px-5 py-20 text-center text-white sm:py-28">
          <span className="text-[10px] uppercase tracking-[0.3em] text-white/60">Let&rsquo;s Create Together</span>
          <h2
            className="mt-4 text-[32px] leading-[1.05] text-[#F5EBDD] sm:text-[52px]"
            style={{ fontFamily: "var(--font-cormorant)" }}
          >
            READY TO GET STARTED?
          </h2>
          <p className="mt-5 max-w-lg text-sm leading-relaxed text-white/70">
            Whether it&rsquo;s a simple alteration or a complete custom fit, we&rsquo;re here to help.
          </p>
          <Link
            href="/faq"
            className="group mt-9 inline-flex items-center gap-3 border border-white/80 px-8 py-4 text-[11px] uppercase tracking-[0.24em] text-white transition-colors hover:bg-white hover:text-[#061B2A]"
          >
            Contact Us
            <ArrowGlyph className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>
    </>
  );
}
