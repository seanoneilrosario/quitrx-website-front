"use client";

import Link from "next/link";
import { A11y, Autoplay, Navigation, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

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
  const visibleSlides = slides.filter((slide) => Boolean(slide.image));

  if (!visibleSlides.length) return null;

  return (
    <section className="promotional-banner-slider" aria-label="Promotions">
      <Swiper
        modules={[A11y, Autoplay, Navigation, Pagination]}
        slidesPerView={1}
        loop={visibleSlides.length > 1}
        autoplay={autoplay && visibleSlides.length > 1 ? { delay: 5500, disableOnInteraction: false, pauseOnMouseEnter: true } : false}
        navigation={visibleSlides.length > 1}
        pagination={{ clickable: true }}
      >
        {visibleSlides.map((slide, index) => {
          const href = getHref(slide);
          const image = (
            <picture>
              {slide.mobileImage && <source media="(max-width: 767px)" srcSet={slide.mobileImage} />}
              <img src={slide.image} alt={slide.alt || "Promotional banner"} />
            </picture>
          );

          return (
            <SwiperSlide key={slide._key || `${slide.image}-${index}`}>
              {href ? (
                <Link
                  href={href}
                  className="promotional-banner-slider__link"
                  target={slide.openInNewTab ? "_blank" : undefined}
                  rel={slide.openInNewTab ? "noreferrer" : undefined}
                >
                  {image}
                </Link>
              ) : (
                <div className="promotional-banner-slider__image">{image}</div>
              )}
            </SwiperSlide>
          );
        })}
      </Swiper>
    </section>
  );
}
