import { defineField, defineType } from 'sanity'
import { TextIcon } from "@sanity/icons";


export default defineType({
  name: 'twoColumnLayout',
  title: 'Two Column Layout',
  type: 'object',
  icon: TextIcon,
  fields: [
    defineField({
      name: 'layoutPosition',
      title: 'Layout Position',
      type: 'string',
      options: {
        list: [
          { title: 'Title on Top (Vertical)', value: 'vertical' },
          { title: 'Title on Left (Horizontal)', value: 'horizontal' },
        ],
        layout: 'radio',
      },
      initialValue: 'vertical',
    }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'Main title for this section',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'leftDescription',
      title: 'Left Description',
      type: 'array',
      of: [{ type: 'block' }],
      description: 'Rich text content for left column',
    }),
    defineField({
      name: 'rightDescription',
      title: 'Right Description',
      type: 'array',
      of: [{ type: 'block' }],
      description: 'Rich text content for right column',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      layout: 'layoutPosition',
    },
    prepare(selection) {
      const { title, layout } = selection
      return {
        title: title || 'Untitled',
        subtitle: layout === 'vertical' ? 'Vertical (Title on Top)' : 'Horizontal (Title on Left)',
      }
    },
  },
})
