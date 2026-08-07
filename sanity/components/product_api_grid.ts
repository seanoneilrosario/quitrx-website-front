import { defineField, defineType } from "sanity";
import { sectionIdField } from "./sectionId";

export default defineType({
  name: "product_api_grid",
  title: "QuitHero Product Grid",
  type: "object",
  fields: [
    sectionIdField,
    defineField({ name: "heading", title: "Heading", type: "string", initialValue: "Products" }),
    defineField({ name: "productLimit", title: "Maximum Products", type: "number", initialValue: 12, validation: (Rule) => Rule.min(1).max(100) }),
    defineField({ name: "paddingTop", title: "Padding Top (px)", type: "number", initialValue: 60, validation: (Rule) => Rule.min(0) }),
    defineField({ name: "paddingBottom", title: "Padding Bottom (px)", type: "number", initialValue: 60, validation: (Rule) => Rule.min(0) }),
  ],
  preview: { select: { title: "heading" }, prepare: ({ title }) => ({ title: title || "QuitHero Product Grid" }) },
});
