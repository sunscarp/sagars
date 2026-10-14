import { useEffect, useState } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "@/firebase";

export type ZoneDef = {
  rate: number;
  perItem: number;
  days: string;
  label: string;
};

export type DeliverySettings = {
  freeDeliveryThreshold: number;
  zones: Record<string, ZoneDef>;
};

const DEFAULT_ZONES: Record<string, ZoneDef> = {
  metro:      { rate: 8,  perItem: 3, days: "1-3", label: "Klang Valley / Metro" },
  peninsular: { rate: 12, perItem: 4, days: "2-4", label: "Peninsular Malaysia" },
  east:       { rate: 20, perItem: 6, days: "4-7", label: "Sabah & Sarawak" },
  intl_asia:       { rate: 60,  perItem: 25, days: "7-14",  label: "Asia" },
  intl_europe:     { rate: 90,  perItem: 35, days: "10-18", label: "Europe" },
  intl_namerica:   { rate: 100, perItem: 40, days: "10-18", label: "North America" },
  intl_samerica:   { rate: 110, perItem: 45, days: "12-20", label: "South America" },
  intl_africa:     { rate: 100, perItem: 40, days: "10-18", label: "Africa" },
  intl_oceania:    { rate: 95,  perItem: 38, days: "10-18", label: "Australia / Oceania" },
};

const DEFAULT_SETTINGS: DeliverySettings = {
  freeDeliveryThreshold: 1000,
  zones: DEFAULT_ZONES,
};

const DOC_ID = "delivery";

export function useDeliverySettings() {
  const [settings, setSettings] = useState<DeliverySettings>(DEFAULT_SETTINGS);
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
          const data = snap.data();
          setSettings({
            freeDeliveryThreshold:
              typeof data.freeDeliveryThreshold === "number"
                ? data.freeDeliveryThreshold
                : DEFAULT_SETTINGS.freeDeliveryThreshold,
            zones:
              data.zones && typeof data.zones === "object"
                ? { ...DEFAULT_SETTINGS.zones, ...data.zones }
                : DEFAULT_SETTINGS.zones,
          });
        }
        setLoading(false);
      },
      () => setLoading(false)
    );

    return () => unsub();
  }, []);

  const saveSettings = async (newSettings: DeliverySettings) => {
    if (!db) return;
    await setDoc(doc(db!, "settings", DOC_ID), {
      freeDeliveryThreshold: newSettings.freeDeliveryThreshold,
      zones: newSettings.zones,
    });
  };

  return { settings, loading, saveSettings };
}
