"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  accessCustomerAccount,
  registerCustomerAccount,
  type CustomerAccessState,
} from "./actions";

const initialState: CustomerAccessState = {};

export default function LoginPopup() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loginState, loginAction, loginPending] = useActionState(accessCustomerAccount, initialState);
  const [registerState, registerAction, registerPending] = useActionState(registerCustomerAccount, initialState);
  const registering = mode === "register";
  const state = registering ? registerState : loginState;
  const pending = registering ? registerPending : loginPending;

  return (
    <div className="customer-login" role="presentation">
      <Link className="customer-login__backdrop" href="/" aria-label="Close customer access" />
      <section className="customer-login__dialog" role="dialog" aria-modal="true" aria-labelledby="customer-login-title">
        <Link className="customer-login__close" href="/" aria-label="Close customer access"><span aria-hidden="true">&times;</span></Link>
        <div className="customer-login__brand" aria-label="QuitRx">Quit<span>Rx</span></div>

        <div className="customer-login__tabs" aria-label="Customer access options">
          <button type="button" className={!registering ? "active" : ""} onClick={() => setMode("login")}>Login</button>
          <button type="button" className={registering ? "active" : ""} onClick={() => setMode("register")}>Register</button>
        </div>

        <div className="customer-login__copy">
          <span className="account-kicker">{registering ? "Create account" : "Welcome back"}</span>
          <h1 id="customer-login-title">{registering ? "Register with QuitRX" : "Access your account"}</h1>
          <p>{registering ? "Only your email is needed to register." : "Enter your email to find your QuitRX customer account."}</p>
        </div>

        <form action={registering ? registerAction : loginAction} className="customer-login__form">
          <label htmlFor="customer-email">Email address</label>
          <div className="customer-login__field">
            <input id="customer-email" name="email" type="email" inputMode="email" autoComplete="email" placeholder="you@example.com" required autoFocus aria-describedby={state.error ? "customer-login-error" : undefined} />
            <button type="submit" disabled={pending} aria-label={registering ? "Register" : "Continue"}>
              {pending ? <span className="customer-login__spinner" /> : <span aria-hidden="true">&rarr;</span>}
            </button>
          </div>
          {state.error && <p id="customer-login-error" className="customer-login__error" role="alert">{state.error}</p>}
          <button className="account-button customer-login__submit" type="submit" disabled={pending}>
            {pending ? (registering ? "Registering..." : "Checking account...") : (registering ? "Register" : "Continue")}
          </button>
        </form>
        <p className="customer-login__note">Registration creates a QuitHero customer using only the email entered above.</p>
      </section>
    </div>
  );
}
