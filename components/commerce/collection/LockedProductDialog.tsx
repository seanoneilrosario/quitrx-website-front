import { useEffect } from "react";
import Link from "next/link";
import styles from "../collection-catalog.module.css";

export function LockedProductDialog({
  lockedProductName,
  onClose,
}: {
  lockedProductName: string;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!lockedProductName) {
      return;
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.body.style.overflow = "hidden";

    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = "";

      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [lockedProductName, onClose]);

  return (
    <div
      className={styles.lockedModal}
      role="dialog"
      aria-modal="true"
      aria-labelledby="locked-product-title"
    >
      <button
        type="button"
        className={styles.lockedModalBackdrop}
        aria-label="Close"
        onClick={onClose}
      />

      <div className={styles.lockedModalCard}>
        <button
          type="button"
          className={styles.lockedModalClose}
          aria-label="Close"
          onClick={onClose}
        />

        <h2 id="locked-product-title">{lockedProductName}</h2>

        <p className={styles.lockedModalEyebrow}>This content is locked</p>

        <h3>
          Looking for Products?
          <br />A free nicotine vaping script unlocks your options
        </h3>

        <Link href="/intake-form" className={styles.applyFreeButton}>
          Apply Free
        </Link>

        <p className={styles.lockedModalContact}>
          Any questions? <Link href="/contact">Contact us.</Link>
        </p>
      </div>
    </div>
  );
}
