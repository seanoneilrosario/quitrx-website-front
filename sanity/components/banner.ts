import { ImageIcon } from "@sanity/icons";
import { defineField, defineType } from "sanity";
import { sectionIdField } from "./sectionId";

export const banner = defineType({
  name: "banner",
  title: "Banner",
  type: "object",
  icon: ImageIcon,
  fields: [
    sectionIdField,
    defineField({
      name: "back_image",
      title: "Back Image",
      type: "image",
      
    }),

    defineField({
      name: "hide_separator",
      title: "Hide Separator",
      type: "boolean",
      initialValue: false
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
      title: "Supporting Text",
      type: "array",
      of: [
        {
          type: "block",
        }
      ],
    }),
    defineField({
      name: "disclaimer",
      title: "Compliance Note",
      description: "Displayed as the smaller bulleted text below the buttons.",
      type: "array",
      of: [
        {
          type: "block",
          marks: {
            annotations: [
              {
                name: "link",
                type: "object",
                title: "Link",
                fields: [
                  {
                    name: "href",
                    type: "url",
                    title: "URL",
                    validation: (Rule) =>
                      Rule.uri({ allowRelative: true, scheme: ["http", "https"] }),
                  },
                ],
              },
            ],
          },
        },
      ],
    }),

    defineField({
      name: "button_text",
      title: "Button Text",
      type: "string",
    }),
    defineField({
      name: "button_style",
      title: "Primary CTA Style",
      description: "Link uses a filled background. Button uses a transparent background.",
      type: "string",
      options: {
        layout: "radio",
        list: [
          { title: "Button", value: "button" },
          { title: "Link", value: "link" },
        ],
      },
      initialValue: "link",
      hidden: ({ parent }) => !parent?.button_text,
    }),
    defineField({
      name: "button_url",
      title: "Button Url",
      type: "reference",
      to: [{type: 'page'}]
    }),
    defineField({
      name: "secondary_button_text",
      title: "Secondary Button Text",
      type: "string",
      description: "For example: Login",
    }),
    defineField({
      name: "secondary_button_style",
      title: "Secondary CTA Style",
      description: "Link uses a filled background. Button uses a transparent background.",
      type: "string",
      options: {
        layout: "radio",
        list: [
          { title: "Button", value: "button" },
          { title: "Link", value: "link" },
        ],
      },
      initialValue: "button",
      hidden: ({ parent }) => !parent?.secondary_button_text,
    }),
    defineField({
      name: "secondary_button_link",
      title: "Secondary Button Link",
      type: "string",
      description: "Enter an internal path such as /login or a full URL.",
      hidden: ({ parent }) => !parent?.secondary_button_text,
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
