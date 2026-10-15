"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";

export default function FacebookLinkForm({ email }: { email: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function connect(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/account/link-facebook", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Unable to connect your Facebook account.");
      }
      window.location.replace("/account");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to connect your Facebook account.");
      setPending(false);
    }
  }
  return (
    <div className="customer-login">
      <section className="customer-login__dialog" aria-labelledby="facebook-link-title">
        <div className="customer-login__copy">
          <h1 id="facebook-link-title">Connect Facebook</h1>
          <p>Connect your Facebook login to your verified account: {email}</p>
        </div>
        <form onSubmit={connect} className="customer-login__form">
          <button className="customer-login__local-button" type="submit" disabled={pending}>
            {pending ? "Connecting…" : "Connect Facebook account"}
          </button>
          {error && (
            <p className="customer-login__error" role="alert">
              {error}
            </p>
          )}
        </form>
        <Link href="/account">Continue without linking</Link>
      </section>
    </div>
  );
}
