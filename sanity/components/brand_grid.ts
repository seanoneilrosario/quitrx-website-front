import { defineField, defineType } from "sanity";
import { sectionIdField } from "./sectionId";

export default defineType({
  name: "brand_grid",
  title: "Shop by Brand Grid",
  type: "object",
  fields: [
    sectionIdField,
    defineField({
      name: "heading",
      title: "Heading",
      type: "string",
      initialValue: "Shop by Brand",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "desktopPaddingTop",
      title: "Desktop padding top (px)",
      type: "number",
      initialValue: 120,
      validation: (Rule) => Rule.min(0),
    }),
    defineField({
      name: "desktopPaddingBottom",
      title: "Desktop padding bottom (px)",
      type: "number",
      initialValue: 120,
      validation: (Rule) => Rule.min(0),
    }),
    defineField({
      name: "mobilePaddingTop",
      title: "Mobile padding top (px)",
      type: "number",
      initialValue: 54,
      validation: (Rule) => Rule.min(0),
    }),
    defineField({
      name: "mobilePaddingBottom",
      title: "Mobile padding bottom (px)",
      type: "number",
      initialValue: 54,
      validation: (Rule) => Rule.min(0),
    }),
    defineField({
      name: "brands",
      title: "Brands",
      type: "array",
      validation: (Rule) => Rule.min(1),
      of: [
        {
          name: "brand",
          title: "Brand",
          type: "object",
          fields: [
            defineField({
              name: "name",
              title: "Brand name",
              type: "string",
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: "logo",
              title: "Brand logo",
              type: "image",
              options: { hotspot: true },
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: "alt",
              title: "Logo alternative text",
              type: "string",
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
            select: { title: "name", media: "logo" },
          },
        },
      ],
    }),
  ],
  preview: {
    select: { title: "heading", brands: "brands" },
    prepare: ({ title, brands }) => ({
      title: title || "Shop by Brand",
      subtitle: `${brands?.length || 0} brand(s)`,
    }),
  },
});
