"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import styles from "@/app/store.module.css";

export default function ProductImageZoom({ image, alt }: { image?: string; alt: string }) {
  const [open, setOpen] = useState(false);

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

  return (
    <>
      <button
        type="button"
        className={`${styles.productImageWrap} ${styles.productImageTrigger}`}
        onClick={() => image && setOpen(true)}
        aria-label={`Zoom ${alt}`}
        disabled={!image}
      >
        <span className={styles.zoomIcon} aria-hidden="true">+</span>
        {image && <Image src={image} width={900} height={900} sizes="(max-width: 989px) 100vw, 50vw" alt={alt} className={styles.productImage} />}
      </button>

      {open && image && typeof document !== "undefined" && createPortal(
        <div className={styles.zoomModal} role="dialog" aria-modal="true" aria-label={`${alt} enlarged image`} onClick={() => setOpen(false)}>
          <button type="button" className={styles.zoomClose} onClick={() => setOpen(false)} aria-label="Close image zoom">
            <span />
          </button>
          <Image src={image} width={1600} height={1600} sizes="92vw" alt={alt} className={styles.zoomedImage} onClick={(event) => event.stopPropagation()} />
        </div>,
        document.body,
      )}
    </>
  );
}
