"use client";

import Image from "next/image";
import Link from "next/link";
import { PortableText } from "next-sanity";
import { PortableTextBlock } from "@/components/global/components";

import styles from "./EscriptBanner.module.css";

interface EscriptBannerProps {
  heading: string;
  description?: PortableTextBlock[];

  icon?: string;
  buttonIcon?: string;

  buttonText?: string;
  buttonUrl?: string;

  paddingTop?: number;
  paddingBottom?: number;
}

const EscriptBanner = ({
  heading,
  description,
  icon,
  buttonIcon,
  buttonText,
  buttonUrl,
  paddingTop = 40,
  paddingBottom = 40,
}: EscriptBannerProps) => {
  return (
    <section
      className={styles.escriptBanner}
      style={{
        paddingTop,
        paddingBottom,
      }}
    >
      <div className="page-width">
        <div className={styles.card}>
          <div className={styles.content}>
            {icon && (
              <div className={styles.icon}>
                <Image
                  src={icon}
                  alt={heading}
                  width={120}
                  height={120}
                />
              </div>
            )}

            <div className={styles.text}>
              <h2>{heading}</h2>

              {description && (
                <PortableText value={description} />
              )}
            </div>
          </div>

          {/* {buttonText && buttonUrl && ( */}
            <Link
              href={`/${buttonUrl}`}
              className={styles.button}
            >
              {buttonIcon && (
                <Image
                  src={buttonIcon}
                  alt=""
                  width={30}
                  height={30}
                />
              )}

              <span>{buttonText}</span>
            </Link>
          {/* )} */}
        </div>
      </div>
    </section>
  );
};

export default EscriptBanner;