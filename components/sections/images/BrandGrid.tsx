import Link from "next/link";
import type { CSSProperties } from "react";
import styles from "./BrandGrid.module.css";

type Brand = {
  _key?: string;
  name?: string;
  logo?: string;
  alt?: string;
  pageSlug?: string;
  pageType?: string;
  url?: string;
  openInNewTab?: boolean;
};

type BrandGridProps = {
  heading?: string;
  brands: Brand[];
  desktopPaddingTop?: number;
  desktopPaddingBottom?: number;
  mobilePaddingTop?: number;
  mobilePaddingBottom?: number;
};

type BrandGridStyles = CSSProperties & {
  "--brand-grid-desktop-padding-top": string;
  "--brand-grid-desktop-padding-bottom": string;
  "--brand-grid-mobile-padding-top": string;
  "--brand-grid-mobile-padding-bottom": string;
};

function getHref(brand: Brand) {
  if (brand.pageType === "home") return "/";
  if (brand.pageSlug) return `/${brand.pageSlug}`;
  return brand.url;
}

export default function BrandGrid({
  heading = "Shop by Brand",
  brands,
  desktopPaddingTop = 120,
  desktopPaddingBottom = 120,
  mobilePaddingTop = 54,
  mobilePaddingBottom = 54,
}: BrandGridProps) {
  const visibleBrands = brands.filter((brand) => brand.logo && brand.name);

  if (!visibleBrands.length) return null;

  const sectionStyle: BrandGridStyles = {
    "--brand-grid-desktop-padding-top": `${desktopPaddingTop}px`,
    "--brand-grid-desktop-padding-bottom": `${desktopPaddingBottom}px`,
    "--brand-grid-mobile-padding-top": `${mobilePaddingTop}px`,
    "--brand-grid-mobile-padding-bottom": `${mobilePaddingBottom}px`,
  };

  return (
    <section
      className={styles.section}
      style={sectionStyle}
      aria-labelledby="brand-grid-heading"
    >
      <div className={styles.container}>
        {heading && (
          <h2 id="brand-grid-heading" className={styles.heading}>
            {heading}
          </h2>
        )}

        <div className={styles.grid}>
          {visibleBrands.map((brand, index) => {
            const href = getHref(brand);
            const content = (
              <>
                <span className={styles.logoCard}>
                  <img
                    className={styles.logo}
                    src={brand.logo}
                    alt={brand.alt || `${brand.name} logo`}
                  />
                </span>
                <span className={styles.name}>{brand.name}</span>
              </>
            );

            return href ? (
              <Link
                className={styles.brand}
                href={href}
                key={brand._key || `${brand.name}-${index}`}
                target={brand.openInNewTab ? "_blank" : undefined}
                rel={brand.openInNewTab ? "noreferrer" : undefined}
              >
                {content}
              </Link>
            ) : (
              <div
                className={styles.brand}
                key={brand._key || `${brand.name}-${index}`}
              >
                {content}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
