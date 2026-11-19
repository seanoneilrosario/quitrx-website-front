import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async redirects() {
    return [
      {
        source: "/drlee",
        destination:
          "https://workdrive.zohopublic.com.au/external/cfaa90dd1e16252b61174ac10d1e983aa703a4722e125584119ae0f601be82b3",
        permanent: false,
      },
      {
        source: "/Gartrell",
        destination:
          "https://workdrive.zohopublic.com.au/external/80d30fdd8fb0777b58f56dbd5583d3ae4d01614b500a9cf6e3fa0befccae466c",
        permanent: true,
      },
      {
        source: "/gartrell",
        destination:
          "https://workdrive.zohopublic.com.au/external/80d30fdd8fb0777b58f56dbd5583d3ae4d01614b500a9cf6e3fa0befccae466c",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path(account|api|admin|cart|checkout|customer-debug)/:rest*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }],
      },
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Restrict framing and plugins without breaking Zoho forms, OAuth,
          // payment redirects or Sanity's existing script requirements.
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'self'; object-src 'none'; base-uri 'self'",
          },
          ...(process.env.NODE_ENV === "production"
            ? [{ key: "Strict-Transport-Security", value: "max-age=31536000" }]
            : []),
        ],
      },
    ];
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
      },
      {
        protocol: "https",
        hostname: "cdn.shopify.com",
      },
      {
        protocol: "https",
        hostname: "stockandbuy.blob.core.windows.net",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
};

export default nextConfig;
