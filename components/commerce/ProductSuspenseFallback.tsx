import styles from "@/app/store.module.css";

export default function ProductSuspenseFallback() {
  return (
    <main className={styles.productSkeletonPage} aria-busy="true" aria-label="Loading product">
      <div className={`${styles.productSkeleton} page-width`}>
        <div className={styles.productSkeletonMedia}>
          <div className={styles.productSkeletonZoom} />
          <div className={styles.productSkeletonImage} />
        </div>
        <div className={styles.productSkeletonContent}>
          <div className={`${styles.productSkeletonLine} ${styles.productSkeletonEyebrow}`} />
          <div className={`${styles.productSkeletonLine} ${styles.productSkeletonTitle}`} />
          <div className={`${styles.productSkeletonLine} ${styles.productSkeletonPrice}`} />
          <div className={`${styles.productSkeletonLine} ${styles.productSkeletonNote}`} />
          <div className={styles.productSkeletonControl} />
          <div className={styles.productSkeletonButton} />
          <div className={styles.productSkeletonDetails} />
          <div className={styles.productSkeletonDetails} />
          <div className={styles.productSkeletonDetails} />
        </div>
      </div>
      <div className={styles.productSkeletonSticky}>
        <div className={styles.productSkeletonStickyProduct} />
        <div className={styles.productSkeletonStickyQuantity} />
        <div className={styles.productSkeletonStickyPrice} />
        <div className={styles.productSkeletonStickyButton} />
      </div>
    </main>
  );
}
