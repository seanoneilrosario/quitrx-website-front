"use client";

import { useRef, useState } from "react";
import { startInvoicePayment } from "./actions";
import styles from "./invoice-payment.module.css";

export default function PaymentButton({ token }: { token: string }) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");

  const paymentLock = useRef(false);

  async function pay() {
    if (paymentLock.current) return;

    paymentLock.current = true;

    setIsPending(true);
    setError("");

    let redirecting = false;

    try {
      const result = await startInvoicePayment(token);

      if (!result.success) {
        setError(result.message);
        return;
      }

      window.location.assign(result.redirectUrl);

      redirecting = true;
    } catch {
      setError(
        "Payment could not be started. Please contact QuitRX support before attempting another payment.",
      );
    } finally {
      if (!redirecting) {
        paymentLock.current = false;
        setIsPending(false);
      }
    }
  }

  return (
    <div className={styles.paymentAction}>
      <button
        type="button"
        className={styles.payButton}
        disabled={isPending}
        aria-busy={isPending}
        onClick={pay}
      >
        {isPending ? "Connecting securely..." : "Pay Invoice Securely"}
      </button>

      <p className={styles.secureNote}>
        <span aria-hidden="true">&#128274;</span> Secure payment powered by Eway
      </p>

      {error && (
        <p className={styles.actionError} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
