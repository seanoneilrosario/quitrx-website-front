import {defineArrayMember, defineField, defineType} from "sanity";
import {EnvelopeIcon} from "@sanity/icons";

export default defineType({
  name: "contact_section",
  title: "Contact Section",
  type: "object",
  icon: EnvelopeIcon,

  fields: [
    defineField({
      name: "eyebrow",
      title: "Eyebrow",
      type: "string",
      initialValue: "Contact us",
    }),

    defineField({
      name: "heading",
      title: "Heading",
      type: "text",
      rows: 2,
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: "offices",
      title: "Office Locations",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          preview: {
            select: {
              title: "title",
              subtitle: "phone",
            },
          },
          fields: [
            defineField({
              name: "title",
              title: "Office Name",
              type: "string",
            }),

            defineField({
              name: "address",
              title: "Address",
              type: "array",
              of: [{type: "block"}],
            }),

            defineField({
              name: "phone",
              title: "Phone Number",
              type: "string",
            }),
          ],
        }),
      ],
    }),

    defineField({
      name: "button_text",
      title: "Button Text",
      type: "string",
      initialValue: "Contact Form",
    }),

    defineField({
      name: "button_link",
      title: "Button Link",
      type: "string",
    }),
  ],

  preview: {
    prepare() {
      return {
        title: "Contact Section",
      };
    },
  },
});