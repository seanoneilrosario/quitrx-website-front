import CollectionCatalog from "@/components/commerce/CollectionCatalog";
import styles from "../../store.module.css";

type CollectionPageProps = { params: Promise<{ slug: string }> };

export default async function CollectionPage({ params }: CollectionPageProps) {
  const slug = (await params).slug;

  return (
    <main className={styles.page}>
      <div className="page-width">
        <CollectionCatalog key={slug} collectionSlug={slug} />
      </div>
    </main>
  );
}
