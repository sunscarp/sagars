"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  addDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/firebase";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useCartSidebar } from "@/context/CartSidebarContext";
import { resolvePricing } from "@/utils/pricing";
import { getProductSlug, parseProductSlug } from "@/utils/productSlug";
import ProductImage from "@/components/ProductImage";
import PriceText from "@/components/PriceText";
import { usePolicies } from "@/hooks/usePolicies";
import Image from "next/image";

type Product = {
  ID: number;
  Description: string;
  Product: string;
  ProductName?: string;
  Price?: number;
  Material?: string;
  Care?: string;
  ImageUrl1?: string;
  ImageUrl2?: string;
  ImageUrl3?: string;
  ImageUrl4?: string;
  ImageUrl5?: string;
  ImageUrl6?: string;
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
  Stock?: number;
  Category?: string;
  StockType?: string;
  IsCustomizable?: boolean;
  CustomizationNote?: string;
  DeliveryTime?: string;
  DiscountPercent?: number;
  OriginalPrice?: number;
  IsFeatured?: boolean;
  Colors?: string[];
  Sizes?: string[];
  VariantStock?: Record<string, number>;
  FallbackDeliveryTime?: string;
  SKU?: string;
};

export default function ProductPage() {
  const { productname } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { addItem } = useCart();
  const { openCart } = useCartSidebar();
  const { policies } = usePolicies();
  const [showSizeChart, setShowSizeChart] = useState(false);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [zoomLoaded, setZoomLoaded] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [imageIndex, setImageIndex] = useState(0);
  const [shareCopied, setShareCopied] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [cartQuantity, setCartQuantity] = useState(0);
  const [cartQuantityForVariant, setCartQuantityForVariant] = useState<Record<string, number>>({});
  const [qty, setQty] = useState(1);
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [shippingOpen, setShippingOpen] = useState(false);
  const [disclaimerOpen, setDisclaimerOpen] = useState(false);
  const [showAdded, setShowAdded] = useState(false);

  // Fetch product
  useEffect(() => {
    const fetchProduct = async () => {
      if (!productname || !db) return;

      const raw = decodeURIComponent(productname as string);
      const { name, sku } = parseProductSlug(raw);

      const bySku = async () => {
        if (!sku) return null;
        const snap = await getDocs(
          query(collection(db!, "inventory"), where("SKU", "==", sku))
        );
        if (snap.empty) return null;
        const match = snap.docs
          .map((d) => d.data() as Product)
          .find((p) => (p.ProductName || p.Description) === name);
        return match ?? (snap.docs[0].data() as Product);
      };

      const byName = async (productName: string) => {
        const snap = await getDocs(
          query(collection(db!, "inventory"), where("ProductName", "==", productName))
        );
        return snap.empty ? null : snap.docs[0].data() as Product;
      };

      const data =
        (await bySku()) ??
        (await byName(name)) ??
        (await byName(raw));

      if (data) {
        setProduct(data);
        const sizes = data.Sizes || [];
        const colors = data.Colors || [];
        setSelectedSize(sizes.length > 0 ? sizes[0] : "");
        setSelectedColor(colors.length > 0 ? colors[0] : "");
      }

      setLoading(false);
    };

    fetchProduct();
  }, [productname]);

  // Real-time cart quantity for this product (stays in sync with CartSidebar)
  useEffect(() => {
    if (!user?.email || !db || !product) return;

    const cartRef = collection(db!, "Cart");
    const q = query(
      cartRef,
      where("UserMail", "==", user.email),
      where("ID", "==", product.ID)
    );

    const unsub = onSnapshot(q, (snap) => {
      const variantMap: Record<string, number> = {};
      let totalQty = 0;
      snap.docs.forEach((d) => {
        const item = d.data();
        const qty = item.Quantity || 0;
        totalQty += qty;
        const itemSize = item.Size || "One Size";
        const itemColor = item.Color || "";
        const key = itemColor ? `${itemColor}|${itemSize}` : itemSize;
        variantMap[key] = (variantMap[key] || 0) + qty;
      });

      setCartQuantityForVariant(variantMap);

      const sizeToUse = isGeneralStockProduct ? "One Size" : (hasSizes ? selectedSize : "One Size");
      const currentSizeKey = selectedColor ? `${selectedColor}|${sizeToUse}` : sizeToUse;
      setCartQuantity(variantMap[currentSizeKey] || 0);
    });

    return () => unsub();
  }, [user?.email, product, selectedSize, selectedColor]);

  // Fetch cross-category recommendations (Style It With)
  useEffect(() => {
    if (!product || !db) return;

    const fetchStyleItWith = async () => {
      // Determine complementary categories based on current product
      const currentCategoryRaw = (product as any).Product ?? (product as any).Category ?? (product as any).ProductName ?? "";
      const currentCategory = typeof currentCategoryRaw === 'string' ? currentCategoryRaw : String(currentCategoryRaw || "");
      let targetCategories: string[] = [];

      // Guard: only call toLowerCase on a string
      const catLower = currentCategory ? currentCategory.toLowerCase() : "";

      // If it's a dress, recommend accessories (purses, earrings)
      if (catLower.includes('dress')) {
        targetCategories = ['Purses', 'Earrings'];
      }
      // If it's an accessory (purse or earring), recommend dresses and other accessories
      else if (catLower.includes('purse')) {
        targetCategories = ['Short Dresses', 'Party Dresses', 'Earrings'];
      }
      else if (catLower.includes('earring')) {
        targetCategories = ['Short Dresses', 'Party Dresses', 'Purses'];
      }
      // For other categories, show a mix of everything except the current category
      else {
        targetCategories = ['Short Dresses', 'Party Dresses', 'Purses', 'Earrings'];
      }

      // Fetch products from target categories in parallel
      const results = await Promise.allSettled(
        targetCategories.map((category) =>
          getDocs(query(collection(db!, "inventory"), where("Product", "==", category)))
        )
      );

      const allRecommendations: Product[] = [];
      results.forEach((result) => {
        if (result.status === "fulfilled") {
          result.value.docs.forEach((d) => allRecommendations.push(d.data() as Product));
        }
      });

      // Shuffle and select 4 random recommendations
      const shuffled = allRecommendations
        .filter((p) => p.ID !== product.ID) // Exclude current product
        .sort(() => 0.5 - Math.random());

      setRelatedProducts(shuffled.slice(0, 4));
    };

    fetchStyleItWith();
  }, [product]);

  // Fetch similar products (same category, name overlap)
  useEffect(() => {
    if (!product || !db) return;

    const fetchSimilar = async () => {
      const currentCategory = (product as any).Category || (product as any).Product || "";
      if (!currentCategory) return;

      const snap = await getDocs(
        query(collection(db!, "inventory"), where("Category", "==", currentCategory))
      );

      const currentName = ((product as any).ProductName || product.Description || "").toLowerCase();
      const currentWords = currentName.split(/\s+/).filter((w: string) => w.length > 2);

      const scored = snap.docs
        .map((d) => {
          const p = d.data() as Product;
          if (p.ID === product.ID) return null;
          const name = ((p as any).ProductName || p.Description || "").toLowerCase();
          const words = name.split(/\s+/).filter((w: string) => w.length > 2);
          const overlap = words.filter((w: string) => currentWords.includes(w)).length;
          return { product: p, overlap };
        })
        .filter(Boolean) as { product: Product; overlap: number }[];

      scored.sort((a, b) => b.overlap - a.overlap);
      setSimilarProducts(scored.slice(0, 4).map((s) => s.product));
    };

    fetchSimilar();
  }, [product]);

  // Preload adjacent gallery images (medium variant to keep payload small)
  useEffect(() => {
    if (!product) return;
    const imgs = [
      product.ImageUrl1 || "/placeholder.png",
      product.ImageUrl2,
      product.ImageUrl3,
      product.ImageUrl4,
      product.ImageUrl5,
      product.ImageUrl6,
    ].filter(Boolean) as string[];
    const meds = [
      product.ImageUrl1Medium,
      product.ImageUrl2Medium,
      product.ImageUrl3Medium,
      product.ImageUrl4Medium,
      product.ImageUrl5Medium,
      product.ImageUrl6Medium,
    ];
    if (imgs.length <= 1) return;
    const preload = (idx: number) => {
      const url = imgs[idx];
      if (!url || url.startsWith("/")) return;
      const href = meds[idx] || url;
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "image";
      link.href = href;
      document.head.appendChild(link);
    };
    const nextIdx = (imageIndex + 1) % imgs.length;
    const prevIdx = (imageIndex - 1 + imgs.length) % imgs.length;
    preload(nextIdx);
    if (nextIdx !== prevIdx) preload(prevIdx);
  }, [imageIndex, product]);

  // Close the size guide / zoom overlays on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowSizeChart(false);
        setZoomImage(null);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-white">
        <div className="w-8 h-8 border-2 border-[#e1dfdc] border-t-black animate-spin" />
        <p
          className="text-[#7a7a7a] tracking-wide"
          style={{ fontFamily: "var(--font-body)", fontSize: "14px" }}
        >
          Loading product...
        </p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p
          className="text-black font-semibold"
          style={{ fontFamily: "var(--font-heading)", fontSize: "18px" }}
        >
          Product not found
        </p>
      </div>
    );
  }

  const imageSlots = [
    { full: product.ImageUrl1 || "/placeholder.png", medium: product.ImageUrl1Medium, thumb: product.ImageUrl1Thumb },
    { full: product.ImageUrl2, medium: product.ImageUrl2Medium, thumb: product.ImageUrl2Thumb },
    { full: product.ImageUrl3, medium: product.ImageUrl3Medium, thumb: product.ImageUrl3Thumb },
    { full: product.ImageUrl4, medium: product.ImageUrl4Medium, thumb: product.ImageUrl4Thumb },
    { full: product.ImageUrl5, medium: product.ImageUrl5Medium, thumb: product.ImageUrl5Thumb },
    { full: product.ImageUrl6, medium: product.ImageUrl6Medium, thumb: product.ImageUrl6Thumb },
  ].filter((s) => !!s.full) as { full: string; medium?: string; thumb?: string }[];

  const images = imageSlots.map((s) => s.full);

  // Check if this product uses general stock (no sizes defined, or Purses/Earrings)
  const currentCategory = (product as any).Category || (product as any).Product || "";
  const hasSizes = (product.Sizes || []).length > 0;
  const isGeneralStockProduct = !hasSizes || currentCategory === "Purses" || currentCategory === "Earrings" ||
                                 currentCategory.toLowerCase().includes("purse") ||
                                 currentCategory.toLowerCase().includes("earring");

  const isMadeToOrder = product.StockType === "made_to_order";

  const pricing = resolvePricing({ Price: product.Price, OriginalPrice: (product as any).OriginalPrice, DiscountPercent: product.DiscountPercent });
  const onSale = pricing.discount > 0;

  // Get available stock for selected size (accounting for items already in cart)
  const getAvailableStock = () => {
    // Made-to-order products have infinite stock
    if (isMadeToOrder) return Infinity;

    const hasColors = (product.Colors || []).length > 0;
    const hasSizes = (product.Sizes || []).length > 0;
    const hasVariants = hasColors || hasSizes;

    // Check variant-specific stock if any variants exist
    if (hasVariants) {
      const color = hasColors ? selectedColor : "";
      const size = hasSizes ? selectedSize : "One Size";
      const variantKey = `${color}|${size}`;
      const variantQty = product.VariantStock?.[variantKey];
      if (typeof variantQty === "number") {
        return Math.max(0, variantQty - (cartQuantityForVariant[variantKey] || 0));
      }
    }

    const totalStock = product.Stock !== undefined ? product.Stock : 0;
    return Math.max(0, totalStock - cartQuantity);
  };

  // Check if current variant has ready stock
  const hasVariantStock = (() => {
    const hasColors = (product.Colors || []).length > 0;
    const hasSizes = (product.Sizes || []).length > 0;
    const hasVariants = hasColors || hasSizes;

    if (hasVariants) {
      const color = hasColors ? selectedColor : "";
      const size = hasSizes ? selectedSize : "One Size";
      const variantKey = `${color}|${size}`;
      const variantQty = product.VariantStock?.[variantKey];
      // If variant has explicit entry, check if it has stock
      if (variantKey in (product.VariantStock || {})) {
        return variantQty! > 0;
      }
      // No entry for this variant — no allocated stock, treat as fallback
      return false;
    }
    return true;
  })();

  // Is the current variant out of stock but product has total stock?
  const isVariantFallback = !isMadeToOrder && !hasVariantStock && (product.Stock ?? 0) > 0;

  const availableStock = getAvailableStock();
  const isSoldOut = availableStock === 0 && !isMadeToOrder && !isVariantFallback;
  const isLowStock = !isSoldOut && !isMadeToOrder && availableStock > 0 && availableStock <= 5;
  const stockClass = isSoldOut ? "mh-stock-out" : isLowStock ? "mh-stock-low" : "mh-stock-in";
  const stockLabel = isSoldOut ? "Out of stock" : isLowStock ? `Only ${availableStock} left` : "In stock";

  // Only show the description separately when it differs from the display name.
  const displayName = (product as any).ProductName || product.Description;
  const showDescription = !!(product as any).ProductName && product.Description !== (product as any).ProductName;

  // Production / delivery estimate, sourced from existing product configuration.
  const deliveryRaw = isMadeToOrder
    ? (product.DeliveryTime || "")
    : isVariantFallback
    ? ((product as any).FallbackDeliveryTime || "")
    : (product.DeliveryTime || "");
  const deliveryText = deliveryRaw
    ? (isMadeToOrder || isVariantFallback ? `Made to order: ${deliveryRaw}` : `Delivery: ${deliveryRaw}`)
    : "";

  // Disclaimer content reuses the existing product-accuracy terms.
  const disclaimerSections = policies.tos.sections.filter((s) =>
    /accuracy|pricing/i.test(s.heading)
  );

  const handleAddToCart = async (addQty?: number) => {
    const quantity = addQty ?? 1;

    // Check stock availability (skip for made-to-order and fallback variants)
    if (!isMadeToOrder && !isVariantFallback) {
      const effectiveStock = availableStock;
      if (effectiveStock === 0) {
        alert(isGeneralStockProduct ? "This item is out of stock" : "This size is out of stock");
        return;
      }

      if (quantity > effectiveStock) {
        alert(isGeneralStockProduct
          ? `Only ${effectiveStock} items available`
          : `Only ${effectiveStock} items available in size ${selectedSize}`
        );
        return;
      }
    }

    if (!user?.email || !db) {
      sessionStorage.setItem(
        "postAuthAction",
        JSON.stringify({
          type: "ADD_TO_CART",
          payload: {
            productId: product.ID,
            quantity: quantity,
            size: selectedSize,
          },
          redirectTo: "/shop",
        })
      );

      router.push("/sign-in");
      return;
    }

    const cartRef = collection(db!, "Cart");

    // For general stock products, use "One Size" as the size identifier
    const sizeToUse = isGeneralStockProduct ? "One Size" : selectedSize;
    const colorToUse = selectedColor || "";

    const q = query(
      cartRef,
      where("UserMail", "==", user.email),
      where("ID", "==", product.ID),
      where("Size", "==", sizeToUse),
      where("Color", "==", colorToUse)
    );

    const snap = await getDocs(q);

    if (!snap.empty) {
      const docRef = snap.docs[0].ref;
      const prevQty = snap.docs[0].data().Quantity || 0;

      await updateDoc(docRef, {
        Quantity: prevQty + quantity,
        ["Added On"]: serverTimestamp(),
      });
      setCartQuantity(prevQty + quantity);
    } else {
      await addDoc(cartRef, {
        ID: product.ID,
        Quantity: quantity,
        Size: sizeToUse,
        Color: colorToUse,
        UserMail: user.email,
        ["Added On"]: serverTimestamp(),
      });
      setCartQuantity(quantity);
    }

    for (let i = 0; i < quantity; i++) {
      addItem(String(product.ID));
    }

    setShowAdded(true);
    setTimeout(() => setShowAdded(false), 2000);
    openCart();
  };

  const handleShare = async () => {
    const link = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.share) {
        await navigator.share({
          title: (product as any)?.ProductName || product.Description || "Product",
          url: link,
        });
      } else {
        await navigator.clipboard.writeText(link);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2000);
      }
    } catch (err) {
      try {
        await navigator.clipboard.writeText(link);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2000);
      } catch (e) {
        alert("Could not copy link. Please copy manually: " + link);
      }
    }
  };

  const Chevron = ({ open }: { open: boolean }) => (
    <svg
      className={`w-4 h-4 text-[#171813] flex-shrink-0 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
    </svg>
  );

  const saleBadge = onSale ? (
    <span className="absolute top-5 left-5 z-[4] bg-white text-black/45 rounded-[20px] px-3 py-1.5 text-[14px] font-medium leading-normal shadow-[0_4px_4px_rgba(0,0,0,0.15)]">
      Sale!
    </span>
  ) : null;

  return (
    <>
      {/* MAIN PRODUCT SECTION */}
      <div className="min-h-screen bg-white text-black">
        <div className="mx-auto max-w-[1320px] px-5 sm:px-8 pt-4 pb-16 lg:pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-[55%_1fr] gap-10 lg:gap-16 items-start">
            {/* IMAGE SECTION */}
            <div>
              {/* Desktop: 2-column image grid */}
              <div className="hidden md:grid grid-cols-2 gap-3">
                {images.map((img, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => { setZoomImage(img); setZoomLoaded(false); }}
                    className="relative w-full aspect-[3/4] overflow-hidden rounded-lg bg-[#f7f7f7] cursor-zoom-in"
                  >
                    {i === 0 && saleBadge}
                    <ProductImage
                      src={img}
                      sizes="(min-width: 1024px) 27vw, 45vw"
                      size="full"
                      quality={90}
                      alt={`${product.Description} ${i + 1}`}
                      priority={i === 0}
                      className="w-full h-full"
                    />
                  </button>
                ))}
              </div>

              {/* Mobile: main image + horizontal thumbnail strip */}
              <div className="md:hidden">
                <button
                  type="button"
                  onClick={() => { setZoomImage(images[imageIndex]); setZoomLoaded(false); }}
                  className="relative block w-full aspect-[4/5] overflow-hidden rounded-[12px] bg-[#f7f7f7]"
                >
                  {saleBadge}
                  <ProductImage
                    src={images[imageIndex] || "/placeholder.png"}
                    sizes="100vw"
                    size="full"
                    quality={90}
                    alt={product.Description}
                    priority={imageIndex === 0}
                    className="w-full h-full"
                  />
                </button>
                {images.length > 1 && (
                  <div className="flex gap-2.5 mt-3 overflow-x-auto scrollbar-hide">
                    {images.map((img, i) => {
                      const thumbUrl = imageSlots[i]?.thumb;
                      const medUrl = imageSlots[i]?.medium;
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setImageIndex(i)}
                          className={`relative w-[82px] h-[82px] flex-shrink-0 overflow-hidden rounded-[6px] border transition-all duration-200 ${
                            i === imageIndex
                              ? "border-[#666] opacity-100 scale-[1.04]"
                              : "border-transparent opacity-[0.68]"
                          }`}
                        >
                          <Image
                            src={thumbUrl || medUrl || img}
                            alt={`Thumbnail ${i + 1}`}
                            fill
                            sizes="82px"
                            className="object-cover"
                          />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* DETAILS */}
            <div className="w-full max-w-[560px]">
              <div>
                {/* TITLE */}
                <h1
                  className="text-[#171813]"
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontWeight: 500,
                    fontSize: "38px",
                    lineHeight: 1.1,
                    letterSpacing: "-0.5px",
                  }}
                >
                  {displayName}
                </h1>

                {/* DESCRIPTION */}
                {showDescription && (
                  <p
                    className="mt-4 text-[15px] leading-[1.7] text-[#6b6b6b]"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    {product.Description}
                  </p>
                )}

                {/* PRICE */}
                <div
                  className="mt-6 flex items-baseline flex-wrap gap-x-3"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  {onSale && (
                    <span className="text-[#a6a6a6] line-through text-[16px]">
                      <PriceText amount={pricing.original} />
                    </span>
                  )}
                  <PriceText
                    amount={pricing.selling}
                    className="text-[#171813] text-[19px] tracking-[0.04em]"
                  />
                </div>
                <p
                  className="mt-1 text-[12px] text-[#9b998f]"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  Inclusive of all taxes
                </p>

                {/* STOCK STATUS */}
                <div className="flex items-center gap-2.5 mt-2.5 text-[14px] text-[#6b6b6b]" style={{ fontFamily: "var(--font-body)" }}>
                  <span className={`mh-stock-dot ${stockClass}`} />
                  <span>{stockLabel}</span>
                </div>

                {/* COLOUR SELECTOR */}
                {(product.Colors || []).length > 0 && (
                  <div className="mt-8">
                    <div className="flex items-baseline justify-between gap-4">
                      <p className="text-[13px] uppercase tracking-[0.12em] text-[#171813]" style={{ fontFamily: "var(--font-body)" }}>Colour</p>
                    </div>
                    <p className="mt-1.5 text-[14px] text-[#6b6b6b]" style={{ fontFamily: "var(--font-body)" }}>{selectedColor}</p>
                    <div className="flex gap-2 flex-wrap mt-3">
                      {product.Colors!.map((color) => (
                        <button
                          key={color}
                          onClick={() => { setSelectedColor(color); setQty(1); }}
                          className={`h-[44px] px-4 rounded-[2px] border text-[13px] tracking-[0.03em] transition-colors ${
                            selectedColor === color
                              ? "border-[#171813] bg-[#171813] text-white"
                              : "border-[#D8D5CD] bg-transparent text-[#171813] hover:border-[#171813]"
                          }`}
                          style={{ fontFamily: "var(--font-body)" }}
                        >
                          {color}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* SIZE SELECTOR (dynamic from product data) */}
                {(product.Sizes || []).length > 0 && (
                  <div className="mt-8">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-[13px] uppercase tracking-[0.12em] text-[#171813]" style={{ fontFamily: "var(--font-body)" }}>Size</p>
                      <button
                        type="button"
                        onClick={() => setShowSizeChart(true)}
                        className="text-[12px] tracking-[0.04em] text-[#6b6b6b] underline underline-offset-4 hover:text-[#171813] transition-colors"
                        style={{ fontFamily: "var(--font-body)" }}
                      >
                        Size Guide
                      </button>
                    </div>
                    <div className="flex gap-2 flex-wrap mt-3">
                      {product.Sizes!.map((size) => (
                        <button
                          key={size}
                          onClick={() => { setSelectedSize(size); setQty(1); }}
                          className={`min-w-[56px] h-[48px] px-3 rounded-[2px] border text-[13px] uppercase tracking-[0.06em] transition-colors ${
                            selectedSize === size
                              ? "border-[#171813] bg-[#171813] text-white"
                              : "border-[#D8D5CD] bg-transparent text-[#171813] hover:border-[#171813]"
                          }`}
                          style={{ fontFamily: "var(--font-body)" }}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* QUANTITY */}
                <div className="mt-8">
                  <p className="text-[13px] uppercase tracking-[0.12em] text-[#171813]" style={{ fontFamily: "var(--font-body)" }}>Quantity</p>
                  <div className="inline-flex items-center border border-[#D8D5CD] rounded-[2px] h-12 mt-3">
                    <button
                      type="button"
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                      disabled={qty <= 1}
                      className="w-12 h-full flex items-center justify-center text-[18px] leading-none text-[#171813] hover:bg-black/[0.04] transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                      −
                    </button>
                    <span className="w-14 text-center text-[15px] text-[#171813] select-none" style={{ fontFamily: "var(--font-body)" }}>{qty}</span>
                    <button
                      type="button"
                      onClick={() => setQty((q) => q + 1)}
                      disabled={!isMadeToOrder && qty >= availableStock}
                      className="w-12 h-full flex items-center justify-center text-[18px] leading-none text-[#171813] hover:bg-black/[0.04] transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* PRODUCTION / DELIVERY */}
                {deliveryText && (
                  <p className="mt-6 text-[13px] text-[#6b6b6b]" style={{ fontFamily: "var(--font-body)" }}>
                    {deliveryText}
                  </p>
                )}

                {/* ADD TO CART */}
                <button
                  onClick={() => handleAddToCart(qty)}
                  disabled={isSoldOut}
                  className={`mt-6 w-full min-h-[48px] rounded-[2px] flex items-center justify-center px-5 text-[12px] font-medium uppercase tracking-[0.16em] transition-colors ${
                    isSoldOut
                      ? "bg-[#b3b3b3] text-white cursor-not-allowed"
                      : "bg-[#171813] text-white hover:bg-[#2b2c26]"
                  }`}
                >
                  {isSoldOut ? "Sold out" : "Add to cart"}
                </button>
                {showAdded && (
                  <p className="text-[#2E7D4F] text-sm mt-2.5">Added to Cart!</p>
                )}

                {/* SHARE */}
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => setShareOpen((v) => !v)}
                    className="flex items-center gap-2.5 text-[#6b6b6b] hover:text-[#171813] transition-colors"
                  >
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    <span className="text-[13px] uppercase tracking-[0.12em]" style={{ fontFamily: "var(--font-body)" }}>Share</span>
                  </button>
                  {shareOpen && (
                    <div className="mt-3 space-y-3">
                      <a
                        href={`https://www.facebook.com/sharer/sharer.php?u=${typeof window !== 'undefined' ? encodeURIComponent(window.location.href) : ''}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 text-[#595B53] hover:text-black transition-colors"
                      >
                        <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                        <span className="text-xs underline underline-offset-2">Share on Facebook</span>
                      </a>
                      <a
                        href={`https://wa.me/?text=${typeof window !== 'undefined' ? encodeURIComponent(window.location.href) : ''}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 text-[#595B53] hover:text-black transition-colors"
                      >
                        <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        <span className="text-xs underline underline-offset-2">Share on WhatsApp</span>
                      </a>
                      <button
                        type="button"
                        onClick={handleShare}
                        className="flex items-center gap-3 text-[#595B53] hover:text-black transition-colors"
                      >
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                        <span className="text-xs underline underline-offset-2">{shareCopied ? 'Link Copied!' : 'Copy Link'}</span>
                      </button>
                      <a
                        href={`mailto:?subject=${typeof window !== 'undefined' ? encodeURIComponent(document.title) : ''}&body=${typeof window !== 'undefined' ? encodeURIComponent(window.location.href) : ''}`}
                        className="flex items-center gap-3 text-[#595B53] hover:text-black transition-colors"
                      >
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        <span className="text-xs underline underline-offset-2">Share via Email</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* ACCORDIONS */}
              <div className="mt-10 border-t border-[#D8D5CD]">
                {/* PRODUCT DETAILS */}
                <div className="border-b border-[#D8D5CD]">
                  <button
                    type="button"
                    onClick={() => setDetailsOpen((v) => !v)}
                    aria-expanded={detailsOpen}
                    aria-controls="accordion-product-details"
                    className="w-full flex items-center justify-between gap-3 py-4 text-left"
                  >
                    <span className="text-[14px] uppercase tracking-[0.1em] text-[#171813]" style={{ fontFamily: "var(--font-body)" }}>Product details</span>
                    <Chevron open={detailsOpen} />
                  </button>
                  <div
                    id="accordion-product-details"
                    hidden={!detailsOpen}
                    className="pb-5 -mt-1 space-y-3 text-[14px] leading-[1.7] text-[#6b6b6b]"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    {product.Description && <p className="whitespace-pre-line">{product.Description}</p>}
                    {product.Material && (
                      <p><span className="text-[#171813]">Material:</span> {product.Material}</p>
                    )}
                    {product.Care && (
                      <p className="whitespace-pre-line"><span className="text-[#171813]">Care:</span> {product.Care}</p>
                    )}
                    {product.IsCustomizable && (
                      <p>{product.CustomizationNote || "This product can be customised to your preference. Add your requirements in the notes section at checkout."}</p>
                    )}
                  </div>
                </div>

                {/* SHIPPING, PACKAGING & RETURNS */}
                <div className="border-b border-[#D8D5CD]">
                  <button
                    type="button"
                    onClick={() => setShippingOpen((v) => !v)}
                    aria-expanded={shippingOpen}
                    aria-controls="accordion-shipping"
                    className="w-full flex items-center justify-between gap-3 py-4 text-left"
                  >
                    <span className="text-[14px] uppercase tracking-[0.1em] text-[#171813]" style={{ fontFamily: "var(--font-body)" }}>Shipping, packaging &amp; returns</span>
                    <Chevron open={shippingOpen} />
                  </button>
                  <div
                    id="accordion-shipping"
                    hidden={!shippingOpen}
                    className="pb-5 -mt-1 space-y-4 text-[14px] leading-[1.7] text-[#6b6b6b]"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    {[...policies.shippingPolicy.sections, ...policies.refundPolicy.sections].map((s, i) => (
                      <div key={i} className="space-y-1">
                        <p className="text-[12px] uppercase tracking-[0.06em] text-[#171813]">{s.heading}</p>
                        <div dangerouslySetInnerHTML={{ __html: s.body }} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* DISCLAIMER */}
                {disclaimerSections.length > 0 && (
                  <div className="border-b border-[#D8D5CD]">
                    <button
                      type="button"
                      onClick={() => setDisclaimerOpen((v) => !v)}
                      aria-expanded={disclaimerOpen}
                      aria-controls="accordion-disclaimer"
                      className="w-full flex items-center justify-between gap-3 py-4 text-left"
                    >
                      <span className="text-[14px] uppercase tracking-[0.1em] text-[#171813]" style={{ fontFamily: "var(--font-body)" }}>Disclaimer</span>
                      <Chevron open={disclaimerOpen} />
                    </button>
                    <div
                      id="accordion-disclaimer"
                      hidden={!disclaimerOpen}
                      className="pb-5 -mt-1 space-y-4 text-[14px] leading-[1.7] text-[#6b6b6b]"
                      style={{ fontFamily: "var(--font-body)" }}
                    >
                      {disclaimerSections.map((s, i) => (
                        <div key={i} className="space-y-1">
                          <p className="text-[12px] uppercase tracking-[0.06em] text-[#171813]">{s.heading}</p>
                          <div dangerouslySetInnerHTML={{ __html: s.body }} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SIMILAR PRODUCTS */}
      {similarProducts.length > 0 && (
        <div className="mx-auto max-w-[1240px] mt-4 lg:mt-10 pt-8 pb-8 lg:pb-16 border-t border-[#e1dfdc] px-5 sm:px-8">
          <h3 className="text-[24px] lg:text-[28px] text-black mb-5" style={{ fontFamily: "var(--font-heading)" }}>Similar Products</h3>
          <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 -mx-1 px-1 lg:grid lg:grid-cols-4 lg:gap-5 lg:overflow-visible lg:pb-0 lg:mx-0 lg:px-0">
            {similarProducts.map((sp) => (
              <button
                key={sp.ID}
                type="button"
                onClick={() => router.push(`/product/${encodeURIComponent(getProductSlug(sp))}`)}
                className="flex-shrink-0 w-[140px] lg:w-auto snap-start text-left group"
              >
                <div className="w-full aspect-[3/4] overflow-hidden rounded-[8px] bg-[#f7f7f7] mb-2">
                  <ProductImage
                    src={(sp as any).ImageUrl1}
                    srcMedium={(sp as any).ImageUrl1Medium}
                    srcThumb={(sp as any).ImageUrl1Thumb}
                    size="thumb"
                    alt={(sp as any).ProductName || sp.Description}
                    className="w-full h-full group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <p className="text-sm text-black leading-snug line-clamp-2">{(sp as any).ProductName || sp.Description}</p>
                <PriceText
                  amount={resolvePricing({ Price: sp.Price, OriginalPrice: (sp as any).OriginalPrice, DiscountPercent: sp.DiscountPercent }).selling}
                  className="text-sm font-bold text-black mt-1"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STYLE IT WITH */}
      {relatedProducts.length > 0 && (
        <div className="relative z-10 mx-auto max-w-[1240px] bg-white text-black px-5 sm:px-8 pt-0 pb-12">
          <hr className="border-t border-[#e1dfdc] mb-6" />
          <h2
            className="text-black mb-5"
            style={{ fontFamily: "var(--font-heading)", fontWeight: '600', fontSize: '26px' }}
          >
            Style It With
          </h2>
          <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory sm:grid sm:grid-cols-3 lg:grid-cols-4 sm:gap-5">
            {relatedProducts.map((rp) => (
              <div key={rp.ID} className="flex-shrink-0 w-1/2 sm:w-auto snap-start text-black transition px-1">
                <button
                  type="button"
                  onClick={() => router.push(`/product/${encodeURIComponent(getProductSlug(rp))}`)}
                  className="cursor-pointer block w-full overflow-hidden rounded-[8px] bg-[#f7f7f7] transition-all duration-300"
                  aria-label={`View ${(rp as any).ProductName || rp.Description}`}
                >
                  <ProductImage
                    src={rp.ImageUrl1}
                    srcMedium={(rp as any).ImageUrl1Medium}
                    srcThumb={(rp as any).ImageUrl1Thumb}
                    size="thumb"
                    alt={(rp as any).ProductName || rp.Description}
                    className="h-36 sm:h-44 lg:h-52 mb-0 self-start w-full"
                  />
                </button>

                <div className="flex flex-col items-start mt-2.5">
                  <p className="text-sm font-medium text-black leading-snug">{(rp as any).ProductName || rp.Description}</p>
                  <PriceText amount={resolvePricing({ Price: rp.Price, OriginalPrice: (rp as any).OriginalPrice, DiscountPercent: rp.DiscountPercent }).selling} className="font-bold text-base text-black mt-1" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {showSizeChart && (
        <div
          className="fixed inset-0 z-[300] bg-black/70 backdrop-blur-sm flex items-center justify-center px-4"
          onClick={() => setShowSizeChart(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Size guide"
        >
          <div
            className="relative bg-white rounded-[22px] shadow-2xl max-w-2xl w-full p-5"
            onClick={(e) => e.stopPropagation()} // prevents closing when clicking image
          >
            {/* Close button */}
            <button
              onClick={() => setShowSizeChart(false)}
              aria-label="Close size guide"
              className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center bg-[#f2f0ed] hover:bg-[#e1dfdc] text-black text-lg font-bold transition-colors"
            >
              ✕
            </button>

            <img
              src="/printrove-size-chart.jpg"
              alt="Printrove Size Chart"
              loading="lazy"
              decoding="async"
              className="w-full h-auto"
            />
          </div>
        </div>
      )}

      {zoomImage && (
        <div
          className="fixed inset-0 z-[300] bg-black/85 backdrop-blur-sm flex items-center justify-center px-4"
          onClick={() => { setZoomImage(null); setZoomLoaded(false); }}
        >
          <div
            className="relative max-w-4xl w-full flex items-center justify-center min-h-[300px]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => { setZoomImage(null); setZoomLoaded(false); }}
              className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white text-2xl font-bold z-10 transition-colors"
            >
              ✕
            </button>

            {!zoomLoaded && (
              <div className="w-8 h-8 border-2 border-white/30 border-t-white animate-spin" />
            )}

            <img
              src={zoomImage}
              alt="Zoomed product"
              onLoad={() => setZoomLoaded(true)}
              className={`w-full max-h-[90vh] object-contain cursor-zoom-out transition-opacity duration-200 ${zoomLoaded ? "opacity-100" : "opacity-0 absolute"}`}
            />
          </div>
        </div>
      )}
    </>
  );
}
