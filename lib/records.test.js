import assert from 'node:assert/strict'
import { occurrenceDoc, speciesDoc } from './records.js'

const occ = { key: 'abc', x: 4305500, y: 2674500, lon: 9.7956617, lat: 47.1838762, species: ['Fagus sylvatica'], sources: { NFI: 3 }, in_mask: true }
const clim = { eutrees4f: { key: 'abc', values: { bio01: 62, bio12: 1151, bio15: 28, tas_summer: 140, pr_summer: 411, pr_winter: 213, continentality: 17.8 } } }
const d = occurrenceDoc(occ, clim, ['ds1'])
assert.equal(d._key, 'abc')
assert.deepEqual(d.geometry_point.coordinates, [9.7956617, 47.1838762])
assert.equal(d.properties.eutrees4f.env_climate_bio01, 6.2)        // °C × 10 → °C
assert.equal(d.properties.eutrees4f.env_climate_tas_summer, 14)    // °C × 10 → °C
assert.equal(d.properties.eutrees4f.env_climate_pr_summer, 137)    // 3-month total → mean monthly
assert.equal(d.properties.eutrees4f.env_climate_bio12, 1151)
assert.equal(d.properties.eutrees4f.env_climate_continentality, 17.8)
assert.deepEqual(Object.keys(d).sort(), ['_custom', '_key', 'geometry_point', 'properties', 'species_list', 'std_dataset_ids'])
const s = speciesDoc({ _key: 'k', species: 'Sorbus aria', aliases: ['Aria edulis'], rank: 'species', eutrees4f: true })
assert.deepEqual(s, { _key: 'k', species: 'Sorbus aria', _custom: { aliases: ['Aria edulis'], rank: 'species', eutrees4f: true } })
console.log('records.test.js ok')
