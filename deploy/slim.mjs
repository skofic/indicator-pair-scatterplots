// Slim copy of the panes' data for a showcase instance, over HTTP only (no arangodump needed).
//   node deploy/slim.mjs export [dir]            laptop → files (default deploy/out, ignored by git)
//   node deploy/slim.mjs import [dir]            files → the target instance
// export reads globals/auth/db.credentials.json; import reads TARGET_URL, TARGET_USER, TARGET_PASSWORD from the
// environment (never from a committed file) and, optionally, TARGET_PREFIX to prefix the database names (rehearsals).
// What is copied is deploy/slim.config.json: per database the collections (documents, type, indexes), the analyzers,
// the views and the Foxx services with their configuration. Restricted units' polygons never leave the laptop.
import { createGzip, createGunzip } from 'node:zlib'
import { createInterface } from 'node:readline'
import { createReadStream, createWriteStream, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { once } from 'node:events'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url)), [,, cmd, dirArg] = process.argv
const DIR = resolve(dirArg ?? `${HERE}/out`), CFG = JSON.parse(readFileSync(`${HERE}/slim.config.json`, 'utf8'))
const client = (host, user, password) => {
  const auth = 'Basic ' + Buffer.from(`${user}:${password}`).toString('base64'), base = host.replace(/\/$/, '')
  const call = async (db, path, { method = 'GET', body, type = 'application/json', raw = false } = {}) => {
    for (let attempt = 1; ; attempt++) {
      try {
        const r = await fetch(`${base}${db ? `/_db/${db}` : ''}${path}`, { method, headers: { Authorization: auth, ...(body ? { 'Content-Type': type } : {}) }, body: body && type === 'application/json' && typeof body !== 'string' ? JSON.stringify(body) : body })
        if (raw) { if (!r.ok) throw new Error(`${path}: ${r.status}`); return Buffer.from(await r.arrayBuffer()) }
        const j = await r.json().catch(() => ({})); if (!r.ok && r.status >= 500 && attempt < 6) throw new Error(`${path}: ${r.status}`)
        return Object.assign(j ?? {}, { _status: r.status })
      } catch (e) { if (attempt >= 6) throw e; await new Promise((s) => setTimeout(s, 2000 * attempt)) }
    }
  }
  return call
}
const strip = (ix) => { const { id, selectivityEstimate, isNewlyCreated, figures, code, error, ...def } = ix; return def }

async function exportAll() {
  const c = JSON.parse(readFileSync(resolve(HERE, '../globals/auth/db.credentials.json'), 'utf8')), call = client(c.host, c.username, c.password)
  for (const [db, spec] of Object.entries(CFG.databases)) {
    const dir = `${DIR}/${db}`; mkdirSync(dir, { recursive: true })
    const all = (await call(db, '/_api/collection?excludeSystem=true')).result.map((x) => x.name)
    const names = spec.collections === '*' ? all : spec.collections
    const meta = { collections: {}, analyzers: [], views: [], services: {} }
    for (const a of (await call(db, '/_api/analyzer')).result.filter((a) => a.name.startsWith(`${db}::`))) meta.analyzers.push({ name: a.name.split('::')[1], type: a.type, properties: a.properties, features: a.features })
    for (const v of (await call(db, '/_api/view')).result) { const p = await call(db, `/_api/view/${v.name}/properties`); meta.views.push({ name: p.name, type: p.type, ...(p.type === 'search-alias' ? { indexes: p.indexes.map(({ collection, index }) => ({ collection, index })) } : { links: p.links }) }) }
    for (const n of names) {
      const props = await call(db, `/_api/collection/${n}/properties`), ix = (await call(db, `/_api/index?collection=${n}`)).indexes.filter((i) => !['primary', 'edge'].includes(i.type)).map(strip)
      const gz = createGzip(), out = createWriteStream(`${dir}/${n}.jsonl.gz`); gz.pipe(out)
      let count = 0, r = await call(db, '/_api/cursor', { method: 'POST', body: { query: spec.queries?.[n] ?? `FOR d IN ${n} RETURN d`, batchSize: spec.batch?.[n] ?? 1000, options: { stream: true }, ttl: 600 } })
      for (;;) {
        if (r.error) throw new Error(`${db}.${n}: ${r.errorMessage}`)
        for (const d of r.result) { delete d._id; delete d._rev; count++; if (!gz.write(JSON.stringify(d) + '\n')) await once(gz, 'drain') }
        if (!r.hasMore) break
        r = await call(db, `/_api/cursor/${r.id}`, { method: 'POST' })
      }
      gz.end(); await once(out, 'finish')
      meta.collections[n] = { type: props.type, count, indexes: ix }
      console.log(`${db}.${n}: ${count} documents, ${ix.length} indexes`)
    }
    for (const mount of spec.services ?? []) {
      writeFileSync(`${dir}/service${mount.replace(/\//g, '_')}.zip`, await call(db, `/_api/foxx/download?mount=${encodeURIComponent(mount)}`, { method: 'POST', raw: true }))
      const cfg = await call(db, `/_api/foxx/configuration?mount=${encodeURIComponent(mount)}&minimal=true`); delete cfg._status
      meta.services[mount] = { configuration: { ...cfg, ...(spec.configuration?.[mount] ?? {}) } }
      console.log(`${db}${mount}: service bundle saved`)
    }
    writeFileSync(`${dir}/_meta.json`, JSON.stringify(meta, null, 1))
  }
}

