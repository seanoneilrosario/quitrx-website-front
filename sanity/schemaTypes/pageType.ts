import { DocumentTextIcon } from "@sanity/icons";
import { ALL_FIELDS_GROUP, defineField, defineType } from "sanity";

export const pageType = defineType({
  name: "page",
  title: "Page",
  type: "document",
  icon: DocumentTextIcon,
  groups: [
    {
      name: "content",
      title: "Content",
    },
    {
      name: "seo",
      title: "SEO",
    },
    {
      name: "settings",
      title: "Settings",
    },
    {
      ...ALL_FIELDS_GROUP,
      hidden: true,
    },
  ],
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      group: "content",

    }),
    defineField({
      name: "no_padding_x",
      title: "No Padding Left & Right",
      type: "boolean",
      group: "settings",

    }),
    defineField({
      name: "no_padding_y",
      title: "No Padding Top & Bottom",
      type: "boolean",
      group: "settings",

    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: {
        source: "title",
      },
      group: "content",

    }),
    defineField({
      name: "background_image",
      title: "Background Image",
      type: "image",
      group: "content",

    }),
    defineField({
      name: "components",
      title: "Components",
      type: "array",
      group: "content",
      of: [
        { type: "video_banner" },
        { type: "banner" },
        { type: "twoColumnLayout" },
        {type: "imageGrid"},
        { type: "richtext_with_cta" },
        { type: "richtext" },
        { type: "richtext_with_grouped_cta" },
        { type: "richtextImage" },
        { type: "heading_with_link" },
        { type: "multi_row" },
        { type: "contact_section" },
         { type: "prescription_comparison" },
        { type: "escript_banner" },
        { type: "text_block_with_icon" },
        { type: "text_image" },
        { type: "faq"},
        {type: "supportForm"},
        { type: "floatingCTA"}
      ],
      options: {
        insertMenu: {
          groups: [
            {
              name: "hero",
              title: "Hero",
              of: ["banner"],
            },
            {
              name: "text",
              title: "Text Blocks",
              of: [
                "twoColumnLayout",
                "richtext_with_cta",
                "richtext_with_grouped_cta",
                "richtextImage",
                "heading_with_link",
                "contact_section",
                "richtext",
                "prescription_comparison",
                "escript_banner",
                "text_block_with_icon",
                "faq",
                "floatingCTA"
                ],
            },
            {
              name: "banner",
              title: "Banners",
              of: ["video_banner"],
            },
            {
              name: "image",
              title: "Images",
              of: ["imageGrid", "multi_row", "text_image"],
            },
            {
              name: "custom-apps",
              title: "Custom Apps",
              of: [
                "supportForm"
              ],
            },
          ],
          // views: [
          //   {
          //     name: "grid",
          //     previewImageUrl: (block: string ) =>
          //       `/sanity/preview/${block}.png`,
          //   },
          //   { name: "list" },
          // ],
        },
      },
    }),
    defineField({
      name: "metaDescription",
      type: "text",
      group: "seo",
    }),
    defineField({
      name: "mainImage",
      type: "image",
      options: {
        hotspot: true,
      },
      group: "seo",

      fields: [
        defineField({
          name: "alt",
          type: "string",
          title: "Alternative text",
        }),
      ],
    }),
  ],
  preview: {
    select: {
      title: "title",
      media: "mainImage",
    },
    prepare(selection) {
      return { ...selection };
    },
  },
});
