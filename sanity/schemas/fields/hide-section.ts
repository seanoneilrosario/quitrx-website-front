import { defineField } from "sanity";

export const hideSectionField = defineField({
  name: "hideSection",
  title: "Hide Section",
  type: "boolean",
  initialValue: false,
  description:
    "Hide this section from the website while keeping its content here. Publish the page to apply the change.",
});
