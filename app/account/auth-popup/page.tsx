"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function AuthPopupCompletePage() {
  useEffect(() => {
    if (!window.opener) return;

    window.opener.postMessage({ type: "quitrx:auth-success" }, window.location.origin);
    window.close();
  }, []);

  return (
    <main className="customer-login" role="status">
      <section className="customer-login__dialog">
        <div className="customer-login__brand" aria-label="QuitRx">Quit<span>Rx</span></div>
        <div className="customer-login__copy">
          <h1>Signed in</h1>
          <p>Your login was successful. You can close this window or continue to your account.</p>
        </div>
        <Link className="button customer-login__submit" href="/account">Continue to account</Link>
      </section>
    </main>
  );
}
