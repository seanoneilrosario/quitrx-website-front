import { defineField, defineType } from "sanity";
import { sectionIdField } from "./sectionId";

export default defineType({
  name: "product_api_grid",
  title: "QuitHero Product Grid",
  type: "object",
  fields: [
    sectionIdField,
    defineField({ name: "heading", title: "Heading", type: "string", initialValue: "Products" }),
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
      description: "Each selected collection displays as its own featured-image card and links to its product collection.",
      type: "array",
      of: [{ type: "reference", to: [{ type: "productCollection" }] }],
      validation: (Rule) => Rule.unique(),
    }),
    defineField({ name: "productLimit", title: "Maximum Products", type: "number", initialValue: 12, validation: (Rule) => Rule.min(1).max(100) }),
    defineField({ name: "desktopPaddingTop", title: "Desktop Padding Top (px)", type: "number", initialValue: 60, validation: (Rule) => Rule.min(0) }),
    defineField({ name: "desktopPaddingBottom", title: "Desktop Padding Bottom (px)", type: "number", initialValue: 60, validation: (Rule) => Rule.min(0) }),
    defineField({ name: "mobilePaddingTop", title: "Mobile Padding Top (px)", type: "number", initialValue: 40, validation: (Rule) => Rule.min(0) }),
    defineField({ name: "mobilePaddingBottom", title: "Mobile Padding Bottom (px)", type: "number", initialValue: 40, validation: (Rule) => Rule.min(0) }),
    defineField({ name: "paddingTop", title: "Legacy Padding Top", type: "number", hidden: true }),
    defineField({ name: "paddingBottom", title: "Legacy Padding Bottom", type: "number", hidden: true }),
  ],
  preview: { select: { title: "heading" }, prepare: ({ title }) => ({ title: title || "QuitHero Product Grid" }) },
});
