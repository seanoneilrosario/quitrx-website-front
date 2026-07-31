"use client"

import { motion } from "motion/react"

interface VideoHeroBannerProps {
  heading?: string;
  video_url: string
}

export default function VideoHeroBanner({
  heading,
  video_url
}: VideoHeroBannerProps) {
  return (
  <section className="video-hero-banner">

      <div className="video-hero-banner__media">
        <iframe
          className="video-hero-banner__video"
          src={`${video_url}?&autoplay=1&loop=1&muted=1&controls=0&title=0&byline=0&portrait=0`}
          frameBorder="0"
          allow="autoplay; fullscreen"
          allowFullScreen
        />
      </div>

      {/* <div className="video-hero-banner__overlay" /> */}

      <div className="video-hero-banner__content">
        <h1 className="video-hero-banner__title">
          {heading}
        </h1>
      </div>

    </section>
  );
}