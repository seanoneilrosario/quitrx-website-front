import type { Metadata } from "next";
import { cache } from "react";
import { draftMode } from "next/headers";
import { defineQuery } from "next-sanity";

import { DisableDraftMode } from "@/components/global/DisableDraftMode";
import ThemeProvider, {
  type ThemeSettings,
} from "@/components/global/ThemeProvider";
import Header, {
  type NavigationData,
  type SearchPage,
} from "@/components/navigation/Header";
import { Footer, FooterProps } from "@/components/navigation/Footer";

import { sanityFetch, SanityLive } from "@/sanity/lib/live";
import { HEADER_SEARCH_QUERY, NAVIGATION, SETTINGS } from "@/sanity/lib/queries";

import logo from "@/public/logo.png";
import "./globals.css";

export const revalidate = 300;

export const metadata: Metadata = {
  metadataBase: new URL("https://mcq-swart.vercel.app"),

  title: "MCQ Capital LLC",

  icons: {
    icon: logo.src,
    shortcut: logo.src,
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
        <ThemeProvider
          settings={settings as ThemeSettings | undefined}
        >
          <Header
            navigation={navigation as NavigationData | null}
            searchPages={searchPages as SearchPage[]}
          />

          <div className="main-sections-wrapper">
            {children}
          </div>

          <Footer
            navigation={
              navigation as FooterProps["navigation"]
            }
          />

          {isEnabled && (
            <>
              <SanityLive />
              <DisableDraftMode />
            </>
          )}
        </ThemeProvider>
      </body>
    </html>
  );
}
