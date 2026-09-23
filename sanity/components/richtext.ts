import { defineField, defineType } from "sanity";
import { sectionIdField } from "./sectionId";

export default defineType({
  name: "richtext",
  title: "Rich Text",
  type: "object",
  fields: [
    sectionIdField,
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
      of: [{
        type: "block",
        marks: {
          annotations: [{
            name: "link",
            type: "object",
            title: "Link",
            fields: [
              defineField({ name: "href", type: "url", title: "URL", validation: (Rule) => Rule.uri({ allowRelative: true, scheme: ["http", "https"] }) }),
              defineField({ name: "openInNewTab", type: "boolean", title: "Open in new tab", initialValue: false }),
            ],
          }],
        },
      }],
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
    defineField({
      name: "buttonOpenInNewTab",
      title: "Open button in new tab",
      type: "boolean",
      initialValue: false,
      hidden: ({ parent }) => !parent?.buttonLink,
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
