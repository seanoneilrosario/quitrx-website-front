"use client";

import { type FormEvent, useRef, useState } from "react";
import { startInvoicePayment } from "./actions";
import styles from "./invoice-payment.module.css";

function isEwayUrl(value: string): boolean {
  try {
    const url = new URL(value);

    return (
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      !url.port &&
      (url.hostname === "ewaypayments.com" || url.hostname.endsWith(".ewaypayments.com"))
    );
  } catch {
    return false;
  }
}

export default function PaymentButton({ token }: { token: string }) {
  const [isPending, setIsPending] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [error, setError] = useState("");

  const paymentLock = useRef(false);

  const cardNameRef = useRef<HTMLInputElement>(null);
  const cardNumberRef = useRef<HTMLInputElement>(null);
  const cardExpiryMonthRef = useRef<HTMLInputElement>(null);
  const cardExpiryYearRef = useRef<HTMLInputElement>(null);
  const cardCvnRef = useRef<HTMLInputElement>(null);

  function clearCardFields() {
    const fields = [cardNameRef, cardNumberRef, cardExpiryMonthRef, cardExpiryYearRef, cardCvnRef];

    for (const field of fields) {
      if (field.current) {
        field.current.value = "";
      }
    }
  }

  function submitEwayPayment(formActionUrl: string, accessCode: string) {
    if (!isEwayUrl(formActionUrl)) {
      throw new Error("Invalid payment destination.");
    }

    const fields = {
      EWAY_ACCESSCODE: accessCode,
      EWAY_PAYMENTTYPE: "Credit Card",

      EWAY_CARDNAME: cardNameRef.current?.value.trim() || "",

      EWAY_CARDNUMBER: cardNumberRef.current?.value.replace(/\D/g, "") || "",

      EWAY_CARDEXPIRYMONTH: cardExpiryMonthRef.current?.value.trim() || "",

      EWAY_CARDEXPIRYYEAR: cardExpiryYearRef.current?.value.trim() || "",

      EWAY_CARDCVN: cardCvnRef.current?.value.replace(/\D/g, "") || "",
    };

    const paymentForm = document.createElement("form");

    paymentForm.method = "POST";
    paymentForm.action = formActionUrl;
    paymentForm.target = "_self";
    paymentForm.style.display = "none";

    for (const [name, value] of Object.entries(fields)) {
      const input = document.createElement("input");

      input.type = "hidden";
      input.name = name;
      input.value = value;

      paymentForm.appendChild(input);
    }

    document.body.appendChild(paymentForm);

    try {
      clearCardFields();
      paymentForm.submit();
    } finally {
      paymentForm.remove();
    }
  }

  async function pay(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (paymentLock.current) return;

    const cardName = cardNameRef.current?.value.trim() || "";

    const cardNumber = cardNumberRef.current?.value.replace(/\D/g, "") || "";

    const expiryMonth = cardExpiryMonthRef.current?.value.trim() || "";

    const expiryYear = cardExpiryYearRef.current?.value.trim() || "";

    const cvn = cardCvnRef.current?.value.trim() || "";

    // Validate card fields before creating a payment session.
    if (
      !cardName ||
      !/^\d{12,19}$/.test(cardNumber) ||
      !/^(0[1-9]|1[0-2])$/.test(expiryMonth) ||
      !/^\d{2}$/.test(expiryYear) ||
      !/^\d{3,4}$/.test(cvn)
    ) {
      setError("Please check your card details.");
      return;
    }

    // Validate card expiry.
    const now = new Date();
    const fullYear = 2000 + Number(expiryYear);

    if (
      fullYear < now.getFullYear() ||
      (fullYear === now.getFullYear() && Number(expiryMonth) < now.getMonth() + 1)
    ) {
      setError("Your card has expired.");
      return;
    }

    paymentLock.current = true;

    setIsLocked(true);
    setIsPending(true);
    setError("");

    let redirecting = false;

    try {
      // Only the invoice token is sent to our server.
      const result = await startInvoicePayment(token);

      if (!result.success) {
        setError(result.message);
        return;
      }

      if (
        result.paymentMethod !== "eway" ||
        result.paymentType !== "TRANSPARENT_REDIRECT" ||
        !result.accessCode ||
        !isEwayUrl(result.formActionUrl)
      ) {
        throw new Error("Invalid payment session.");
      }

      setIsRedirecting(true);

      // Allow the loading interface to render.
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      );

      // Submit card details directly to Eway.
      submitEwayPayment(result.formActionUrl, result.accessCode);

      redirecting = true;
    } catch {
      setError(
        "Payment could not be completed. Please contact QuitRX support before attempting another payment.",
      );
    } finally {
      if (!redirecting) {
        clearCardFields();
        setIsPending(false);
        setIsRedirecting(false);

        // Do not automatically retry an uncertain session.
        // The backend reservation may already exist.
      }
    }
  }

  return (
    <div className={styles.paymentAction}>
      <form className={styles.cardPaymentForm} onSubmit={pay} method="post" autoComplete="on">
        <div className={styles.paymentHeading}>
          <h2>Pay by card</h2>

          <p>Pay securely using your credit or debit card.</p>
        </div>

        <fieldset className={styles.cardFieldset} disabled={isPending || isLocked}>
          <div className={styles.cardFields}>
            <label className={styles.cardFieldWide}>
              <span>Name on card</span>

              <input
                ref={cardNameRef}
                autoComplete="cc-name"
                placeholder="Cardholder name"
                maxLength={50}
                required
              />
            </label>

            <label className={styles.cardFieldWide}>
              <span>Card number</span>

              <input
                ref={cardNumberRef}
                autoComplete="cc-number"
                inputMode="numeric"
                placeholder="0000 0000 0000 0000"
                minLength={12}
                maxLength={23}
                pattern="[0-9 ]{12,23}"
                required
              />
            </label>

            <label>
              <span>Expiry month</span>

              <input
                ref={cardExpiryMonthRef}
                autoComplete="cc-exp-month"
                inputMode="numeric"
                placeholder="MM"
                minLength={2}
                maxLength={2}
                pattern="0[1-9]|1[0-2]"
                required
              />
            </label>

            <label>
              <span>Expiry year</span>

              <input
                ref={cardExpiryYearRef}
                autoComplete="cc-exp-year"
                inputMode="numeric"
                placeholder="YY"
                minLength={2}
                maxLength={2}
                pattern="[0-9]{2}"
                required
              />
            </label>

            <label className={styles.cardFieldWide}>
              <span>Security code (CVV)</span>

              <input
                ref={cardCvnRef}
                type="password"
                autoComplete="cc-csc"
                inputMode="numeric"
                placeholder="CVV"
                minLength={3}
                maxLength={4}
                pattern="[0-9]{3,4}"
                required
              />
            </label>
          </div>
        </fieldset>

        {error && (
          <p className={styles.actionError} role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          className={styles.payButton}
          disabled={isPending || isLocked}
          aria-busy={isPending}
        >
          {isRedirecting
            ? "Connecting to Eway..."
            : isPending
              ? "Preparing payment..."
              : "Pay Invoice Securely"}
        </button>

        <p className={styles.secureNote}>
          <span aria-hidden="true">&#128274;</span> Secure payment powered by Eway
        </p>

        <p className={styles.cardSecurityNote}>
          Your card details are submitted directly from your browser to Eway and are not sent to our
          application servers.
        </p>
      </form>
    </div>
  );
}
