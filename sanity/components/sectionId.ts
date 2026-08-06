import { defineField } from "sanity";

export const sectionIdField = defineField({
  name: "sectionId",
  title: "Section ID (anchor link)",
  type: "string",
  description: "Use this in header links as #your-section-id (for example: #contact).",
  validation: (Rule) =>
    Rule.custom((value) =>
      !value || /^[A-Za-z][A-Za-z0-9_-]*$/.test(value)
        ? true
        : "Start with a letter; use only letters, numbers, hyphens, and underscores."
    ),
});
