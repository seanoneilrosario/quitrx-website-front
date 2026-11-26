import type { Metadata } from "next";
import "./page-result.css";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Payment result | QuitRX",
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nocache: true,
  },
  referrer: "no-referrer",
};

export default async function PaymentResultPage({
  searchParams,
}: {
  searchParams: Promise<{
    payment?: string;
  }>;
}) {
  const { payment } = await searchParams;

  const isSuccess = payment === "success";
  const isPending = payment === "pending";

  const title = isSuccess
    ? "Payment submitted"
    : isPending
      ? "Payment pending"
      : "Payment status unavailable";

  const description = isSuccess
    ? "Please open your original invoice link to confirm your payment status."
    : isPending
      ? "Your payment has not been confirmed. Please do not submit another payment until QuitRX has verified your transaction."
      : "We could not determine your payment status. Please check your original invoice link or contact QuitRX support.";

  return (
    <main className="invoice-result-page">
      <div className="invoice-result-shell">
        <header className="invoice-result-header">
          <div className="invoice-result-brand">
            <span aria-hidden="true">Q</span>
            <strong>QuitRX</strong>
          </div>

          <span>Secure invoice payment</span>
        </header>

        <section className="invoice-result-card">
          <div
            className={`invoice-result-icon ${
              isSuccess ? "invoice-result-icon-success" : "invoice-result-icon-pending"
            }`}
            aria-hidden="true"
          >
            {isSuccess ? "✓" : "!"}
          </div>

          <p className="invoice-result-label">INVOICE PAYMENT</p>

          <h1>{title}</h1>

          <p className="invoice-result-description">{description}</p>

          <div className="invoice-result-notice">
            <strong>What happens next?</strong>

            <p>
              You can check your current payment status using the original invoice link sent to your
              email.
            </p>
          </div>

          <Link href="/" className="invoice-result-button">
            Return to QuitRX
          </Link>

          <p className="invoice-result-secure">Secure payment powered by Eway</p>
        </section>

        <footer className="invoice-result-support">
          <strong>Need help with your payment?</strong>

          <p>Please contact QuitRX support for assistance.</p>
        </footer>
      </div>
    </main>
  );
}
