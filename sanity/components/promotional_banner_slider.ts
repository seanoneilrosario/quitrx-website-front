import { defineField, defineType } from "sanity";
import { sectionIdField } from "./sectionId";

export default defineType({
  name: "promotional_banner_slider",
  title: "Promotional Banner Slider",
  type: "object",
  fields: [
    sectionIdField,
    defineField({
      name: "slides",
      title: "Slides",
      type: "array",
      validation: (Rule) => Rule.min(1),
      of: [
        {
          name: "slide",
          title: "Slide",
          type: "object",
          fields: [
            defineField({
              name: "image",
              title: "Desktop banner image",
              type: "image",
              options: { hotspot: true },
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: "mobileImage",
              title: "Mobile banner image (optional)",
              type: "image",
              options: { hotspot: true },
            }),
            defineField({
              name: "alt",
              title: "Alternative text",
              type: "string",
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: "page",
              title: "Internal page",
              type: "reference",
              to: [{ type: "page" }, { type: "home" }],
            }),
            defineField({
              name: "url",
              title: "External URL",
              type: "url",
              description: "Used when no internal page is selected.",
            }),
            defineField({
              name: "openInNewTab",
              title: "Open external URL in a new tab",
              type: "boolean",
              initialValue: false,
              hidden: ({ parent }) => !parent?.url || Boolean(parent?.page),
            }),
          ],
          preview: {
            select: { title: "alt", media: "image" },
            prepare: ({ title, media }) => ({ title: title || "Untitled slide", media }),
          },
        },
      ],
    }),
    defineField({
      name: "autoplay",
      title: "Autoplay slides",
      type: "boolean",
      initialValue: true,
    }),
  ],
  preview: {
    select: { slides: "slides" },
    prepare: ({ slides }) => ({ title: "Promotional Banner Slider", subtitle: `${slides?.length || 0} slide(s)` }),
  },
});
