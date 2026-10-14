"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "@/firebase";

export type ContactInfo = {
  phone: string;
  email: string;
  address: string;
  hours: string;
  instagramJewellery: string;
  instagramHomeDecor: string;
  facebookJewellery: string;
  facebookHomeDecor: string;
  sstNo: string;
  legalName: string;
  tradeName: string;
};

const DEFAULTS: ContactInfo = {
  phone: "+60 12-345 6789",
  email: "support@thesagarsdesignhouse.com",
  address: "No. 8, Jalan Bukit Bintang,\nBukit Bintang,\n55100 Kuala Lumpur,\nMalaysia",
  hours: "10:00 AM – 7:00 PM MYT",
  instagramJewellery: "https://www.instagram.com/kria_terracotta_jewellery",
  instagramHomeDecor: "https://www.instagram.com/kria_homedecor",
  facebookJewellery: "https://www.facebook.com/Kriastore/",
  facebookHomeDecor: "https://facebook.com/kriacrafts",
  sstNo: "000000000000",
  legalName: "The Sagar's Design House Sdn. Bhd.",
  tradeName: "THE SAGAR'S DESIGN HOUSE",
};

const DOC_ID = "contactInfo";

export function useContactInfo() {
  const [info, setInfo] = useState<ContactInfo>(DEFAULTS);
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
          setInfo({ ...DEFAULTS, ...snap.data() } as ContactInfo);
        }
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, []);

  const saveContactInfo = async (data: ContactInfo) => {
    if (!db) return;
    await setDoc(doc(db!, "settings", DOC_ID), data);
  };

  return { info, loading, saveContactInfo };
}
