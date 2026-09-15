import styles from "./collectionCatalog.module.css";
import storeStyles from "@/app/store.module.css";

export function CollectionProductSkeletons() {
  return Array.from({ length: 6 }, (_, index) => (
    <article className={styles.skeletonCard} aria-hidden="true" key={index}>
      <div className={styles.skeletonImage} />
      <div className={styles.skeletonInfo}>
        <span className={`${styles.skeletonLine} ${styles.skeletonBrand}`} />
        <span className={styles.skeletonLine} />
        <span className={`${styles.skeletonLine} ${styles.skeletonName}`} />
        <span className={`${styles.skeletonLine} ${styles.skeletonPrice}`} />
        <span className={styles.skeletonButton} />
      </div>
    </article>
  ));
}

export default function CollectionLoading() {
  return (
    <main className={storeStyles.page} aria-busy="true" aria-label="Loading collection">
      <div className="page-width">
        <header className={storeStyles.collectionHeader}>
          <div className={`${styles.skeletonLine} ${styles.skeletonHeading}`} />
        </header>
        <div className={styles.catalog}>
          <aside className={styles.skeletonFilters} aria-hidden="true">
            {Array.from({ length: 5 }, (_, index) => <span className={styles.skeletonFilter} key={index} />)}
          </aside>
          <section className={styles.results}>
            <div className={styles.skeletonToolbar} aria-hidden="true" />
            <div className={styles.productGrid}>
              <CollectionProductSkeletons />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
