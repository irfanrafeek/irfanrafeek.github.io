// Portable Text body — Notion-like editor with inline formatting
// plus custom embedded blocks for media (image, video, gallery, embed).
export const portableBody = {
  name: 'portableBody',
  type: 'array',
  title: 'Body',
  of: [
    {
      type: 'block',
      title: 'Text',
      styles: [
        { title: 'Paragraph', value: 'normal' },
        { title: 'Heading', value: 'h2' },
        { title: 'Subheading', value: 'h3' },
        { title: 'Quote', value: 'blockquote' },
      ],
      lists: [
        { title: 'Bullet', value: 'bullet' },
        { title: 'Numbered', value: 'number' },
      ],
      marks: {
        decorators: [
          { title: 'Bold', value: 'strong' },
          { title: 'Italic', value: 'em' },
          { title: 'Underline', value: 'underline' },
          { title: 'Code', value: 'code' },
        ],
        annotations: [
          {
            name: 'link',
            type: 'object',
            title: 'Link',
            fields: [
              {
                name: 'href',
                type: 'url',
                title: 'URL',
                validation: (Rule) => Rule.uri({ scheme: ['http', 'https', 'mailto', 'tel'] }),
              },
            ],
          },
        ],
      },
    },
    {
      type: 'object',
      name: 'mediaImage',
      title: 'Image',
      fields: [
        { name: 'src', title: 'Image path or URL', type: 'string' },
        { name: 'alt', title: 'Alt text', type: 'string' },
        { name: 'caption', title: 'Caption', type: 'string' },
      ],
      preview: {
        select: { title: 'src', subtitle: 'caption' },
        prepare: ({ title, subtitle }) => ({
          title: title || '(no image)',
          subtitle: subtitle ? `🖼 ${subtitle}` : '🖼 Image',
        }),
      },
    },
    {
      type: 'object',
      name: 'mediaVideo',
      title: 'Video',
      fields: [
        { name: 'src', title: 'Video URL', type: 'string' },
        { name: 'poster', title: 'Poster image URL', type: 'string' },
        { name: 'caption', title: 'Caption', type: 'string' },
      ],
      preview: {
        select: { title: 'src', subtitle: 'caption' },
        prepare: ({ title, subtitle }) => ({
          title: title || '(no video)',
          subtitle: subtitle ? `▶ ${subtitle}` : '▶ Video',
        }),
      },
    },
    {
      type: 'object',
      name: 'mediaGallery',
      title: 'Gallery',
      fields: [
        {
          name: 'items',
          title: 'Images',
          type: 'array',
          of: [
            {
              type: 'object',
              name: 'galleryItem',
              fields: [
                { name: 'src', title: 'Image path or URL', type: 'string' },
                { name: 'alt', title: 'Alt text', type: 'string' },
                { name: 'caption', title: 'Caption', type: 'string' },
              ],
              preview: { select: { title: 'src', subtitle: 'caption' } },
            },
          ],
        },
      ],
      preview: {
        select: { items: 'items' },
        prepare: ({ items }) => ({
          title: `Gallery (${(items || []).length} image${(items || []).length === 1 ? '' : 's'})`,
          subtitle: '⊞ Gallery',
        }),
      },
    },
    {
      type: 'object',
      name: 'mediaEmbed',
      title: 'Embed',
      fields: [
        { name: 'src', title: 'Embed URL', type: 'string' },
        { name: 'title', title: 'Title (for accessibility)', type: 'string' },
        { name: 'caption', title: 'Caption', type: 'string' },
      ],
      preview: {
        select: { title: 'src', subtitle: 'caption' },
        prepare: ({ title, subtitle }) => ({
          title: title || '(no embed)',
          subtitle: subtitle ? `⊡ ${subtitle}` : '⊡ Embed',
        }),
      },
    },
  ],
}
