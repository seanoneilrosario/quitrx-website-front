/* eslint-disable react-hooks/set-state-in-effect */
"use client";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
type NavigationMenuItem = {
  title?: string | null;
  href?: string | null;
  link?: string | null;
  anchor?: string | null;
};
export type NavigationData = {
  title?: string | null;
  headerLogo?: string | null;
  headerLogoAlt?: string | null;
  headerLogoMenu?: string | null;
  headerLogoMenuAlt?: string | null;
  header_menu?: NavigationMenuItem[] | null;
  header_logo2?: string | null;
};
export type SearchPage = {
  _id: string;
  _type: "home" | "page";
  title?: string | null;
  slug?: string | null;
  metaDescription?: string | null;
};
type HeaderProps = {
  navigation?: NavigationData | null;
  searchPages?: SearchPage[];
};
type CartItem = {
  key: string;
  productName: string;
  image?: string;
  variantName: string;
  price?: number | string;
  quantity: number;
};
type SearchProduct = {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  image?: string;
};
type AccountIdentity = {
  firstName?: string;
  email?: string;
};
const CART_KEY = "quitrx-cart";

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" ? value as Record<string, unknown> : undefined;
}

function textValue(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value;
  }
}

function productImage(product: Record<string, unknown>) {
  const directImage = textValue(product, ["imageUrl", "image_url", "thumbnail", "image"]);
  if (directImage) return directImage;

  const images = product.images;
  if (!Array.isArray(images) || !images.length) return undefined;
  if (typeof images[0] === "string") return images[0];
  return textValue(asRecord(images[0]) || {}, ["url", "src", "imageUrl"]);
}

function parseSearchProducts(payload: unknown): SearchProduct[] {
  const record = asRecord(payload);
  const items = Array.isArray(payload) ? payload : record?.products || record?.data || record?.items;
  if (!Array.isArray(items)) return [];

  return items.flatMap((item) => {
    const product = asRecord(item);
    if (!product) return [];
    const id = textValue(product, ["id", "_id"]);
    const name = textValue(product, ["name", "title", "productName"]);
    if (!id || !name) return [];
    return [{
      id,
      name,
      slug: textValue(product, ["slug"]),
      description: textValue(product, ["shortDescription", "description", "seoDescription"]),
      image: productImage(product),
    }];
  });
}

function readCart(): CartItem[] {
  try {
    const cart = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    return Array.isArray(cart) ? cart : [];
  } catch {
    return [];
  }
}

