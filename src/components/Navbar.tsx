"use client";
import { useRef, useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useCartSidebar } from "@/context/CartSidebarContext";
import { signOut } from "firebase/auth";
import { auth } from "@/firebase";
import { useAdmin } from "@/hooks/useAdmin";
import { useCategories } from "@/hooks/useCategories";
import SearchOverlay from "@/components/SearchOverlay";
import Image from "next/image";

const NAV_LEFT = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "Collections", href: "/#categories" },
];

const NAV_RIGHT = [
  { label: "About", href: "/about-us" },
  { label: "Contact", href: "/faq" },
];

function NavTextLink({
  label,
  href,
  active,
  onClick,
}: {
  label: string;
  href: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`group relative inline-block py-1.5 text-[11px] lg:text-[12px] uppercase tracking-[0.3em] transition-opacity duration-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-current focus-visible:ring-offset-0 ${
        active ? "opacity-100" : "opacity-75 hover:opacity-100"
      }`}
    >
      {label}
      <span
        aria-hidden
        className={`pointer-events-none absolute left-0 right-0 -bottom-0.5 h-px origin-left bg-current transition-transform duration-300 ${
          active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
        }`}
      />
    </Link>
  );
}

function NavbarContent() {
  const router = useRouter();
  const pathname = usePathname();
  const isHome = pathname === "/";

  const { totalItems, pulse } = useCart();
  const { user, loading } = useAuth();
  const { isAdmin } = useAdmin(user);
  const { categories } = useCategories();
  const { openCart } = useCartSidebar();

  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const setVar = () => {
      document.documentElement.style.setProperty("--navbar-height", `${el.offsetHeight}px`);
    };
    setVar();
    const ro = new ResizeObserver(setVar);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!isHome) {
      setScrolled(false);
      return;
    }
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome]);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      const menuBox = document.getElementById("hamburger-menu");
      const hamburgerBtn = document.getElementById("hamburger-button");
      if (menuBox && !menuBox.contains(e.target as Node) && !hamburgerBtn?.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  useEffect(() => {
    if (!userMenuOpen) return;
    function handleClick(e: MouseEvent) {
      const userMenuBox = document.getElementById("user-menu");
      if (userMenuBox && !userMenuBox.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [userMenuOpen]);

  const handleSignOut = async () => {
    if (!auth) return;
    await signOut(auth);
  };

  const isActive = (href: string) => {
    if (href.includes("#")) return false;
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
  };

  // Solid (light) header everywhere except over the home hero before scrolling
  const solid = !isHome || scrolled;

  // Hover background for icon buttons depending on header state
  const iconHover = isHome && !scrolled ? "hover:bg-white/10" : "hover:bg-[#F1EEE7]";
  const iconBtn = `p-2 flex items-center justify-center min-w-[44px] min-h-[44px] transition-colors ${iconHover}`;

  const searchButton = (extra = "") => (
    <button
      type="button"
      aria-label="Open search"
      className={`${iconBtn} ${extra}`}
      onClick={() => setSearchOpen(true)}
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.25} stroke="currentColor" className="w-5 h-5 sm:w-[22px] sm:h-[22px]">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
      </svg>
    </button>
  );

  const userMenu = () => (
    <div className="hidden md:block relative" id="user-menu" onMouseEnter={() => setUserMenuOpen(true)} onMouseLeave={() => setUserMenuOpen(false)}>
      {loading ? (
        <div className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-[#D8D5CD] border-t-[#171813] animate-spin rounded-full" />
        </div>
      ) : user ? (
        <>
          <button
            type="button"
            aria-label="User menu"
            onClick={() => setUserMenuOpen((s) => !s)}
            className={iconBtn}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.25} stroke="currentColor" className="w-5 h-5 sm:w-[22px] sm:h-[22px]">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </button>
          {userMenuOpen && (
            <div className="absolute right-0 top-full mt-0 w-48 bg-[#FFFFFF] shadow-lg border border-[#D8D5CD] py-2 z-50 text-[#171813]">
              <Link href="/orders" className="flex items-center px-4 py-2 text-sm text-[#171813] hover:bg-[#F1EEE7] transition-colors" onClick={() => setUserMenuOpen(false)}>
                <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M8 11v6h8v-6H8z" />
                </svg>
                My Orders
              </Link>
              {isAdmin && (
                <Link href="/admin" className="flex items-center px-4 py-2 text-sm font-medium text-[#171813] hover:bg-[#F1EEE7] transition-colors" onClick={() => setUserMenuOpen(false)}>
                  <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                  </svg>
                  Admin Dashboard
                </Link>
              )}
              <button onClick={() => { setUserMenuOpen(false); handleSignOut(); }} className="flex items-center w-full px-4 py-2 text-sm text-[#171813] hover:bg-[#F1EEE7] transition-colors">
                <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </button>
            </div>
          )}
        </>
      ) : (
        <Link href="/sign-in" className={iconBtn} aria-label="Sign in">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.25} stroke="currentColor" className="w-5 h-5 sm:w-[22px] sm:h-[22px]">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
        </Link>
      )}
    </div>
  );

  const cartButton = () => (
    <button
      type="button"
      onClick={openCart}
      className={`relative p-2 transition-all flex items-center justify-center ${iconHover} ${
        pulse ? "ring-4 ring-current animate-pulse px-2 py-1" : ""
      }`}
      style={{ minWidth: "2.5rem", minHeight: "2.5rem" }}
      aria-label="Open cart"
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.25} stroke="currentColor" className="w-5 h-5 sm:w-[22px] sm:h-[22px]">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
      </svg>
      {totalItems > 0 && (
        <span className="absolute -top-1 -right-1 bg-[#171813] text-white text-xs px-1.5 py-0.5 font-bold">
          {totalItems}
        </span>
      )}
    </button>
  );

  const drawer = (
    <div id="hamburger-menu">
      <div
        className={`fixed inset-0 z-[200] bg-black/40 transition-opacity duration-300 ${
          menuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setMenuOpen(false)}
      />
      <div
        className={`fixed left-0 top-0 bottom-0 z-[210] bg-[#FFFFFF] text-[#171813] shadow-xl transition-transform duration-300 ease-in-out w-full sm:w-[360px] lg:w-[420px] ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between mx-4 sm:mx-6 py-4 border-b border-[#D8D5CD]">
          <h2 className="text-lg sm:text-xl tracking-[0.18em] uppercase text-[#171813]" style={{ fontFamily: "var(--font-cormorant)" }}>Menu</h2>
          <button
            onClick={() => setMenuOpen(false)}
            className="p-2 hover:bg-[#F1EEE7] text-[#171813] min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors"
            aria-label="Close menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav className="p-4 sm:p-6 overflow-y-auto" style={{ height: "calc(100% - 65px)" }}>
          <div className="space-y-2 sm:space-y-4">
            <Link
              href="/"
              className="py-3 px-4 text-base tracking-wide text-[#171813] hover:bg-[#F1EEE7] transition-colors min-h-[48px] flex items-center"
              onClick={(e) => {
                e.preventDefault();
                setMenuOpen(false);
                window.location.href = "/";
              }}
            >
              Home
            </Link>

            {categories.map((cat) => {
              const subs = (cat.subcategories || []).sort((a, b) => a.order - b.order);
              const hasSubs = subs.length > 0;
              const isOpen = openCategory === cat.id;
              return (
                <div key={cat.id}>
                  <button
                    type="button"
                    onClick={() => {
                      if (!hasSubs) {
                        setMenuOpen(false);
                        window.location.href = `/shop?category=${encodeURIComponent(cat.name)}`;
                        return;
                      }
                      setOpenCategory(isOpen ? null : cat.id);
                    }}
                    className="w-full flex items-center justify-between py-3 px-4 text-base sm:text-lg text-[#171813] hover:bg-[#F1EEE7] transition-colors min-h-[48px] text-left"
                    aria-expanded={isOpen}
                  >
                    <span>{cat.name}</span>
                    {hasSubs && (
                      <svg
                        className={`w-4 h-4 text-[#595B53] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </button>
                  {isOpen && hasSubs && (
                    <div className="pb-1">
                      <Link
                        href={`/shop?category=${encodeURIComponent(cat.name)}`}
                        className="block py-3 px-4 pl-8 text-base sm:text-lg font-medium text-[#171813] hover:bg-[#F1EEE7] transition-colors min-h-[44px]"
                        onClick={(e) => {
                          e.preventDefault();
                          setMenuOpen(false);
                          window.location.href = `/shop?category=${encodeURIComponent(cat.name)}`;
                        }}
                      >
                        Shop All {cat.name}
                      </Link>
                      {subs.map((sub) => (
                        <Link
                          key={sub.name}
                          href={`/shop?category=${encodeURIComponent(cat.name)}&subcategory=${encodeURIComponent(sub.name)}`}
                          className="block py-3 px-4 pl-8 text-base sm:text-lg text-[#171813] hover:bg-[#F1EEE7] transition-colors min-h-[44px]"
                          onClick={(e) => {
                            e.preventDefault();
                            setMenuOpen(false);
                            window.location.href = `/shop?category=${encodeURIComponent(cat.name)}&subcategory=${encodeURIComponent(sub.name)}`;
                          }}
                        >
                          {sub.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            <Link
              href="/about-us"
              className="py-3 px-4 text-base tracking-wide text-[#171813] hover:bg-[#F1EEE7] transition-colors min-h-[48px] flex items-center"
              onClick={(e) => { e.preventDefault(); setMenuOpen(false); window.location.href = "/about-us"; }}
            >
              About Us
            </Link>

            <Link
              href="/faq"
              className="py-3 px-4 text-base tracking-wide text-[#171813] hover:bg-[#F1EEE7] transition-colors min-h-[48px] flex items-center"
              onClick={(e) => {
                e.preventDefault();
                setMenuOpen(false);
                window.location.href = "/faq";
              }}
            >
              Contact Us
            </Link>

            <div className="border-t border-[#D8D5CD] pt-4 mt-6">
              {[
                { href: "/privacy-policy", label: "Privacy Policy" },
                { href: "/refund-policy", label: "Return & Refund" },
                { href: "/shipping-policy", label: "Shipping Policy" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block py-3 px-4 text-base tracking-wide text-[#171813] hover:bg-[#F1EEE7] transition-colors min-h-[48px]"
                  onClick={() => { setMenuOpen(false); window.location.href = item.href; }}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="md:hidden">
              {user ? (
                <div className="border-t border-[#D8D5CD] pt-4 mt-6">
                  <Link
                    href="/orders"
                    className="block py-3 px-4 text-base tracking-wide text-[#171813] hover:bg-[#F1EEE7] transition-colors min-h-[48px]"
                    onClick={() => { setMenuOpen(false); router.push("/orders"); }}
                  >
                    My Orders
                  </Link>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      className="block py-3 px-4 text-base sm:text-lg text-[#171813] font-medium hover:bg-[#F1EEE7] transition-colors min-h-[48px]"
                      onClick={() => { setMenuOpen(false); router.push("/admin"); }}
                    >
                      Admin Dashboard
                    </Link>
                  )}
                  <button
                    onClick={() => { setMenuOpen(false); handleSignOut(); }}
                    className="block w-full text-left py-3 px-4 text-base tracking-wide text-[#171813] hover:bg-[#F1EEE7] transition-colors min-h-[48px]"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="border-t border-[#D8D5CD] pt-4 mt-6">
                  <Link
                    href="/sign-in"
                    className="block py-3 px-4 text-base tracking-wide text-[#171813] hover:bg-[#F1EEE7] transition-colors min-h-[48px]"
                    onClick={() => { setMenuOpen(false); window.location.href = "/sign-in"; }}
                  >
                    Sign In
                  </Link>
                </div>
              )}
            </div>

            <div className="border-t border-[#D8D5CD] pt-4 mt-6">
              <div className="flex space-x-4 px-4">
                <a href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer" className="text-[#171813] hover:text-[#171813] transition-colors" aria-label="Instagram">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2zm0 1.5A4.25 4.25 0 0 0 3.5 7.75v8.5A4.25 4.25 0 0 0 7.75 20.5h8.5A4.25 4.25 0 0 0 20.5 16.25v-8.5A4.25 4.25 0 0 0 16.25 3.5h-8.5zm4.25 3.25a5.25 5.25 0 1 1 0 10.5a5.25 5.25 0 0 1 0-10.5zm0 1.5a3.75 3.75 0 1 0 0 7.5a3.75 3.75 0 0 0 0-7.5zm5.25.75a1 1 0 1 1-2 0a1 1 0 0 1 2 0z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </nav>
      </div>
    </div>
  );

  const hamburger = (
    <button
      id="hamburger-button"
      onClick={() => setMenuOpen(!menuOpen)}
      className={`${iconBtn} -ml-2`}
      aria-label="Menu"
      aria-expanded={menuOpen}
    >
      <span className="flex flex-col gap-[5px]" aria-hidden>
        <span className="block w-[20px] h-[1.5px] bg-current" />
        <span className="block w-[20px] h-[1.5px] bg-current" />
        <span className="block w-[20px] h-[1.5px] bg-current" />
      </span>
    </button>
  );

  const header = (
    <header
      ref={headerRef}
      className={`top-0 z-[100] transition-colors duration-300 ${
        isHome ? "fixed left-0 right-0" : "sticky"
      } ${
        solid
          ? "bg-white border-b border-[#D8D5CD] text-[#171813]"
          : "bg-transparent text-white"
      }`}
    >
      <div className="mx-auto max-w-[1600px] px-14 sm:px-28 lg:px-36 xl:px-52">
        <div className="grid grid-cols-3 items-center h-16 lg:h-[72px]">
          {/* Left */}
          <div className="flex items-center justify-start lg:justify-end">
            <nav aria-label="Primary" className="hidden lg:flex items-center gap-9 xl:gap-14">
              {NAV_LEFT.map((item) => (
                <NavTextLink key={item.label} label={item.label} href={item.href} active={isActive(item.href)} />
              ))}
            </nav>
            <span className="lg:hidden">{hamburger}</span>
          </div>

          {/* Center — brand logo */}
          <div className="flex items-center justify-center">
            <Link href="/" aria-label="The Sagar's Design House — home" className="flex shrink-0 items-center focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-current">
              <Image
                src="/wave.png"
                alt="The Sagar's Design House"
                width={128}
                height={128}
                priority
                className={`h-16 w-16 object-contain transition-[filter] duration-300 lg:h-20 lg:w-20 ${
                  solid ? "[filter:brightness(0)]" : ""
                }`}
              />
            </Link>
          </div>

          {/* Right */}
          <div className="flex items-center justify-end gap-2 lg:justify-start lg:gap-12">
            <nav aria-label="Secondary" className="hidden lg:flex items-center gap-9 xl:gap-14">
              {NAV_RIGHT.map((item) => (
                <NavTextLink key={item.label} label={item.label} href={item.href} active={isActive(item.href)} />
              ))}
            </nav>
            <div className="-mr-2 flex items-center gap-0.5 sm:gap-1 lg:ml-auto">
              {searchButton("hidden sm:flex")}
              {userMenu()}
              {cartButton()}
            </div>
          </div>
        </div>
      </div>
    </header>
  );

  return (
    <>
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
      {drawer}
      {header}
    </>
  );
}

export default function Navbar() {
  return (
    <Suspense fallback={<header className="bg-[#F1EEE7] h-16"></header>}>
      <NavbarContent />
    </Suspense>
  );
}
