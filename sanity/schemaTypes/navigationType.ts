import { ListIcon } from "@sanity/icons";
import { ALL_FIELDS_GROUP, defineField, defineType } from "sanity";

export const navigationType = defineType({
  name: "navigation",
  title: "Navigation",
  type: "document",
  icon: ListIcon,
  groups: [
    {
      name: "content",
      title: "Content",
    },
    {
      name: "logo",
      title: "LOGO",
    },
    {
      name: "links",
      title: "LINKS",
    },
    {
      ...ALL_FIELDS_GROUP,
      hidden: true,
    },
  ],
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      group: "content",
    }),
    defineField({
      name: "header_logo",
      title: "Header Logo",
      type: "image",
      group: "logo",
      fields: [
        defineField({
          name: "alt",
          title: "Alt Text",
          type: "string",
        }),
      ],
    }),
    defineField({
      name: "header_logo2",
      title: "Header Logo 2",
      type: "image",
      group: "logo",
      fields: [
        defineField({
          name: "alt",
          title: "Alt Text",
          type: "string",
        }),
      ],
    }),
    defineField({
      name: "footer_logo",
      title: "Footer Logo",
      type: "image",
      group: "logo",
      fields: [
        defineField({
          name: "alt",
          title: "Alt Text",
          type: "string",
        }),
      ],
    }),
    defineField({
      name: "footer_background_image",
      title: "Footer Background Image",
      type: "image",
      group: "logo",
      fields: [
        defineField({
          name: "alt",
          title: "Alt Text",
          type: "string",
        }),
      ],
    }),
    defineField({
      name: "header_menu",
      title: "Header Menu",
      type: "array",
      group: "links",
      of: [
        {
          type: "object",
          fields: [
            defineField({
              name: "title",
              title: "Title",
              type: "string",
            }),
            defineField({
              name: "page",
              title: "Internal Page",
              type: "object",
              fields: [
                defineField({
                  title: "Slug",
                  name: "slug",
                  type: "reference",
                  to: [{ type: "page" }, { type: "home" }],
                }),
              ],
            }),
            defineField({
              name: "link",
              title: "External Link",
              type: "url",
              description:
                "Optional - use this instead of page for external URLs.",
            }),
          ],
        },
      ],
    }),
    defineField({
      name: "footer_menu",
      title: "Footer Menu",
      type: "array",
      group: "links",
      of: [
        {
          type: "object",
          fields: [
            defineField({
              name: "title",
              title: "Title",
              type: "string",
            }),
            defineField({
              name: "link",
              title: "Link",
              type: "string",
            }),
          ],
        },
      ],
    }),
    defineField({
      name: "socials",
      title: "Socials",
      type: "array",
      group: "links",
      of: [
        {
          type: "object",
          fields: [
            defineField({
              name: "icon",
              title: "Icon",
              type: "image",
            }),
            defineField({
              name: "link",
              title: "Link",
              type: "string",
            }),
          ],
        },
      ],
    }),
    defineField({
      name: "contact_email",
      title: "Contact Email",
      type: "array",
      of: [{ type: "block" }],
      group: "content",
    }),
    defineField({
      name: "company_info",
      title: "Company Info",
      type: "array",
      of: [{ type: "block" }],
      group: "content",
    }),
  ],
});
