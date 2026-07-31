/* eslint-disable @typescript-eslint/no-explicit-any */
import { client } from "@/sanity/lib/client";
import { ALLPAGE_QUERY } from "@/sanity/lib/queries";
import {MetadataRoute} from "next";
import {defineQuery, SanityDocument} from "next-sanity";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const ROOT_URL = "https://mcq-swart.vercel.app";

  const query = defineQuery(ALLPAGE_QUERY);

  const allslug = await client.fetch<SanityDocument>(
      query,
      {},
      {
        cache: "no-store",
      }
    );
  
    const pageSlugs: MetadataRoute.Sitemap = allslug.map((item: any) => ({
      url: `${ROOT_URL}/${item.slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.4,
  }));

  return [...pageSlugs];
}
