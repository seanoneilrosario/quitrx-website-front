import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/private/",
        "/account",
        "/api/",
        "/admin",
        "/cart",
        "/checkout",
        "/customer-debug",
      ],
    },
    sitemap: "https://quitrx.com.au/sitemap.xml",
  };
}
