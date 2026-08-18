/**
 * Moves a document between the `project` and `writing` types.
 *
 * Sanity cannot patch `_type`, so a move is create-then-delete: the whole
 * document is copied under a new id with the new type, and only once the copy
 * is confirmed to exist is the original removed. A JSON backup of the original
 * is written next to this script first, so the move is always reversible.
 *
 * `sortOrder` is dropped on the way across — the two lists are ordered
 * independently, so a rank that made sense among projects is meaningless
 * among writings, where it would fall back to year-desc.
 *
 * Usage (from sanity-studio/):
 *   node move-to-writing.js <slug> [--to writing|project]
 *
 * Token: SANITY_TOKEN if set, otherwise the Sanity CLI login in
 * ~/.config/sanity/config.json.
 */
import { createClient } from '@sanity/client'
import { readFileSync, writeFileSync } from 'fs'
import { homedir } from 'os'
import { resolve } from 'path'

const slug = process.argv[2]
const toIndex = process.argv.indexOf('--to')
const toType = toIndex === -1 ? 'writing' : process.argv[toIndex + 1]
const fromType = toType === 'writing' ? 'project' : 'writing'

if (!slug || !['writing', 'project'].includes(toType)) {
  console.error('Usage: node move-to-writing.js <slug> [--to writing|project]')
  process.exit(1)
}

function token() {
  if (process.env.SANITY_TOKEN) return process.env.SANITY_TOKEN
  try {
    return JSON.parse(readFileSync(resolve(homedir(), '.config/sanity/config.json'), 'utf8')).authToken
  } catch {
    return null
  }
}

const auth = token()
if (!auth) {
  console.error('No token — set SANITY_TOKEN or run `npx sanity login`.')
  process.exit(1)
}

const client = createClient({
  projectId: 'qgasa874',
  dataset: 'production',
  apiVersion: '2021-10-21',
  token: auth,
  useCdn: false,
})

async function main() {
  const doc = await client.fetch('*[_type==$fromType && slug.current==$slug][0]', { fromType, slug })
  if (!doc) {
    console.error(`No ${fromType} with slug "${slug}".`)
    process.exit(1)
  }

  const backup = resolve(`backup-${doc._id}.json`)
  writeFileSync(backup, JSON.stringify(doc, null, 2))
  console.log(`backed up ${doc._id} → ${backup}`)

  const { _id, _type, _rev, _createdAt, _updatedAt, sortOrder, ...fields } = doc
  const newId = `${toType}-${slug}`

  if (await client.fetch('*[_id==$newId][0]._id', { newId })) {
    console.error(`${newId} already exists — nothing done.`)
    process.exit(1)
  }

  await client.create({ _id: newId, _type: toType, ...fields })
  console.log(`created ${newId} as ${toType}`)

  // Only remove the original once the copy is readable back from the API.
  const created = await client.fetch('*[_id==$newId][0]{_id,_type,title}', { newId })
  if (!created) {
    console.error('Copy not readable — leaving the original in place.')
    process.exit(1)
  }

  await client.delete(_id)
  console.log(`deleted ${_id}`)
  console.log('done —', created.title, 'is now a', created._type)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
