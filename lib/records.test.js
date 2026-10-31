import assert from 'node:assert/strict'
import { occurrenceDoc, speciesDoc, nestFuture, toGids } from './records.js'

const occ = { key: 'abc', x: 4305500, y: 2674500, lon: 9.7956617, lat: 47.1838762, species: ['Fagus sylvatica'], sources: { NFI: 3 }, in_mask: true }
const climate = {
  eutrees4f: { periods: { '1961-1990': { bio01: 62, bio12: 1151, bio15: 28, tas_summer: 140, pr_summer: 411, pr_winter: 213, continentality: 17.8 },
                          '2021-2050': { rcp45: { bio01: 70.2, pr_summer: 390 }, rcp85: { bio01: 72, pr_summer: null } } } },
  worldclim: { geometry_hash: 'k1', periods: { '1970-2000': { bio01: 6.5, srad_spring_summer: 880.1 }, '2041-2060': nestFuture('worldclim', '2041-2060', { bio01: 8.1, tas_summer: 16.2 }) } },
}
const d = occurrenceDoc(occ, climate, ['ds1'])
assert.equal(d.properties.eutrees4f['1961-1990'].env_climate_bio01, 6.2)
assert.equal(d.properties.eutrees4f['1961-1990'].env_climate_pr_summer, 137)
assert.equal(d.properties.eutrees4f['2021-2050'].rcp45.env_climate_bio01, 7.02)
assert.equal(d.properties.eutrees4f['2021-2050'].rcp45.env_climate_pr_summer, 130)
assert.deepEqual(Object.keys(d.properties.eutrees4f['2021-2050'].rcp85), ['env_climate_bio01'])
assert.equal(d.properties.worldclim.geometry_hash, 'k1')
assert.equal(d.properties.worldclim['1970-2000']['env_climate_srad_spring-summer'], 880.1)
assert.equal(d.properties.worldclim['2041-2060']['MPI-ESM1-2-HR'].ssp370.env_climate_tas_summer, 16.2)
assert.deepEqual(d.std_dataset_ids, ['ds1', 'bf102320-3726-48d1-b3fc-421f131c6666'])
assert.deepEqual(toGids('chelsa', { bio01: null }), {})
const s = speciesDoc({ _key: 'k', species: 'Sorbus aria', aliases: ['Aria edulis'], rank: 'species', eutrees4f: true })
assert.deepEqual(s, { _key: 'k', species: 'Sorbus aria', _custom: { aliases: ['Aria edulis'], rank: 'species', eutrees4f: true } })
console.log('records.test.js ok')
