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
    const handleAuthSuccess = (event: MessageEvent) => {
      if (
        event.origin !== window.location.origin ||
        event.data?.type !== "quitrx:auth-success"
      ) {
        return;
      }

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
        <Link className="customer-login__brand" href="/" aria-label="QuitRx homepage">Quit<span>Rx</span></Link>

        <div className="customer-login__copy">
          <h1 id="customer-login-title">Sign in</h1>
          <p>Sign in or create an account</p>
        </div>

        <div className="customer-login__socials">
          {googleEnabled ? (
            // OAuth endpoints require a full browser navigation so the popup flow can receive redirects.
            // eslint-disable-next-line @next/next/no-html-link-for-pages
            <a href="/api/account/google" onClick={(event) => openSocialPopup(event, "google")} aria-label="Continue with Google"><span className="google-mark">G</span></a>
          ) : (
            <button type="button" disabled title="Configure Google OAuth credentials" aria-label="Continue with Google"><span className="google-mark">G</span></button>
          )}
          {facebookEnabled ? (
            // eslint-disable-next-line @next/next/no-html-link-for-pages
            <a href="/api/account/facebook" onClick={(event) => openSocialPopup(event, "facebook")} aria-label="Continue with Facebook"><span className="facebook-mark">f</span></a>
          ) : (
            <button type="button" disabled title="Configure Facebook OAuth credentials" aria-label="Continue with Facebook"><span className="facebook-mark">f</span></button>
          )}
        </div>

        <div className="customer-login__divider"><span>or</span></div>

        <form action={action} className="customer-login__form">
          {state.step === "code" ? (
            <>
              <input type="hidden" name="email" value={state.email} />
              <input type="hidden" name="phone" value={state.phone} />
              <label htmlFor="customer-code">Confirmation code</label>
              <p className="customer-login__message">{state.message ?? "Enter the SMS code sent to the mobile number on your account."}</p>
              <div className="customer-login__field">
                <input id="customer-code" name="code" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} placeholder="6-digit code" required autoFocus aria-describedby={state.error ? "customer-login-error" : undefined} />
                <button type="submit" name="intent" value="verify" disabled={pending} aria-label="Confirm SMS code">
                  {pending ? <span className="customer-login__spinner" /> : <span aria-hidden="true">&rarr;</span>}
                </button>
              </div>
              <div className="customer-login__code-actions">
                <button type="submit" name="intent" value="request" formNoValidate disabled={pending}>Resend code</button>
                <button type="submit" name="intent" value="reset" formNoValidate disabled={pending}>Change details</button>
              </div>
            </>
          ) : (
            <>
              <label className="sr-only" htmlFor="customer-email">Email address</label>
              <div className="customer-login__field">
                <input id="customer-email" name="email" type="email" inputMode="email" autoComplete="email" placeholder="Email" required autoFocus aria-describedby={state.error ? "customer-login-error" : "customer-login-help"} />
              </div>
              <label className="sr-only" htmlFor="customer-phone">Australian mobile number</label>
              <div className="customer-login__field">
                <input id="customer-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="Australian mobile (0412 345 678)" pattern="(?:\+?61|0)4[\s-]?\d{2}[\s-]?\d{3}[\s-]?\d{3}" required aria-describedby={state.error ? "customer-login-error" : "customer-login-help"} />
                <button type="submit" name="intent" value="request" disabled={pending} aria-label="Send SMS confirmation code">
                  {pending ? <span className="customer-login__spinner" /> : <span aria-hidden="true">&rarr;</span>}
                </button>
              </div>
            </>
          )}
          {state.error && <p id="customer-login-error" className="customer-login__error" role="alert">{state.error}</p>}
        </form>

        <p id="customer-login-help" className="customer-login__note">
          Enter the email and Australian mobile number linked to your account. We will send your confirmation code by SMS.
        </p>
      </section>
    </div>
  );
}
