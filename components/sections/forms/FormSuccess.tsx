import Link from "next/link";
import styles from "./form-success.module.css";

type FormSuccessProps = {
  title?: string;
  lead?: string;
  message?: string;
  homeHref?: string;
};

export default function FormSuccess({
  title = "Form submitted successfully!",
  lead = "Your intake form has been submitted successfully.",
  message =
    "A QuitRX doctor will review your confidential information and respond within 24 hours. You will receive an email once your prescription is ready.",
  homeHref = "/",
}: FormSuccessProps) {
  return (
    <section className={styles.section} aria-labelledby="form-success-title">
      <div className={styles.content}>
        <div className={styles.icon} aria-hidden="true">
          <svg viewBox="0 0 64 64" role="presentation">
            <path d="M17 32.5 27.5 43 48 20.5" />
          </svg>
        </div>

        <h1 id="form-success-title" className={styles.title}>
          {title}
        </h1>
        <p className={styles.lead}>{lead}</p>
        <p className={styles.message}>{message}</p>

        <Link className={styles.button} href={homeHref}>
          Back to Home
        </Link>
      </div>
    </section>
  );
}
