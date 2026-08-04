"use client"
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
  return (
    <section
      className="support-form"
      style={{
        paddingTop,
        paddingBottom,
      }}
    >
      <div className="page-width">

        <h2 className="support-form__title">
          {title}
        </h2>

        <div className="support-form__card">
          <iframe
            aria-label="QuitRX Support Ticket"
            src="https://forms.zohopublic.com.au/quickrx/form/QuitRXSupportTicket/formperma/e3ds64I16V665B47VYDprcnB-UAx8Sbtbv5yj09po8w?fname=Levi&lname=Rosario&email=levidepsi7@gmail.com"
            className="support-form__iframe"
            frameBorder="0"
          />
        </div>

      </div>
    </section>
  );
}