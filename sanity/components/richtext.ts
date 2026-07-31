import { defineField, defineType } from "sanity";

export default defineType({
  name: "richtext",
  title: "Rich Text",
  type: "object",
  fields: [
    defineField({
      name: "eyebrow",
      title: "Eyebrow",
      type: "string",
    }),
    defineField({
      name: "title",
      title: "Title",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "rightDescription",
      title: "Right Description",
      type: "array",
      of: [{ type: "block" }],
    }),
    defineField({
      name: "buttonText",
      title: "Button Text",
      type: "string",
    }),
    defineField({
      name: "buttonLink",
      title: "Button Link",
      type: "string",
    }),
  ],
  preview: {
    prepare() {
      return {
        title: "Rich Text",
      };
    },
  },
});