import { defineField } from "sanity";
import { sectionIdField } from "./sectionId";

export const uploadPrescription = defineField({
  name: "uploadPrescription",
  title: "Upload Prescription",
  type: "object",
  fields: [
    sectionIdField,
    defineField({
      name: "title",
      title: "Title",
      type: "string",
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
