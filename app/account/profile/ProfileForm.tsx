"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { QuitHeroAddress } from "@/lib/quithero-customers";
import { useAccountCustomer } from "@/hooks/useAccountCustomer";

function AddressFields({ address }: { address?: QuitHeroAddress }) {
  return <>
    <label className="full">Address<input name="address1" autoComplete="address-line1" defaultValue={address?.address1 ?? address?.line1 ?? ""} required/></label>
    <label className="full">Apartment, suite, etc.<input name="address2" autoComplete="address-line2" defaultValue={address?.address2 ?? address?.line2 ?? ""}/></label>
    <label>Suburb / city<input name="city" autoComplete="address-level2" defaultValue={address?.city ?? ""} required/></label>
    <label>State<input name="state" autoComplete="address-level1" defaultValue={address?.state ?? address?.province ?? ""} required/></label>
    <label>Postcode<input name="postcode" autoComplete="postal-code" defaultValue={address?.postcode ?? address?.zip ?? ""} required/></label>
    <label>Country<input name="country" autoComplete="country-name" defaultValue={address?.country ?? "Australia"} required/></label>
  </>;
}

function addressLines(address: QuitHeroAddress) {
  return [
    address.address1 ?? address.line1,
    address.address2 ?? address.line2,
    [address.city, address.state ?? address.province, address.postcode ?? address.zip].filter(Boolean).join(" "),
    address.country,
  ].filter(Boolean);
}

export default function ProfileForm() {
  const router = useRouter();
  const { customer, loading, error: accountError, refreshCustomer } = useAccountCustomer();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string>();

  useEffect(() => {
    if (!loading && !customer && !accountError) router.replace("/account/login");
  }, [accountError, customer, loading, router]);

  async function request(url: string, method: "POST" | "PATCH", body?: object) {
    const response = await fetch(url, {
      method,
      headers: body ? { "content-type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data?.error || "Unable to update your account.");
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending("profile"); setError(""); setMessage("");
    try {
      await request("/api/account/me", "PATCH", Object.fromEntries(new FormData(event.currentTarget)));
      await refreshCustomer();
      setMessage("Your profile has been updated.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save your profile.");
    } finally { setPending(""); }
  }

  async function saveAddress(event: FormEvent<HTMLFormElement>, addressId?: string) {
    event.preventDefault();
    setPending(addressId ? `edit-${addressId}` : "add"); setError(""); setMessage("");
    try {
      await request(addressId ? `/api/account/addresses/${encodeURIComponent(addressId)}` : "/api/account/addresses", addressId ? "PATCH" : "POST", Object.fromEntries(new FormData(event.currentTarget)));
      await refreshCustomer();
      setAdding(false); setEditingId(undefined);
      setMessage(addressId ? "Address updated." : "Address added.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save the address.");
    } finally { setPending(""); }
  }

  async function setDefault(addressId: string) {
    setPending(`default-${addressId}`); setError(""); setMessage("");
    try {
      await request(`/api/account/addresses/${encodeURIComponent(addressId)}/default`, "PATCH");
      await refreshCustomer();
      setMessage("Default address updated.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to set the default address.");
    } finally { setPending(""); }
  }

  if (accountError) return <section className="account-card"><p className="account-load-message">{accountError}</p></section>;
  if (!customer) return <section className="account-card"><p className="account-load-message">Loading your profile...</p></section>;
  const addresses = customer.addresses?.length ? customer.addresses : customer.address ? [customer.address] : [];

  return <div className="account-profile-sections">
    <section className="account-card">
      <form className="account-form" onSubmit={saveProfile}>
        <label>First name<input name="firstName" defaultValue={customer.firstName ?? ""}/></label>
        <label>Last name<input name="lastName" defaultValue={customer.lastName ?? ""}/></label>
        <label>Email<input type="email" value={customer.email ?? ""} readOnly aria-readonly="true"/></label>
        <label>Mobile<input name="phone" type="tel" defaultValue={customer.phone ?? ""}/></label>
        <div className="full"><button type="submit" className="account-button" disabled={Boolean(pending)}>{pending === "profile" ? "Saving..." : "Save changes"}</button></div>
      </form>
    </section>

    <section className="account-card account-addresses">
      <div className="account-addresses__heading"><h2>Delivery addresses</h2><button type="button" className="account-button" onClick={() => { setAdding(true); setEditingId(undefined); }} disabled={Boolean(pending) || adding}>Add address</button></div>
      {message && <p role="status" className="account-form-message">{message}</p>}
      {error && <p role="alert" className="account-form-error">{error}</p>}

      {adding && <form className="account-form account-address-form" onSubmit={(event) => saveAddress(event)}>
        <AddressFields />
        <div className="full account-form-actions"><button type="submit" className="account-button" disabled={Boolean(pending)}>{pending === "add" ? "Adding..." : "Add address"}</button><button type="button" className="text-button" onClick={() => setAdding(false)} disabled={Boolean(pending)}>Cancel</button></div>
      </form>}

      <div className="account-address-list">
        {addresses.length === 0 && !adding && <p className="muted">No delivery addresses saved yet.</p>}
        {addresses.map((address, index) => {
          const addressId = address.id ?? address.addressId;
          const editing = Boolean(addressId && editingId === addressId);
          return <article className={`account-address${address.isDefault ? " account-address--default" : ""}`} key={addressId ?? index}>
            <div className="account-address__summary">
              <div>{address.isDefault && <span className="status">Default</span>}{addressLines(address).map((line) => <span key={line}>{line}</span>)}</div>
              {addressId && <div className="account-address__actions"><button type="button" className="text-button" onClick={() => { setEditingId(editing ? undefined : addressId); setAdding(false); }} disabled={Boolean(pending)}>{editing ? "Cancel" : "Edit"}</button>{!address.isDefault && <button type="button" className="text-button" onClick={() => setDefault(addressId)} disabled={Boolean(pending)}>{pending === `default-${addressId}` ? "Setting..." : "Set as default"}</button>}</div>}
            </div>
            {editing && <form className="account-form account-address-form" onSubmit={(event) => saveAddress(event, addressId)}><AddressFields address={address}/><div className="full"><button type="submit" className="account-button" disabled={Boolean(pending)}>{pending === `edit-${addressId}` ? "Saving..." : "Save address"}</button></div></form>}
          </article>;
        })}
      </div>
    </section>
  </div>;
}
