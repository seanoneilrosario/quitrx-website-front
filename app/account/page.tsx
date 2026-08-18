import Link from "next/link";

type QuitHeroCustomer = {
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  tags?: string[];
  scriptExpiry?: string;
  scriptActive?: boolean;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
};

function formatDate(date?: string) {
  if (!date) return "Not available";

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "Not available";

  return new Intl.DateTimeFormat("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

async function getCustomer() {
  const apiUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  try {
    const response = await fetch(`${apiUrl}/api/quithero-customers?search=seanrosario119@gmail.com`, {
      cache: "no-store",
    });

    if (!response.ok) return null;

    const data = await response.json();
    return Array.isArray(data) ? (data[0] as QuitHeroCustomer | undefined) : (data?.[0] as QuitHeroCustomer | undefined) ?? null;
  } catch {
    return null;
  }
}

export default async function AccountPage() {
  const customer = await getCustomer();
  const firstName = customer?.firstName ?? "Arvin";
  const lastName = customer?.lastName ?? "";
  const fullName = [firstName, lastName].filter(Boolean).join(" ") || "Customer";
  const email = customer?.email ?? "No email available";
  const phone = customer?.phone ?? "No phone available";
  const scriptIsActive = Boolean(
    customer?.scriptActive ?? customer?.tags?.some((tag) => /script/i.test(String(tag))),
  );
  const expiryDate = formatDate(customer?.scriptExpiry);
  const address = customer?.address;
  const addressLines = [
    address?.line1,
    address?.line2,
    [address?.city, address?.state, address?.postcode].filter(Boolean).join(" "),
    address?.country,
  ].filter(Boolean);

  return (
    <>
      <header className="account-overview__header">
        <h1>{firstName}</h1>
      </header>

      <section className="account-overview__grid">
        <article className="account-panel account-panel--overview">
          <div className="account-panel__icon">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 3h12v18H6z" />
              <path d="M9 8h6M9 12h6M9 16h3" />
            </svg>
          </div>
          <div className="account-panel__content">
            <h2>Script</h2>
            <p>Overview</p>
            <div className="account-panel__status-row">
              <span className="account-badge account-badge--success">• {scriptIsActive ? "Active" : "Inactive"}</span>
            </div>
            <div className="account-panel__meta">
              <span>Expiry Date: {expiryDate}</span>
            </div>
          </div>
          <button type="button" className="account-button account-button--primary">Renew for free</button>
        </article>

        <article className="account-panel account-panel--address">
          <div className="account-panel__icon account-panel__icon--muted">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 21s6-5.5 6-11a6 6 0 1 0-12 0c0 5.5 6 11 6 11Z" />
              <circle cx="12" cy="10" r="2.5" />
            </svg>
          </div>
          <div className="account-panel__content">
            <h2>Your</h2>
            <p>Address</p>
            <div className="account-address-block">
              <strong>{fullName}</strong>
              {addressLines.length ? (
                addressLines.map((line) => <span key={line}>{line}</span>)
              ) : (
                <>
                  <span>{email}</span>
                  <span>{phone}</span>
                </>
              )}
            </div>
            <Link href="/account/profile" className="link-button">View addresses (1)</Link>
          </div>
        </article>

        <article className="account-panel account-panel--orders">
          <div className="account-panel__icon account-panel__icon--muted">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 8h14l-1 13H6L5 8Z" />
              <path d="M9 10V6a3 3 0 0 1 6 0v4" />
            </svg>
          </div>
          <div className="account-panel__content">
            <h2>Orders</h2>
            <p>1 Orders</p>
            <Link href="/account/orders" className="account-button account-button--primary account-button--compact">View Orders</Link>
          </div>
        </article>
      </section>

      <section className="account-order-history">
        <div className="account-order-history__header">
          <span className="account-order-history__icon">🧾</span>
          <h2>Order History</h2>
        </div>

        <div className="account-order-table">
          <div className="account-order-table__row account-order-table__head">
            <span>Order Number</span>
            <span>Date</span>
            <span>Fulfillment Status</span>
          </div>

          <div className="account-order-table__row">
            <span>QRX1170</span>
            <span>August 05, 2026</span>
            <span className="account-order-status"><i /> Unfulfilled</span>
          </div>
        </div>
      </section>

      <section className="account-banner">
        <div className="account-banner__content">
          <span className="account-banner__icon">✉️</span>
          <div>
            <h3>Need an eScript?</h3>
            <p>Get a $49 eScript to use at your local pharmacy.</p>
          </div>
        </div>
        <button type="button" className="account-button account-button--primary account-button--banner">Get eScript</button>
      </section>
    </>
  );
}
