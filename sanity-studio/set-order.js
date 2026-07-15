/**
 * Sets sortOrder on existing projects so the site displays them in the intended sequence.
 * The GROQ query orders by `coalesce(sortOrder, 9999) asc, year desc`, so:
 *   - Projects with a sortOrder appear first (lowest number wins).
 *   - Any project left without a sortOrder falls through to year-desc.
 *
 * Usage:
 *   SANITY_TOKEN=<token> node set-order.js
 *
 * Get a write token from: https://sanity.io/manage → API → Tokens → Editor role.
 * Safe to re-run — patches are idempotent.
 */

import { createClient } from '@sanity/client'

const client = createClient({
  projectId: 'qgasa874',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_TOKEN,
  useCdn: false,
})

const ORDER = [
  ['building-ambo',                              10],
  ['theming-conde-nast-verso',                   20],
  ['spacing-verso-design-system',                30],
  ['revamping-conventional-subscription-flows',  40],
  ['emphasis-design-system',                     50],
  ['ahead',                                      60],
  ['asista-redesign',                            70],
]

async function main() {
  if (!process.env.SANITY_TOKEN) {
    console.error('Missing SANITY_TOKEN env var.')
    process.exit(1)
  }

  for (const [slug, sortOrder] of ORDER) {
    const ids = await client.fetch(
      '*[_type=="project" && slug.current==$slug]._id',
      { slug }
    )
    if (!ids.length) {
      console.warn(`skip ${slug} — not found in Sanity`)
      continue
    }
    for (const id of ids) {
      await client.patch(id).set({ sortOrder }).commit()
      console.log(`set ${id} → ${sortOrder}`)
    }
  }

  console.log('done')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
