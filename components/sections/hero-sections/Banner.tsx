/* eslint-disable @next/next/no-img-element */
/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { PortableText } from "@portabletext/react";
import { PortableTextBlock } from "@/components/global/components";
import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import arrow from "@/public/Icon feather-arrow-down.svg";

interface BannerProps {
  image: string;
  back_image: string;
  doc_img: any;
  title: string;
  link?: string;
  title_image?: string;
  description: PortableTextBlock[];
  title_array: PortableTextBlock[];
  button_text?: string;
  button_url?: string;
}

export function Banner({
  image,
  back_image,
  doc_img,
  title,
  link,
  title_image,
  description,
  title_array,
  button_text,
  button_url
}: BannerProps) {
  const handleScrollDown = (event?: React.MouseEvent<HTMLButtonElement>) => {
    event?.preventDefault();
    event?.stopPropagation();

    window.scrollBy({
      top: 500,
      behavior: "smooth"
    });
  };

  console.log(doc_img)

  const content = (
    <section className="hero-banner page-width">
      {image && 
        <Image
          src={image}
          alt={title}
          fill
          priority
          className="hero-banner-bg"
        />
      }


      {title_image && (
        <div className="hero-logo">
          <Image
            src={title_image}
            alt={title}
            width={90}
            height={90}
          />
        </div>
      )}

      <div className="hero-center">
            {!title_array.length && (
              <motion.h1
                className="hero-title"
                initial={{ y: 8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              >
                {title}
              </motion.h1>
            )}

            {title_array.length > 0 && (
              <motion.div
                className="hero-title-array"
                initial={{ y: 8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, ease: "easeOut", delay: 0.05 }}
              >
                <PortableText value={title_array} />
              </motion.div>
        )}
        
        <span className="border-separator"></span>
            <motion.div
              className="hero-description"
              initial={{ y: 6, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.7, ease: "easeOut", delay: 0.12 }}
            >
              <PortableText value={description} />
        </motion.div>
        
        <div className="banner-links">
          <Link href={button_url || "#"} className="banner-button">
            {button_text || "Learn More"}
          </Link>
        </div>
      </div>
    <div className="text-img-fullbg_img">
      {back_image && 
        <Image
          className="back_image"
          src={back_image}
          alt={title}
          width={1000}
          height={1000}
        />
      }
      {/* {doc_img && 
        <Image
          className="front_image"
          src={`${doc_img}`}
          alt={title}
          width={1000}
          height={1000}
        />
      } */}
        <img src={doc_img} className="front_image" width={1000} height={1000} />
        {/* <div>{doc_img}</div> */}
    </div>

      {/* <button
        type="button"
        className="hero-scroll"
        onClick={handleScrollDown}
        aria-label="Scroll down"
      >
        <Image
          src={arrow}
          alt="Scroll down"
          width={17}
          height={17}
          className="mx-auto"
        />
      </button> */}
    </section>
  );

  if (link) {
    return (
      <Link href={link}>
        {content}
      </Link>
    );
  }

  return content;
}