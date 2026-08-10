import { notFound } from "next/navigation";
import { getQuitHeroCollection } from "@/lib/quithero";
import CollectionCatalog from "@/components/commerce/CollectionCatalog";
import styles from "../../store.module.css";

type CollectionPageProps = { params: Promise<{ slug: string }> };

export default async function CollectionPage({ params }: CollectionPageProps) {
  const collection = await getQuitHeroCollection((await params).slug).catch(() => undefined);
  if (!collection) notFound();

  return (
    <main className={styles.page}>
      <div className="page-width">
        <header className={styles.collectionHeader}>
          <h1>{collection.brand?.name}</h1>
          {collection.brand?.description && <p>{collection.brand.description}</p>}
        </header>
        <CollectionCatalog products={collection.products} />
      </div>
    </main>
  );
}
