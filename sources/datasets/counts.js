// Fill `count` on every Dataset record this project owns: the number of documents in the record's FIRST
// `_collection_list` collection that carry the record's key in std_dataset_ids (the std_dataset convention:
// when several collections are listed, count describes the first one). Usage: node sources/datasets/counts.js
import { connect, loadCredentials, explain } from '../../lib/db.js'
import { RECORDS } from './records.js'
try {
  const creds = loadCredentials(); const { db, collections } = connect(creds, { requireLoadTarget: true })
  for (const rec of RECORDS) {
    const found = await db.query('FOR d IN @@c FILTER d.std_dataset_code == @code RETURN d', { '@c': collections.dataset, code: rec.std_dataset_code }).then((c) => c.all())
    if (!found.length) { console.log(`  ${rec.std_dataset_code}: no record`); continue }
    const coll = found[0].std_dataset_prop?._collection_list?.[0]
    const count = await db.query('RETURN LENGTH(FOR d IN @@c FILTER @key IN d.std_dataset_ids RETURN 1)', { '@c': coll, key: found[0]._key }).then((c) => c.next())
    await db.collection(collections.dataset).update(found[0]._key, { count })
    console.log(`  ${rec.std_dataset_code}: count = ${count} (${coll})`)
  }
} catch (e) { console.error(explain(e)); process.exit(1) }
