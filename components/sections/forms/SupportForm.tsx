"use client";

import { useAccountCustomer } from "@/hooks/useAccountCustomer";
import "./SupportForm.css";

interface SupportFormProps {
  title: string;
  paddingTop?: number;
  paddingBottom?: number;
}

export default function SupportForm({
  title,
  paddingTop = 80,
  paddingBottom = 80,
}: SupportFormProps) {
  const { customer, loading } = useAccountCustomer();

  if (loading) {
    return (
      <section className="account-card">
        <p className="account-load-message">Loading support form...</p>
      </section>
    );
  }

  const params = new URLSearchParams({
    fname: customer?.firstName?.trim() ?? "",
    lname: customer?.lastName?.trim() ?? "",
    email: customer?.email?.trim() ?? "",
  });
  const formUrl = `https://forms.zohopublic.com.au/quickrx/form/QuitRXSupportTicket/formperma/e3ds64I16V665B47VYDprcnB-UAx8Sbtbv5yj09po8w?${params.toString()}`;

  return (
    <section
      className="support-form"
      style={{
        paddingTop,
        paddingBottom,
      }}
      id="contact"
    >
      <div className="page-width">

        <h2 className="support-form__title">
          {title}
        </h2>

        <div className="support-form__card">
          <iframe
            aria-label="QuitRX Support Ticket"
            src={formUrl}
            className="support-form__iframe"
            frameBorder="0"
          />
        </div>

      </div>
    </section>
  );
}
