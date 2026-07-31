import { VideoIcon } from "@sanity/icons";
import { defineField, defineType } from "sanity";

export const videoBanner = defineType({
  name: "video_banner",
  title: "Video Banner",
  type: "object",
  icon: VideoIcon,
  fields: [
    defineField({
      name: "eyebrow",
      title: "Eyebrow",
      type: "string",
    }),
    defineField({
      name: "heading",
      title: "Heading",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "body",
      title: "Body",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "video",
      title: "Video",
      type: "file",
      options: {
        accept: "video/*",
      },
      fields: [
        defineField({
          name: "alt",
          title: "Alt Text",
          type: "string",
        }),
      ],
    }),
    defineField({
      name: "video_url",
      title: "Video URL",
      type: "url",
      description: "Optional external video URL.",
    }),
    defineField({
      name: "poster",
      title: "Poster Image",
      type: "image",
      options: {
        hotspot: true,
      },
      fields: [
        defineField({
          name: "alt",
          title: "Alt Text",
          type: "string",
        }),
      ],
    }),
    defineField({
      name: "cta",
      title: "Call To Action",
      type: "object",
      fields: [
        defineField({
          name: "label",
          title: "Label",
          type: "string",
        }),
        defineField({
          name: "link",
          title: "Link",
          type: "url",
        }),
      ],
    }),
  ],
  preview: {
    select: {
      title: "heading",
      subtitle: "eyebrow",
      media: "poster",
    },
    prepare({ title, subtitle, media }) {
      return {
        title: title || "Video Banner",
        subtitle,
        media,
      };
    },
  },
});
