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



export interface COMPONENTS {
  _key: string;
  _type: SectionType;
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
}