import { type SchemaTypeDefinition } from "sanity";

import { blockContentType } from "./objects/block-content";
import { categoryType } from "./documents/category";
import { postType } from "./documents/post";
import { authorType } from "./documents/author";
import { navigationType } from "./documents/navigation";
import { pageType } from "./documents/page";
import { homeType } from "./documents/home";
// import {footerType} from './documents/footer'
import { videoBanner } from "./sections/video-banner";
import { banner } from "./sections/banner";
import twoColumnLayout from "./sections/two-column-layout";
import imageGrid from "./sections/image-grid";
import richtext_with_cta from "./sections/richtext-with-cta";
import richtext_with_image from "./sections/richtext-with-image";
import { richtextWithGroupedCTA } from "./sections/richtext-with-grouped-cta";
import richtext from "./sections/richtext";
import heading_with_link from "./sections/heading-with-link";
import multi_row from "./sections/multi-row";
import contact_section from "./sections/contact-section";
import { productType } from "./documents/product";
import { prescriptionComparison } from "./sections/text-blocks";
import { imageDocument } from "./documents/image-document";
import { escriptBanner } from "./sections/escript-banner";
import textBlockWithIcon from "./sections/text-block-with-icon";
import { textImage } from "./sections/text-image";
import faq from "./sections/faq";
import { externalForm } from "./sections/external-form";
import { floatingCTASchema } from "./sections/floating-cta";
import banner_slider from "./sections/banner-slider";
import promotional_banner_slider from "./sections/promotional-banner-slider";
import brand_grid from "./sections/brand-grid";
import product_api_grid from "./sections/product-api-grid";
import { intakeForm } from "./sections/intake-form";
import { uploadPrescription } from "./sections/upload-prescription";
import { escriptRequest } from "./sections/escript-request";
import { productCollectionType } from "./documents/product-collection";

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [
    // templates
    blockContentType,
    categoryType,
    postType,
    authorType,
    navigationType,
    pageType,
    homeType,
    productType,
    productCollectionType,
    imageDocument,
    // components
    videoBanner,
    banner,
    twoColumnLayout,
    imageGrid,
    richtext_with_cta,
    richtext_with_image,
    richtextWithGroupedCTA,
    richtext,
    heading_with_link,
    multi_row,
    contact_section,
    prescriptionComparison,
    escriptBanner,
    textBlockWithIcon,
    textImage,
    faq,
    externalForm,
    floatingCTASchema,
    banner_slider,
    promotional_banner_slider,
    brand_grid,
    product_api_grid,
    intakeForm,
    uploadPrescription,
    escriptRequest,
  ],
};
