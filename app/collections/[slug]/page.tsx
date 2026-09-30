import CollectionCatalog from "@/components/commerce/CollectionCatalog";
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