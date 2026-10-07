"use client";

import { SanityDocument } from "next-sanity";
import SectionRenderer from "@/components/sections/SectionRenderer";

type HomepagePageProps = {
  data?: SanityDocument | null;
};

const Homepage = ({ data }: HomepagePageProps) => {
  const safeData = data && typeof data === "object" ? data : null;
  const components = Array.isArray(safeData?.components) ? safeData.components : [];

  if (!safeData) {
    return null;
  }

  return (
    <div className="">{components.length > 0 && <SectionRenderer components={components} />}</div>
  );
};

export default Homepage;
