import {TagIcon} from '@sanity/icons'
import {defineField, defineType} from 'sanity'

export const productCollectionType = defineType({
  name: 'productCollection',
  title: 'Product Collection',
  type: 'document',
  icon: TagIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Collection name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'URL slug',
      type: 'slug',
      options: {source: 'title'},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'image',
      title: 'Collection image',
      type: 'image',
      options: {hotspot: true},
      fields: [
        defineField({name: 'alt', title: 'Alternative text', type: 'string'}),
      ],
    }),
  ],
  preview: {
    select: {title: 'title', media: 'image'},
  },
})
