"use client";

import { useEffect } from "react";
import Link from "next/link";
import styles from "@/app/store.module.css";

type ProductErrorFallbackProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ProductErrorFallback({ error, reset }: ProductErrorFallbackProps) {
  useEffect(() => {
    console.error("Product page failed to load.", error);
  }, [error]);

  return (
    <main className={styles.productErrorPage}>
      <div className={styles.productErrorCard}>
        <p className={styles.productErrorEyebrow}>Temporary loading issue</p>
        <h1>We couldn&apos;t load this product</h1>
        <p>The product service may be taking longer than expected. Please try again.</p>
        <div className={styles.productErrorActions}>
          <button type="button" onClick={reset}>Try again</button>
          <Link href="/collections/all-products">View all products</Link>
        </div>
      </div>
    </main>
  );
}
