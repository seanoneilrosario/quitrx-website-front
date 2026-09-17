import CollectionCatalog from "@/components/commerce/CollectionCatalog";
import { getFastQuitHeroCollectionPage } from "@/lib/quithero";
import styles from "../../store.module.css";

type CollectionPageProps = { params: Promise<{ slug: string }> };

export default async function CollectionPage({ params }: CollectionPageProps) {
  const slug = (await params).slug;
  const initialPage = await getFastQuitHeroCollectionPage(slug, 1, 10).catch(() => undefined);

  return (
    <main className={styles.page}>
      <div className="page-width">
        <CollectionCatalog key={slug} collectionSlug={slug} initialPage={initialPage} />
      </div>
    </main>
  );
}
