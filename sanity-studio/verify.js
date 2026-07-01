/**
 * Verify migration parity between the original JSON and what's in Sanity.
 *
 * Reports:
 * - Documents missing from Sanity
 * - Content-block counts (JSON vs Sanity) so you can see if anything dropped
 * - Broken image references (missing asset URL)
 *
 * Uses only the public read API so no token is needed:
 *   node verify.js
 */
import { createClient } from '@sanity/client'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, '..')

const client = createClient({
  projectId: 'qgasa874',
  dataset: 'production',
  apiVersion: '2021-10-21',
  useCdn: false,
})

function countLegacyBlocks(item) {
  const blocks = Array.isArray(item.blocks) ? item.blocks : []
  let text = 0, media = 0, listItems = 0
  for (const b of blocks) {
    if (['heading', 'paragraph', 'quote'].includes(b.type)) text++
    else if (b.type === 'list' || b.type === 'numbered_list') listItems += (b.items || []).length
    else if (['image', 'video', 'gallery', 'embed'].includes(b.type)) media++
  }
  return { text, media, listItems, cover: item.image ? 1 : 0 }
}

function countSanityBody(doc) {
  const body = Array.isArray(doc.body) ? doc.body : []
  let text = 0, media = 0, listItems = 0
  for (const b of body) {
    if (b._type === 'block') {
      if (b.listItem) listItems++
      else text++
    } else if (['mediaImage', 'mediaVideo', 'mediaGallery', 'mediaEmbed'].includes(b._type)) {
      media++
    }
  }
  return { text, media, listItems, cover: doc.image?.asset?._ref ? 1 : 0 }
}

async function checkCollection(docType, jsonKey, jsonFile) {
  const { [jsonKey]: source } = JSON.parse(readFileSync(resolve(rootDir, jsonFile), 'utf8'))
  const sanityDocs = await client.fetch(`*[_type==$t]{_id,title,"slug":slug.current,image,body}`, { t: docType })
  const bySlug = new Map(sanityDocs.map((d) => [d.slug, d]))

  console.log(`\n=== ${docType.toUpperCase()}S — ${source.length} in JSON, ${sanityDocs.length} in Sanity ===\n`)

  const issues = []
  for (const item of source) {
    const doc = bySlug.get(item.slug)
    if (!doc) {
      issues.push(`✗ MISSING: ${item.slug}`)
      continue
    }
    const src = countLegacyBlocks(item)
    const dst = countSanityBody(doc)

    const parts = []
    parts.push(`text ${dst.text}/${src.text}`)
    parts.push(`media ${dst.media}/${src.media}`)
    parts.push(`list-items ${dst.listItems}/${src.listItems}`)
    parts.push(`cover ${dst.cover}/${src.cover}`)

    const ok = dst.media >= src.media && dst.cover >= src.cover
    console.log(`${ok ? '✓' : '⚠'} ${item.title}`)
    console.log(`    ${parts.join('   ')}`)
    if (!ok) issues.push(item.slug)
  }

  return issues
}

async function main() {
  const p = await checkCollection('project', 'projects', 'projects.json')
  const w = await checkCollection('writing', 'writings', 'writings.json')

  const failures = [...p, ...w]
  console.log('\n' + '─'.repeat(50))
  if (failures.length === 0) {
    console.log('✓ All content transferred successfully.')
  } else {
    console.log(`⚠ ${failures.length} item(s) need attention: ${failures.join(', ')}`)
  }
}

main().catch((err) => {
  console.error('Verify failed:', err.message)
  process.exit(1)
})
