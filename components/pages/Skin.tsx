"use client";

import { SanityDocument } from "next-sanity";
import SpreadComponents from "../global/SpreadComponent";
import Image from "next/image";
import "./pages.css";

type SkinpageProps = {
  data?: SanityDocument | null;
  activeSection?: string;
};

const Skinpage = ({ data, activeSection }: SkinpageProps) => {
  const safeData = data && typeof data === "object" ? data : null;
  const title = typeof safeData?.title === "string" ? safeData.title : "Untitled page";
  const backgroundImage = typeof safeData?.background_image === "string" ? safeData.background_image : "";
  const components = Array.isArray(safeData?.components) ? safeData.components : [];

  if (!safeData) {
    return null;
  }

  return (
    <div className={`inner_pages ${safeData.no_padding_x ? "removePaddingX" : ""} ${safeData.no_padding_y ? "removePaddingY" : ""}`}>
      {backgroundImage && <Image src={backgroundImage} width={2000} height={2000} alt={title} className="backgroundImage" />}
      {components.length > 0 && (
        <SpreadComponents components={components} activeSection={activeSection} />
      )}
    </div>
  );
};

export default Skinpage;