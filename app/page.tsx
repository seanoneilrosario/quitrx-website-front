  import { defineQuery } from "next-sanity";
  import { cache } from "react";
  import { Metadata } from "next";
  import { SanityDocument } from "sanity";
  import { notFound } from "next/navigation";

  import Homepage from "@/components/pages/Home";
  import { sanityFetch } from "@/sanity/lib/live";
  import { HOME_QUERY } from "@/sanity/lib/queries";

  interface HomePageData {
    title?: string;
    meta_description?: string;
    meta_image?: string;
  }

  export const revalidate = 300;

  const homeQuery = defineQuery(HOME_QUERY);

  const getHomePage = cache(async () => {
    try {
      const result = await sanityFetch({
        query: homeQuery,
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

  export async function generateMetadata(): Promise<Metadata> {
    const homeData = (await getHomePage()) as HomePageData | null;

    const metaTitle = "MCQ Capital LLC";

    const metaDescription =
      homeData?.meta_description ??
      "Welcome to Dr. Costas";

    return {
      title: metaTitle,
      description: metaDescription,

      openGraph: {
        title: metaTitle,
        description: metaDescription,
        url: "http://localhost:3000/",
        siteName: metaTitle,
        type: "website",

        ...(homeData?.meta_image && {
          images: [
            {
              url: homeData.meta_image,
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

  export default async function Home() {
    const data = await getHomePage();

    if (!data) {
      notFound();
    }

    return <Homepage data={data} />;
  }
export async function generateStaticParams() {

  return [
    {slug: "/"}
  ];
}
