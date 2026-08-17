"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  ["/account", "Overview", "home"],
  ["/account/orders", "Orders", "bag"],
  ["/account/prescriptions", "Prescriptions", "script"],
  ["/account/consultations", "Consultations", "calendar"],
  ["/account/profile", "Profile", "user"],
  ["/account/security", "Security", "lock"],
] as const;

function Icon({ name }: { name: string }) {
  const paths: Record<string, React.ReactNode> = {
    home: <><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9v11h14V9M9 20v-6h6v6"/></>,
    bag: <><path d="M5 8h14l-1 13H6L5 8Z"/><path d="M9 10V6a3 3 0 0 1 6 0v4"/></>,
    script: <><path d="M6 3h12v18H6z"/><path d="M9 8h6M9 12h6M9 16h3"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/></>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
    lock: <><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>,
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>;
}

export default function AccountShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="account-shell">
      <aside className="account-sidebar">
        <div className="account-sidebar__intro">
          <span className="account-avatar">AM</span>
          <div><strong>Alex Morgan</strong><span>Customer account</span></div>
        </div>
        <nav aria-label="Account navigation">
          {navigation.map(([href, label, icon]) => {
            const active = href === "/account" ? pathname === href : pathname.startsWith(href);
            return <Link key={href} href={href} className={active ? "active" : ""}><Icon name={icon}/><span>{label}</span></Link>;
          })}
        </nav>
        <Link href="/" className="account-signout"><span aria-hidden="true">↗</span> Sign out</Link>
      </aside>
      <main className="account-main">
        <div className="account-demo-note"><span>Demo preview</span> Connect authentication and QuitHero to show live customer information.</div>
        {children}
      </main>
    </div>
  );
}

export function PageHeading({ eyebrow, title, copy, action }: { eyebrow?: string; title: string; copy?: string; action?: React.ReactNode }) {
  return <header className="account-heading"><div>{eyebrow && <span>{eyebrow}</span>}<h1>{title}</h1>{copy && <p>{copy}</p>}</div>{action}</header>;
}
