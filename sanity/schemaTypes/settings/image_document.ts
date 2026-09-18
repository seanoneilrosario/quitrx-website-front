import { defineField, defineType } from "sanity";
import { ImageUploadInput } from '../../components/ImageUploadInput';

export const imageDocument = defineType({
  name: "image_document",
  title: "Image Uploads",
  type: "document",

  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: "images",
      title: "Images",
      type: "array",
      description: "Upload images, then search this document by image ID, URL, filename, alt text, or caption.",
      options: { layout: "grid" },
      components: { input: ImageUploadInput },
      of: [
        {
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
            defineField({
              name: "caption",
              title: "Caption",
              type: "string",
            }),
          ],
          preview: {
            select: { title: 'asset.originalFilename', subtitle: 'alt', media: 'asset' },
          },
        },
      ],
    }),
  ],

  preview: {
    select: {
      title: "title",
      media: "images.0",
    },
  },
});