async function importAll() {
  const { TARGET_URL, TARGET_USER = 'root', TARGET_PASSWORD, TARGET_PREFIX = '' } = process.env
  if (!TARGET_URL || TARGET_PASSWORD === undefined) throw new Error('set TARGET_URL and TARGET_PASSWORD (and TARGET_USER, default root)')
  const call = client(TARGET_URL, TARGET_USER, TARGET_PASSWORD)
  for (const db of Object.keys(CFG.databases)) {
    const dir = `${DIR}/${db}`, to = TARGET_PREFIX + db, meta = JSON.parse(readFileSync(`${dir}/_meta.json`, 'utf8'))
    const made = await call(null, '/_api/database', { method: 'POST', body: { name: to } }); if (made._status !== 201 && made._status !== 409) throw new Error(`${to}: cannot create the database (${made._status} ${made.errorMessage ?? ''}) — the target user must be an administrator`)
    console.log(`${to}: database ${made._status === 201 ? 'created' : 'exists'}`)
    for (const a of meta.analyzers) await call(to, '/_api/analyzer', { method: 'POST', body: a })
    for (const [n, c] of Object.entries(meta.collections)) {
      await call(to, '/_api/collection', { method: 'POST', body: { name: n, type: c.type } })
      let errors = 0, chunk = [], size = 0   // read as a stream (the occurrences exceed a string's size), sent in chunks of about 8 MB: the size that crossed a slow line without a break
      const flush = async () => {
        if (!chunk.length) return
        const r = await call(to, `/_api/import?collection=${n}&type=documents&onDuplicate=replace`, { method: 'POST', body: chunk.join('\n'), type: 'application/x-ndjson' })
        if (r.error) throw new Error(`${to}.${n}: ${r.errorMessage}`)
        errors += r.errors ?? 0; chunk = []; size = 0
      }
      for await (const line of createInterface({ input: createReadStream(`${dir}/${n}.jsonl.gz`).pipe(createGunzip()), crlfDelay: Infinity })) { if (!line) continue; chunk.push(line); size += line.length; if (size >= 8e6) await flush() }
      await flush()
      for (const ix of c.indexes) { const r = await call(to, `/_api/index?collection=${n}`, { method: 'POST', body: ix }); if (r.error) console.log(`  index ${ix.name}: ${r.errorMessage}`) }
      const have = (await call(to, `/_api/collection/${n}/count`)).count
      console.log(`${to}.${n}: ${have} of ${c.count} documents, ${errors} errors, ${c.indexes.length} indexes${have === c.count ? '' : '  ← MISMATCH'}`)
    }
    for (const v of meta.views) { const r = await call(to, '/_api/view', { method: 'POST', body: v }); if (r.error && r.errorNum !== 1207) console.log(`  view ${v.name}: ${r.errorMessage}`) }
    for (const [mount, s] of Object.entries(meta.services)) {
      const zip = readFileSync(`${dir}/service${mount.replace(/\//g, '_')}.zip`), cfg = { ...s.configuration }
      if (TARGET_PREFIX && typeof cfg.metadataUi === 'string') cfg.metadataUi = cfg.metadataUi.replace('/_db/metadata/', `/_db/${TARGET_PREFIX}metadata/`)
      const exists = (await call(to, '/_api/foxx')).some?.((x) => x.mount === mount)
      const r = await call(to, `/_api/foxx${exists ? '/service' : ''}?mount=${encodeURIComponent(mount)}&setup=true${exists ? '&teardown=false' : ''}`, { method: exists ? 'PATCH' : 'POST', body: zip, type: 'application/zip' })
      if (r.error) throw new Error(`${to}${mount}: ${r.errorMessage}`)
      await call(to, `/_api/foxx/configuration?mount=${encodeURIComponent(mount)}`, { method: 'PATCH', body: cfg })
      console.log(`${to}${mount}: service ${exists ? 'upgraded' : 'installed'}, configured`)
    }
  }
}
if (cmd === 'export') await exportAll(); else if (cmd === 'import') await importAll(); else console.log('usage: node deploy/slim.mjs export|import [dir]')
