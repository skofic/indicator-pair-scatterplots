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
 * Check a document: top-level descriptors, then `properties`, whose values nest under NON-descriptor keys
 * (source, period, model, scenario) to any depth. A key that is a descriptor in `leafGids` is validated as a
 * leaf; a plain object under any other key is recursed into; anything else is an unknown property error.
 * `skip` = gids to ignore (missing from the dictionary and dropped by policy).
 */
export function checkDocument(doc, dictionary, report, { skip = new Set(), leafGids = null } = {}) {
  const errors = [], warnings = []
  const leaf = (gid, value, path) => {
    if (skip.has(gid)) return
    const r = validator.validateByDictionary(value, gid, dictionary)
    report.add(r, { gid })
    for (const e of r.errors) errors.push({ ...e, path: `${path}.${e.path ?? gid}` })
    for (const w of r.warnings) warnings.push({ ...w, path: `${path}.${w.path ?? gid}` })
  }
  const isLeaf = (k) => (leafGids ? leafGids.has(k) : k.startsWith('env_climate_') || k === 'geometry_hash')
  const walk = (obj, path) => {
    for (const [k, v] of Object.entries(obj)) {
      if (v === null || v === undefined) continue
      if (isLeaf(k)) leaf(k, v, path)
      else if (typeof v === 'object' && !Array.isArray(v)) walk(v, `${path}.${k}`)
      else errors.push({ code: 'UNKNOWN_PROPERTY', path: `${path}.${k}`, value: v, message: `"${k}" is not a descriptor and not a container` })
    }
  }
  for (const [k, v] of Object.entries(doc)) {
    if (k.startsWith('_') || k === 'properties') continue
    leaf(k, v, k)
  }
  if (doc.properties) walk(doc.properties, 'properties')
  return { errors, warnings }
}

/** Remove the properties named in `gids` anywhere under `properties` (policy --on-missing drop). */
export function dropGids(doc, gids) {
  const strip = (o) => { for (const [k, v] of Object.entries(o)) { if (gids.includes(k)) delete o[k]; else if (v && typeof v === 'object' && !Array.isArray(v)) strip(v) } }
  if (doc.properties) strip(doc.properties)
  return doc
}

