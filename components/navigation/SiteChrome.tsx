"use client";

import { usePathname } from "next/navigation";

import Header, { type NavigationData, type SearchPage } from "./Header";
import { Footer, type FooterProps } from "./Footer";

type SiteChromeProps = {
  children: React.ReactNode;
  navigation: NavigationData | null;
  searchPages: SearchPage[];
};

export default function SiteChrome({ children, navigation, searchPages }: SiteChromeProps) {
  const pathname = usePathname();
  const isAccountRoute = pathname === "/account" || pathname.startsWith("/account/");

  return (
    <>
      {!isAccountRoute && <Header navigation={navigation} searchPages={searchPages} />}

      <div className="main-sections-wrapper">{children}</div>

      {!isAccountRoute && (
        <Footer navigation={navigation as FooterProps["navigation"]} />
      )}
    </>
  );
}
