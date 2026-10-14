import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  writeBatch,
  updateDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "@/firebase";

const ADMIN_EMAIL = "admin@gmail.com";

function slugify(name: string) {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "category"
  );
}

function localDefaults(): Category[] {
  return DEFAULT_CATEGORIES.map((cat, i) => ({
    id: `local-${i}`,
    name: cat.name,
    image: cat.image,
    bgColor: cat.bgColor,
    mainTextFont: "var(--font-cormorant)",
    mainTextSize: 4,
    order: i,
    subcategories: cat.subcategories,
  }));
}

export type Subcategory = {
  name: string;
  order: number;
};

export const FONT_OPTIONS = [
  { label: "DM Sans", value: "var(--font-dm-sans, 'DM Sans', sans-serif)", group: "sans" },
  { label: "Cormorant Garamond", value: "var(--font-cormorant, 'Cormorant Garamond', serif)", group: "serif" },
  { label: "Georgia", value: "Georgia, serif", group: "serif" },
  { label: "Times New Roman", value: "'Times New Roman', serif", group: "serif" },
  { label: "Arial", value: "Arial, sans-serif", group: "sans" },
];

export const MAIN_TEXT_SIZES: Record<number, string> = {
  1: 'text-base sm:text-lg md:text-xl',
  2: 'text-lg sm:text-xl md:text-2xl',
  3: 'text-xl sm:text-2xl md:text-3xl',
  4: 'text-2xl sm:text-3xl md:text-4xl',
  5: 'text-3xl sm:text-4xl md:text-5xl',
};

export type Category = {
  id: string;
  name: string;
  image?: string;
  mainText?: string;
  bgColor?: string;
  mainTextFont?: string;
  mainTextSize?: number;
  order: number;
  subcategories: Subcategory[];
};

