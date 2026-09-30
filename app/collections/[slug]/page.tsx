import CollectionCatalog from "@/components/commerce/CollectionCatalog";
import { COLLECTION_PAGE_SIZE } from "@/lib/catalog-pagination";
import { getFastQuitHeroCollectionPage } from "@/lib/quithero";
import { sanityFetch } from "@/sanity/lib/live";
import { PRODUCT_GRID_COLLECTIONS_QUERY } from "@/sanity/lib/queries";
import { defineQuery } from "next-sanity";
import styles from "../../store.module.css";

type CollectionPageProps = { params: Promise<{ slug: string }> };

export default async function CollectionPage({ params }: CollectionPageProps) {
  const slug = (await params).slug;
  const [initialPage, productGridCollectionsResult] = await Promise.all([
    getFastQuitHeroCollectionPage(slug, 1, COLLECTION_PAGE_SIZE).catch(() => undefined),
    sanityFetch({
      query: defineQuery(PRODUCT_GRID_COLLECTIONS_QUERY),
      perspective: "published",
      stega: false,
    }).catch(() => ({ data: [] })),
  ]);
  const productGridCollections = Array.isArray(productGridCollectionsResult.data)
    ? productGridCollectionsResult.data.flatMap((item) =>
        item?.title && item?.slug ? [{ name: item.title, slug: item.slug }] : [],
      )
    : [];

  return (
    <main className={styles.page}>
      <div className="page-width">
        <CollectionCatalog
          key={slug}
          collectionSlug={slug}
          initialPage={initialPage}
          collectionLinks={productGridCollections}
        />
      </div>
    </main>
  );
}
