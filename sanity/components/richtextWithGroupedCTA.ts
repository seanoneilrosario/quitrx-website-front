// schemas/objects/richtextWithGroupedCTA.ts

import { ActivityIcon } from "@sanity/icons";
import { defineField, defineType } from "sanity";
import { sectionIdField } from "./sectionId";

export const richtextWithGroupedCTA = defineType({
  name: "richtext_with_grouped_cta",
  title: "Richtext With Grouped CTA",
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
      name: "background_image",
      title: "Background Image",
      type: "image",
    }),

    defineField({
      name: "cta_groups",
      title: "CTA Groups",
      type: "array",

      of: [
        {
          type: "object",

          fields: [
            defineField({
              name: "group_title",
              title: "Group Title",
              type: "string",
            }),

            defineField({
              name: "buttons",
              title: "Buttons",
              type: "array",

              of: [
                {
                  type: "object",

                  fields: [
                    defineField({
                      name: "label",
                      title: "Label",
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

          preview: {
            select: {
              title: "group_title",
            },
          },
        },
      ],
    }),
  ],
});
