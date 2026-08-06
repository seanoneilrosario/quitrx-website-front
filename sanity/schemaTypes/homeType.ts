import { HomeIcon } from "@sanity/icons";
import { ALL_FIELDS_GROUP, defineField, defineType } from "sanity";

export const homeType = defineType({
  name: "home",
  title: "Home",
  type: "document",
  icon: HomeIcon,
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
      title: "String",
      type: "string",
      group: "content",
    }),
    defineField({
      name: "slug",
      type: "slug",
      options: {
        source: "title",
      },
      group: "content",
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
    defineField({
      name: "publishedAt",
      type: "datetime",
      group: "settings",
    }),
    defineField({
      name: "body",
      type: "blockContent",
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
        { type: "imageGrid" },
        { type: "richtextImage" },
        { type: "heading_with_link" },
        { type: "prescription_comparison" },
        { type: "escript_banner" },
        { type: "text_block_with_icon" },
        { type: "text_image" },
        { type: "faq"},
        {type: "supportForm"}
        
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
                "richtextImage",
                "richtext_with_cta",
                "richtextWithGroupedCTA",
                "richtext",
                "heading_with_link",
                "prescription_comparison",
                "escript_banner",
                "text_block_with_icon",
                "faq",
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
              of: ["imageGrid", "text_image"],
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
