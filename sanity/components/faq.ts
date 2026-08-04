import { defineField, defineType, defineArrayMember } from "sanity";

export default defineType({
  name: "faq",
  title: "FAQ",
  type: "object",
  fields: [
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
              of: [{ type: "block" }],
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