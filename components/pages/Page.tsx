"use client";

import { SanityDocument } from "next-sanity";
import SpreadComponents from "../global/SpreadComponent";
import Image from "next/image";
import "./pages.css";

type PageProps = {
  page?: SanityDocument | null;
};

export default function Pages({ page }: PageProps) {
  const safePage = page && typeof page === "object" ? page : null;
  const title = typeof safePage?.title === "string" ? safePage.title : "Untitled page";
  const backgroundImage = typeof safePage?.background_image === "string" ? safePage.background_image : "";
  const components = Array.isArray(safePage?.components) ? safePage.components : [];

  if (!safePage) {
    return null;
  }

  return (
    <div className={`inner_pages ${safePage.no_padding_x ? "removePaddingX" : ""} ${safePage.no_padding_y ? "removePaddingY" : ""}`}>
      {backgroundImage && <Image src={backgroundImage} width={2000} height={2000} alt={title} className="backgroundImage" />}
      {components.length > 0 && <SpreadComponents components={components} />}
    </div>
  );
}
