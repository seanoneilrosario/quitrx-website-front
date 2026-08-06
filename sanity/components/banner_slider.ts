import { ALL_FIELDS_GROUP, defineField, defineType } from "sanity";
import { sectionIdField } from "./sectionId";

export default defineType({
  name: "banner_slider",
  title: "Banner Slider",
  type: "object",
  groups: [
    {
      name: "content",
      title: "Content",
    },
    {
      name: "settings",
      title: "Settings",
    },
    {
      ...ALL_FIELDS_GROUP,
      hidden: true,
    },
  ],
  fields: [
    sectionIdField,
    defineField({
      name: "title_block",
      title: "Title",
      type: "array",
      of: [{ type: "block" }],
      group: "content",

    }),
    defineField({
      name: "description",
      title: "Description",
      type: "array",
      of: [{ type: "block" }],
      group: "content",

    }),
     defineField({
      name: "grid_column",
      title: "Grid Column",
      type: "string",
       group: "settings",
      options: {
        list: [
          {title: "1", value: "1"},
          { title: "2", value: "2" },
          {title: "3", value: "3"},
          {title: "4", value: "4"},

        ],
        layout: "radio",
      },
      initialValue: "",
    }),
    defineField({
      name: "slide_items",
      title: "Slide Items",
      type: "array",
      group: "content",
      of: [
        {
          name: "column",
          title: "Column",
          type: "object",
          fields: [
            { name: "name", title: "Name", type: "string" },
            { name: "description", title: "Description", type: "blockContent" },
            { name: "defaultShowedText", title: "Default ShowedText (ex: 200 text length)", type: "number" },
           
          ],
        },
      ],
    }),
    defineField({
      name: "section_size",
      title: "Section size",
      type: "string",
      group: "settings",
      options: {
        list: [
          {title: "Small", value: "small"},
          {title: "Medium", value: "medium"},
          {title: "Large", value: "large"},
          {title: "Screen height", value: "screen"},
        ],
        layout: "radio",
      },
      initialValue: "medium",
    }),
    
    defineField({
      group: "settings",
      name: "addBg",
      title: "Add Bg",
      type: "boolean",
    }),
    defineField({
      group: "settings",
      name: "show_button",
      title: "Show Button (Back)",
      type: "boolean",
    }),
  ],

  preview: {
    select: {
      title: "title",
    },
  },
});
