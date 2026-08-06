import { ImageIcon } from "@sanity/icons";
import { defineField, defineType } from "sanity";

export default defineType({
  name: "richtextImage",
  title: "Richtext With Image",
  type: "object",
  icon: ImageIcon,
  fields: [
    defineField({
      name: "image",
      title: "Icon",
      type: "image",
      options: {
        hotspot: true,
      },
    }),

    defineField({
      name: "title_array",
      title: "Title array",
      type: "array",
      of: [
        {
          type: "block",
          styles: [
            { title: "Normal", value: "normal" },
          ],
          lists: [],
          marks: {
            decorators: [
              { title: "Strong", value: "strong" },
              { title: "Emphasis", value: "em" },
            ],
          },
        },
      ],
    }),

    defineField({
      name: "content",
      title: "Content",
      type: "array",
      of: [
        {
          type: "block",
        },
      ],
    }),

    defineField({
      name: "paddingTop",
      title: "Padding Top",
      type: "number",
      initialValue: 0,
    }),

    defineField({
      name: "paddingBottom",
      title: "Padding Bottom",
      type: "number",
      initialValue: 70,
    }),
  ],
  preview: {
    select: {
      title: "title_array",
      media: "image",
    },
    prepare(selection) {
      return {
        title: selection.title || "Richtext with Image",
        media: selection.media,
      };
    },
  },
});
