/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavigationMenuItem = {
  title?: string | null;
  href?: string | null;
  link?: string | null;
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

type HeaderProps = {
  navigation?: NavigationData | null;
};

const fallbackMenu: NavigationMenuItem[] = [
  { title: "About", href: "/about" },

];

const MARQUEE_TEXT = "Welcome to the NEW QuitRX. Advancing the way Australians quit.";
const MARQUEE_REPEAT = 4;

function getHref(item: NavigationMenuItem) {
  return item.href || item.link || "#";
}

export default function Header({ navigation }: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isScrollingUp, setIsScrollingUp] = useState(false);
  const lastScrollY = useRef(0);

  const menuItems = navigation?.header_menu?.length
    ? navigation.header_menu
    : fallbackMenu;
  
  const pathname = usePathname()
  const isHome = pathname === "/";

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
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

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
              <button className="svg-icon-search">
                <svg fill="none" className="icon icon-search" viewBox="0 0 18 19"><path fill="currentColor" fill-rule="evenodd" d="M11.03 11.68A5.784 5.784 0 1 1 2.85 3.5a5.784 5.784 0 0 1 8.18 8.18m.26 1.12a6.78 6.78 0 1 1 .72-.7l5.4 5.4a.5.5 0 1 1-.71.7z" clip-rule="evenodd"></path></svg>
              </button>
              <div className="cart-button">
                <a className="site-header__cart site-header__mobile" href="/cart">
                  My Cart
                </a>
                <a className="site-header__cart site-header__desktop" href="/cart">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" className="icon icon-cart-empty" viewBox="0 0 40 40"><path fill="currentColor" fill-rule="evenodd" d="M15.75 11.8h-3.16l-.77 11.6a5 5 0 0 0 4.99 5.34h7.38a5 5 0 0 0 4.99-5.33L28.4 11.8zm0 1h-2.22l-.71 10.67a4 4 0 0 0 3.99 4.27h7.38a4 4 0 0 0 4-4.27l-.72-10.67h-2.22v.63a4.75 4.75 0 1 1-9.5 0zm8.5 0h-7.5v.63a3.75 3.75 0 1 0 7.5 0z"></path></svg>
                </a>
              </div>
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
                if (item.title == "About") {
                  return (
                    <Link
                      key={`${item.title}-${getHref(item)}`}
                      href={getHref(item)}
                      onClick={() => setIsOpen(false)}
                    >
                      {item.title}
                    </Link>
                  )
                }
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

            {/* <div className="site-nav__footer">
              <Link className="site-nav__cta" href="/contact" onClick={() => setIsOpen(false)}>
                Start a conversation
              </Link>
            </div> */}
          </div>
        </div>
      </header>
    </Fragment>
  );
}
