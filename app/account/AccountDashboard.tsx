"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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

  const firstName = customer.firstName ?? "Customer";
  const fullName = [customer.firstName, customer.lastName].filter(Boolean).join(" ") || "Customer";
  const addresses = addressLines(customer);

  return <>
    <header className="account-overview__header"><h1>{firstName}</h1></header>
    <section className="account-overview__grid">
      <article className="account-panel"><div className="account-panel__content"><h2>Account profile</h2><p>{fullName}</p><p>{value(customer.email)}</p><p>{value(customer.phone)}</p></div></article>
      <article className="account-panel"><div className="account-panel__content"><h2>Address</h2><div className="account-address-block">{addresses.length ? addresses.map((line) => <span key={line}>{line}</span>) : <span>Not available</span>}</div></div></article>
      <article className="account-panel"><div className="account-panel__content"><h2>Orders</h2><p>{value(customer.numberOfOrders)} total orders</p><p>{customer.totalSpent === undefined ? "Not available" : `${customer.currencyCode ?? ""} ${customer.totalSpent}`.trim()}</p></div></article>
    </section>
    <section className="account-card account-profile-details">
      <h2>Customer information</h2>
      <dl>
        <div><dt>First name</dt><dd>{value(customer.firstName)}</dd></div>
        <div><dt>Last name</dt><dd>{value(customer.lastName)}</dd></div>
        <div><dt>Email</dt><dd>{value(customer.email)}</dd></div>
        <div><dt>Phone</dt><dd>{value(customer.phone)}</dd></div>
        <div><dt>Customer ID</dt><dd>{value(customer.id)}</dd></div>
        <div><dt>Account state</dt><dd>{value(customer.state)}</dd></div>
      </dl>
    </section>
  </>;
}
