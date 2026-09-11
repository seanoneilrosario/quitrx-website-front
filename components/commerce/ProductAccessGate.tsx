"use client";

import Link from "next/link";
import { useAccountCustomer } from "@/hooks/useAccountCustomer";
import { hasActiveScript } from "@/lib/script-access";
import styles from "@/app/store.module.css";

type ProductAccessGateProps = {
  productName: string;
  children: React.ReactNode;
};

export default function ProductAccessGate({ productName, children }: ProductAccessGateProps) {
  const { customer, loading } = useAccountCustomer();

  if (loading) {
    return <main className={styles.lockedProductPage} aria-busy="true" />;
  }

  if (hasActiveScript(customer)) return children;

  return (
    <main className={styles.lockedProductPage}>
      <div className={`${styles.lockedProductCard} page-width`}>
        <h1>{productName}</h1>
        <p className={styles.lockedProductEyebrow}>This content is locked</p>
        <h2>Looking for Products?<br />A free nicotine vaping script unlocks your options</h2>
        <Link href="/intake-form" className={styles.applyFreeButton}>Apply Free</Link>
        <p className={styles.lockedProductContact}>Any questions? <Link href="/contact">Contact us.</Link></p>
      </div>
    </main>
  );
}
