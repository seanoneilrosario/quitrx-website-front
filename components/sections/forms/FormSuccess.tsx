import Link from "next/link";
import Image from "next/image";
import styles from "./form-success.module.css";

type FormSuccessProps = {
  icon?: string;
  title?: string;
  lead?: string;
  message?: string;
  buttonText?: string;
  homeHref?: string;
};

export default function FormSuccess({
  icon,
  title = "Form submitted successfully!",
  lead = "Your intake form has been submitted successfully.",
  message =
    "A QuitRX doctor will review your confidential information and respond within 24 hours. You will receive an email once your prescription is ready.",
  buttonText = "Back to Home",
  homeHref = "/",
}: FormSuccessProps) {
  return (
    <section className={styles.section} aria-labelledby="form-success-title">
      <div className={styles.content}>
        <div className={styles.icon} aria-hidden="true">
          {icon ? (
            <Image src={icon} alt="" width={72} height={72} />
          ) : (
            <svg viewBox="0 0 64 64" role="presentation">
              <path d="M17 32.5 27.5 43 48 20.5" />
            </svg>
          )}
        </div>

        <h1 id="form-success-title" className={styles.title}>
          {title}
        </h1>
        <p className={styles.lead}>{lead}</p>
        <p className={styles.message}>{message}</p>

        <Link className={styles.button} href={homeHref}>
          {buttonText}
        </Link>
      </div>
    </section>
  );
}
