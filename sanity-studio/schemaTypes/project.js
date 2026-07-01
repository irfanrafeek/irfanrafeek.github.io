export const project = {
  name: 'project',
  title: 'Project',
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
      title: 'Cover Image (path or URL)',
      type: 'string',
      description: 'e.g. Assets/ambo-01.png or a full https:// URL',
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
      name: 'body',
      title: 'Body',
      type: 'portableBody',
    },
  ],
  preview: {
    select: { title: 'title', subtitle: 'year' },
  },
}
