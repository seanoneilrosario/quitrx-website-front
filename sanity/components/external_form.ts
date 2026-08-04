import { defineField } from "sanity";


export const externalForm = defineField({
  name: "supportForm",
  title: "Support Form",
  type: "object",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      initialValue: "Any Questions?",
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
  ],
});