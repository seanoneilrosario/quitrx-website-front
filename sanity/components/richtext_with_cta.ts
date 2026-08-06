import { ActivityIcon } from "@sanity/icons";
import { defineField, defineType } from "sanity";
import { sectionIdField } from "./sectionId";

export default defineType({
  name: "richtext_with_cta",
  title: "Richtext With CTA",
  type: "object",
  icon: ActivityIcon,

  fields: [
    sectionIdField,
    defineField({
      name: "title",
      title: "Title",
      type: "string",
    }),

    defineField({
      name: "description",
      title: "Description",
      type: "array",
      of: [{ type: "block" }],
    }),

    defineField({
      name: "activeItem",
      title: "Set Active Items",
      type: "number",
    }),
    defineField({
      name: "desktop_left_width",
      title: "Desktop Left Width",
      type: "number",
    }),

    defineField({
      name: "cta_buttons",
      title: "CTA Buttons",
      type: "array",
      of: [
        {
          type: "object",

          fields: [
            defineField({
              name: "label",
              title: "Button Label",
              type: "string",
            }),

            defineField({
              name: "description",
              title: "Description",
              type: "array",
              of: [{ type: "block" }],
            }),

          ],
          preview: {
            select: {
              title: "label",
            },
          },
        },
      ],
    }),
  ],
});
