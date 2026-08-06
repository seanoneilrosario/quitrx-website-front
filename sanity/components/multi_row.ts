import {defineArrayMember, defineField, defineType} from "sanity";
import {UsersIcon} from "@sanity/icons";
import {sectionIdField} from "./sectionId";

export default defineType({
  name: "multi_row",
  title: "Multi Row",
  type: "object",
  icon: UsersIcon,

  fields: [
    sectionIdField,
    defineField({
      name: "members",
      title: "Members",
      type: "array",
      validation: (Rule) => Rule.min(1),
      of: [
        defineArrayMember({
          type: "object",
          preview: {
            select: {
              title: "name",
              subtitle: "position",
              media: "image",
            },
          },
          fields: [
            defineField({
              name: "image",
              title: "Image",
              type: "image",
              options: {
                hotspot: true,
              },
            }),

            defineField({
              name: "name",
              title: "Name",
              type: "string",
            }),

            defineField({
              name: "position",
              title: "Position",
              type: "string",
            }),

            defineField({
              name: "description",
              title: "Description",
              type: "array",
              of: [{type: "block"}],
            }),
          ],
        }),
      ],
    }),
  ],

  preview: {
    prepare() {
      return {
        title: "Multi Row",
      };
    },
  },
});
