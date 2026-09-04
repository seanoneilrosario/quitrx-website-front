"use client"

import Image from "next/image";
import Link from "next/link";
import { PortableText } from "@portabletext/react";
import { urlFor } from "@/sanity/lib/image";

import "./footer.css";
import { PortableTextBlock } from "../global/components";
import { usePathname } from "next/navigation";

const components = {
  marks: {
    link: ({ children, value }: { children: React.ReactNode; value?: { href?: string } }) => {
      const href = value?.href || "";
      const isExternal = href.startsWith("https://");

      return (
        <a
          href={href}
          target={isExternal ? "_blank" : undefined}
          rel={isExternal ? "noopener noreferrer" : undefined}
        >
          {children}
        </a>
      );
    },
  },
};

export interface FooterProps {
  navigation: {
    footer_menu?: {
      title: string;
      link: string;
    }[];
    footer_background_image: string;
    company_info?: PortableTextBlock[];

    footerLogo?: string
  } | null;
}

export function Footer({ navigation }: FooterProps) {
  const pathname = usePathname()
  const currentYear = new Date().getFullYear();

  if (pathname.startsWith("/admin") || pathname === "/account" || pathname === "/checkout") {
    return null
  }
  return (
    <footer className="footer ">
      {/* <Image
          src={navigation?.footer_background_image || ""}
          alt="Background image"
          width={2000}
          height={2000}
          className="richtext-with-image__background absolute top-0 left-0 w-full h-full object-cover z-[-1]"
        /> */}
      <div className="footer-content relative">
        
        {/* <div className="richtext-with-image__container">
          {navigation?.footerLogo && (
            <div className="richtext-with-image__image">
              <Image
                src={navigation?.footerLogo}
                alt={ "Richtext image"}
                width={100}
                height={100}
                className="richtext-with-image__img"
              />
             
            </div>
          )}
  
          <div className="richtext-with-image__content">
            <div className="richtext-with-image__description">
              <PortableText value={navigation?.company_info} />
            </div>
          </div>
        </div> */}
      </div>
      <div className="footer-border-separator hidden lg:block  w-[89%] mb-5 mx-auto"></div>

      <div className={`footer__container page-width bottom-4 w-[94%]`}>
        
        {/* LEFT */}
        <div className="footer__left">
          {navigation?.footer_menu?.map((item, index) => (
            <Link
              key={index}
              href={item.link || "#"}
              className="footer__link"
            >
              {item.title}
            </Link>
          ))}
          {/* <Link
              href={`/privacy-policy`}
              className="footer__link"
            >
              Privacy Policy
            </Link> */}
        </div>

        {/* CENTER */}
        {/* <div className="footer__center">
          {navigation?.footerLogo && (
            <Image
              src={urlFor(navigation.footerLogo).url()}
              alt={navigation.footerLogo || "Footer Logo"}
              width={220}
              height={80}
              className="footer__logo"
            />
          )}
        </div> */}

        {/* RIGHT */}
        <div className="footer__right">
          {/* <PortableText value={navigation?.company_info} components={components} /> */}
          <p>&copy; Copyright QuitRx {currentYear}</p>

        </div>
      <div className="footer-border-separator w-full lg:hidden"></div>

      </div>
    </footer>
  );
}
