"use client";

import Image from "next/image";
import Link from "next/link";
import { PortableText } from "next-sanity";
import { PortableTextBlock } from "@/components/global/components";
import "./TextBlocks.css";

type ComparisonFeature = {
  _key?: string;
  text?: string;
  details?: string[];
};

interface TextBlocksProps {
  heading: string;
  description?: PortableTextBlock[];
  icon?: string;
  audience?: string;
  cardTitle?: string;
  cardDescription?: PortableTextBlock[];
  features?: ComparisonFeature[];
  buttonText?: string;
  buttonLink?: string;
  disclaimer?: PortableTextBlock[];
  paddingTop?: number;
  paddingBottom?: number;
}

const TextBlocks = ({
  heading,
  description,
  icon,
  audience,
  cardTitle,
  cardDescription,
  features = [],
  buttonText,
  buttonLink,
  disclaimer,
  paddingTop = 36,
  paddingBottom = 36,
}: TextBlocksProps) => {
  return (
    <section
      className="text-blocks_wrap"
      style={{ paddingTop, paddingBottom }}
    >
      <div className="comparison-heading">
        <h2>{heading}</h2>
        {description && <PortableText value={description} />}
      </div>

      <div className="comparison-card page-width">
        <div className="comparison-card__top">
          {icon && (
            <span className="comparison-card__icon">
              <Image src={icon} width={96} height={96} alt="" />
            </span>
          )}
          {audience && (
            <span className="comparison-card__audience">{audience}</span>
          )}
        </div>

        {cardTitle && <h3>{cardTitle}</h3>}

        {cardDescription && (
          <div className="comparison-card__description">
            <PortableText value={cardDescription} />
          </div>
        )}

        {features.length > 0 && (
          <ul className="comparison-card__features">
            {features.map((feature, index) => (
              <li key={feature._key || `${feature.text}-${index}`}>
                <span className="comparison-card__check" aria-hidden="true">
                  ✓
                </span>
                <div>
                  {feature.text && <strong>{feature.text}</strong>}
                  {feature.details && feature.details.length > 0 && (
                    <ul className="comparison-card__details">
                      {feature.details.map((detail) => (
                        <li key={detail}>{detail}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        {buttonText && (
          <Link href={buttonLink || "#"} className="comparison-card__button">
            {buttonText}
          </Link>
        )}

        {disclaimer && (
          <div className="comparison-card__disclaimer">
            <PortableText value={disclaimer} />
          </div>
        )}
      </div>
    </section>
  );
};

export default TextBlocks;
