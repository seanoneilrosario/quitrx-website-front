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
  const [searchTerm, setSearchTerm] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);
  const [isScrollingUp, setIsScrollingUp] = useState(false);
  const lastScrollY = useRef(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const menuItems = navigation?.header_menu?.length
    ? navigation.header_menu
    : fallbackMenu;
  
  const pathname = usePathname()
  const isHome = pathname === "/";
  const isAdmin = pathname.startsWith("/admin");
  const isAccountPage = pathname === "/account" || pathname === "/account/login";
  const searchResults = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return [];

    return searchPages.filter((page) =>
      `${page.title || ""} ${page.metaDescription || ""}`.toLowerCase().includes(term)
    );
  }, [searchPages, searchTerm]);
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
    document.body.style.overflow = isOpen || isSearchOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, isSearchOpen]);
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
                <Link className="site-header__cart site-header__mobile" href="/cart">
                  My Cart
                </Link>
                <Link className="site-header__cart site-header__desktop" href="/cart">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" className="icon icon-cart-empty" viewBox="0 0 40 40"><path fill="currentColor" fillRule="evenodd" d="M15.75 11.8h-3.16l-.77 11.6a5 5 0 0 0 4.99 5.34h7.38a5 5 0 0 0 4.99-5.33L28.4 11.8zm0 1h-2.22l-.71 10.67a4 4 0 0 0 3.99 4.27h7.38a4 4 0 0 0 4-4.27l-.72-10.67h-2.22v.63a4.75 4.75 0 1 1-9.5 0zm8.5 0h-7.5v.63a3.75 3.75 0 1 0 7.5 0z"></path></svg>
                </Link>
              </div>
              <Link className="site-header__account site-header__desktop" href="/account/login">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
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
                <Link className="site-header__account site-header__mobile" href="/account/login">
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
              {searchTerm.trim() && searchResults.length === 0 && <p>No pages found.</p>}
              {searchResults.map((page) => {
                const href = page._type === "home" ? "/" : `/${page.slug}`;
                return (
                  <Link key={page._id} href={href} onClick={() => setIsSearchOpen(false)}>
                    <strong>{page.title || "Untitled page"}</strong>
                    {page.metaDescription && <span>{page.metaDescription}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
    </Fragment>
  );
}
