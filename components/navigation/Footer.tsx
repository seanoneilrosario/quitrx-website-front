"use client";

import Link from "next/link";

import "./footer.css";
import { PortableTextBlock } from "@/components/sections/section-types";
import { usePathname } from "next/navigation";

export interface FooterProps {
  navigation: {
    footer_menu?: {
      title: string;
      link: string;
    }[];
    footer_background_image: string;
    company_info?: PortableTextBlock[];

    footerLogo?: string;
  } | null;
}

export function Footer({ navigation }: FooterProps) {
  const pathname = usePathname();
  const currentYear = new Date().getFullYear();

  if (pathname.startsWith("/admin") || pathname === "/account" || pathname === "/checkout") {
    return null;
  }
  return (
    <footer className="footer ">
      <div className="footer-content relative"></div>
      <div className="footer-border-separator hidden lg:block  w-[89%] mb-5 mx-auto"></div>

      <div className={`footer__container page-width bottom-4 w-[94%]`}>
        {/* LEFT */}
        <div className="footer__left">
          {navigation?.footer_menu?.map((item, index) => (
            <Link key={index} href={item.link || "#"} className="footer__link">
              {item.title}
            </Link>
          ))}
        </div>

        {/* RIGHT */}
        <div className="footer__right">
          <p>&copy; Copyright QuitRx {currentYear}</p>
        </div>
        <div className="footer-border-separator w-full lg:hidden"></div>
      </div>
    </footer>
  );
}
