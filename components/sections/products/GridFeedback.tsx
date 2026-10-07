import Link from "next/link";
import styles from "./product-api-grid.module.css";

export function ProductGridSkeleton({ count }: { count: number }) {
  return (
    <div className={styles.grid} aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <div className={styles.skeletonCard} key={index}>
          <div className={styles.skeletonImage} />
          <div className={styles.skeletonLine} />
        </div>
      ))}
    </div>
  );
}
export function ProductGridAccessNotice({ signedIn }: { signedIn: boolean }) {
  return (
    <div className={styles.lockedCard}>
      <p className={styles.lockedEyebrow}>This content is locked</p>
      <h2>
        Looking for Products?
        <br />A free nicotine vaping script unlocks your options
      </h2>
      <Link
        href={
          signedIn ? "https://quitrx-website-front-ecru.vercel.app/intake-form" : "/account/login"
        }
        className={styles.loginButton}
      >
        {signedIn ? "Apply Free" : "Login"}
      </Link>
      <p className={styles.contact}>
        Any questions? <Link href="/contact">Contact us.</Link>
      </p>
    </div>
  );
}
