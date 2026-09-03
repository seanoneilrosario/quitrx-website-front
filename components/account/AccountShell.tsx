"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type AccountIdentity = {
  firstName?: string;
  username?: string;
  email?: string;
};

const navigation = [
  ["/account", "Account Status", "user"],
  ["/pharmacy", "Shop Products", "bag"],
  ["/request-script", "Get eScript ($49)", "escript"],
  ["tel:1300115734", "Speak to our pharmacist", "phone"],
  ["/upload-prescription", "Upload Prescription", "upload"],
  ["/contact", "Contact Us", "help"],
] as const;

function Icon({ name }: { name: string }) {
  if (name === "escript") {
    return <Image className="account-nav-image-icon" src="/images/option-escript.webp" width={18} height={22} alt="" aria-hidden="true" />;
  }
  if (name === "phone") {
    return <svg viewBox="0 0 37.64 37.64" aria-hidden="true"><path className="account-phone-icon__path" d="M22.73,19.14c1.27-1,2.9-1.18,4.39-.61l3.64,1.4c1.37.53,2.46,1.88,2.45,3.37v4.26c-.12,1.84-1.75,3.44-3.66,3.5-8.1.26-16.13-3.87-20.5-10.73-2.27-3.56-3.54-7.72-3.38-11.96.07-1.94,1.82-3.47,3.7-3.54h4.33c1.52,0,2.96.94,3.55,2.33l1.59,3.77c.6,1.42.15,3.02-.88,4.12l-.71.81c-.32.37-.32.98.06,1.34l2.62,2.51c.51.48,1.27.63,1.83.19l.96-.75ZM24.52,21.41l-.99.78c-1.6,1.18-3.92,1.16-5.39-.23l-2.92-2.78c-1.4-1.43-1.42-3.68-.18-5.19l.84-.96c.27-.3.42-.72.25-1.12l-1.52-3.56c-.17-.39-.63-.66-1.05-.66h-4c-.47,0-1.03.4-1.04.91-.05,3.16.76,6.23,2.27,9.01,1.6,2.94,3.93,5.4,6.74,7.21,3.5,2.25,7.56,3.42,11.73,3.39.47,0,1.05-.38,1.06-.85l.02-3.88c0-.39-.36-.76-.7-.89l-3.67-1.4c-.49-.19-1.02-.11-1.44.22Z"/></svg>;
  }

  const paths: Record<string, React.ReactNode> = {
    home: <><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9v11h14V9M9 20v-6h6v6"/></>,
    bag: <><circle cx="9" cy="20" r="1.5" stroke="currentColor" strokeWidth="2"/><circle cx="18" cy="20" r="1.5" stroke="currentColor" strokeWidth="2"/><path d="M3 4H6L8.4 15H19L21 8H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></>,
    script: <><path d="M6 3h12v18H6z"/><path d="M9 8h6M9 12h6M9 16h3"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/></>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
    upload: <><path d="M12 16V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M8 8L12 4L16 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M5 20H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></>,
    lock: <><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>,
    help: <><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/><path d="M9.5 9A2.5 2.5 0 0114 10.5C14 12 12 12.5 12 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><circle cx="12" cy="17" r="1" fill="currentColor" stroke="none"/></>,
    status: <><circle cx="12" cy="12" r="7"/><path d="M12 7v5l3 3"/></>,
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>;
}

export default function AccountShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [identity, setIdentity] = useState<AccountIdentity>();
  const accountName = identity?.firstName?.trim()
    || identity?.username?.trim()
    || identity?.email?.split("@")[0]?.trim();

  useEffect(() => {
    if (pathname === "/account/login" || pathname === "/account/auth-popup") return;
    const controller = new AbortController();
    fetch("/api/account/me", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (response.ok) setIdentity(await response.json() as AccountIdentity);
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) setIdentity(undefined);
      });
    return () => controller.abort();
  }, [pathname]);

  if (pathname === "/account/login" || pathname === "/account/auth-popup") {
    return <main className="account-login-page">{children}</main>;
  }

  return (
    <div className="account-shell">
      <aside className="account-sidebar">
        <Link className="account-brand" href="/" aria-label="QuitRx homepage">
          <span className="account-brand__mark">Quit</span>
          <span className="account-brand__rx">Rx</span>
        </Link>
        <div className="account-sidebar__intro">
          <strong>{accountName ? `Welcome, ${accountName}` : "Welcome"}</strong>
          {identity?.email && <span>{identity.email}</span>}
        </div>
        <nav aria-label="Account navigation">
          {navigation.map(([href, label, icon]) => {
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
              <Link key={href} href={href} className={active ? "active" : ""}>
                <Icon name={icon} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
        <form className="account-signout-form" action="/api/account/logout" method="post">
          <button type="submit" className="account-signout">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M15 16L20 12L15 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M20 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M9 4H5C3.9 4 3 4.9 3 6V18C3 19.1 3.9 20 5 20H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Sign Out
          </button>
        </form>
      </aside>
      <main className="account-main">
        {children}
      </main>
    </div>
  );
}

export function PageHeading({ eyebrow, title, copy, action }: { eyebrow?: string; title: string; copy?: string; action?: React.ReactNode }) {
  return <header className="account-heading"><div>{eyebrow && <span>{eyebrow}</span>}<h1>{title}</h1>{copy && <p>{copy}</p>}</div>{action}</header>;
}
