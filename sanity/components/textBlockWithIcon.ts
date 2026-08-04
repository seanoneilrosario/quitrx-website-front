import {defineArrayMember, defineField, defineType} from "sanity";
import {UsersIcon} from "@sanity/icons";

export default defineType({
  name: "text_block_with_icon",
  title: "Text Block with Icon",
  type: "object",
  icon: UsersIcon,

  fields: [
    defineField({
      name: "title_array",
      title: "Title Array",
      type: "array",
      of: [{ type: "block" }],
    }),
    defineField({
      name: "sub_heading",
      title: "Sub Heading",
      type: "text",
    }),
    defineField({
      name: "box",
      title: "Box",
      type: "array",
      validation: (Rule) => Rule.min(1),
      of: [
        defineArrayMember({
          type: "object",
          preview: {
            select: {
              title: "title",
              subtitle: "step",
              media: "image",
            },
          },
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
              name: "step",
              title: "Step Badge",
              type: "string",
              initialValue: "STEP 1",
            }),

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

            // ==========================
            // Feature Row 1
            // ==========================

            defineField({
              name: "label_1",
              title: "Feature Row 1 - Left Badge",
              type: "string",
            }),

            defineField({
              name: "description_1",
              title: "Feature Row 1 - Right Description",
              type: "text",
            }),

            // ==========================
            // Feature Row 2
            // ==========================

            defineField({
              name: "label_2",
              title: "Feature Row 2 - Left Badge",
              type: "string",
            }),

            defineField({
              name: "description_2",
              title: "Feature Row 2 - Right Description",
              type: "text",
            }),

            // ==========================
            // Feature Row 3
            // ==========================

            defineField({
              name: "label_3",
              title: "Feature Row 3 - Left Badge",
              type: "string",
            }),

            defineField({
              name: "description_3",
              title: "Feature Row 3 - Right Description",
              type: "text",
            }),

            // ==========================
            // Feature Row 4
            // ==========================

            defineField({
              name: "label_4",
              title: "Feature Row 4 - Left Badge",
              type: "string",
            }),

            defineField({
              name: "description_4",
              title: "Feature Row 4 - Right Description",
              type: "text",
            }),

            defineField({
              name: "row_direction",
              title: "Reverse Feature Row Layout",
              description: "Swap the badge and description positions.",
              type: "boolean",
              initialValue: false,
            }),
          ],
        }),
      ],
    }),
  ],

  preview: {
    prepare() {
      return {
        title: "Text Block With Icon",
      };
    },
  },
});