"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "@/firebase";

export type HeroContent = {
  tagline: string;
};

const DEFAULTS: HeroContent = {
  tagline: "Tradition Meets Modern Elegance",
};

const DOC_ID = "heroContent";

export function useHeroContent(initialTagline: string = DEFAULTS.tagline) {
  const [content, setContent] = useState<HeroContent>({ tagline: initialTagline });
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
          const data = snap.data() as Partial<HeroContent>;
          setContent({ tagline: data.tagline?.trim() ? data.tagline : initialTagline });
        }
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, [initialTagline]);

  const saveHeroContent = async (data: HeroContent) => {
    if (!db) return;
    await setDoc(doc(db!, "settings", DOC_ID), data);
  };

  return { content, loading, saveHeroContent };
}
