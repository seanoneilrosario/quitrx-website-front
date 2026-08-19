"use client";

import Link from "next/link";
import { useActionState } from "react";
import { accessCustomerAccount, type CustomerAccessState } from "./actions";

const initialState: CustomerAccessState = {};

export default function LoginPopup({ socialLoginUrl }: { socialLoginUrl?: string }) {
  const [state, action, pending] = useActionState(accessCustomerAccount, initialState);

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
          {socialLoginUrl ? <a href={socialLoginUrl} aria-label="Continue with Google"><span className="google-mark">G</span></a> : <button type="button" disabled title="Configure SHOPIFY_CUSTOMER_LOGIN_URL"><span className="google-mark">G</span></button>}
          {socialLoginUrl ? <a href={socialLoginUrl} aria-label="Continue with Facebook"><span className="facebook-mark">f</span></a> : <button type="button" disabled title="Configure SHOPIFY_CUSTOMER_LOGIN_URL"><span className="facebook-mark">f</span></button>}
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
