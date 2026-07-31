/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState } from "react";
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

function getHref(item: NavigationMenuItem) {
  return item.href || item.link || "#";
}

export default function Header({ navigation }: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const menuItems = navigation?.header_menu?.length
    ? navigation.header_menu
    : fallbackMenu;
  
  const pathname = usePathname()
  const isHome = pathname === "/";

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
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
    <header className={`site-header ${!isHome ? "site-header--not-home" : ""} ${isScrolled ? "site-header--scrolled" : ""}`}>
      <div className="site-header__bar">
        <div className="site-header__inner">
          {/* <Link className="site-header__consultations" href="/contact">
            Consultations
          </Link> */}

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

          <div className="nav2">
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
            <Link className="site-header__contact" href="/contact">
              Contact
            </Link>
          </div>

          

          <button
            className="site-header__menu-button"
            type="button"
            aria-label="Open navigation menu"
            aria-expanded={isOpen}
            onClick={() => setIsOpen(true)}
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

            <button
              className="site-nav__close"
              type="button"
              aria-label="Close navigation menu"
              onClick={() => setIsOpen(false)}
            >
              <span />
              <span />
            </button>
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
  );
}
