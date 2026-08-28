"use client";

import { useMemo, useState } from "react";
import { createCollection } from "../actions";
import styles from "./dashboard.module.css";

type ProductOption = { id: string; name: string; slug: string };

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function CollectionCreator({ products }: { products: ProductOption[] }) {
  const [filter, setFilter] = useState("");
  const [name, setName] = useState("");
  const slug = slugify(name);
  const filtered = useMemo(() => {
    const query = filter.trim().toLowerCase();
    return query ? products.filter((product) => `${product.name} ${product.slug}`.toLowerCase().includes(query)) : products;
  }, [filter, products]);

  return (
    <details className={styles.creator}>
      <summary>+ Add collection</summary>
      <form action={createCollection}>
        <div className={styles.inlineForm}>
          <label>Collection name<input required name="name" value={name} onChange={(event) => setName(event.target.value)} /></label>
          <label>Slug<input required readOnly name="slug" value={slug} /></label>
          <label>Image URL<input name="image" type="url" /></label>
          <label className={styles.full}>Description<input name="description" /></label>
          <label>SEO title<input name="seoTitle" /></label>
          <label>SEO description<input name="seoDescription" /></label>
        </div>
        <section className={styles.productPicker}>
          <div><strong>Add products</strong><span>Select one or more products for this collection.</span></div>
          <input aria-label="Filter products" placeholder="Filter products by name or slug" value={filter} onChange={(event) => setFilter(event.target.value)} />
          <div className={styles.productChoices}>
            {filtered.map((product) => <label key={product.id}><input type="checkbox" name="productIds" value={product.id}/><span><strong>{product.name}</strong><small>{product.slug}</small></span></label>)}
            {!filtered.length ? <p>No products match this filter.</p> : null}
          </div>
        </section>
        <button className={styles.primary}>Save collection</button>
      </form>
    </details>
  );
}
