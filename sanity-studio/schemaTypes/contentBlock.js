export const contentBlock = {
  name: 'contentBlock',
  title: 'Content Block',
  type: 'object',
  fields: [
    {
      name: 'type',
      title: 'Block Type',
      type: 'string',
      validation: (Rule) => Rule.required(),
      options: {
        list: [
          { title: 'Heading', value: 'heading' },
          { title: 'Paragraph', value: 'paragraph' },
          { title: 'Image', value: 'image' },
          { title: 'Quote', value: 'quote' },
          { title: 'Video', value: 'video' },
          { title: 'Bullet List', value: 'list' },
          { title: 'Numbered List', value: 'numbered_list' },
          { title: 'Gallery', value: 'gallery' },
          { title: 'Embed', value: 'embed' },
        ],
      },
    },
    {
      name: 'text',
      title: 'Text',
      type: 'text',
      rows: 4,
      hidden: ({ parent }) => !['heading', 'paragraph', 'quote'].includes(parent?.type),
    },
    {
      name: 'src',
      title: 'Source URL / Path',
      type: 'string',
      hidden: ({ parent }) => !['image', 'video', 'embed'].includes(parent?.type),
    },
    {
      name: 'alt',
      title: 'Alt Text',
      type: 'string',
      hidden: ({ parent }) => parent?.type !== 'image',
    },
    {
      name: 'caption',
      title: 'Caption',
      type: 'string',
      hidden: ({ parent }) => !['image', 'video', 'gallery', 'embed'].includes(parent?.type),
    },
    {
      name: 'poster',
      title: 'Poster Image URL',
      type: 'string',
      hidden: ({ parent }) => parent?.type !== 'video',
    },
    {
      name: 'attribution',
      title: 'Attribution / Source',
      type: 'string',
      hidden: ({ parent }) => parent?.type !== 'quote',
    },
    {
      name: 'embedTitle',
      title: 'Embed Title (for accessibility)',
      type: 'string',
      hidden: ({ parent }) => parent?.type !== 'embed',
    },
    {
      name: 'items',
      title: 'List Items',
      type: 'array',
      hidden: ({ parent }) => !['list', 'numbered_list'].includes(parent?.type),
      of: [{ type: 'string' }],
    },
    {
      name: 'galleryItems',
      title: 'Gallery Images',
      type: 'array',
      hidden: ({ parent }) => parent?.type !== 'gallery',
      of: [
        {
          type: 'object',
          name: 'galleryItem',
          title: 'Image',
          fields: [
            { name: 'src', title: 'Image Path / URL', type: 'string' },
            { name: 'alt', title: 'Alt Text', type: 'string' },
            { name: 'caption', title: 'Caption', type: 'string' },
          ],
          preview: {
            select: { title: 'src', subtitle: 'caption' },
          },
        },
      ],
    },
  ],
  preview: {
    select: { type: 'type', text: 'text', src: 'src' },
    prepare({ type, text, src }) {
      const label = {
        heading: '— Heading',
        paragraph: '¶ Paragraph',
        image: '🖼 Image',
        quote: '" Quote',
        video: '▶ Video',
        list: '• List',
        numbered_list: '1. Numbered List',
        gallery: '⊞ Gallery',
        embed: '⊡ Embed',
      }[type] || type
      return { title: text || src || '(empty)', subtitle: label }
    },
  },
}
