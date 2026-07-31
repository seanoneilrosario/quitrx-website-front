/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { PortableText } from "@portabletext/react";
import { urlFor } from "@/sanity/lib/image";
import "./richtextwithimage.css";
import { PortableTextBlock } from "@/components/global/components";
import Image from "next/image";

interface Props {
  title?: string;
  image?: any;
  background_image?: any;
  description: PortableTextBlock[];
  
}

const RichtextWithImage = ({ title, image, background_image, description }: Props) => {
  const imageUrl = image ? urlFor(image).auto("format").url() : "";
  const backgroundImageUrl = background_image ? urlFor(background_image).auto("format").url() : "";

  return (
    <section className="richtext-with-image relative">
      <Image
        src={backgroundImageUrl}
        alt="Background image"
        width={2000}
        height={2000}
        className="richtext-with-image__background absolute top-0 left-0 w-full h-full object-cover z-[-1]"
      />
      <div className="richtext-with-image__container">
        {image && (
          <div className="richtext-with-image__image">
            <Image
              src={imageUrl}
              alt={image.alt || "Richtext image"}
              width={100}
              height={100}
              className="richtext-with-image__img"
            />
            {image.caption && (
              <p className="richtext-with-image__caption">{image.caption}</p>
            )}
          </div>
        )}

        <div className="richtext-with-image__content">
          {title && <h2 className="richtext-with-image__title">{title}</h2>}
          <div className="richtext-with-image__description">
            <PortableText value={description} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default RichtextWithImage;
