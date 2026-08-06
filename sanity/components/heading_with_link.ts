import {defineField, defineType} from "sanity";
import {LinkIcon} from "@sanity/icons";
import {sectionIdField} from "./sectionId";

export default defineType({
  name: "heading_with_link",
  title: "Heading With Link",
  type: "object",
  icon: LinkIcon,
  fields: [
    sectionIdField,
    defineField({
      name: "eyebrow",
      title: "Eyebrow",
      type: "string",
      description: "Small text displayed on the left (e.g. Our Focus)",
    }),

    defineField({
      name: "eyebrow_max_width",
      title: "Eyebrow Max Width",
      type: "number",
      description: "Maximum width for the eyebrow text",
    }),

    defineField({
      name: "heading",
      title: "Heading",
      type: "text",
      rows: 3,
    }),

    defineField({
      name: "left_description",
      title: "Left Description",
      type: "text",
      rows: 3,
    }),

    defineField({
      name: "right_description",
      title: "Right Description",
      type: "text",
      rows: 3,
    }),

    defineField({
      name: "button_text",
      title: "Button Text",
      type: "string",
      initialValue: "Learn more",
    }),

    defineField({
      name: "button_link",
      title: "Button Link",
      type: "string",
    }),
  ],

  preview: {
    select: {
      title: "heading",
      subtitle: "eyebrow",
    },
  },
});
