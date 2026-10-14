import { defineField, defineType } from "sanity";
import { sectionIdField } from "../fields/section-id";
import { ApiCollectionInput } from "@/sanity/studio/ApiCollectionInput";
import { ApiProductInput } from "@/sanity/studio/ApiProductInput";

export default defineType({
  name: "product_highlights",
  title: "Product Highlights",
  type: "object",
  fields: [
    sectionIdField,
    defineField({ name: "heading", type: "string", initialValue: "Product highlights" }),
    defineField({
      name: "highlightSource",
      title: "Choose products from",
      type: "string",
      initialValue: "products",
      options: {
        layout: "radio",
        list: [
          { title: "Individual QuitHero products", value: "products" },
          { title: "Dashboard collection", value: "collection" },
        ],
      },
    }),
    defineField({
      name: "highlightProducts",
      title: "Highlighted products",
      type: "array",
      description: "Search QuitHero products directly. Drag entries to change their display order.",
      hidden: ({ parent }) => parent?.highlightSource !== "products",
      of: [
        {
          name: "highlightProduct",
          title: "QuitHero product",
          type: "object",
          components: { input: ApiProductInput },
          fields: [
            defineField({
              name: "id",
              type: "string",
              readOnly: true,
              validation: (Rule) => Rule.required(),
            }),
            defineField({ name: "title", type: "string", readOnly: true }),
            defineField({ name: "slug", type: "string", readOnly: true }),
            defineField({
              name: "new_product",
              title: "New product",
              type: "boolean",
              initialValue: false,
            }),
          ],
          preview: { select: { title: "title", subtitle: "slug" } },
        },
      ],
      validation: (Rule) =>
        Rule.max(15).custom((value, context) => {
          if ((context.parent as { highlightSource?: string })?.highlightSource !== "products")
            return true;
          const products = (value ?? []) as { id?: string }[];
          if (!products.length) return "Select at least one product.";
          return (
            new Set(products.map((product) => product.id)).size === products.length ||
            "Select each product only once."
          );
        }),
    }),
    defineField({
      name: "highlightCollection",
      title: "Dashboard collection",
      hidden: ({ parent }) => parent?.highlightSource === "products",
      type: "object",
      description:
        "Create a Product Highlights collection in the dashboard and manage its products there. Select that collection here; product images, prices and availability come from QuitHero.",
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
      validation: (Rule) =>
        Rule.custom(
          (value, context) =>
            (context.parent as { highlightSource?: string })?.highlightSource === "products" ||
            Boolean(value?.slug) ||
            "Select a dashboard collection.",
        ),
    }),
    defineField({
      name: "productLimit",
      title: "Products to show",
      type: "number",
      initialValue: 3,
      validation: (Rule) => Rule.required().integer().min(1).max(15),
    }),
    defineField({
      name: "showBottomBorder",
      title: "Show bottom divider",
      type: "boolean",
      initialValue: true,
    }),
    ...["desktopPaddingTop", "desktopPaddingBottom", "mobilePaddingTop", "mobilePaddingBottom"].map(
      (name) =>
        defineField({
          name,
          title: name.replace(/([A-Z])/g, " $1") + " (px)",
          type: "number",
          initialValue: 32,
          validation: (Rule) => Rule.min(0),
        }),
    ),
  ],
  preview: {
    select: { title: "heading", subtitle: "highlightCollection.title" },
    prepare: ({ title, subtitle }) => ({ title: title || "Product highlights", subtitle }),
  },
});
