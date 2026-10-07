"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAccountCustomer } from "@/hooks/useAccountCustomer";
import { logoutAccount } from "@/app/account/actions";
import { hasActiveScript } from "@/lib/account/script-access";

const navigation = [
  ["/account", "Account Status", "user"],
  ["/pharmacy", "Shop Products", "bag"],
  ["/request-script", "Get eScript ($49)", "escript"],
  ["tel:1300115734", "Speak to our pharmacist", "phone"],
  ["/upload-prescription", "Upload Prescription", "upload"],
  ["/contact", "Contact Us", "help"],
] as const;

const iconImages = {
  home: "/images/account/home.svg",
  bag: "/images/account/QuitRX dashboard icons-25.png",
  script: "/images/account/script.svg",
  calendar: "/images/account/calendar.svg",
  user: "/images/account/QuitRX dashboard icons-24.png",
  upload: "/images/account/QuitRX dashboard icons-27.png",
  lock: "/images/account/lock.svg",
  help: "/images/account/help.svg",
  status: "/images/account/status.svg",
  phone: "/images/account/phone.svg",
  escript: "/images/option-escript.webp",
} as const;

function Icon({ name }: { name: keyof typeof iconImages }) {
  return (
    <Image
      className={
        name === "escript"
          ? "account-nav-image-icon"
          : "account-nav-image-icon account-nav-image-icon--monochrome"
      }
      src={iconImages[name]}
      width={name === "escript" ? 18 : 28}
      height={name === "escript" ? 22 : 28}
      alt=""
      aria-hidden="true"
    />
  );
}

export default function AccountShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { customer: identity, loading: customerLoading, setCustomer } = useAccountCustomer();
  const [menuOpen, setMenuOpen] = useState(false);
  const accountName = identity?.firstName?.trim() || identity?.email?.split("@")[0]?.trim();
  const scriptIsActive = hasActiveScript(identity);

  if (pathname === "/account/login" || pathname === "/account/auth-popup") {
    return <main className="account-login-page">{children}</main>;
  }

  return (
    <div className={menuOpen ? "account-shell account-shell--menu-open" : "account-shell"}>
      <aside className="account-sidebar" id="account-navigation">
        <button
          className="account-menu-toggle"
          type="button"
          aria-controls="account-navigation"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Close account menu" : "Open account menu"}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span aria-hidden="true">{menuOpen ? "‹" : "›"}</span>
        </button>
        <Link className="account-brand" href="/" aria-label="QuitRx homepage">
          <Image
            src="/images/quitrx-logo-white.png"
            width={170}
            height={48}
            alt="QuitRx"
            priority
          />
        </Link>
        <div className="account-sidebar__intro">
          <strong>{accountName ? `Welcome, ${accountName}` : "Welcome"}</strong>
          {identity?.email && <span>{identity.email}</span>}
        </div>
        <nav aria-label="Account navigation">
          {navigation.map(([href, label, icon]) => {
            const requiresActiveScript = href === "/pharmacy" || href === "/request-script";
            if (requiresActiveScript && (customerLoading || !scriptIsActive)) {
              return (
                <div key={href} className="account-nav-disabled" aria-disabled="true">
                  <Icon name={icon} />
                  <span>{label}</span>
                </div>
              );
            }

            if (!href) {
              return (
                <div key={label} className="account-nav-status">
                  <Icon name={icon} />
                  <span>{label}</span>
                </div>
              );
            }

            const active = href === "/account" ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={active ? "active" : ""}
                onClick={() => setMenuOpen(false)}
              >
                <Icon name={icon} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
        <form
          className="account-signout-form"
          action={logoutAccount}
          onSubmit={() => setCustomer(undefined)}
        >
          <button type="submit" className="account-signout">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M15 16L20 12L15 8"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M20 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path
                d="M9 4H5C3.9 4 3 4.9 3 6V18C3 19.1 3.9 20 5 20H9"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            Sign Out
          </button>
        </form>
      </aside>
      {menuOpen && (
        <button
          className="account-menu-backdrop"
          type="button"
          aria-label="Close account menu"
          onClick={() => setMenuOpen(false)}
        />
      )}
      <main className="account-main">{children}</main>
    </div>
  );
}

export function PageHeading({
  eyebrow,
  title,
  copy,
  action,
}: {
  eyebrow?: string;
  title: string;
  copy?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="account-heading">
      <div>
        {eyebrow && <span>{eyebrow}</span>}
        <h1>{title}</h1>
        {copy && <p>{copy}</p>}
      </div>
      {action}
    </header>
  );
}
