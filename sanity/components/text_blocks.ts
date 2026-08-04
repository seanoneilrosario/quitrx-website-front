import { defineField, defineType } from "sanity";

export const prescriptionComparison = defineType({
  name: "prescription_comparison",
  title: "Prescription Comparison",
  type: "object",

  fields: [
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