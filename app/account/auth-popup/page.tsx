"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AuthPopupCompletePage() {
  const router = useRouter();
  const [needsEmail, setNeedsEmail] = useState<boolean | null>(null);
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function checkSession() {
      try {
        const response = await fetch("/api/auth/session", { cache: "no-store" });
        if (!response.ok) throw new Error();

        const session = await response.json();
        setNeedsEmail(Boolean(session?.user?.needsCustomerEmail));
      } catch {
        setError("Unable to check your login.");
      }
    }

    void checkSession();
  }, []);

  useEffect(() => {
    if (needsEmail !== false) return;

    if (window.opener) {
      window.opener.postMessage(
        { type: "quitrx:auth-success" },
        window.location.origin,
      );

      window.close();
      return;
    }

    router.replace("/account");
    router.refresh();
  }, [needsEmail, router]);

  async function submitEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/account/link-facebook", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data?.error ?? "Unable to link your Facebook account.");
        return;
      }

      if (window.opener) {
        window.opener.postMessage({ type: "quitrx:auth-success" }, window.location.origin);
        window.close();
      } else {
        router.replace("/account");
        router.refresh();
      }
    } catch {
      setError("Unable to link your Facebook account.");
    } finally {
      setPending(false);
    }
  }

  if (needsEmail === null) {
    return (
      <main className="customer-login" role="status">
        <section className="customer-login__dialog">
          <Link className="customer-login__brand" href="/" aria-label="QuitRx homepage">Quit<span>Rx</span></Link>
          <div className="customer-login__copy">
            <h1>Signing in</h1>
            <p>{error || "Please wait..."}</p>
          </div>
        </section>
      </main>
    );
  }

  if (needsEmail) {
    return (
      <main className="customer-login" role="dialog" aria-modal="true">
        <section className="customer-login__dialog">
          <Link className="customer-login__brand" href="/" aria-label="QuitRx homepage">Quit<span>Rx</span></Link>
          <div className="customer-login__copy">
            <h1>Almost there</h1>
            <p>Enter your email address once to connect your Facebook account to your QuitRx customer account.</p>
          </div>
          <form onSubmit={submitEmail} className="customer-login__form">
            <label className="sr-only" htmlFor="facebook-link-email">Email address</label>
            <div className="customer-login__field">
              <input
                id="facebook-link-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="Email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoFocus
                disabled={pending}
              />
              <button type="submit" disabled={pending} aria-label="Connect Facebook account">
                {pending ? <span className="customer-login__spinner" /> : <span aria-hidden="true">→</span>}
              </button>
            </div>
            {error && <p className="customer-login__error" role="alert">{error}</p>}
          </form>
        </section>
      </main>
    );
  }

  return null;
}
