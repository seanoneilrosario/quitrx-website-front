import { defineField, defineType } from "sanity";
import { sectionIdField } from "@/sanity/schemas/fields/section-id";
import { ApiCollectionInput } from "@/sanity/studio/ApiCollectionInput";

export default defineType({
  name: "product_api_grid",
  title: "QuitHero Collections",
  type: "object",
  fields: [
    sectionIdField,
    defineField({ name: "heading", title: "Heading", type: "string", initialValue: "Collections" }),
    defineField({
      name: "displayMode",
      title: "Display",
      type: "string",
      initialValue: "collections",
      options: {
        layout: "radio",
        list: [
          { title: "Collection cards", value: "collections" },
          { title: "All individual products", value: "products" },
        ],
      },
    }),
    defineField({
      name: "collection",
      title: "Legacy product collection",
      type: "reference",
      to: [{ type: "productCollection" }],
      hidden: true,
    }),
    defineField({
      name: "collections",
      title: "Collections to display",
      description:
        "Add a QuitHero collection and choose it from the API. Opening its card loads that collection's products from QuitHero.",
      type: "array",
      of: [
        {
          name: "apiCollection",
          title: "QuitHero collection (API)",
          type: "object",
          components: { input: ApiCollectionInput },
          fields: [
            defineField({ name: "id", type: "string", readOnly: true }),
            defineField({ name: "title", type: "string", readOnly: true }),
            defineField({
              name: "slug",
              type: "string",
              readOnly: true,
              validation: (Rule) => Rule.required(),
            }),
            defineField({ name: "image", type: "string", readOnly: true }),
          ],
          preview: {
            select: { title: "title", subtitle: "slug" },
            prepare: ({ title, subtitle }) => ({
              title: title || "Choose a collection",
              subtitle: subtitle ? `/collections/${subtitle}` : "QuitHero API",
            }),
          },
        },
        {
          type: "reference",
          title: "Existing Sanity collection",
          to: [{ type: "productCollection" }],
        },
        {
          name: "customLink",
          title: "Custom link",
          type: "object",
          fields: [
            defineField({
              name: "title",
              title: "Title",
              type: "string",
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: "image",
              title: "Image",
              type: "image",
              options: { hotspot: true },
            }),
            defineField({
              name: "link",
              title: "Link",
              description:
                "Use an internal path such as starter-packs or /starter-packs, or a full external URL.",
              type: "string",
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: "openInNewTab",
              title: "Open in a new tab",
              type: "boolean",
              initialValue: false,
            }),
          ],
          preview: {
            select: { title: "title", subtitle: "link", media: "image" },
            prepare: ({ title, subtitle, media }) => ({
              title: title || "Custom link",
              subtitle,
              media,
            }),
          },
        },
      ],
      validation: (Rule) =>
        Rule.unique().custom((items) => {
          const slugs = (items ?? []).flatMap((item) => {
            const record = item as { slug?: string };
            return record.slug ? [record.slug] : [];
          });
          return new Set(slugs).size === slugs.length || "Choose each API collection only once.";
        }),
    }),
    defineField({
      name: "productLimit",
      title: "Maximum Products",
      type: "number",
      initialValue: 12,
      validation: (Rule) => Rule.min(1).max(100),
    }),
    defineField({
      name: "desktopPaddingTop",
      title: "Desktop Padding Top (px)",
      type: "number",
      initialValue: 60,
      validation: (Rule) => Rule.min(0),
    }),
    defineField({
      name: "desktopPaddingBottom",
      title: "Desktop Padding Bottom (px)",
      type: "number",
      initialValue: 60,
      validation: (Rule) => Rule.min(0),
    }),
    defineField({
      name: "mobilePaddingTop",
      title: "Mobile Padding Top (px)",
      type: "number",
      initialValue: 40,
      validation: (Rule) => Rule.min(0),
    }),
    defineField({
      name: "mobilePaddingBottom",
      title: "Mobile Padding Bottom (px)",
      type: "number",
      initialValue: 40,
      validation: (Rule) => Rule.min(0),
    }),
    defineField({ name: "paddingTop", title: "Legacy Padding Top", type: "number", hidden: true }),
    defineField({
      name: "paddingBottom",
      title: "Legacy Padding Bottom",
      type: "number",
      hidden: true,
    }),
  ],
  preview: {
    select: { title: "heading" },
    prepare: ({ title }) => ({ title: title || "QuitHero Collections" }),
  },
});
