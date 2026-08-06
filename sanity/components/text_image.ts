import {
  defineArrayMember,
  defineField,
  defineType,
} from "sanity";
import { sectionIdField } from "./sectionId";

export const textImage = defineType({
  name: "text_image",
  title: "Text with Image",
  type: "object",

  fields: [
    sectionIdField,
    defineField({
      name: "theme",
      title: "Theme",
      type: "string",
      initialValue: "dark",
      options: {
        list: [
          { title: "Dark", value: "dark" },
          { title: "Light", value: "light" },
        ],
      },
    }),

    defineField({
      name: "contentTheme",
      title: "Content Theme",
      type: "string",
      initialValue: "plaintext",
      options: {
        list: [
          {
            title: "Plain Text",
            value: "plaintext",
          },
          {
            title: "Bullet List",
            value: "img_bullet",
          },
        ],
      },
    }),

    defineField({
      name: "imageTheme",
      title: "Image Theme",
      type: "string",
      initialValue: "double",
      options: {
        list: [
          {
            title: "Double Image",
            value: "double",
          },
          {
            title: "Single Small Image",
            value: "single",
          },
        ],
      },
    }),

    defineField({
      name: "heading",
      type: "string",
    }),

    defineField({
      name: "sub_heading",
      type: "string",
    }),

    defineField({
      name: "frontImage",
      type: "image",
    }),

    defineField({
      name: "backImage",
      type: "image",
    }),

    defineField({
      name: "content",
      title: "Plain Content",
      type: "array",
      of: [{ type: "block" }],
    }),

    defineField({
      name: "bullets",
      title: "Bullets",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          fields: [
            defineField({
              name: "content",
              title: "Content",
              type: "array",
              of: [{ type: "block" }],
            }),
          ],
        }),
      ],
    }),

    defineField({
      name: "paddingTop",
      type: "number",
      initialValue: 60,
    }),

    defineField({
      name: "paddingBottom",
      type: "number",
      initialValue: 60,
    }),
  ],

  preview: {
    select: {
      title: "heading",
    },
  },
});
