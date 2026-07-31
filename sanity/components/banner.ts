import { ImageIcon } from "@sanity/icons";
import { defineField, defineType } from "sanity";

export const banner = defineType({
  name: "banner",
  title: "Banner",
  type: "object",
  icon: ImageIcon,
  fields: [
    defineField({
      name: "back_image",
      title: "Back Image",
      type: "image",
      
    }),
    defineField({
      name: "doc_img",
      title: "Doc Image",
      type: "image",
    }),
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      // validation: (Rule) => Rule.required(),
      initialValue: "Banner"
    }),
    defineField({
      name: "title_array",
      title: "Title Array",
      type: "array",
      of: [
        {
          type: "block",
        }
      ],
    }),
    defineField({
      name: "title_image",
      title: "Title Image",
      type: "image",
    }),
    defineField({
      name: "link",
      title: "Link",
      type: "url",
      validation: (Rule) =>
        Rule.uri({
          allowRelative: true,
          scheme: ["http", "https"],
        }),
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
      name: "button_text",
      title: "Button Text",
      type: "string",
    }),
    defineField({
      name: "button_url",
      title: "Button Url",
      type: "reference",
      to: [{type: 'page'}]
    }),
  ],
  preview: {
    select: {
      title: "title",
      media: "image",
    },
    prepare({ title, media }) {
      return {
        title: title || "Banner",
        media,
      };
    },
  },
});
