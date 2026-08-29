"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { accessCustomerAccount, type CustomerAccessState } from "./actions";

const initialState: CustomerAccessState = {};

export default function LoginPopup({ googleEnabled, facebookEnabled }: { googleEnabled: boolean; facebookEnabled: boolean }) {
  const [state, action, pending] = useActionState(accessCustomerAccount, initialState);
  const router = useRouter();

  useEffect(() => {
    console.log("[OAuth Debug] login page mounted", {
      pathname: window.location.pathname,
      origin: window.location.origin,
    });

    const handleAuthSuccess = (event: MessageEvent) => {
      console.log("[OAuth Debug] message received", {
        origin: event.origin,
        type: event.data?.type,
      });

      if (
        event.origin !== window.location.origin ||
        event.data?.type !== "quitrx:auth-success"
      ) {
        return;
      }

      console.log("[OAuth Debug] auth success -> /account");

      router.replace("/account");
      router.refresh();
    };

    window.addEventListener("message", handleAuthSuccess);

    return () =>
      window.removeEventListener("message", handleAuthSuccess);
  }, [router]);

  const openSocialPopup = (
    event: React.MouseEvent<HTMLAnchorElement>,
    provider: "google" | "facebook",
  ) => {
    console.log("[OAuth Debug] clicked", {
      provider,
      href: event.currentTarget.href,
      origin: window.location.origin,
    });

    const width = 730;
    const height = 760;
    const left = Math.max(
      0,
      window.screenX + (window.outerWidth - width) / 2,
    );
    const top = Math.max(
      0,
      window.screenY + (window.outerHeight - height) / 2,
    );

    const popup = window.open(
      event.currentTarget.href,
      `quitrx-${provider}-login`,
      `popup=yes,width=${width},height=${height},left=${left},top=${top}`,
    );

    console.log("[OAuth Debug] popup result", {
      provider,
      popupOpened: Boolean(popup),
    });

    if (popup) {
      event.preventDefault();
      popup.focus();
    }
  };

  return (
    <div className="customer-login" role="presentation">
      <Link className="customer-login__backdrop" href="/" aria-label="Close customer login" />
      <section className="customer-login__dialog" role="dialog" aria-modal="true" aria-labelledby="customer-login-title">
        <Link className="customer-login__close" href="/" aria-label="Close customer login"><span aria-hidden="true">&times;</span></Link>
        <div className="customer-login__brand" aria-label="QuitRx">Quit<span>Rx</span></div>

        <div className="customer-login__copy">
          <h1 id="customer-login-title">Sign in</h1>
          <p>Sign in or create an account</p>
        </div>

        <div className="customer-login__socials">
          {googleEnabled ? (
            <a href="/api/account/google" onClick={(event) => openSocialPopup(event, "google")} aria-label="Continue with Google"><span className="google-mark">G</span></a>
          ) : (
            <button type="button" disabled title="Configure Google OAuth credentials" aria-label="Continue with Google"><span className="google-mark">G</span></button>
          )}
          {facebookEnabled ? (
            <a href="/api/account/facebook" onClick={(event) => openSocialPopup(event, "facebook")} aria-label="Continue with Facebook"><span className="facebook-mark">f</span></a>
          ) : (
            <button type="button" disabled title="Configure Facebook OAuth credentials" aria-label="Continue with Facebook"><span className="facebook-mark">f</span></button>
          )}
        </div>

        <div className="customer-login__divider"><span>or</span></div>

        <form action={action} className="customer-login__form">
          <label className="sr-only" htmlFor="customer-email">Email address</label>
          <div className="customer-login__field">
            <input id="customer-email" name="email" type="email" inputMode="email" autoComplete="email" placeholder="Email" required autoFocus aria-describedby={state.error ? "customer-login-error" : "customer-login-help"} />
            <button type="submit" disabled={pending} aria-label="Continue with email">
              {pending ? <span className="customer-login__spinner" /> : <span aria-hidden="true">&rarr;</span>}
            </button>
          </div>
          {state.error && <p id="customer-login-error" className="customer-login__error" role="alert">{state.error}</p>}
        </form>

        <p id="customer-login-help" className="customer-login__note">
          Customers can sign in using Google, Facebook, or email. If an email account does not exist, it is automatically added to the customer database.
        </p>
      </section>
    </div>
  );
}
