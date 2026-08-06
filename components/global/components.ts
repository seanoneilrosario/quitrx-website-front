/* eslint-disable @typescript-eslint/no-explicit-any */


export interface PortableTextChild {
  _type: string;
  text?: string;
}

export interface PortableTextBlock {
  _type: string;
  style?: string;
  children?: PortableTextChild[];
}

interface GridImage {
  image: {
    asset: {
      _id: string;
      url: string;
    };
    hotspot?: {
      x: number;
      y: number;
      height: number;
      width: number;
    };
  };
  alt: string;
  caption?: string;
  link?: string;
}

interface GridRow {
  columns: number;
  images: GridImage[];
}

export interface CTAButtonsProps {
  label: string;
  description: PortableTextBlock[];
}

interface CTAButton {
  label: string;
  description: PortableTextBlock[];
}

interface CTAGroup {
  group_title: string;
  buttons: CTAButton[];
}

interface Office {
  title: string;
  address: PortableTextBlock[];
  phone: string;
}

export interface TextBlocksIconBox {
  image?: string;

  step?: string;

  title?: string;

  description?: PortableTextBlock[];

  label_1?: string;
  description_1?: string;

  label_2?: string;
  description_2?: string;

  label_3?: string;
  description_3?: string;

  label_4?: string;
  description_4?: string;

  row_direction?: boolean;
}

export interface TextImageBullet {
  content?: PortableTextBlock[];
}

export interface FAQItem {
  question: string;
  answer?: PortableTextBlock[];
}


export type SectionType =
  | "video_banner"
  | "banner"
  | "twoColumnLayout"
  | "imageGrid"
  | "richtext_with_cta"
  | "richtext"
  | "richtext_with_grouped_cta"
  // | "richtext_with_image"
  | "heading_with_link"
  | "multi_row"
  | "contact_section"
  | "prescription_comparison"
  | "escript_banner"
  | "text_block_with_icon"
  | "text_image"
  | "faq"
  | "supportForm"
  | "floatingCTA"
  | "richtextImage"
  | "promotional_banner_slider"



export interface COMPONENTS {
  _key: string;
  _type: SectionType;
  sectionId?: string;
  title?: string;
  heading?: string;
  video_url?: string;
  image?: string;
  back_image?: string;
  doc_img? : string;
  front_image?: any;
  link?: string;
  title_image?: string;
  layoutPosition?: string;
  leftDescription?: PortableTextBlock[];
  rightDescription?: PortableTextBlock[];
  description?: PortableTextBlock[];
  text?: PortableTextBlock[];
  activeItem?: number;
  desktop_left_width?: number;
  rows?: GridRow[];
  cta_buttons?: CTAButtonsProps[];
  cta_groups?: CTAGroup[];
  title_array?: PortableTextBlock[];
  eyebrow?: string;
  left_description?: string;
  right_description?: string;
  button_text?: string;
  button_link?: string;
  background_image?: string;
  eyebrow_max_width?: number;
  paddingTop?: number;
  paddingBottom?: number;
  sub_heading?: string;
  hide_separator: boolean;
  members?: {
    image: {
      asset: {
        _id: string;
        url: string;
      };
      hotspot?: {
        x: number;
        y: number;
        height: number;
        width: number;
      };
    };
    name: string;
    position: string;
    description: PortableTextBlock[];
  }[];
  offices: Office[];
  button_url?: {
    slug: string;
  };
  icon?: string;
  buttonIcon?: string;
  box: TextBlocksIconBox[];
   theme?: "dark" | "light";

  contentTheme?: "plaintext" | "img_bullet";

  imageTheme?: "double" | "single";

  frontImage?: string;

  backImage?: string;

  content?: PortableTextBlock[];

  bullets?: TextImageBullet[];

  items: FAQItem[];
  slides?: {
    _key?: string;
    image?: string;
    mobileImage?: string;
    alt?: string;
    pageSlug?: string;
    pageType?: string;
    url?: string;
    openInNewTab?: boolean;
  }[];
  autoplay?: boolean;
}
