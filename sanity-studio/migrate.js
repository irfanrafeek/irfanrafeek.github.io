/**
 * One-time migration: imports projects.json and writings.json into Sanity.
 * Converts the legacy typed-blocks format into Portable Text.
 *
 * Run from the sanity-studio/ directory:
 *   SANITY_TOKEN=<your-token> node migrate.js
 *
 * Get a write token from: https://sanity.io/manage → API → Tokens → Add API token (Editor role)
 */
import { createClient } from '@sanity/client'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const client = createClient({
  projectId: 'qgasa874',
  dataset: 'production',
  apiVersion: '2021-10-21',
  token: process.env.SANITY_TOKEN,
  useCdn: false,
})

function uid() {
  return Math.random().toString(36).slice(2, 12)
}

// Build a Portable Text "block" (paragraph, heading, list-item, quote).
function ptBlock(text, style = 'normal', listItem) {
  const block = {
    _type: 'block',
    _key: uid(),
    style,
    markDefs: [],
    children: [{ _type: 'span', _key: uid(), text: String(text || ''), marks: [] }],
  }
  if (listItem) {
    block.listItem = listItem
    block.level = 1
  }
  return block
}

// Convert a single legacy typed block → one or more Portable Text entries.
function convertBlock(block) {
  switch (block.type) {
    case 'heading':
      return [ptBlock(block.text, 'h2')]

    case 'paragraph':
      // Support double-newlines within a paragraph → multiple PT paragraphs.
      return String(block.text || '')
        .split(/\n\n+/)
        .map((t) => ptBlock(t, 'normal'))

    case 'quote': {
      const out = [ptBlock(block.text, 'blockquote')]
      if (block.attribution) out.push(ptBlock(`— ${block.attribution}`, 'normal'))
      return out
    }

    case 'list':
      return (Array.isArray(block.items) ? block.items : [])
        .map((item) => ptBlock(item, 'normal', 'bullet'))

    case 'numbered_list':
      return (Array.isArray(block.items) ? block.items : [])
        .map((item) => ptBlock(item, 'normal', 'number'))

    case 'image':
      return [{
        _type: 'mediaImage',
        _key: uid(),
        src: block.src || '',
        alt: block.alt || '',
        caption: block.caption || '',
      }]

    case 'video':
      return [{
        _type: 'mediaVideo',
        _key: uid(),
        src: block.src || '',
        poster: block.poster || '',
        caption: block.caption || '',
      }]

    case 'gallery':
      return [{
        _type: 'mediaGallery',
        _key: uid(),
        items: (Array.isArray(block.items) ? block.items : []).map((item) => ({
          _type: 'galleryItem',
          _key: uid(),
          src: item.src || '',
          alt: item.alt || '',
          caption: item.caption || '',
        })),
      }]

    case 'embed':
      return [{
        _type: 'mediaEmbed',
        _key: uid(),
        src: block.src || '',
        title: block.title || '',
        caption: block.caption || '',
      }]

    default:
      return []
  }
}

function transformItem(item, docType) {
  const legacyBlocks = Array.isArray(item.blocks) ? item.blocks : []
  const body = legacyBlocks.flatMap(convertBlock)

  return {
    _type: docType,
    _id: `${docType}-${item.slug}`,
    title: item.title,
    slug: { _type: 'slug', current: item.slug },
    year: String(item.year),
    image: item.image || '',
    description: item.description || '',
    tags: Array.isArray(item.tags) ? item.tags : [],
    featured: Boolean(item.featured),
    body,
  }
}

async function migrate() {
  const rootDir = resolve(__dirname, '..')

  const { projects } = JSON.parse(readFileSync(resolve(rootDir, 'projects.json'), 'utf8'))
  const { writings } = JSON.parse(readFileSync(resolve(rootDir, 'writings.json'), 'utf8'))

  console.log(`Migrating ${projects.length} projects and ${writings.length} writings…\n`)

  for (const item of projects) {
    await client.createOrReplace(transformItem(item, 'project'))
    console.log(`✓ project: ${item.title}`)
  }

  for (const item of writings) {
    await client.createOrReplace(transformItem(item, 'writing'))
    console.log(`✓ writing: ${item.title}`)
  }

  console.log('\nMigration complete!')
}

migrate().catch((err) => {
  console.error('Migration failed:', err.message)
  process.exit(1)
})
