import { defineField } from "sanity";

export const floatingCTASchema = defineField({
  name: "floatingCTA",
  title: "Floating CTA",
  type: "object",

  fields: [
    defineField({
      name: "icon",
      title: "Icon",
      type: "image",
      options: {
        hotspot: true,
      },
    }),

    defineField({
      name: "title_array",
      title: "Title Array",
      type: "array",
      of: [
        {
          type: "block",
        },
      ],
    }),

    defineField({
      name: "text",
      title: "Description",
      type: "array",
      of: [
        {
          type: "block",
        },
      ],
    }),

    defineField({
      name: "button_text",
      title: "Button Label",
      type: "string",
      initialValue: "Get Started",
    }),

    defineField({
      name: "button_link",
      title: "Button Link",
      type: "string",
    }),
  ],

  preview: {
    select: {
      title: "button_text",
      media: "icon",
    },
    prepare({ title, media }) {
      return {
        title: title || "Floating CTA",
        media,
      };
    },
  },
});