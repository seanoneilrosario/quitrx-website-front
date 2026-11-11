import { defineField } from "sanity";
import { sectionIdField } from "@/sanity/schemas/fields/section-id";

export const formSuccess = defineField({
  name: "formSuccess",
  title: "Intake Form Success",
  type: "object",
  fields: [
    sectionIdField,
    defineField({
      name: "icon",
      title: "Icon",
      type: "image",
      description: "Optional. Upload an icon to replace the default checkmark.",
      options: { hotspot: true },
    }),
    defineField({
      name: "title",
      title: "Heading",
      type: "string",
      initialValue: "Form submitted successfully!",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "lead",
      title: "Confirmation Message",
      type: "string",
      initialValue: "Your intake form has been submitted successfully.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "message",
      title: "Follow-up Message",
      type: "text",
      rows: 3,
      initialValue:
        "A QuitRX doctor will review your confidential information and respond within 24 hours. You will receive an email once your prescription is ready.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "buttonText",
      title: "Button Text",
      type: "string",
      initialValue: "Back to Home",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "buttonLink",
      title: "Button Link",
      type: "string",
      description: "Enter an internal path such as / or a full URL.",
      initialValue: "/",
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: { title: "title" },
    prepare({ title }) {
      return {
        title: title || "Intake Form Success",
        subtitle: "Form success message",
      };
    },
  },
});
