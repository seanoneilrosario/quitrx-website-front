"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState } from "react";
import { accessCustomerAccount, type CustomerAccessState } from "./actions";

const initialState: CustomerAccessState = {};

function GoogleLogo() {
  return (
    <svg className="social-logo" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.05H12v3.87h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.33 2.98-7.35Z" />
      <path fill="#34A853" d="M12 22c2.7 0 4.97-.9 6.62-2.42l-3.24-2.51c-.9.6-2.05.96-3.38.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.59A10 10 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.39 13.9A6.02 6.02 0 0 1 6.07 12c0-.66.11-1.3.32-1.9V7.51H3.04A10 10 0 0 0 2 12c0 1.61.38 3.14 1.04 4.49l3.35-2.59Z" />
      <path fill="#EA4335" d="M12 5.97c1.47 0 2.79.51 3.82 1.49l2.87-2.87A9.62 9.62 0 0 0 12 2a10 10 0 0 0-8.96 5.51l3.35 2.59C7.18 7.73 9.39 5.97 12 5.97Z" />
    </svg>
  );
}

function FacebookLogo() {
  return (
    <svg className="social-logo" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#1877F2" d="M24 12.07C24 5.41 18.63 0 12 0S0 5.41 0 12.07C0 18.1 4.39 23.09 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.7 4.53-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.09 24 18.1 24 12.07Z" />
      <path fill="#fff" d="m16.67 15.56.53-3.49h-3.33V9.81c0-.96.47-1.89 1.96-1.89h1.51V4.95s-1.37-.24-2.68-.24c-2.74 0-4.53 1.68-4.53 4.7v2.66H7.08v3.49h3.05V24a12.1 12.1 0 0 0 3.74 0v-8.44h2.8Z" />
    </svg>
  );
}

export default function LoginPopup({
  redirectTo,
  googleEnabled,
  facebookEnabled,
  loginError,
}: {
  redirectTo: string;
  googleEnabled: boolean;
  facebookEnabled: boolean;
  loginError?: string;
}) {
  const [state, action, pending] = useActionState(accessCustomerAccount, initialState);
  const displayedLoginError = state.error ?? loginError;

  return (
    <div className="customer-login" role="presentation">
      <Link className="customer-login__backdrop" href="/" aria-label="Close customer login" />
      <section
        className="customer-login__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="customer-login-title"
      >
        <Link className="customer-login__close" href="/" aria-label="Close customer login">
          <span aria-hidden="true">&times;</span>
        </Link>
        <Link className="customer-login__brand" href="/" aria-label="QuitRx homepage">
          <Image src="/images/quitrx-logo-light.png" width={174} height={71} alt="QuitRx" priority />
        </Link>

        <div className="customer-login__copy">
          <h1 id="customer-login-title">Sign in</h1>
          <p>Sign in to your account</p>
        </div>

        {displayedLoginError && (
          <p id="customer-login-error" className="customer-login__error" role="alert">
            {displayedLoginError}
          </p>
        )}

        <div className="customer-login__socials">
          {googleEnabled ? (
            // OAuth endpoints require a full browser navigation so the popup flow can receive redirects.
            // eslint-disable-next-line @next/next/no-html-link-for-pages
            <a
              href="/api/account/google"
              aria-label="Continue with Google"
            >
              <GoogleLogo />
            </a>
          ) : (
            <button
              type="button"
              disabled
              title="Configure Google OAuth credentials"
              aria-label="Continue with Google"
            >
              <GoogleLogo />
            </button>
          )}
          {facebookEnabled ? (
            // eslint-disable-next-line @next/next/no-html-link-for-pages
            <a
              href="/api/account/facebook"
              aria-label="Continue with Facebook"
            >
              <FacebookLogo />
            </a>
          ) : (
            <button
              type="button"
              disabled
              title="Configure Facebook OAuth credentials"
              aria-label="Continue with Facebook"
            >
              <FacebookLogo />
            </button>
          )}
        </div>

        <div className="customer-login__divider">
          <span>or</span>
        </div>

        <form action={action} className="customer-login__form">
            <input type="hidden" name="redirectTo" value={redirectTo} />
            {state.step === "code" ? (
              <>
                <input type="hidden" name="email" value={state.email} />
                <label htmlFor="customer-code">Confirmation code</label>
                <p className="customer-login__message">
                  {state.message ?? `Enter the code sent to ${state.email}.`}
                </p>
                <div className="customer-login__field">
                  <input
                    id="customer-code"
                    name="code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    placeholder="6-digit code"
                    required
                    autoFocus
                    aria-describedby={state.error ? "customer-login-error" : undefined}
                  />
                  <button
                    type="submit"
                    name="intent"
                    value="verify"
                    disabled={pending}
                    aria-label="Confirm email code"
                  >
                    {pending ? (
                      <span className="customer-login__spinner" />
                    ) : (
                      <span aria-hidden="true">&rarr;</span>
                    )}
                  </button>
                </div>
                <div className="customer-login__code-actions">
                  <button
                    type="submit"
                    name="intent"
                    value="request"
                    formNoValidate
                    disabled={pending}
                  >
                    Resend code
                  </button>
                  <button
                    type="submit"
                    name="intent"
                    value="reset"
                    formNoValidate
                    disabled={pending}
                  >
                    Change email
                  </button>
                </div>
              </>
            ) : (
              <>
                <label className="sr-only" htmlFor="customer-email">
                  Email address
                </label>
                <div className="customer-login__field">
                  <input
                    id="customer-email"
                    name="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="Email"
                    required
                    autoFocus
                    aria-describedby={state.error ? "customer-login-error" : "customer-login-help"}
                  />
                  <button
                    type="submit"
                    name="intent"
                    value="request"
                    disabled={pending}
                    aria-label="Send email confirmation code"
                  >
                    {pending ? (
                      <span className="customer-login__spinner" />
                    ) : (
                      <span aria-hidden="true">&rarr;</span>
                    )}
                  </button>
                </div>
              </>
            )}
        </form>

        <p id="customer-login-help" className="customer-login__note">
          Enter the email linked to your account. We will send your confirmation code by email.
        </p>
      </section>
    </div>
  );
}
