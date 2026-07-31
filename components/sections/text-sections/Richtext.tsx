"use client";

import Link from "next/link";
import { PortableText } from "next-sanity";
import { PortableTextBlock } from "@/components/global/components";
import styles from "./Richtext.module.css";

interface RichtextProps {
  eyebrow?: string;
  title?: string;
  rightDescription?: PortableTextBlock[];
  buttonText?: string;
  buttonLink?: string;
}

export default function Richtext({
  eyebrow,
  title,
  rightDescription,
  buttonText,
  buttonLink,
}: RichtextProps) {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.wrapper}>
          {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}

          {title && <h2 className={styles.title}>{title}</h2>}

          {rightDescription && rightDescription.length > 0 && (
            <div className={styles.content}>
              <div className={styles.description}>
                <PortableText value={rightDescription} />
              </div>
            </div>
          )}

          {buttonLink && buttonText && (
            <Link href={buttonLink} className={styles.button}>
              <span>{buttonText}</span>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
