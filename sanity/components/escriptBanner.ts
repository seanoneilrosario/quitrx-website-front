import { defineField, defineType } from "sanity";

export const escriptBanner = defineType({
  name: "escript_banner",
  title: "eScript Banner",
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
      name: "heading",
      title: "Heading",
      type: "string",
      initialValue: "Already have an eScript?",
    }),

    defineField({
      name: "description",
      title: "Description",
      type: "array",
      of: [{ type: "block" }],
    }),

    defineField({
      name: "buttonIcon",
      title: "Button Icon",
      type: "image",
      options: {
        hotspot: true,
      },
    }),

    defineField({
      name: "button_text",
      title: "Button Text",
      type: "string",
      initialValue: "Upload eScript",
    }),

    defineField({
      name: "button_url",
      title: "Button URL",
      type: "reference",
      to: [{ type: "page" }],
    }),

    defineField({
      name: "paddingTop",
      title: "Padding Top",
      type: "number",
      initialValue: 40,
    }),

    defineField({
      name: "paddingBottom",
      title: "Padding Bottom",
      type: "number",
      initialValue: 40,
    }),
  ],

  preview: {
    select: {
      title: "heading",
      media: "icon",
    },
  },
});