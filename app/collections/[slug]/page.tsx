import CollectionCatalog from "@/components/commerce/CollectionCatalog";
import { COLLECTION_PAGE_SIZE } from "@/lib/catalog-pagination";
import { getFastQuitHeroCollectionPage, getQuitHeroCollections } from "@/lib/quithero";
import { sanityFetch } from "@/sanity/lib/live";
import { PRODUCT_GRID_COLLECTIONS_QUERY } from "@/sanity/lib/queries";
import { defineQuery } from "next-sanity";
import styles from "../../store.module.css";

type CollectionPageProps = { params: Promise<{ slug: string }> };

export default async function CollectionPage({ params }: CollectionPageProps) {
  const slug = (await params).slug;
  const [initialPage, productGridCollectionsResult, quitHeroCollections] = await Promise.all([
    getFastQuitHeroCollectionPage(slug, 1, COLLECTION_PAGE_SIZE).catch(() => undefined),
    sanityFetch({
      query: defineQuery(PRODUCT_GRID_COLLECTIONS_QUERY),
      perspective: "published",
      stega: false,
    }).catch(() => ({ data: [] })),
    getQuitHeroCollections().catch(() => []),
  ]);
  const configuredCollections = Array.isArray(productGridCollectionsResult.data)
    ? productGridCollectionsResult.data.flatMap((item) =>
        item?.title && item?.slug ? [{ name: item.title, slug: item.slug }] : [],
      )
    : [];
  const apiCollections = quitHeroCollections.flatMap((item) =>
    item.name && item.slug ? [{ name: item.name, slug: item.slug }] : [],
  );
  const fallbackCollection = {
    name: initialPage?.collection.name || slug.replaceAll("-", " "),
    slug,
  };
  const collectionLinks = configuredCollections.length ? configuredCollections : apiCollections.length ? apiCollections : [fallbackCollection];

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
