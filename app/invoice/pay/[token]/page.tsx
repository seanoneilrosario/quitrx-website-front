import type { Metadata } from "next";

import {
  getPublicInvoice,
  PublicInvoiceError,
  type PublicInvoice,
} from "@/lib/invoices/public-client";

import PaymentButton from "./payment-button";
import styles from "./invoice-payment.module.css";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export const metadata: Metadata = {
  title: "Invoice payment",
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nocache: true,
  },
  referrer: "no-referrer",
};

function money(value: string | number | null | undefined, currencyCode: string) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  const amount = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(amount)) {
    return "—";
  }

  try {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: currencyCode || "AUD",
    }).format(amount);
  } catch {
    return "—";
  }
}

function date(value: string) {
  const parsed = new Date(value);

  return Number.isNaN(parsed.valueOf())
    ? "—"
    : new Intl.DateTimeFormat("en-AU", {
        dateStyle: "long",
      }).format(parsed);
}

function Brand() {
  return (
    <div className={styles.brand} aria-label="QuitRX">
      <span aria-hidden="true">Q</span>
      <strong>QuitRX</strong>
    </div>
  );
}


function getPaymentStatusLabel(invoice: PublicInvoice) {
  if (invoice.isPaid) {
    return "PAID";
  }

  if (invoice.paymentSessionStatus === "RECONCILIATION_REQUIRED") {
    return "REVIEW REQUIRED";
  }

  if (invoice.hasExistingPaymentAttempt) {
    return "PAYMENT PENDING";
  }

  if (invoice.orderStatus === "CANCELLED") {
    return "CANCELLED";
  }

  if (invoice.noPaymentRequired) {
    return "NO PAYMENT REQUIRED";
  }

  if (invoice.requiresPayment) {
    return "UNPAID";
  }

  return invoice.paymentStatus.replaceAll("_", " ");
}


function InvoiceDetails({ invoice }: { invoice: PublicInvoice }) {
  const rows = [
    ["Subtotal", invoice.subtotal],
    ["Discount", invoice.discountTotal],
    ["Shipping fee", invoice.shippingTotal],
    ["GST", invoice.taxTotal],
  ] as const;

  const statusLabel = getPaymentStatusLabel(invoice);

 
const statusClass = invoice.isPaid
  ? "statusPAID"
  : invoice.hasExistingPaymentAttempt || invoice.paymentSessionStatus === "RECONCILIATION_REQUIRED"
    ? "statusPENDING"
    : invoice.orderStatus === "CANCELLED"
      ? "statusCANCELLED"
      : invoice.noPaymentRequired
        ? "statusPAID"
        : invoice.requiresPayment
          ? "statusUNPAID"
          : `status${invoice.paymentStatus.replaceAll("_", "")}`;


  const amountPaid = invoice.isPaid ? invoice.total : null;

  return (
    <>
      <div className={styles.invoiceMeta}>
        <div>
          <span>Invoice number</span>
          <strong>{invoice.invoiceNumber}</strong>
        </div>

        <div>
          <span>Order number</span>
          <strong>{invoice.orderNumber}</strong>
        </div>

        <div>
          <span>Order date</span>
          <strong>{date(invoice.createdAt)}</strong>
        </div>

        <div>
          <span>Payment status</span>

          <strong className={`${styles.status} ${styles[statusClass] ?? ""}`}>{statusLabel}</strong>
        </div>
      </div>

      <div className={styles.amounts}>
        {rows.map(([label, value]) => (
          <div key={label}>
            <span>{label}</span>
            <strong>{money(value, invoice.currency)}</strong>
          </div>
        ))}

        <div className={styles.total}>
          <span>Total amount</span>

          <strong>{money(invoice.total, invoice.currency)}</strong>
        </div>

        {invoice.isPaid && (
          <div>
            <span>Amount already paid</span>

            <strong>{money(amountPaid, invoice.currency)}</strong>
          </div>
        )}

        <div className={styles.outstanding}>
          <span>Outstanding balance</span>

          <strong>{money(invoice.amountDue, invoice.currency)}</strong>
        </div>
      </div>
    </>
  );
}

export default async function InvoicePaymentPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  let invoice: PublicInvoice;

  try {
    invoice = await getPublicInvoice(token);
  } catch (error) {
    const message =
      error instanceof PublicInvoiceError
        ? error.message
        : "We could not load this invoice. Please try again shortly.";

    return (
      <main className={styles.page}>
        <section className={styles.errorCard}>
          <Brand />

          <div className={styles.errorIcon} aria-hidden="true">
            !
          </div>

          <h1>Invoice unavailable</h1>

          <p>{message}</p>

          <p>Please use the latest link from your invoice email or contact QuitRX support.</p>
        </section>
      </main>
    );
  }


const isPaid = invoice.isPaid;

const isCancelled = invoice.orderStatus === "CANCELLED";

const requiresReview = !isPaid && invoice.paymentSessionStatus === "RECONCILIATION_REQUIRED";

const isPending = !isPaid && !requiresReview && invoice.hasExistingPaymentAttempt;

const noPaymentRequired =
  invoice.noPaymentRequired &&
  !isPaid &&
  !isCancelled &&
  !requiresReview &&
  !isPending &&
  !invoice.requiresPayment &&
  !invoice.canPay &&
  invoice.amountDue === 0;

const canPay =
  invoice.canPay &&
  invoice.requiresPayment &&
  !isPaid &&
  !isCancelled &&
  !noPaymentRequired &&
  !requiresReview &&
  !invoice.hasExistingPaymentAttempt;

const isUnavailable =
  !canPay && !isPaid && !isPending && !requiresReview && !isCancelled && !noPaymentRequired;


  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <Brand />
          <span>Secure invoice payment</span>
        </header>

        <section className={styles.card}>
          <div className={styles.heading}>
            <div>
              <p>Invoice</p>
              <h1>Payment details</h1>
            </div>

            <span className={styles.currency}>{invoice.currency}</span>
          </div>

          <InvoiceDetails invoice={invoice} />

          {isPaid && (
            <div className={styles.success} role="status">
              <strong>Payment complete</strong>

              <span>This invoice has been paid in full. No further payment is required.</span>
            </div>
          )}

          {noPaymentRequired && (
            <div className={styles.success} role="status">
              <strong>No payment required</strong>

              <span>This invoice has no outstanding balance. No further payment is required.</span>
            </div>
          )}

          {requiresReview && (
            <div className={styles.pending} role="status">
              <strong>Payment requires verification</strong>

              <span>
                We could not confirm the payment yet. Please contact QuitRX support before
                attempting another payment.
              </span>
            </div>
          )}

          {isPending && (
            <div className={styles.pending} role="status">
              <strong>Payment attempt in progress</strong>

              <span>
                A payment session already exists for this invoice. Please do not submit another
                payment. Contact QuitRX support if you need assistance.
              </span>
            </div>
          )}

          {isCancelled && !isPaid && !requiresReview && !isPending && (
            <div className={styles.pending} role="status">
              <strong>Order cancelled</strong>

              <span>This order has been cancelled and is no longer eligible for payment.</span>
            </div>
          )}

          {canPay && <PaymentButton token={token} />}

          {isUnavailable && (
            <div className={styles.pending} role="status">
              <strong>Payment is currently unavailable</strong>

              <span>Please contact QuitRX support before attempting a payment.</span>
            </div>
          )}
        </section>

        <footer className={styles.support}>
          <strong>Need help with this invoice?</strong>

          <span>Please contact QuitRX support for assistance with your invoice or payment.</span>
        </footer>
      </div>
    </main>
  );
}
