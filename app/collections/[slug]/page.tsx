import CollectionCatalog from "@/components/commerce/CollectionCatalog";
import Link from "next/link";
import { COLLECTION_PAGE_SIZE, parseCollectionPage } from "@/lib/catalog/catalog-pagination";
import { getFastQuitHeroCollectionPage } from "@/lib/quithero";
import styles from "../../store.module.css";

type CollectionPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
};

export default async function CollectionPage({ params, searchParams }: CollectionPageProps) {
  const { slug } = await params;

  const query = await searchParams;
  const page = parseCollectionPage(Array.isArray(query.page) ? query.page[0] : query.page);
  const initialPage = await getFastQuitHeroCollectionPage(slug, page, COLLECTION_PAGE_SIZE);

  return (
    <main className={styles.page}>
      <div className="page-width">
        <Link href="/pharmacy" className={styles.backToPharmacy} aria-label="Go back to pharmacy">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M19 12H5m7-7-7 7 7 7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Go back
        </Link>
        <CollectionCatalog key={slug} collectionSlug={slug} initialPage={initialPage} />
      </div>
    </main>
  );
}
