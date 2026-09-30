import CollectionCatalog from "@/components/commerce/CollectionCatalog";
import Link from "next/link";
import { COLLECTION_PAGE_SIZE } from "@/lib/catalog-pagination";
import {
  getFastQuitHeroCollectionPage,
  getQuitHeroCollections,
} from "@/lib/quithero";
import styles from "../../store.module.css";

type CollectionPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function CollectionPage({
  params,
}: CollectionPageProps) {
  const { slug } = await params;

  const [initialPage, quitHeroCollections] = await Promise.all([
    getFastQuitHeroCollectionPage(
      slug,
      1,
      COLLECTION_PAGE_SIZE,
    ),
    getQuitHeroCollections(),
  ]);

  const collectionLinks = quitHeroCollections.flatMap((item) =>
    item.name && item.slug
      ? [{ name: item.name, slug: item.slug }]
      : [],
  );

  return (
    <main className={styles.page}>
      <div className="page-width">
        <Link href="/pharmacy" className={styles.backToPharmacy} aria-label="Go back to pharmacy">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M19 12H5m7-7-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Go back
        </Link>
        <CollectionCatalog
          key={slug}
          collectionSlug={slug}
          initialPage={initialPage}
          collectionLinks={collectionLinks}
        />
      </div>
    </main>
  );
}
