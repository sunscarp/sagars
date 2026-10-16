import type { Metadata } from "next";
import { DM_Sans, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import { SearchProvider } from "@/context/SearchContext";
import { CartSidebarProvider } from "@/context/CartSidebarContext";
import SiteShell from "@/components/SiteShell";


const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const cormorantGaramond = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "The Sagar's Design House",
  description:
    "The Sagar's Design House brings you premium handcrafted terracotta jewellery, artisanal home decor, and hand-painted silk sarees — made with love by Malaysian artisans.",
  keywords: [
    "handcrafted jewellery",
    "terracotta jewellery",
    "home decor",
    "hand-painted silk sarees",
    "artisanal Malaysian crafts",
    "The Sagar's Design House",
  ],
  openGraph: {
    title: "The Sagar's Design House",
    description:
      "Premium handcrafted terracotta jewellery, artisanal home decor, and hand-painted silk sarees.",
    siteName: "The Sagar's Design House",
    type: "website",
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
};




export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://firebasestorage.googleapis.com" />
        <link rel="dns-prefetch" href="https://firebasestorage.googleapis.com" />
      </head>
      <body
        suppressHydrationWarning
        className={`${dmSans.variable} ${cormorantGaramond.variable} antialiased min-h-screen bg-white text-[#171813]`}
      >
        <script dangerouslySetInnerHTML={{ __html: "if (typeof document !== 'undefined') { document.documentElement.classList.add('js-reveal'); }" }} />

        <AuthProvider>
          <CartProvider>
            <CartSidebarProvider>
              <SearchProvider>
                <SiteShell>{children}</SiteShell>
              </SearchProvider>
            </CartSidebarProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
