import Link from "next/link";

export default function FormBackButton() {
  return (
    <Link href="/account" className="form-back-button" aria-label="Go back to your account">
      <span aria-hidden="true">←</span>
      Back
    </Link>
  );
}
