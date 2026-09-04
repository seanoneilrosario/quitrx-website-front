"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { QuitHeroAddress, QuitHeroCustomer } from "@/lib/quithero-customers";
import { useAccountCustomer } from "@/hooks/useAccountCustomer";

function addressValue(customer: QuitHeroCustomer) {
  const address: QuitHeroAddress | undefined = customer.address ?? customer.addresses?.[0];
  return address?.line1 ?? address?.address1 ?? "";
}

export default function ProfileForm() {
  const router = useRouter();
  const { customer, loading, setCustomer } = useAccountCustomer();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!loading && !customer) router.replace("/account/login");
  }, [customer, loading, router]);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    setMessage("");
    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/account/me", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(Object.fromEntries(form)),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Unable to save your profile.");
      setCustomer((current) => ({ ...current, ...data }));
      setMessage("Your profile has been updated.");
      router.refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save your profile.");
    } finally {
      setPending(false);
    }
  }

  if (!customer) return <section className="account-card"><p className="account-load-message">Loading your profile...</p></section>;

  return <section className="account-card">
    <form className="account-form" onSubmit={saveProfile}>
      <label>First name<input name="firstName" defaultValue={customer.firstName ?? ""}/></label>
      <label>Last name<input name="lastName" defaultValue={customer.lastName ?? ""}/></label>
      <label>Email<input type="email" value={customer.email ?? ""} readOnly aria-readonly="true"/></label>
      <label>Mobile<input name="phone" type="tel" defaultValue={customer.phone ?? ""}/></label>
      <label className="full">Delivery address<input name="address1" defaultValue={addressValue(customer)}/></label>
      <div className="full">
        <button type="submit" className="account-button" disabled={pending}>{pending ? "Saving..." : "Save changes"}</button>
        {message && <p role="status">{message}</p>}
        {error && <p role="alert">{error}</p>}
      </div>
    </form>
  </section>;
}
