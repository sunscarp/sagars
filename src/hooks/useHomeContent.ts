"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "@/firebase";

export type HomeContent = {
  experienceImages: string[];
  tailoringImage: string;
  featuredProductIds: number[];
  favouriteProductIds: number[];
};

const DEFAULTS: HomeContent = {
  experienceImages: [],
  tailoringImage: "",
  featuredProductIds: [],
  favouriteProductIds: [],
};

const DOC_ID = "homeContent";

export function useHomeContent() {
  const [content, setContent] = useState<HomeContent>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }
    const ref = doc(db!, "settings", DOC_ID);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as Partial<HomeContent>;
          setContent({
            experienceImages: Array.isArray(data.experienceImages) ? data.experienceImages.filter(Boolean) : [],
            tailoringImage: data.tailoringImage || "",
            featuredProductIds: Array.isArray(data.featuredProductIds)
              ? data.featuredProductIds.filter((n) => typeof n === "number")
              : [],
            favouriteProductIds: Array.isArray(data.favouriteProductIds)
              ? data.favouriteProductIds.filter((n) => typeof n === "number")
              : [],
          });
        }
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, []);

  const saveHomeContent = async (data: HomeContent) => {
    if (!db) return;
    await setDoc(doc(db!, "settings", DOC_ID), data);
  };

  return { content, loading, saveHomeContent };
}
