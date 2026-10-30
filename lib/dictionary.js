// The dictionary check: one snapshot of the `metadata` dictionary per run (fetched through arangojs with the
// same credentials, database `metadata`), then synchronous validation of every value against its descriptor.
// Same policy as metadata-external-databases/lib/dictionary.js: check on the FINAL document right before the
// write; errors refuse the run unless the operator says --on-invalid drop|keep; warnings never change data.
import { createRequire } from 'node:module'
import { writeFileSync } from 'node:fs'
import { connect } from './db.js'

export const validator = createRequire(import.meta.url)('metadata-store-validator')
export const ON_INVALID = ['fail', 'drop', 'keep']
export const ON_MISSING = ['fail', 'drop']

/** Fetch the snapshot for `gids`; `missing` lists gids the dictionary does not know (e.g. terms not yet created). */
export async function loadDictionary(gids, creds, { snapshotFile = null } = {}) {
  const { db } = connect(creds, { database: 'metadata' })
  const snapshot = await validator.buildSnapshot({
    gids: [...new Set(gids)],
    query: (aql, bindVars) => db.query(aql, bindVars).then((c) => c.all()),
  })
  if (snapshotFile) writeFileSync(snapshotFile, JSON.stringify(snapshot))
  return { dictionary: validator.makeSnapshotDbAccess(snapshot), missing: snapshot.missing ?? [] }
}

/**
 * Check a document whose values sit either flat under `properties` (keys = gids) or nested one level under
 * non-descriptor keys (climate sources). Returns { errors, warnings } with paths; `report.add` is called for
 * every leaf. `skip` = gids to ignore (missing from the dictionary and dropped by policy).
 */
export function checkDocument(doc, dictionary, report, { skip = new Set() } = {}) {
  const errors = [], warnings = []
  const leaf = (gid, value, path) => {
    if (skip.has(gid)) return
    const r = validator.validateByDictionary(value, gid, dictionary)
    report.add(r, { gid })
    for (const e of r.errors) errors.push({ ...e, path: `${path}.${e.path ?? gid}` })
    for (const w of r.warnings) warnings.push({ ...w, path: `${path}.${w.path ?? gid}` })
  }
  for (const [k, v] of Object.entries(doc)) {
    if (k.startsWith('_') || k === 'properties') continue
    leaf(k, v, k)
  }
  for (const [src, block] of Object.entries(doc.properties ?? {})) {
    for (const [gid, v] of Object.entries(block)) if (v !== null && v !== undefined) leaf(gid, v, `properties.${src}`)
  }
  return { errors, warnings }
}

/** Remove the properties named in `gids` from every source block (policy --on-missing drop). */
export function dropGids(doc, gids) {
  for (const block of Object.values(doc.properties ?? {})) for (const g of gids) delete block[g]
  return doc
}
