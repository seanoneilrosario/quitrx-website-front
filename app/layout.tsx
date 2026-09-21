import type { Metadata } from "next";
import { cache } from "react";
import { draftMode } from "next/headers";
import { defineQuery } from "next-sanity";

import { DisableDraftMode } from "@/components/global/DisableDraftMode";
import type { ThemeSettings } from "@/components/global/ThemeProvider";
import WebsiteShell from "@/components/global/WebsiteShell";
import type {
  NavigationData,
  SearchPage,
} from "@/components/navigation/Header";

import { sanityFetch, SanityLive } from "@/sanity/lib/live";
import { HEADER_SEARCH_QUERY, NAVIGATION, SETTINGS } from "@/sanity/lib/queries";

import "./globals.css";

export const revalidate = 300;

export const metadata: Metadata = {
  metadataBase: new URL("https://mcq-swart.vercel.app"),

  title: "MCQ Capital LLC",

  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
  },

  other: {
    "Permissions-Policy":
      "payment=(), microphone=(), camera=(), geolocation=()",
  },
};

const getNavigation = cache(async () => {
  const result = await sanityFetch({
    query: defineQuery(NAVIGATION),
    perspective: "published",
    stega: false,
  });

  return result?.data ?? null;
});

const getSettings = cache(async () => {
  const result = await sanityFetch({
    query: defineQuery(SETTINGS),
    perspective: "published",
    stega: false,
  });

  return result?.data ?? null;
});

const getSearchPages = cache(async () => {
  const result = await sanityFetch({
    query: defineQuery(HEADER_SEARCH_QUERY),
    perspective: "published",
    stega: false,
  });

  return result?.data ?? [];
});

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isEnabled } = await draftMode();

  const [navigation, settings, searchPages] = await Promise.all([
    getNavigation(),
    getSettings(),
    getSearchPages(),
  ]);

  return (
    <html
      lang="en"
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <WebsiteShell
          settings={settings as ThemeSettings | undefined}
          navigation={navigation as NavigationData | null}
          searchPages={searchPages as SearchPage[]}
          liveContent={
            <>
              <SanityLive />
              {isEnabled && <DisableDraftMode />}
            </>
          }
        >
          {children}
        </WebsiteShell>
      </body>
    </html>
  );
}