function cartMoney(value?: number | string) {
  const amount = typeof value === "number" ? value : Number(String(value || "").replace(/[^0-9.-]/g, ""));
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(Number.isFinite(amount) ? amount : 0);
}
const fallbackMenu: NavigationMenuItem[] = [
  { title: "About", href: "/about" },
];
const MARQUEE_TEXT = "Welcome to the NEW QuitRX. Advancing the way Australians quit.";
const MARQUEE_REPEAT = 4;
const BODY_TEMPLATE_CLASSES = [
  "template-index",
  "template-page",
  "template-admin",
];
function getHref(item: NavigationMenuItem) {
  const base = item.href || item.link || "";
  const anchor = item.anchor ? `#${item.anchor.replace(/^#/, "")}` : "";

  if (base && anchor) {
    // e.g. "/about" + "#team" -> "/about#team"
    return `${base}${anchor}`;
  }

  if (anchor) {
    // No page/link set - jump to a section on the current page
    return anchor;
  }

  return base || "#";
}
export default function Header({ navigation, searchPages = [] }: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [accountIdentity, setAccountIdentity] = useState<AccountIdentity>();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchProducts, setSearchProducts] = useState<SearchProduct[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchLoaded, setSearchLoaded] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);
  const [isScrollingUp, setIsScrollingUp] = useState(false);
  const lastScrollY = useRef(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const menuItems = navigation?.header_menu?.length
    ? navigation.header_menu
    : fallbackMenu;
  const accountName = accountIdentity?.firstName?.trim() || accountIdentity?.email?.trim();
  
  const pathname = usePathname()
  const isHome = pathname === "/";
  const isAdmin = pathname.startsWith("/admin");
  const isAccountPage = pathname === "/account" || pathname === "/account/login";
  const pageSearchResults = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return [];

    return searchPages.filter((page) =>
      `${page.title || ""} ${page.metaDescription || ""}`.toLowerCase().includes(term)
    );
  }, [searchPages, searchTerm]);
  const productSearchResults = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return [];
    return searchProducts.filter((product) =>
      `${product.name} ${product.description || ""}`.toLowerCase().includes(term)
    );
  }, [searchProducts, searchTerm]);
  useEffect(() => {
    if (!isSearchOpen || searchLoaded) return;
    const controller = new AbortController();
    let cancelled = false;
    setSearchLoading(true);
    setSearchError("");
    fetch("/api/quithero-products", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load products.");
        const products = parseSearchProducts(await response.json());
        if (!cancelled) setSearchProducts(products);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        if (!cancelled) setSearchError("Product search is temporarily unavailable.");
      })
      .finally(() => {
        if (!cancelled) {
          setSearchLoading(false);
          setSearchLoaded(true);
        }
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [isSearchOpen, searchLoaded]);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/account/me", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          setAccountIdentity(undefined);
          return;
        }
        setAccountIdentity(await response.json() as AccountIdentity);
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setAccountIdentity(undefined);
        }
      });
    return () => controller.abort();
  }, [pathname]);
  useEffect(() => {
    const updateCart = (event?: Event) => {
      setCartItems(readCart());
      if (event instanceof CustomEvent && event.detail?.open) setIsCartOpen(true);
    };
    updateCart();
    window.addEventListener("storage", updateCart);
    window.addEventListener("quitrx:cart-updated", updateCart);
    return () => {
      window.removeEventListener("storage", updateCart);
      window.removeEventListener("quitrx:cart-updated", updateCart);
    };
  }, []);
  useEffect(() => {
    lastScrollY.current = window.scrollY;
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsScrolled(currentScrollY > 0);
      setIsScrollingUp(currentScrollY < lastScrollY.current);
      lastScrollY.current = currentScrollY;
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);
  useEffect(() => {
    setIsOpen(false);
    setIsSearchOpen(false);
    setSearchTerm("");
  }, [pathname]);
  useEffect(() => {
    document.body.style.overflow = isOpen || isSearchOpen || isCartOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, isSearchOpen, isCartOpen]);
  useEffect(() => {
    if (isSearchOpen) {
      searchInputRef.current?.focus();
    }
  }, [isSearchOpen]);
  // Tag <body> with the current page type: home / inner page / admin
  useEffect(() => {
    const body = document.body;
    body.classList.remove(...BODY_TEMPLATE_CLASSES);
    if (isAdmin) {
      body.classList.add("template-admin");
    } else if (isHome) {
      body.classList.add("template-index");
    } else {
      body.classList.add("template-page");
    }

    body.classList.toggle("account-page", isAccountPage);

    return () => {
      body.classList.remove(...BODY_TEMPLATE_CLASSES, "account-page");
    };
  }, [isAdmin, isHome, isAccountPage]);
  if (pathname.includes("/admin")) {
    return null
  }
  const selectedLogo = !isHome && navigation?.header_logo2 ? navigation.header_logo2 : navigation?.headerLogo
  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const cartSubtotal = cartItems.reduce((total, item) => {
    const amount = typeof item.price === "number" ? item.price : Number(String(item.price || "").replace(/[^0-9.-]/g, ""));
    return total + (Number.isFinite(amount) ? amount : 0) * item.quantity;
  }, 0);

  function saveCart(items: CartItem[]) {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    setCartItems(items);
    window.dispatchEvent(new CustomEvent("quitrx:cart-updated", { detail: { items } }));
  }
  return (
    <Fragment>
      <div className="site-marquee">
        <div className="site-marquee__track">
          {Array.from({ length: MARQUEE_REPEAT }).map((_, i) => (
            <span className="site-marquee__item" key={i}>
              {MARQUEE_TEXT}
            </span>
          ))}
        </div>
      </div>
      <header
        className={`site-header ${!isHome ? "site-header--not-home" : ""} ${
          isScrolled ? "site-header--scrolled" : ""
        } ${isScrollingUp ? "site-header--scroll-up" : ""}`}
      >
        <div className="site-header__bar">
          <div className="site-header__inner">
            <div className="mobile_nav_icons">
               <div className="cart-button">
                <button className="site-header__cart site-header__mobile" type="button" onClick={() => setIsCartOpen(true)}>
                  My Cart {cartCount > 0 && <span className="site-header__cart-count">{cartCount}</span>}
                </button>
                <button className="site-header__cart site-header__desktop" type="button" aria-label={`Open cart with ${cartCount} items`} onClick={() => setIsCartOpen(true)}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" className="icon icon-cart-empty" viewBox="0 0 40 40"><path fill="currentColor" fillRule="evenodd" d="M15.75 11.8h-3.16l-.77 11.6a5 5 0 0 0 4.99 5.34h7.38a5 5 0 0 0 4.99-5.33L28.4 11.8zm0 1h-2.22l-.71 10.67a4 4 0 0 0 3.99 4.27h7.38a4 4 0 0 0 4-4.27l-.72-10.67h-2.22v.63a4.75 4.75 0 1 1-9.5 0zm8.5 0h-7.5v.63a3.75 3.75 0 1 0 7.5 0z"></path></svg>
                  {cartCount > 0 && <span className="site-header__cart-count">{cartCount}</span>}
                </button>
              </div>
              <Link className="site-header__account site-header__desktop" href={accountName ? "/account" : "/account/login"}>
                {accountName && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="12" cy="7" r="4"/><path d="M4.5 21v-2.5a5 5 0 0 1 5-5h5a5 5 0 0 1 5 5V21"/></svg>}
                <span>{accountName ? `Hi, ${accountName}` : "Login"}</span>
              </Link>
              <button
                className="svg-icon-search"
                type="button"
                aria-label="Search the site"
                aria-expanded={isSearchOpen}
                aria-controls="site-search-dialog"
                onClick={() => {
                  setIsOpen(false);
                  setIsSearchOpen(true);
                }}
              >
                <svg fill="none" className="icon icon-search" viewBox="0 0 18 19"><path fill="currentColor" fillRule="evenodd" d="M11.03 11.68A5.784 5.784 0 1 1 2.85 3.5a5.784 5.784 0 0 1 8.18 8.18m.26 1.12a6.78 6.78 0 1 1 .72-.7l5.4 5.4a.5.5 0 1 1-.71.7z" clipRule="evenodd"></path></svg>
              </button>
            </div>
            {/* <Link className="site-header__consultations" href="/contact">
              Consultations
            </Link> */}
              <Link className="site-header__logo" href="/" aria-label="Home">
                {selectedLogo ? (
                  <Image
                    src={selectedLogo}
                    alt={navigation?.headerLogoAlt || navigation?.title || "MCQ"}
                    width={280}
                    height={80}
                    priority
                  />
                ) : (
                  <span>MCQ</span>
                )}
              </Link>
            <nav className="site-header__desktop-nav" aria-label="Primary navigation">
              {menuItems.map((item) => {
                  return (
                    <Link
                      key={`${item.title}-${getHref(item)}`}
                      href={getHref(item)}
                      onClick={() => setIsOpen(false)}
                    >
                      {item.title}
                    </Link>
                  )
              })}
            </nav>
            <button
              className={`site-header__menu-button ${isOpen ? "site-header__menu-button--open" : ""}`}
              type="button"
              aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={isOpen}
              onClick={() => setIsOpen((prev) => !prev)}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
        <div className={`site-nav ${isOpen ? "site-nav--open" : ""}`} onClick={() => setIsOpen(false)}>
          <div className="site-nav__panel" onClick={(event) => event.stopPropagation()}>
            <div className="site-nav__header">
              <Link className="site-nav__logo" href="/" onClick={() => setIsOpen(false)}>
                {(!isHome && navigation?.header_logo2) ? (
                  <Image
                    src={navigation.header_logo2}
                    alt={navigation.headerLogoAlt || navigation.title || "MCQ"}
                    width={90}
                    height={90}
                  />
                ) : (navigation?.headerLogoMenu || navigation?.headerLogo) ? (
                  <Image
                    src={navigation.headerLogoMenu || navigation.headerLogo || ""}
                    alt={
                      navigation.headerLogoMenuAlt ||
                      navigation.headerLogoAlt ||
                      navigation.title ||
                      "MCQ"
                    }
                    width={90}
                    height={90}
                  />
                ) : (
                  <span>MCQ</span>
                )}
              </Link>
              {/* <button
                className="site-nav__close"
                type="button"
                aria-label="Close navigation menu"
                onClick={() => setIsOpen(false)}
              >
                <span />
                <span />
              </button> */}
            </div>
            <nav className="site-nav__menu" aria-label="Primary navigation">
              {menuItems.map((item) => (
                <Link
                  key={`${item.title}-${getHref(item)}`}
                  href={getHref(item)}
                  onClick={() => setIsOpen(false)}
                >
                  {item.title}
                </Link>
              ))}
            </nav>
            <div className="site-nav__footer">
                <Link className="site-header__account site-header__mobile" href={accountName ? "/account" : "/account/login"} aria-label={accountName ? `Open ${accountName}'s account` : "Log in"}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                </Link>
            </div>
          </div>
        </div>
      </header>
        <div
          id="site-search-dialog"
          className={`site-search ${isSearchOpen ? "site-search--open" : ""}`}
          role="dialog"
          aria-modal="true"
          aria-label="Search the site"
          onClick={() => setIsSearchOpen(false)}
        >
          <div className="site-search__panel" onClick={(event) => event.stopPropagation()}>
            <div className="site-search__field">
              <label className="site-search__label" htmlFor="site-search-input">Search pages</label>
              <input
                id="site-search-input"
                className="site-search__input"
                type="search"
                value={searchTerm}
                placeholder="Search"
                ref={searchInputRef}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
              <svg className="site-search__icon" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="10.5" cy="10.5" r="6.5" />
                <path d="m16 16 5 5" />
              </svg>
            </div>
            <button
              type="button"
              className="site-search__close"
              aria-label="Close search"
              onClick={() => setIsSearchOpen(false)}
            >
              <span />
              <span />
            </button>
            <div className="site-search__results" aria-live="polite">
              {searchTerm.trim() && !searchLoading && pageSearchResults.length === 0 && productSearchResults.length === 0 && <p>No results found.</p>}
              {searchLoading && <p>Loading products…</p>}
              {searchError && <p>{searchError}</p>}
              {pageSearchResults.map((page) => {
                const href = page._type === "home" ? "/" : `/${page.slug}`;
                return (
                  <Link key={page._id} href={href} onClick={() => setIsSearchOpen(false)}>
                    <strong>{page.title || "Untitled page"}</strong>
                  </Link>
                );
              })}
              {productSearchResults.map((product) => (
                <Link
                  key={product.id}
                  href={product.slug ? `/products/${product.slug}` : `/product/${encodeURIComponent(product.id)}`}
                  className="site-search__product"
                  onClick={() => setIsSearchOpen(false)}
                >
                  {product.image && <img src={product.image} alt="" />}
                  <strong>{product.name}</strong>
                </Link>
              ))}
            </div>
          </div>
        </div>
        <div className={`cart-drawer ${isCartOpen ? "cart-drawer--open" : ""}`} aria-hidden={!isCartOpen}>
          <button className="cart-drawer__backdrop" type="button" aria-label="Close cart" onClick={() => setIsCartOpen(false)} />
          <aside className="cart-drawer__panel" role="dialog" aria-modal="true" aria-label="Shopping cart">
            <div className="cart-drawer__header">
              <h2>Your cart <span>({cartCount})</span></h2>
              <button type="button" aria-label="Close cart" onClick={() => setIsCartOpen(false)}>&times;</button>
            </div>
            {cartItems.length === 0 ? (
              <div className="cart-drawer__empty"><p>Your cart is empty.</p><button type="button" onClick={() => setIsCartOpen(false)}>Continue shopping</button></div>
            ) : (
              <>
                <div className="cart-drawer__items">
                  {cartItems.map((item) => (
                    <article className="cart-drawer__item" key={item.key}>
                      <div className="cart-drawer__image">{item.image && <img src={item.image} alt="" />}</div>
                      <div className="cart-drawer__details">
                        <strong>{item.productName}</strong>
                        <span>{item.variantName}</span>
                        <span>{cartMoney(item.price)}</span>
                        <div className="cart-drawer__quantity">
                          <button type="button" aria-label={`Decrease ${item.productName} quantity`} onClick={() => saveCart(item.quantity === 1 ? cartItems.filter((entry) => entry.key !== item.key) : cartItems.map((entry) => entry.key === item.key ? { ...entry, quantity: entry.quantity - 1 } : entry))}>−</button>
                          <span>{item.quantity}</span>
                          <button type="button" aria-label={`Increase ${item.productName} quantity`} onClick={() => saveCart(cartItems.map((entry) => entry.key === item.key ? { ...entry, quantity: entry.quantity + 1 } : entry))}>+</button>
                        </div>
                      </div>
                      <button className="cart-drawer__remove" type="button" onClick={() => saveCart(cartItems.filter((entry) => entry.key !== item.key))}>Remove</button>
                    </article>
                  ))}
                </div>
                <div className="cart-drawer__footer">
                  <div><span>Subtotal</span><strong>{cartMoney(cartSubtotal)}</strong></div>
                  <p>Shipping and payment are confirmed at checkout.</p>
                  <Link href="/cart" onClick={() => setIsCartOpen(false)}>View cart</Link>
                  <Link className="cart-drawer__checkout" href="/contact" onClick={() => setIsCartOpen(false)}>Continue to checkout</Link>
                </div>
              </>
            )}
          </aside>
        </div>
    </Fragment>
  );
}
