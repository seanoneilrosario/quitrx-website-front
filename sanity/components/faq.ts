import { defineField, defineType, defineArrayMember } from "sanity";
import { sectionIdField } from "./sectionId";

export default defineType({
  name: "faq",
  title: "FAQ",
  type: "object",
  fields: [
    sectionIdField,
    defineField({
      name: "heading",
      title: "Heading",
      type: "string",
      initialValue: "Frequently asked questions",
    }),

    defineField({
      name: "paddingTop",
      title: "Padding Top",
      type: "number",
      initialValue: 80,
    }),

    defineField({
      name: "paddingBottom",
      title: "Padding Bottom",
      type: "number",
      initialValue: 80,
    }),

    defineField({
      name: "items",
      title: "FAQ Items",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          fields: [
            defineField({
              name: "question",
              title: "Question",
              type: "string",
            }),

            defineField({
              name: "answer",
              title: "Answer",
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
                      defineField({ name: "openInNewTab", type: "boolean", title: "Open in new tab", initialValue: true }),
                    ],
                  }],
                },
              }],
            }),
          ],
          preview: {
            select: {
              title: "question",
            },
          },
        }),
      ],
    }),
  ],

  preview: {
    prepare() {
      return {
        title: "FAQ",
      };
    },
  },
});
