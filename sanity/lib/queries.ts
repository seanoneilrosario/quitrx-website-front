const PAGE_COMPONENTS = `
  components[]{
    _type,
    sectionId,
    title,
    link,
    heading,
    eyebrow,
    description,
    disclaimer,
    text,
    sub_heading,
    paddingTop,
    paddingBottom,
    productLimit,
    displayMode,
    "collection": collection->{title, "slug": slug.current, "image": coalesce(image.asset->url, featuredImageUrl)},
    "collections": collections[]->{title, "slug": slug.current, "image": coalesce(image.asset->url, featuredImageUrl)},
    "comparisonIcon": comparison_icon.asset->url,
    audience,
    card_title,
    card_description,
    comparison_features[]{
      _key,
      text,
      details
    },
    comparison_button_text,
    comparison_button_link,
    comparison_disclaimer,
    desktopPaddingTop,
    desktopPaddingBottom,
    mobilePaddingTop,
    mobilePaddingBottom,
    hide_separator,
    body,
    "video": video.asset->url,
    "image": image.asset->url,
    "title_image": title_image.asset->url,
    "back_image": back_image.asset->url,
    "doc_img": doc_img.asset->url,
    front_image{
      asset->{
        url,
        metadata {
          dimensions
        }
      },
      alt
    },
    video_url,
    "poster": poster.asset->url,
    activeItem,
    desktop_left_width,
    cta{
      label,
      link
    },
    layoutPosition,
    leftDescription,
    rightDescription,
    description,
    rows[]{
      columns,
      images[]{
        "image": image.asset->url,
        alt,
        link
      }
    },
    cta_buttons[]{
      label,
      description
    },
    cta_groups[]{
      group_title,
      buttons[]{
        label,
        description
      }
    },
    title_array,
    eyebrow,
    heading,
    left_description,
    right_description,
    button_text,
    button_style,
    button_link,
    secondary_button_text,
    secondary_button_style,
    secondary_button_link,
    "background_image": background_image.asset->url,
    eyebrow_max_width,
    members[]{
      image{
        asset->{
          _id,
          url
        },
        hotspot{
          x,
          y,
          height,
          width
        }
      },
      name,
      position,
      description
    },
    offices[]{
      title,
      address,
      phone
    },
    button_url-> {
      "slug": slug.current
    },
    "buttonIcon": buttonIcon.asset->url,
    "icon": icon.asset->url,
    "box": box[]{
      step,
      title,

      description,
      button_text,
      button_link,
      disclaimer,

      "image": image.asset->url,

      label_1,
      description_1,

      label_2,
      description_2,

      label_3,
      description_3,

      label_4,
      description_4,

      row_direction
    },
    theme,
    contentTheme,
    imageTheme,
    "frontImage": frontImage.asset->url,
    "backImage": backImage.asset->url,
    content,
     bullets[]{
      content
    },
    items[]{
      question,
      answer
    },
    autoplay,
    slides[]{
      _key,
      "image": image.asset->url,
      "mobileImage": mobileImage.asset->url,
      alt,
      url,
      openInNewTab,
      "pageSlug": page->slug.current,
      "pageType": page->_type
    },
    brands[]{
      _key,
      name,
      "logo": logo.asset->url,
      alt,
      url,
      openInNewTab,
      "pageSlug": page->slug.current,
      "pageType": page->_type
    }
  }
`;

const PAGE_METADATA = `
  _type,
  title,
  "slug": slug.current,
  metaDescription,
  "meta_image": meta_image.asset->url,
  "background_image": background_image.asset->url,
  no_padding_x,
  no_padding_y,
`;

export const NAVIGATION = `*[_type == "navigation"][0]{
  title,
  "headerLogo": header_logo.asset->url,
  "header_logo2": header_logo2.asset->url,
  "headerLogoAlt": header_logo.alt,
  "headerLogoMenu": header_logo2.asset->url,
  "headerLogoMenuAlt": header_logo2.alt,
  "footerLogo": footer_logo.asset->url,
  header_menu[]{
    title,
    link,
    "href": coalesce(
      link,
      anchor,
      select(
        page.slug->_type == "home" => "/",
        defined(page.slug->slug.current) => "/" + page.slug->slug.current,
        "#"
      )
    )
  },
  footer_menu[]{
    title,
    link
  },
  socials[]{
    "icon": icon.asset->url,
    link
  },
  contact_email,
  company_info,
  "footer_background_image": footer_background_image.asset->url
}`;

export const SETTINGS = `*[_type == "settings"][0]{
  ...,
  defaultTheme
}`;

export const GET_ALL_PAGE_BG_POSITION = `*[_type in ["page", "home"]]{
  _id,
  _type,
  title,
  "slug": slug.current,
  page_bg_position
}`;

export const HOME_QUERY = `*[_type == "home"][0]{
  _type,
  title,
  "slug": slug.current,
  metaDescription,
  "meta_image": meta_image.asset->url,
  ${PAGE_COMPONENTS}
}`;

export const PAGE_QUERY = `*[_type == "page" && slug.current == $slug][0]{
  ${PAGE_METADATA}
  ${PAGE_COMPONENTS}
}`;

export const ALLPAGE_QUERY = `*[_type == "page"]{
  title,
  "slug": slug.current,
  _type
}`;

export const HEADER_SEARCH_QUERY = `*[_type in ["page", "home"]] | order(title asc){
  _id,
  _type,
  title,
  "slug": slug.current,
  metaDescription
}`;

export const FACE_QUERY = `*[_type == "page" && slug.current == "face"][0]{
  ${PAGE_METADATA}
  ${PAGE_COMPONENTS}
}`;

export const BODY_QUERY = `*[_type == "page" && slug.current == "body"][0]{
  ${PAGE_METADATA}
  ${PAGE_COMPONENTS}
}`;

export const SKIN_QUERY = `*[_type == "page" && slug.current == "skin"][0]{
  ${PAGE_METADATA}
  ${PAGE_COMPONENTS}
}`;
