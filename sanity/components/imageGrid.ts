/* eslint-disable @typescript-eslint/no-explicit-any */
import { defineField, defineType } from 'sanity'
import { ImagesIcon } from '@sanity/icons'

export default defineType({
  name: 'imageGrid',
  title: 'Image Grid',
  type: 'object',
  icon: ImagesIcon,
  fields: [
    defineField({
      name: 'rows',
      title: 'Image Rows',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'gridRow',
          title: 'Grid Row',
          fields: [
            defineField({
              name: 'columns',
              title: 'Number of Columns',
              type: 'number',
              description: 'How many images in this row (e.g., 3 or 4)',
              initialValue: 3,
              validation: (Rule) => Rule.required().min(1).max(6),
            }),
            defineField({
              name: 'images',
              title: 'Images',
              type: 'array',
              of: [
                {
                  type: 'object',
                  name: 'gridImage',
                  title: 'Grid Image',
                  fields: [
                    defineField({
                      name: 'image',
                      title: 'Image',
                      type: 'image',
                      options: { hotspot: true },
                      validation: (Rule) => Rule.required(),
                    }),
                    defineField({
                      name: 'alt',
                      title: 'Alt Text',
                      type: 'string',
                      description: 'Alternative text for accessibility',
                    }),
                    defineField({
                      name: 'caption',
                      title: 'Caption',
                      type: 'string',
                      description: 'Optional caption for the image',
                    }),
                    defineField({
                      name: 'link',
                      title: 'Link',
                      type: 'url',
                      description: 'Optional link when image is clicked',
                    }),
                  ],
                  preview: {
                    select: {
                      image: 'image',
                      alt: 'alt',
                    },
                    prepare(selection) {
                      const { image, alt } = selection
                      return {
                        title: alt || 'Image',
                        media: image,
                      }
                    },
                  },
                },
              ],
              validation: (Rule) =>
                Rule.custom((images, context) => {
                  const columns = (context.parent as any)?.columns || 3
                  if (!images || images.length === 0) {
                    return 'At least one image is required'
                  }
                  if (images.length !== columns) {
                    return `This row should have exactly ${columns} images, but has ${images.length}`
                  }
                  return true
                }),
            }),
          ],
          preview: {
            select: {
              columns: 'columns',
              image0: 'images.0.image',
              image1: 'images.1.image',
              image2: 'images.2.image',
            },
            prepare(selection) {
              const { columns, image0 } = selection
              return {
                title: `Row - ${columns} Columns`,
                media: image0,
              }
            },
          },
        },
      ],
    }),
  ],
  preview: {
    select: {
      rows: 'rows',
    },
    prepare(selection) {
      const { rows } = selection
      const rowCount = (rows as any)?.length || 0
      return {
        title: 'Image Grid',
        subtitle: `${rowCount} row${rowCount !== 1 ? 's' : ''}`,
      }
    },
  },
})
