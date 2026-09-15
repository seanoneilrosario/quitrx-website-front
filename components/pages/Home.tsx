"use client";

import { useEffect } from "react";
import { SanityDocument } from "next-sanity";
import SpreadComponents from "../global/SpreadComponent";

type HomepagePageProps = {
  data?: SanityDocument | null;
};

const Homepage = ({ data }: HomepagePageProps) => {
  const safeData = data && typeof data === "object" ? data : null;
  const components = Array.isArray(safeData?.components) ? safeData.components : [];

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      fetch("/api/quithero-products?prefetch=1", {
        cache: "no-store",
        signal: controller.signal,
      }).catch(() => undefined);
    }, 1_000);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, []);

  if (!safeData) {
    return null;
  }

  return (
    <div className="">
      {components.length > 0 && <SpreadComponents components={components} />}
    </div>
  );
};

export default Homepage;
