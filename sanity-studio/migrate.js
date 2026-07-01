/**
 * One-time migration: imports projects.json and writings.json into Sanity.
 * - Uploads referenced Assets/*.{png,jpg,gif,webp,svg} to Sanity's image CDN
 * - Converts legacy typed-blocks into Portable Text
 * - Cover images and content images become native Sanity image references
 *
 * Run from the sanity-studio/ directory:
 *   SANITY_TOKEN=<your-token> node migrate.js
 *
 * Get a write token from: https://sanity.io/manage → API → Tokens → Editor role
 */
import { createClient } from '@sanity/client'
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname, basename, extname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, '..')

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

// Cache of local-path → Sanity asset _id so we upload each unique image only once.
const assetCache = new Map()

async function uploadLocalImage(path) {
  if (!path) return null
  const key = path.trim()
  if (assetCache.has(key)) return assetCache.get(key)

  // External URLs stay as-is (only local Assets/* paths get uploaded).
  if (/^https?:\/\//i.test(key)) {
    assetCache.set(key, null)
    return null
  }

  const full = resolve(rootDir, key)
  if (!existsSync(full)) {
    console.warn(`  ⚠ file not found, skipping: ${key}`)
    assetCache.set(key, null)
    return null
  }

  const ext = extname(key).toLowerCase()
  if (!/\.(png|jpe?g|gif|webp|svg|avif)$/i.test(ext)) {
    assetCache.set(key, null)
    return null
  }

  try {
    const asset = await client.assets.upload('image', readFileSync(full), {
      filename: basename(key),
    })
    console.log(`  ↑ uploaded ${key}`)
    assetCache.set(key, asset._id)
    return asset._id
  } catch (err) {
    console.warn(`  ⚠ upload failed for ${key}: ${err.message}`)
    assetCache.set(key, null)
    return null
  }
}

function imageRef(assetId) {
  return {
    _type: 'image',
    asset: { _type: 'reference', _ref: assetId },
  }
}

// Portable Text text block (paragraph, heading, list-item, quote).
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

// Convert one legacy typed block → one or more Portable Text entries.
// Images are uploaded (if local) and referenced by asset ID.
async function convertBlock(block) {
  switch (block.type) {
    case 'heading':
      return [ptBlock(block.text, 'h2')]

    case 'paragraph':
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

    case 'image': {
      const assetId = await uploadLocalImage(block.src)
      if (!assetId) return []
      return [{
        _type: 'mediaImage',
        _key: uid(),
        asset: { _type: 'reference', _ref: assetId },
        alt: block.alt || '',
        caption: block.caption || '',
      }]
    }

    case 'video':
      return [{
        _type: 'mediaVideo',
        _key: uid(),
        src: block.src || '',
        poster: block.poster || '',
        caption: block.caption || '',
      }]

    case 'gallery': {
      const items = []
      for (const item of (Array.isArray(block.items) ? block.items : [])) {
        const assetId = await uploadLocalImage(item.src)
        if (!assetId) continue
        items.push({
          _type: 'galleryItem',
          _key: uid(),
          asset: { _type: 'reference', _ref: assetId },
          alt: item.alt || '',
          caption: item.caption || '',
        })
      }
      return [{ _type: 'mediaGallery', _key: uid(), items }]
    }

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

async function transformItem(item, docType) {
  const legacyBlocks = Array.isArray(item.blocks) ? item.blocks : []
  const body = []
  for (const block of legacyBlocks) {
    const converted = await convertBlock(block)
    body.push(...converted)
  }

  const doc = {
    _type: docType,
    _id: `${docType}-${item.slug}`,
    title: item.title,
    slug: { _type: 'slug', current: item.slug },
    year: String(item.year),
    description: item.description || '',
    tags: Array.isArray(item.tags) ? item.tags : [],
    featured: Boolean(item.featured),
    body,
  }

  const coverAssetId = await uploadLocalImage(item.image)
  if (coverAssetId) doc.image = imageRef(coverAssetId)

  return doc
}

async function migrate() {
  const { projects } = JSON.parse(readFileSync(resolve(rootDir, 'projects.json'), 'utf8'))
  const { writings } = JSON.parse(readFileSync(resolve(rootDir, 'writings.json'), 'utf8'))

  console.log(`Migrating ${projects.length} projects and ${writings.length} writings…`)
  console.log(`(images will be uploaded to Sanity CDN — this takes a couple of minutes)\n`)

  for (const item of projects) {
    console.log(`→ project: ${item.title}`)
    const doc = await transformItem(item, 'project')
    await client.createOrReplace(doc)
    console.log(`  ✓ saved\n`)
  }

  for (const item of writings) {
    console.log(`→ writing: ${item.title}`)
    const doc = await transformItem(item, 'writing')
    await client.createOrReplace(doc)
    console.log(`  ✓ saved\n`)
  }

  console.log(`Migration complete! Uploaded ${[...assetCache.values()].filter(Boolean).length} unique images.`)
}

migrate().catch((err) => {
  console.error('Migration failed:', err.message)
  process.exit(1)
})
