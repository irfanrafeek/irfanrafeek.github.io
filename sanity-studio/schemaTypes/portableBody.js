// Portable Text body — Notion-like editor with inline formatting
// plus custom embedded blocks for media (image, video, gallery, embed).
// Images and gallery items use Sanity's native image asset type
// (upload / drag-drop / hotspot / auto-resize via CDN).
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
      type: 'image',
      name: 'mediaImage',
      title: 'Image',
      options: { hotspot: true },
      fields: [
        { name: 'alt', title: 'Alt text', type: 'string' },
        { name: 'caption', title: 'Caption', type: 'string' },
      ],
      preview: {
        select: { media: 'asset', title: 'caption', alt: 'alt' },
        prepare: ({ media, title, alt }) => ({
          title: title || alt || 'Image',
          subtitle: '🖼 Image',
          media,
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
              type: 'image',
              name: 'galleryItem',
              options: { hotspot: true },
              fields: [
                { name: 'alt', title: 'Alt text', type: 'string' },
                { name: 'caption', title: 'Caption', type: 'string' },
              ],
              preview: {
                select: { media: 'asset', title: 'caption', alt: 'alt' },
                prepare: ({ media, title, alt }) => ({
                  title: title || alt || 'Image',
                  media,
                }),
              },
            },
          ],
        },
      ],
      preview: {
        select: { items: 'items', firstAsset: 'items.0.asset' },
        prepare: ({ items, firstAsset }) => ({
          title: `Gallery (${(items || []).length} image${(items || []).length === 1 ? '' : 's'})`,
          subtitle: '⊞ Gallery',
          media: firstAsset,
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
