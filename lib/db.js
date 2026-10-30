// ArangoDB connection for this project's pipeline.
// Adapted from metadata-external-databases/lib/db.js (same credentials convention, same write guard,
// same async-job pattern for long queries), trimmed to what this repository uses.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { Database } from 'arangojs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const CRED_PATH = resolve(__dirname, '../globals/auth/db.credentials.json')
export const CRED_ENV = 'DB_CREDENTIALS'

/** --credentials PATH, else $DB_CREDENTIALS, else globals/auth/db.credentials.json */
export function credentialsPath(argv = process.argv) {
  const i = argv.indexOf('--credentials')
  if (i >= 0) {
    if (!argv[i + 1]) throw new Error('--credentials needs a path')
    return argv[i + 1]
  }
  return process.env[CRED_ENV] || CRED_PATH
}

export function loadCredentials(path = credentialsPath()) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch (err) {
    throw new Error(
      `Could not read DB credentials at ${path}. Copy globals/auth/db.credentials.prototype.json to ` +
        `db.credentials.json and fill it in. (${err.message})`,
    )
  }
}

/**
 * Connect; returns { db, collections, database }. Write tools pass { requireLoadTarget: true } and are
 * refused unless the credentials file carries "is_load_target": true — the per-machine fence that keeps
 * a production credentials file from ever being written to by mistake.
 */
export function connect(creds = loadCredentials(), { database, requireLoadTarget = false } = {}) {
  const databaseName = database || creds.database
  if (requireLoadTarget && creds.is_load_target !== true) {
    throw new Error(
      `Refusing to write: the credentials file is not marked "is_load_target": true ` +
        `(host=${creds.host}, db=${databaseName}).`,
    )
  }
  const db = new Database({
    url: creds.host,
    databaseName,
    auth: { username: creds.username, password: creds.password },
  })
  return { db, collections: creds.collections, database: databaseName }
}

/** Say what went wrong, including the errno undici hides on `.cause`. */
export function explain(err) {
  const parts = [err?.message ?? String(err)]
  for (let c = err?.cause; c; c = c.cause) {
    const bit = [c.code, c.message].filter(Boolean).join(' ')
    if (bit && !parts.includes(bit)) parts.push(bit)
  }
  if (err?.isArangoError && err.errorNum) parts.push(`ArangoDB errorNum ${err.errorNum}`)
  return parts.join(' ← ')
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/**
 * Run an AQL query of any duration without holding an HTTP request open: the server stores the job
 * (`x-arango-async: store`), we poll it with a ramping interval, then drain the cursor. Node's fetch
 * gives up on a silent socket after 300 s, which is why db.query() cannot be used for a long COLLECT.
 */
export async function longQuery(db, query, bindVars = {}, { batchSize = 1000, ttl = 3600, pollMs = 5000, onWait = null } = {}) {
  const started = Date.now()
  const accepted = await db.request({
    method: 'POST', path: '/_api/cursor', headers: { 'x-arango-async': 'store' },
    body: { query, bindVars, batchSize, ttl },
  }, false)
  const jobId = accepted.headers.get('x-arango-async-id')
  if (accepted.status !== 202 || !jobId) throw new Error(`query was not queued as an async job (HTTP ${accepted.status})`)
  let body = null, wait = 25, reported = 0
  for (;;) {
    const res = await db.request({ method: 'PUT', path: `/_api/job/${jobId}` }, false)
    if (res.status !== 204) { body = res.parsedBody; break }
    await sleep(wait)
    wait = Math.min(pollMs, Math.round(wait * 2))
    const elapsed = Math.floor((Date.now() - started) / 1000)
    if (onWait && elapsed - reported >= pollMs / 1000) { reported = elapsed; onWait(elapsed) }
  }
  if (body?.error) { const e = new Error(body.errorMessage); e.isArangoError = true; e.errorNum = body.errorNum; throw e }
  const out = [...(body.result ?? [])]
  let cursor = body
  while (cursor.hasMore) {
    const res = await db.request({ method: 'PUT', path: `/_api/cursor/${cursor.id}` }, false)
    cursor = res.parsedBody
    out.push(...cursor.result)
  }
  return out
}
