import { defineField, defineType } from "sanity";
import { sectionIdField } from "./sectionId";

export const prescriptionComparison = defineType({
  name: "prescription_comparison",
  title: "Prescription Comparison",
  type: "object",

  fields: [
    sectionIdField,
    defineField({
      name: "heading",
      title: "Heading",
      type: "string",
      initialValue: "Nicotine Replacement Therapies",
    }),

    defineField({
      name: "description",
      title: "Description",
      type: "array",
      of: [
        {
          type: "block",
        }
      ],
    }),
    defineField({
      name: "comparison_icon",
      title: "Card Icon",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "audience",
      title: "Audience Badge",
      type: "string",
      initialValue: "For Everyone",
    }),
    defineField({
      name: "card_title",
      title: "Card Title",
      type: "string",
      initialValue: "Nicotine Replacement Therapies",
    }),
    defineField({
      name: "card_description",
      title: "Card Description",
      type: "array",
      of: [{ type: "block" }],
    }),
    defineField({
      name: "comparison_features",
      title: "Checklist",
      type: "array",
      of: [{
        name: "feature",
        title: "Checklist Item",
        type: "object",
        fields: [
          defineField({ name: "text", title: "Text", type: "string", validation: (Rule) => Rule.required() }),
          defineField({ name: "details", title: "Indented Details", type: "array", of: [{ type: "string" }] }),
        ],
        preview: { select: { title: "text" } },
      }],
    }),
    defineField({ name: "comparison_button_text", title: "Button Text", type: "string", initialValue: "Get Started" }),
    defineField({ name: "comparison_button_link", title: "Button Link", type: "string", description: "Enter an internal path or a full URL." }),
    defineField({ name: "comparison_disclaimer", title: "Compliance Note", type: "array", of: [{ type: "block" }] }),

    defineField({
      name: "paddingTop",
      title: "Padding Top",
      type: "number",
      initialValue: 36,
      validation: (Rule) => Rule.min(0).max(100),
    }),

    defineField({
      name: "paddingBottom",
      title: "Padding Bottom",
      type: "number",
      initialValue: 36,
      validation: (Rule) => Rule.min(0).max(100),
    }),
  ],

  preview: {
    prepare() {
      return {
        title: "Prescription Comparison",
      };
    },
  },
});
