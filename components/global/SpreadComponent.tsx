"use client";

import { JSX, useMemo } from "react";
import { Banner } from "../sections/hero-sections/Banner";
import VideoHeroBanner from "../sections/hero-sections/VideoHeroBanner";
import ImageGrid from "../sections/images/ImageGrid";
import RichtextWithCta from "../sections/text-sections/RichtextWithCta";
import RichtextWithGroupedCTA from "../sections/text-sections/RichtextWithGroupedCTA";
import RichtextWithImage from "../sections/text-sections/RichtextWithImage";
import TwoColumnLayout from "../sections/text-sections/TwoColumnLayout";
import { COMPONENTS, SectionType } from "./components";
import HeadingWithLink from "../sections/text-sections/HeadingWithLink";
import MultiRow from "../sections/images/MultiRow";
import ContactSection from "../sections/contact/ContactSection";
import Richtext from "../sections/text-sections/Richtext";

const sectionRenderers: Record<
  SectionType,
  (component: COMPONENTS, activeSection?: string) => JSX.Element | null
> = {
  video_banner: (component) => (
    <VideoHeroBanner
      heading={component.heading}
      video_url={component.video_url || ""}
    />
  ),
  banner: (component) => (
    <Banner
      title={component.title || ""}
      image={component.image || ""}
      back_image={component.back_image || ""}
      doc_img={component.doc_img || ""}
      link={component.link}
      title_image={component.title_image || ""}
      description={component.description || []}
      title_array={component.title_array || []}
    />
  ),
  twoColumnLayout: (component) => (
    <TwoColumnLayout
      title={component.title || ""}
      leftDescription={component.leftDescription || []}
      rightDescription={component.rightDescription || []}
      layoutPosition={component.layoutPosition}
    />
  ),
  imageGrid: (component) => (
    <ImageGrid rows={component.rows || []} />
  ),
  // richtext_with_image: (component) => (
  //   <RichtextWithImage
  //     title={component.title || ""}
  //     image={component.image}
  //     description={component.description || []}
  //     background_image={component.background_image || ""}
  //   />
  // ),
  richtext_with_cta: (component) => (
    <RichtextWithCta
      title={component.title || ""}
      description={component.description || []}
      cta_buttons={component.cta_buttons || []}
      activeItem={component.activeItem || 0}
      desktop_left_width={component.desktop_left_width || 0}
    />
  ),
  richtext: (component) => (
    <Richtext
      eyebrow={component.eyebrow || ""}
      title={component.title || ""}
      rightDescription={component.rightDescription || []}
    />
  ),
  richtext_with_grouped_cta: (component, activeSection) => (
    <RichtextWithGroupedCTA
      title={component.title || ""}
      cta_groups={component.cta_groups || []}
      desktop_left_width={component.desktop_left_width || 0}
      activeSection={activeSection}
    />
  ),
  heading_with_link: (component) => (
    <HeadingWithLink 
      heading={component.heading || ""}
      eyebrow={component.eyebrow || ""}
      eyebrow_max_width={component.eyebrow_max_width || 0}
      left_description={component.left_description }
      right_description={component.right_description }
      button_text={component.button_text || ""}
      button_link={component.button_link || ""}
    />
  ),
  multi_row: (component) => (
    <MultiRow members={component.members || []} />
  ),
  contact_section: (component) => (
    <ContactSection 
      eyebrow={component.eyebrow || ""}
      heading={component.heading || ""}
      button_text={component.button_text || ""}
      offices={component.offices || []}
      button_link={component.button_link || ""}
    />
  )
};

export default function SpreadComponents({
  components,
  activeSection,
}: {
  components: COMPONENTS[];
  activeSection?: string;
}) {
  const normalizedComponents = useMemo(() => {
    if (!Array.isArray(components)) {
      return [] as COMPONENTS[];
    }

    return components.filter(
      (component): component is COMPONENTS =>
        Boolean(component) &&
        typeof component === "object" &&
        typeof component._type === "string"
    );
  }, [components]);

  const renderedSections = useMemo(
    () =>
      normalizedComponents.map((component, index) => {
        const content = sectionRenderers[component._type as SectionType]?.(
          component,
          activeSection
        );

        if (!content) {
          return null;
        }

        return (
          <div
            key={component._key ?? `${component._type}-${index}`}
            className={`${component._type}-section`}
          >
            {content}
          </div>
        );
      }),
    [normalizedComponents, activeSection]
  );

  return <>{renderedSections}</>;
}