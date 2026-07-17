export const writing = {
  name: 'writing',
  title: 'Writing',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title' },
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'year',
      title: 'Year',
      type: 'string',
    },
    {
      name: 'image',
      title: 'Cover Image',
      type: 'image',
      options: { hotspot: true },
    },
    {
      name: 'description',
      title: 'Short Description',
      type: 'text',
      rows: 3,
    },
    {
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'string' }],
      options: { layout: 'tags' },
    },
    {
      name: 'featured',
      title: 'Featured on home page',
      type: 'boolean',
      initialValue: false,
    },
    {
      name: 'sortOrder',
      title: 'Sort order',
      description: 'Lower numbers appear first. Leave blank to fall back to year (newest first). Use gaps of 10 (10, 20, 30…) so you can slot new items in without renumbering.',
      type: 'number',
    },
    {
      name: 'body',
      title: 'Body',
      type: 'portableBody',
    },
  ],
  preview: {
    select: { title: 'title', subtitle: 'year', media: 'image' },
  },
}
