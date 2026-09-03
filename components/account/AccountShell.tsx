"use client";

import Link from "next/link";
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
  ["/request-script", "Get eScript ($49)", "script"],
  ["tel:1300115734", "Speak to our pharmacist", "calendar"],
  ["/upload-prescription", "Upload Prescription", "user"],
  ["/contact", "Contact Us", "lock"],
] as const;

function Icon({ name }: { name: string }) {
  const paths: Record<string, React.ReactNode> = {
    home: <><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9v11h14V9M9 20v-6h6v6"/></>,
    bag: <><path d="M5 8h14l-1 13H6L5 8Z"/><path d="M9 10V6a3 3 0 0 1 6 0v4"/></>,
    script: <><path d="M6 3h12v18H6z"/><path d="M9 8h6M9 12h6M9 16h3"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/></>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
    lock: <><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>,
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
          <button type="submit" className="account-signout"><span aria-hidden="true">→</span> Sign Out</button>
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
