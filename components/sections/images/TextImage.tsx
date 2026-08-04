"use client";

import "./text-image.css";

import Image from "next/image";
import { PortableText } from "next-sanity";
import { PortableTextBlock, TextImageBullet } from "@/components/global/components";

interface TextImageProps {
  heading?: string;
  subHeading?: string;

  theme?: "dark" | "light";

  contentTheme?: "plaintext" | "img_bullet";

  imageTheme?: "double" | "single";

  frontImage?: string;

  backImage?: string;

  content?: PortableTextBlock[];

  bullets?: TextImageBullet[];

  paddingTop?: number;

  paddingBottom?: number;
}

export default function TextImage({
  heading,
  subHeading,
  theme = "dark",
  imageTheme = "double",
  contentTheme = "plaintext",
  frontImage,
  backImage,
  content,
  bullets,
  paddingTop = 60,
  paddingBottom = 60,
}: TextImageProps) {
  console.log(imageTheme)
  return (
   <section
  className={`text-img_wrap ${
    theme === "dark" ? "text-img--dark" : "text-img--light"
  }`}
  style={{
    paddingTop,
    paddingBottom,
  }}
>
  <div className="page-width">

    <h2 className="text-img_title">
      {heading}
    </h2>

    <h4 className="text-img_sub-head">
      {subHeading}
    </h4>

    <div className="text-img_container">

      <div className="text-img_image">

        {frontImage && (
          <Image
            src={frontImage}
            alt=""
            width={900}
            height={900}
            className={`text-img_img_ppl ${
              imageTheme === "single" ? "small_img" : ""
            }`}
          />
        )}

        {backImage && imageTheme === "double" && (
          <Image
            src={backImage}
            alt=""
            width={900}
            height={900}
            className="text-img_img_bg"
          />
        )}

      </div>

      <div className="text-img_contents">

        {contentTheme === "plaintext" ? (
          <PortableText value={content ?? []} />
        ) : (
          bullets?.map((item, index) => (
            <div
              key={index}
              className="bulleted_content"
            >
              <Image
                src="https://cdn.sanity.io/images/bd7slutt/production/fbb85c86f4d81d84d37d52a49bfe93bb84ff51be-10x10.svg"
                width={20}
                height={20}
                alt=""
                className="text-img_bullet"
              />

              <div className="bulleted_content_texts">
                <PortableText value={item.content ?? []} />
              </div>
            </div>
          ))
        )}

      </div>

    </div>

  </div>
</section>
  );
}