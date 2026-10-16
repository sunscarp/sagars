"use client";

import Link from "next/link";
import { useContactInfo } from "@/hooks/useContactInfo";

export default function Footer() {
  const { info } = useContactInfo();

  return (
    <footer className="bg-[#F1EEE7] text-[#171813] w-full">
      <div className="max-w-[1600px] mx-auto px-5 sm:px-[3%] py-14 sm:py-20">
        {/* Brand statement */}
        <div className="max-w-xl">
          <span className="block text-xl sm:text-2xl tracking-[0.28em] font-medium">THE SAGAR'S DESIGN HOUSE</span>
          <p className="mt-4 text-[13px] leading-[1.85] text-[#595B53]">
            Tradition lives beautifully. Timeless Malaysian handcrafted pieces, thoughtfully
            curated for modern living. We celebrate heritage, craftsmanship and the people
            who wear their stories with grace.
          </p>
        </div>

        {/* Link columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-10 mt-12 sm:mt-16 border-t border-[#D8D5CD] pt-12">
          <div>
            <h4 className="text-[11px] uppercase tracking-[0.16em] text-[#595B53] mb-5 font-medium">
              Shop
            </h4>
            <ul className="space-y-3 text-[13px]">
              <li><Link href="/shop" className="hover:underline">All products</Link></li>
              <li><Link href="/shop" className="hover:underline">Sarees</Link></li>
              <li><Link href="/shop" className="hover:underline">Kurtas &amp; tops</Link></li>
              <li><Link href="/shop" className="hover:underline">Jewellery</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[11px] uppercase tracking-[0.16em] text-[#595B53] mb-5 font-medium">
              Customer care
            </h4>
            <ul className="space-y-3 text-[13px]">
              <li><a href="/faq" className="hover:underline">FAQ</a></li>
              <li><a href="/shipping-policy" className="hover:underline">Shipping policy</a></li>
              <li><a href="/refund-policy" className="hover:underline">Returns &amp; refunds</a></li>
              <li><a href="/tos" className="hover:underline">Terms &amp; conditions</a></li>
              <li><a href="/privacy-policy" className="hover:underline">Privacy policy</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[11px] uppercase tracking-[0.16em] text-[#595B53] mb-5 font-medium">
              Learn
            </h4>
            <ul className="space-y-3 text-[13px]">
              <li><a href="/about-us" className="hover:underline">About us</a></li>
              <li><a href="/what-makes-us-special" className="hover:underline">What makes The Sagar's Design House special</a></li>
              <li><a href="/product-care" className="hover:underline">Product care</a></li>
              <li><a href="/orders" className="hover:underline">Track your order</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[11px] uppercase tracking-[0.16em] text-[#595B53] mb-5 font-medium">
              Contact
            </h4>
            <ul className="space-y-3 text-[13px]">
              <li>
                <a href={`https://wa.me/${info.phone.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                  {info.phone}
                </a>
              </li>
              <li>
                <a href={`mailto:${info.email}`} className="hover:underline">{info.email}</a>
              </li>
              <li className="text-[#595B53] whitespace-pre-line leading-[1.7]">{info.address}</li>
            </ul>

            <div className="flex gap-4 mt-5">
              <a href={info.instagramJewellery} target="_blank" rel="noopener noreferrer" aria-label="Instagram Jewellery" className="hover:opacity-60">
                <svg className="w-5 h-5 fill-[#171813]" viewBox="0 0 24 24">
                  <path d="M7 2C4.2 2 2 4.2 2 7v10c0 2.8 2.2 5 5 5h10c2.8 0 5-2.2 5-5V7c0-2.8-2.2-5-5-5H7zm10 2a3 3 0 013 3v10a3 3 0 01-3 3H7a3 3 0 01-3-3V7a3 3 0 013-3h10zm-5 3.5A4.5 4.5 0 1016.5 12 4.5 4.5 0 0012 7.5zm0 7.4a2.9 2.9 0 112.9-2.9 2.9 2.9 0 01-2.9 2.9zm4.8-8.9a1.1 1.1 0 11-1.1-1.1 1.1 1.1 0 011.1 1.1z"/>
                </svg>
              </a>
              <a href={info.instagramHomeDecor} target="_blank" rel="noopener noreferrer" aria-label="Instagram Home Decor" className="hover:opacity-60">
                <svg className="w-5 h-5 fill-[#171813]" viewBox="0 0 24 24">
                  <path d="M7 2C4.2 2 2 4.2 2 7v10c0 2.8 2.2 5 5 5h10c2.8 0 5-2.2 5-5V7c0-2.8-2.2-5-5-5H7zm10 2a3 3 0 013 3v10a3 3 0 01-3 3H7a3 3 0 01-3-3V7a3 3 0 013-3h10z"/>
                </svg>
              </a>
              <a href={info.facebookJewellery} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="hover:opacity-60">
                <svg className="w-5 h-5 fill-[#171813]" viewBox="0 0 24 24">
                  <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mt-12 pt-6 border-t border-[#D8D5CD] text-[11px] tracking-[0.035em] text-[#595B53]">
          <span>© {new Date().getFullYear()} The Sagar's Design House. All rights reserved.</span>
          <span>SST No.: {info.sstNo} · {info.legalName}</span>
        </div>
      </div>
    </footer>
  );
}
