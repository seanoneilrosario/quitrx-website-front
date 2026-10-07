"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import ThemeProvider, { type ThemeSettings } from "@/components/providers/ThemeProvider";
import SiteChrome from "@/components/navigation/SiteChrome";
import type { NavigationData, SearchPage } from "@/components/navigation/Header";
import { AccountCustomerProvider } from "@/hooks/useAccountCustomer";
import QueryProvider from "@/components/providers/QueryProvider";
import type { QuitHeroCustomer } from "@/lib/quithero/customers";

type WebsiteShellProps = {
  initialCustomer?: QuitHeroCustomer | null;
  children: ReactNode;
  liveContent: ReactNode;
  settings?: ThemeSettings;
  navigation: NavigationData | null;
  searchPages: SearchPage[];
};

export default function WebsiteShell({
  initialCustomer,
  children,
  liveContent,
  settings,
  navigation,
  searchPages,
}: WebsiteShellProps) {
  const pathname = usePathname();

  // Studio owns its navigation. SanityLive can refresh it during editing.
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return <>{children}</>;
  }

  return (
    <QueryProvider>
      <ThemeProvider settings={settings}>
        <AccountCustomerProvider initialCustomer={initialCustomer}>
          <SiteChrome navigation={navigation} searchPages={searchPages}>
            {children}
          </SiteChrome>
        </AccountCustomerProvider>
        {liveContent}
      </ThemeProvider>
    </QueryProvider>
  );
}
