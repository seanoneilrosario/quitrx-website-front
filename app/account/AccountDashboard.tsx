"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { QuitHeroAddress, QuitHeroCustomer } from "@/lib/quithero-customers";

function addressLines(customer: QuitHeroCustomer) {
  const address: QuitHeroAddress | undefined = customer.address ?? customer.addresses?.[0];
  if (!address) return [];
  return [
    address.line1 ?? address.address1,
    address.line2 ?? address.address2,
    [address.city, address.state ?? address.province, address.postcode ?? address.zip].filter(Boolean).join(" "),
    address.country,
  ].filter((line): line is string => Boolean(line));
}

function value(field: string | number | undefined) {
  return field === undefined || field === "" ? "Not available" : String(field);
}

function formatDate(date?: string) {
  if (!date) return "Not available";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return new Intl.DateTimeFormat("en-AU", { day: "2-digit", month: "short", year: "numeric" }).format(parsed);
}

export default function AccountDashboard() {
  const router = useRouter();
  const [customer, setCustomer] = useState<QuitHeroCustomer>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    const controller = new AbortController();
    async function loadCustomer() {
      try {
        const response = await fetch("/api/account/me", { cache: "no-store", signal: controller.signal });
        if (response.status === 401) return router.replace("/account/login");
        if (!response.ok) throw new Error("Customer request failed");
        setCustomer(await response.json() as QuitHeroCustomer);
      } catch (requestError) {
        if ((requestError as Error).name !== "AbortError") setError("Unable to load your account right now.");
      }
    }
    void loadCustomer();
    return () => controller.abort();
  }, [router]);

  if (error) return <section className="account-card"><p className="account-load-message">{error}</p></section>;
  if (!customer) return <section className="account-card"><p className="account-load-message">Loading your account...</p></section>;

  const fullName = [customer.firstName?.trim(), customer.lastName?.trim()].filter(Boolean).join(" ");
  const headerName = fullName || customer.email?.trim() || "Customer";
  const addresses = addressLines(customer);
  const hasActiveScriptTag = customer.tags?.some(
    (tag) => tag.trim().toLowerCase() === "scriptactive",
  ) ?? false;
  const scriptIsActive = customer.scriptActive === true || hasActiveScriptTag;

  if (customer.consultPurchase !== true) {
    return <>
      <header className="account-overview__header"><h1>{customer.firstName?.trim() || headerName}</h1></header>
      <section className="account-assessment-card">
        <div className="account-assessment-card__heading">
          <span className="account-assessment-card__icon" aria-hidden="true">
            <svg viewBox="0 0 48 48"><path d="m17 15 14 8-10 18a4 4 0 0 1-5.5 1.5l-7-4a4 4 0 0 1-1.5-5.5l10-18Z"/><path d="m21 17 5-9 9 5-5 9M29 10l4-7 6 3.5-4 7"/></svg>
          </span>
          <h2>Start Online Assessment</h2>
        </div>
        <p className="account-assessment-card__copy">Complete your assessment in just 2 minutes to get your free prescription.</p>
        <Link href="/intake-form" className="account-assessment-card__button">Start Assessment</Link>
        <p className="account-assessment-card__disclaimer">
          This assessment is not for nicotine pouch prescriptions. In accordance with the TGA&apos;s advertising requirements for therapeutic vaping goods, we cannot publicly advertise or describe certain treatment options.
        </p>
      </section>
    </>;
  }

  return <>
    <header className="account-overview__header"><h1>{headerName}</h1></header>
    <section className="account-overview__grid">
      <article className="account-panel account-panel--overview">
        <div className="account-panel__heading"><div className="account-panel__icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12v18H6z"/><path d="M9 8h6M9 12h6M9 16h3"/></svg></div><h2>Script<br/>Overview</h2></div>
        <div className="account-panel__content">
          <p className={scriptIsActive ? "account-script-status active" : "account-script-status"}>{scriptIsActive ? "Active" : "Inactive"}</p>
          <p><strong>Expiry Date:</strong> {formatDate(customer.scriptExpiry)}</p>
        </div>
        <Link href="/account/prescriptions" className="account-button account-button--primary account-button--compact">Renew for free</Link>
      </article>

      <article className="account-panel account-panel--address">
        <div className="account-panel__heading"><div className="account-panel__icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s6-5.5 6-11a6 6 0 1 0-12 0c0 5.5 6 11 6 11Z"/><circle cx="12" cy="10" r="2.5"/></svg></div><h2>Your<br/>Address</h2></div>
        <div className="account-panel__content account-address-block">
          <strong>{fullName || customer.email?.trim() || "Customer"}</strong>
          {addresses.length ? addresses.map((line) => <span key={line}>{line}</span>) : <span>Address not available</span>}
          <span>{value(customer.email)}</span>
          <span>{value(customer.phone)}</span>
        </div>
        <Link href="/account/profile" className="account-panel__text-link">View addresses</Link>
      </article>

      <article className="account-panel account-panel--orders">
        <div className="account-panel__heading"><div className="account-panel__icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l-1 13H6L5 8Z"/><path d="M9 10V6a3 3 0 0 1 6 0v4"/></svg></div><h2>Orders</h2></div>
        <div className="account-panel__content"><p><strong>{customer.numberOfOrders ?? 0}</strong> Orders</p>{customer.totalSpent !== undefined && <p>{`${customer.currencyCode ?? ""} ${customer.totalSpent}`.trim()} total spent</p>}</div>
        <Link href="/account/orders" className="account-button account-button--primary account-button--compact">View Orders</Link>
      </article>
    </section>

    <section className="account-order-history">
      <div className="account-order-history__header"><span className="account-order-history__icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M6 3h12v18H6z"/><path d="M9 8h6M9 12h6M9 16h3"/></svg></span><h2>Order History</h2></div>
      <div className="account-order-table">
        <div className="account-order-table__row account-order-table__head"><span>Order Number</span><span>Date</span><span>Fulfillment Status</span></div>
        <div className="account-order-table__empty">Order details are not available from the customer response.</div>
      </div>
    </section>
    {hasActiveScriptTag && (
      <section className="account-banner">
        <div className="account-banner__content">
          <span className="account-banner__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M6 3h12v18H6z"/><path d="M9 8h6M9 12h6M9 16h3"/></svg>
          </span>
          <div>
            <h3>Need an eScript?</h3>
            <p>Get a $49 eScript to use at your local pharmacy.</p>
          </div>
        </div>
        <Link href="/request-script" className="account-button account-button--banner">Get eScript</Link>
      </section>
    )}
  </>;
}
