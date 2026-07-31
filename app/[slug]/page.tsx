/* eslint-disable @typescript-eslint/no-explicit-any */

import { cache } from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { defineQuery } from "next-sanity";
import { SanityDocument } from "sanity";

import Pages from "@/components/pages/Page";
import { client } from "@/sanity/lib/client";
import { sanityFetch } from "@/sanity/lib/live";
import { ALLPAGE_QUERY, PAGE_QUERY } from "@/sanity/lib/queries";

interface HomePageData {
  title?: string;
  metaDescription?: string;
  meta_image?: string;
}

type Params = {
  slug: string;
};

export const revalidate = 300;

const pageQuery = defineQuery(PAGE_QUERY);

const getPage = cache(async (slug: string) => {
  try {
    const result = await sanityFetch({
      query: pageQuery,
      params: { slug },
      perspective: "published",
      stega: false,
    });

    const data = result?.data ?? null;

    if (
      !data ||
      (typeof data === "object" &&
        Object.keys(data).length === 0)
    ) {
      return null;
    }

    return data as SanityDocument;
  } catch {
    return null;
  }
});

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;

  const page = (await getPage(slug)) as HomePageData | null;

  if (!page) {
    return {
      title: "Page Not Found | MCQ Capital LLC",
      description: "The requested page could not be found.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const metaTitle =
    `${page.title} | MCQ Capital LLC`;

  const metaDescription =
    page.metaDescription ??
    "Welcome to MCQ Capital LLC";

  return {
    title: metaTitle,

    description: metaDescription,

    openGraph: {
      title: metaTitle,

      description: metaDescription,

      url: `https://mcq-swart.vercel.app/${slug}`,

      siteName: "MCQ Capital LLC",

      type: "website",

      ...(page.meta_image && {
        images: [
          {
            url: page.meta_image,
            width: 1200,
            height: 630,
          },
        ],
      }),
    },

    other: {
      "Permissions-Policy":
        "payment=(), microphone=(), camera=(), geolocation=()",
    },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;

  const page = await getPage(slug);

  if (!page) {
    notFound();
  }

  return <Pages page={page} />;
}

export async function generateStaticParams() {
  const query = defineQuery(ALLPAGE_QUERY);

  const allSlugs = await client.fetch(
    query,
    {},
    {
      next: {
        revalidate: 300,
      },
    }
  );

  const allowedTypes = [
    "destination",
    "villa",
    "chooseyourmood",
    "collection",
  ];

  return allSlugs
    .filter(
      (item: any) =>
        allowedTypes.includes(item._type) &&
        item.slug &&
        item.slug !== "villas"
    )
    .map((item: any) => ({
      slug: item.slug,
    }));
}