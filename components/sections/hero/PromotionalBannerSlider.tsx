"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useAccountCustomer } from "@/hooks/useAccountCustomer";

type PromotionalSlide = {
  _key?: string;
  image?: string;
  mobileImage?: string;
  alt?: string;
  pageSlug?: string;
  pageType?: string;
  url?: string;
  openInNewTab?: boolean;
};

type PromotionalBannerSliderProps = {
  slides: PromotionalSlide[];
  autoplay?: boolean;
};

function getHref(slide: PromotionalSlide) {
  if (slide.pageType === "home") return "/";
  if (slide.pageSlug) return `/${slide.pageSlug}`;
  return slide.url;
}

export default function PromotionalBannerSlider({
  slides,
  autoplay = true,
}: PromotionalBannerSliderProps) {
  const { customer, loading } = useAccountCustomer();
  const visibleSlides = slides.filter((slide) => Boolean(slide.image));
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const slideCount = visibleSlides.length;

  useEffect(() => {
    if (!autoplay || isPaused || slideCount < 2) return;

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slideCount);
    }, 5500);

    return () => window.clearInterval(timer);
  }, [autoplay, isPaused, slideCount]);

  if (loading || !customer || !slideCount) return null;

  const safeActiveIndex = activeIndex % slideCount;

  const goToPrevious = () => {
    setActiveIndex((current) => (current - 1 + slideCount) % slideCount);
  };

  const goToNext = () => {
    setActiveIndex((current) => (current + 1) % slideCount);
  };

  return (
    <section
      className="promotional-banner-slider"
      aria-label="Promotions"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div
        className="promotional-banner-slider__track"
        style={{ transform: `translateX(-${safeActiveIndex * 100}%)` }}
      >
        {visibleSlides.map((slide, index) => {
          const href = getHref(slide);
          const media = (
            <div
              className={`promotional-banner-slider__media${
                slide.mobileImage
                  ? " promotional-banner-slider__media--has-mobile"
                  : ""
              }`}
            >
              <Image
                className="promotional-banner-slider__desktop-image"
                src={slide.image!}
                alt={slide.alt || "Promotional banner"}
                width={1920}
                height={640}
                sizes="100vw"
                priority={index === 0}
              />
              {slide.mobileImage && (
                <Image
                  className="promotional-banner-slider__mobile-image"
                  src={slide.mobileImage}
                  alt={slide.alt || "Promotional banner"}
                  width={768}
                  height={768}
                  sizes="100vw"
                  priority={index === 0}
                />
              )}
            </div>
          );

          return (
            <div
              className="promotional-banner-slider__slide"
              key={slide._key || `${slide.image}-${index}`}
              aria-hidden={index !== safeActiveIndex}
            >
              {href ? (
                <Link
                  href={href}
                  className="promotional-banner-slider__link"
                  target={slide.openInNewTab ? "_blank" : undefined}
                  rel={slide.openInNewTab ? "noreferrer" : undefined}
                  tabIndex={index === safeActiveIndex ? undefined : -1}
                >
                  {media}
                </Link>
              ) : (
                media
              )}
            </div>
          );
        })}
      </div>

      {slideCount > 1 && (
        <>
          <button
            type="button"
            className="promotional-banner-slider__arrow promotional-banner-slider__arrow--previous"
            onClick={goToPrevious}
            aria-label="Previous promotion"
          >
            <span>
              &#8249;
            </span>
          </button>
          <button
            type="button"
            className="promotional-banner-slider__arrow promotional-banner-slider__arrow--next"
            onClick={goToNext}
            aria-label="Next promotion"
          >
            <span>
              &#8250;
            </span>
          </button>
          <div className="promotional-banner-slider__pagination">
            {visibleSlides.map((slide, index) => (
              <button
                type="button"
                key={slide._key || `${slide.image}-${index}`}
                className={`promotional-banner-slider__dot${
                  index === safeActiveIndex
                    ? " promotional-banner-slider__dot--active"
                    : ""
                }`}
                onClick={() => setActiveIndex(index)}
                aria-label={`Go to promotion ${index + 1}`}
                aria-current={index === safeActiveIndex ? "true" : undefined}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