const DEFAULT_CATEGORIES: { name: string; image: string; bgColor: string; subcategories: Subcategory[] }[] = [
  {
    name: "Terracotta Jewellery",
    image: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400&h=600&fit=crop",
    bgColor: "#F1EEE7",
    subcategories: [
      { name: "Studs", order: 0 },
      { name: "Jumuka", order: 1 },
      { name: "Danglers", order: 2 },
      { name: "Neck Sets", order: 3 },
    ],
  },
  {
    name: "Accessories",
    image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&h=600&fit=crop",
    bgColor: "#F1EEE7",
    subcategories: [
      { name: "Hairclips", order: 0 },
      { name: "Catcher Clips", order: 1 },
      { name: "Saree Pins", order: 2 },
      { name: "Bangles", order: 3 },
    ],
  },
  {
    name: "Home Decor",
    image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400&h=600&fit=crop",
    bgColor: "#D8D5CD",
    subcategories: [
      { name: "Handpainted Wall Plates", order: 0 },
      { name: "Wooden Steps", order: 1 },
      { name: "Paintings", order: 2 },
    ],
  },
  {
    name: "Sarees & Salwars",
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&h=600&fit=crop",
    bgColor: "#F1EEE7",
    subcategories: [
      { name: "Saree", order: 0 },
      { name: "Salwar", order: 1 },
      { name: "Handpainted Saree", order: 2 },
    ],
  },
  {
    name: "Return Gifts",
    image: "https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=400&h=600&fit=crop",
    bgColor: "#F1EEE7",
    subcategories: [
      { name: "Handpainted Silk Purses", order: 0 },
      { name: "Hair Accessories", order: 1 },
      { name: "Fridge Magnets", order: 2 },
      { name: "Pooja Gifts", order: 3 },
    ],
  },
  {
    name: "Wholesale",
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=600&fit=crop",
    bgColor: "#E1DFDC",
    subcategories: [],
  },
];

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }

    let lastSnap: { empty: boolean } | null = null;
    let isOwner = false;
    let seeded = false;

    const maybeSeed = async () => {
      if (!isOwner || seeded || !lastSnap || !lastSnap.empty) return;
      seeded = true;
      try {
        const batch = writeBatch(db!);
        DEFAULT_CATEGORIES.forEach((cat, i) => {
          const ref = doc(db!, "categories", slugify(cat.name));
          batch.set(ref, {
            name: cat.name,
            image: cat.image,
            bgColor: cat.bgColor,
            mainTextFont: "var(--font-cormorant)",
            mainTextSize: 4,
            order: i,
            subcategories: cat.subcategories,
          });
        });
        await batch.commit();
      } catch {
        seeded = false;
      }
    };

    const q = query(collection(db!, "categories"), orderBy("order", "asc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        lastSnap = snap;
        if (snap.empty) {
          if (isOwner) {
            void maybeSeed();
          } else {
            setCategories(localDefaults());
            setLoading(false);
          }
          return;
        }

        const seen = new Set<string>();
        const unique: Category[] = [];
        snap.docs.forEach((d) => {
          const data = d.data() as any;
          const key = String(data?.name ?? "").trim().toLowerCase();
          if (key && seen.has(key)) return;
          if (key) seen.add(key);
          unique.push({
            id: d.id,
            ...data,
            subcategories: data.subcategories || [],
          });
        });
        setCategories(unique);
        setLoading(false);
      },
      () => {
        setCategories(localDefaults());
        setLoading(false);
      }
    );

    let unsubAuth: (() => void) | undefined;
    if (auth) {
      unsubAuth = onAuthStateChanged(auth, (user) => {
        isOwner = user?.email === ADMIN_EMAIL;
        void maybeSeed();
      });
    }

    return () => {
      unsub();
      unsubAuth?.();
    };
  }, []);

  const addCategory = async (name: string, image?: string, subcategories?: Subcategory[], bgColor?: string, mainTextFont?: string, mainTextSize?: number) => {
    if (!db) return;
    const maxOrder = categories.length ? Math.max(...categories.map((c) => c.order)) : 0;
    await addDoc(collection(db!, "categories"), {
      name: name.trim(),
      image: image || "",
      bgColor: bgColor || "#F1EEE7",
      mainTextFont: mainTextFont || "var(--font-cormorant)",
      mainTextSize: mainTextSize || 4,
      order: maxOrder + 1,
      subcategories: subcategories || [],
    });
  };

  const removeCategory = async (id: string) => {
    if (!db) return;
    await deleteDoc(doc(db!, "categories", id));
  };

  const updateCategory = async (id: string, updates: Partial<Pick<Category, "name" | "image" | "mainText" | "bgColor" | "mainTextFont" | "mainTextSize" | "order" | "subcategories">>) => {
    if (!db) return;
    const ref = doc(db!, "categories", id);
    await updateDoc(ref, updates);
  };

  const addSubcategory = async (categoryId: string, name: string) => {
    if (!db) return;
    const cat = categories.find((c) => c.id === categoryId);
    if (!cat) return;
    const subs = [...(cat.subcategories || [])];
    subs.push({ name: name.trim(), order: subs.length });
    await updateCategory(categoryId, { subcategories: subs });
  };

  const removeSubcategory = async (categoryId: string, subIndex: number) => {
    if (!db) return;
    const cat = categories.find((c) => c.id === categoryId);
    if (!cat) return;
    const subs = (cat.subcategories || []).filter((_, i) => i !== subIndex);
    subs.forEach((s, i) => (s.order = i));
    await updateCategory(categoryId, { subcategories: subs });
  };

  const updateSubcategory = async (categoryId: string, subIndex: number, name: string) => {
    if (!db) return;
    const cat = categories.find((c) => c.id === categoryId);
    if (!cat) return;
    const subs = [...(cat.subcategories || [])];
    if (subs[subIndex]) {
      subs[subIndex] = { ...subs[subIndex], name: name.trim() };
    }
    await updateCategory(categoryId, { subcategories: subs });
  };

  const getSubcategoriesForCategory = (categoryId: string) => {
    const cat = categories.find((c) => c.id === categoryId);
    return (cat?.subcategories || []).sort((a, b) => a.order - b.order);
  };

  return {
    categories,
    loading,
    addCategory,
    removeCategory,
    updateCategory,
    addSubcategory,
    removeSubcategory,
    updateSubcategory,
    getSubcategoriesForCategory,
  };
}
