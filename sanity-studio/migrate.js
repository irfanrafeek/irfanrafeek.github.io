/**
 * One-time migration: imports projects.json and writings.json into Sanity.
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
  return Math.random().toString(36).slice(2, 10)
}

function transformBlock(block) {
  const base = { _type: 'contentBlock', _key: uid(), type: block.type }

  switch (block.type) {
    case 'heading':
    case 'paragraph':
      return { ...base, text: block.text }

    case 'quote':
      return { ...base, text: block.text, attribution: block.attribution || '' }

    case 'image':
      return { ...base, src: block.src, alt: block.alt || '', caption: block.caption || '' }

    case 'video':
      return { ...base, src: block.src, poster: block.poster || '', caption: block.caption || '' }

    case 'list':
    case 'numbered_list':
      return { ...base, items: Array.isArray(block.items) ? block.items : [] }

    case 'gallery':
      return {
        ...base,
        galleryItems: (Array.isArray(block.items) ? block.items : []).map((item, i) => ({
          _type: 'galleryItem',
          _key: `gi-${i}-${uid()}`,
          src: item.src || '',
          alt: item.alt || '',
          caption: item.caption || '',
        })),
      }

    case 'embed':
      return {
        ...base,
        src: block.src,
        embedTitle: block.title || '',
        caption: block.caption || '',
      }

    default:
      return base
  }
}

function transformItem(item, docType) {
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
    blocks: Array.isArray(item.blocks) ? item.blocks.map(transformBlock) : [],
  }
}

async function migrate() {
  const rootDir = resolve(__dirname, '..')

  const { projects } = JSON.parse(readFileSync(resolve(rootDir, 'projects.json'), 'utf8'))
  const { writings } = JSON.parse(readFileSync(resolve(rootDir, 'writings.json'), 'utf8'))

  console.log(`Migrating ${projects.length} projects and ${writings.length} writings…\n`)

  for (const item of projects) {
    const doc = transformItem(item, 'project')
    await client.createOrReplace(doc)
    console.log(`✓ project: ${item.title}`)
  }

  for (const item of writings) {
    const doc = transformItem(item, 'writing')
    await client.createOrReplace(doc)
    console.log(`✓ writing: ${item.title}`)
  }

  console.log('\nMigration complete!')
}

migrate().catch((err) => {
  console.error('Migration failed:', err.message)
  process.exit(1)
})
