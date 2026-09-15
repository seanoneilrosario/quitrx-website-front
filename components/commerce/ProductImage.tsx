"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";
import { DEFAULT_PRODUCT_IMAGE } from "@/lib/product-image";

type ProductImageProps = Omit<ImageProps, "src" | "onError"> & {
  src?: string | null;
};

export default function ProductImage({ src, alt, ...props }: ProductImageProps) {
  const validSrc = typeof src === "string" ? src.trim() : "";
  const [failedSrc, setFailedSrc] = useState<string>();
  const imageSrc = !validSrc || failedSrc === validSrc ? DEFAULT_PRODUCT_IMAGE : validSrc;

  return (
    <Image
      {...props}
      src={imageSrc}
      alt={alt}
      onError={() => {
        if (imageSrc !== DEFAULT_PRODUCT_IMAGE) setFailedSrc(validSrc);
      }}
    />
  );
}
