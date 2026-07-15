/**
 * Publish (or update) a SINGLE writing from writings.json into Sanity,
 * without touching any other document — unlike migrate.js, which re-imports
 * everything and would overwrite Studio edits.
 *
 * Run from the sanity-studio/ directory:
 *   SANITY_TOKEN=<your-token> node publish-writing.js <slug>
 *
 * Example:
 *   SANITY_TOKEN=sk... node publish-writing.js i-built-a-game-for-a-wedding-then-it-went-viral
 */
import { createClient } from '@sanity/client'
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname, basename, extname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, '..')

const slugArg = process.argv[2]
if (!slugArg) {
  console.error('Usage: SANITY_TOKEN=<token> node publish-writing.js <slug>')
  process.exit(1)
}
if (!process.env.SANITY_TOKEN) {
  console.error('Missing SANITY_TOKEN env var (sanity.io/manage → API → Tokens → Editor role)')
  process.exit(1)
}

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

const assetCache = new Map()

async function uploadLocalImage(path) {
  if (!path) return null
  const key = path.trim()
  if (assetCache.has(key)) return assetCache.get(key)
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
  return { _type: 'image', asset: { _type: 'reference', _ref: assetId } }
}

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

async function convertBlock(block) {
  switch (block.type) {
    case 'heading':
      return [ptBlock(block.text, 'h2')]
    case 'subheading':
      return [ptBlock(block.text, 'h3')]
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
      return (Array.isArray(block.items) ? block.items : []).map((item) => ptBlock(item, 'normal', 'bullet'))
    case 'numbered_list':
      return (Array.isArray(block.items) ? block.items : []).map((item) => ptBlock(item, 'normal', 'number'))
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
      return [{ _type: 'mediaVideo', _key: uid(), src: block.src || '', poster: block.poster || '', caption: block.caption || '' }]
    case 'gallery': {
      const items = []
      for (const item of (Array.isArray(block.items) ? block.items : [])) {
        const assetId = await uploadLocalImage(item.src)
        if (!assetId) continue
        items.push({ _type: 'galleryItem', _key: uid(), asset: { _type: 'reference', _ref: assetId }, alt: item.alt || '', caption: item.caption || '' })
      }
      return [{ _type: 'mediaGallery', _key: uid(), items }]
    }
    case 'embed':
      return [{ _type: 'mediaEmbed', _key: uid(), src: block.src || '', title: block.title || '', caption: block.caption || '' }]
    default:
      return []
  }
}

async function publish() {
  const { writings } = JSON.parse(readFileSync(resolve(rootDir, 'writings.json'), 'utf8'))
  const item = writings.find((w) => w.slug === slugArg)
  if (!item) {
    console.error(`No writing with slug "${slugArg}" in writings.json`)
    process.exit(1)
  }

  console.log(`→ publishing writing: ${item.title}`)
  const body = []
  for (const block of (Array.isArray(item.blocks) ? item.blocks : [])) {
    body.push(...(await convertBlock(block)))
  }

  const doc = {
    _type: 'writing',
    _id: `writing-${item.slug}`,
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

  await client.delete(`drafts.${doc._id}`).catch(() => {})
  await client.createOrReplace(doc)
  console.log(`  ✓ published as ${doc._id}`)
  console.log(`\nLive at: writing.html?slug=${item.slug}`)
}

publish().catch((err) => {
  console.error('Publish failed:', err.message)
  process.exit(1)
})
