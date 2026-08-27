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
import TextBlocks from "../sections/text-sections/TextBlocks";
import EscriptBanner from "../sections/text-sections/EscriptBanner";
import TextBlocksIcon from "../sections/text-sections/TextBlocksIcon";
import TextImage from "../sections/images/TextImage";
import Faq from "../sections/text-sections/Faq";
import SupportForm from "../sections/customs/SupportForm";
import FloatingCTA from "../sections/text-sections/floatingCTA";
import RichtextImage from "../sections/text-sections/RichtextWithImage";
import { urlFor } from "@/sanity/lib/image";
import PromotionalBannerSlider from "../sections/hero-sections/PromotionalBannerSlider";
import BrandGrid from "../sections/images/BrandGrid";
import ProductApiGrid from "../sections/products/ProductApiGrid";

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
      disclaimer={component.disclaimer || []}
      title_array={component.title_array || []}
      button_text={component.button_text || ""}
      button_url={component.button_url?.slug || ""}
      secondary_button_text={component.secondary_button_text || ""}
      secondary_button_link={component.secondary_button_link || ""}
      hide_separator={component.hide_separator}
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
  richtextImage: (component) => (
    <RichtextImage
      image={
        component.image
      }
      title_array={component.title_array || []}
      content={component.content}
      paddingTop={component.paddingTop}
      paddingBottom={component.paddingBottom}
    />
  ),
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
  ),
  prescription_comparison: (component) => (
    <TextBlocks
      heading={component.heading || ""}
      description={component.description || []}
      icon={component.comparisonIcon}
      audience={component.audience}
      cardTitle={component.card_title}
      cardDescription={component.card_description}
      features={component.comparison_features || []}
      buttonText={component.comparison_button_text}
      buttonLink={component.comparison_button_link}
      disclaimer={component.comparison_disclaimer}
      paddingTop={component.paddingTop || 0}
      paddingBottom={component.paddingBottom || 0}
      // isLoggedIn={isLoggedIn}
      // isLoggedIn={true}
      // customer={true}
      // openLoginPopup={openLoginPopup}
    />
  ),
  escript_banner: (component) => (
    <EscriptBanner
      heading={component.heading || ""}
      description={component.description || []}
      icon={component.icon}
      buttonIcon={component.buttonIcon}
      buttonText={component.button_text || ""}
      buttonUrl={component.button_url?.slug || ""}
      paddingTop={component.paddingTop || 0}
      paddingBottom={component.paddingBottom || 0}
    />
  ),
  text_block_with_icon: (component) => (
    <TextBlocksIcon
      title_array={component.title_array || []}
      subHeading={component.sub_heading || ""}
      box={component.box || []}
      paddingTop={component.paddingTop ?? 60}
      paddingBottom={component.paddingBottom ?? 60}
    />
  ),
  text_image: (component) => (
    <TextImage
      heading={component.heading || ""}
      subHeading={component.sub_heading || ""}
      theme={component.theme || "dark"}
      contentTheme ={component.contentTheme  || "plaintext"}
      frontImage={component.frontImage || ""}
      backImage={component.backImage || ""}
      content={component.content || []}
      bullets={component.bullets || []}
      paddingTop={component.paddingTop || 0}
      paddingBottom={component.paddingBottom || 0}
      imageTheme={component.imageTheme || "double"}
    />
  ),
  faq: (component) => (
    <Faq
      heading={component.heading || ""}
      paddingTop={component.paddingTop || 0}
      paddingBottom={component.paddingBottom || 0}
      items={component.items || []}
    />
  ),
  supportForm: (component) => (
    <SupportForm
      title={component.title || ""}
      paddingTop={component.paddingTop || 0}
      paddingBottom={component.paddingBottom || 0}
    />
  ),
  floatingCTA: (component) => (
    <FloatingCTA
      icon={component.icon}
      title_array={component.title_array || []}
      text={component.text || []}
      button_text={component.button_text}
      button_link={component.button_link}
    />
  ),
  promotional_banner_slider: (component) => (
    <PromotionalBannerSlider
      slides={component.slides || []}
      autoplay={component.autoplay}
    />
  ),
  brand_grid: (component) => (
    <BrandGrid
      heading={component.heading}
      brands={component.brands || []}
      desktopPaddingTop={component.desktopPaddingTop}
      desktopPaddingBottom={component.desktopPaddingBottom}
      mobilePaddingTop={component.mobilePaddingTop}
      mobilePaddingBottom={component.mobilePaddingBottom}
    />
  ),
  product_api_grid: (component) => (
    <ProductApiGrid
      heading={component.heading}
      productLimit={component.productLimit}
      displayMode={component.displayMode}
      paddingTop={component.paddingTop}
      paddingBottom={component.paddingBottom}
      desktopPaddingTop={component.desktopPaddingTop}
      desktopPaddingBottom={component.desktopPaddingBottom}
      mobilePaddingTop={component.mobilePaddingTop}
      mobilePaddingBottom={component.mobilePaddingBottom}
    />
  ),
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
            id={component.sectionId || undefined}
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
