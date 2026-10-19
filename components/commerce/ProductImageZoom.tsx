/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import styles from "@/app/store.module.css";
import ProductImage from "./ProductImage";
import type { Variant } from "./ProductPurchasePanel";

export default function ProductImageZoom({
  image,
  alt,
  product,
  activeVariant,
}: {
  image?: string;
  alt: string;
  product: any;
  activeVariant: Variant | null;
}) {
  const [open, setOpen] = useState(false);
  const [loadedImage, setLoadedImage] = useState<string>();
  const [selectedImage, setSelectedImage] = useState(image);

  // Normalize product images into URLs.
  const productImages: string[] = Array.isArray(product?.images)
    ? product.images
        .map((item: any) => (typeof item === "string" ? item : item?.url || item?.src))
        .filter(Boolean)
    : [];

  // Include the main image and remove duplicates.
  const images = Array.from(new Set([image, ...productImages].filter(Boolean))) as string[];

  const matchingImage = activeVariant?.imageId && Array.isArray(product?.images)
    ? product.images.find(
        (item: any) =>
          item?.id === activeVariant.imageId && (item?.url || item?.src),
      )
    : undefined;
  const variantImage: string | undefined =
    activeVariant?.image?.url || activeVariant?.image?.src || matchingImage?.url || matchingImage?.src;

  // Select the variant's image, falling back to the product's main image.
  useEffect(() => {
    setSelectedImage(variantImage || image);
  }, [activeVariant, variantImage, image]);

  const currentImage = selectedImage || images[0];
  const imageKey = currentImage || "default-product-image";
  const imageLoaded = loadedImage === imageKey;

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  console.log("Product Images", product?.images);

  return (
    <>
      <div className={styles.productGallery}>
        {/* Main Product Image */}
        <button
          type="button"
          className={`${styles.productImageWrap} ${styles.productImageTrigger}`}
          onClick={() => currentImage && setOpen(true)}
          aria-label={`Zoom ${alt}`}
          disabled={!currentImage}
          aria-busy={!imageLoaded}
        >
          <span className={styles.zoomIcon} aria-hidden="true">
            +
          </span>

          {!imageLoaded && <span className={styles.productImageLoader} aria-hidden="true" />}

          <ProductImage
            key={imageKey}
            src={currentImage}
            width={900}
            height={900}
            sizes="(max-width: 989px) 100vw, 50vw"
            alt={alt}
            className={`${styles.productImage} ${
              imageLoaded ? styles.productImageLoaded : styles.productImageLoading
            }`}
            priority
            onLoad={() => setLoadedImage(imageKey)}
          />
        </button>

        {/* Product Thumbnails */}
        {images.length > 1 && (
          <div className={styles.productThumbnails} role="group" aria-label="Product images">
            {images.map((thumbnail, index) => (
              <button
                key={`${thumbnail}-${index}`}
                type="button"
                className={`${styles.productThumbnail} ${
                  currentImage === thumbnail ? styles.productThumbnailActive : ""
                }`}
                onClick={() => setSelectedImage(thumbnail)}
                aria-label={`View product image ${index + 1}`}
                aria-pressed={currentImage === thumbnail}
              >
                <ProductImage
                  src={thumbnail}
                  width={120}
                  height={120}
                  sizes="(max-width: 749px) 76px, 96px"
                  alt={`${alt} thumbnail ${index + 1}`}
                  className={styles.productThumbnailImage}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Image Zoom Modal */}
      {open &&
        currentImage &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className={styles.zoomModal}
            role="dialog"
            aria-modal="true"
            aria-label={`${alt} enlarged image`}
            onClick={() => setOpen(false)}
          >
            <button
              type="button"
              className={styles.zoomClose}
              onClick={() => setOpen(false)}
              aria-label="Close image zoom"
            >
              <span />
            </button>

            <ProductImage
              src={currentImage}
              width={1600}
              height={1600}
              sizes="92vw"
              alt={alt}
              className={styles.zoomedImage}
              onClick={(event) => event.stopPropagation()}
            />
          </div>,
          document.body,
        )}
    </>
  );
}
