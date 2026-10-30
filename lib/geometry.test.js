import assert from 'node:assert/strict'
import { cellPolygon, geometryHash, containingCellCentre, containingCellKey, RADIUS_30S } from './geometry.js'

// A point in the middle of a cell maps to that cell's centre; a point on the SW corner too.
const [clon, clat] = containingCellCentre(2.35, 48.85)
assert.deepEqual([clon, clat], [2.354167, 48.854167], `centre ${clon},${clat}`)
// the stored convention, read from the live collections: centre [10.004167, 47.004167] has key 9a58412ef8e43b206471611c9b2c7ec2
assert.equal(containingCellKey(10.003, 47.003), '9a58412ef8e43b206471611c9b2c7ec2')
assert.equal(containingCellKey(9.9876, 47.0040), '37f5ea48ac561da16e3050f6b241028a')
assert.deepEqual(containingCellCentre(clon, clat), [clon, clat])
// The key is the hash of the polygon built from the centre.
assert.equal(containingCellKey(2.35, 48.85), geometryHash(cellPolygon(clon, clat, RADIUS_30S)))
// Two points in the same cell share a key; a point one cell east does not.
assert.equal(containingCellKey(2.35, 48.85), containingCellKey(2.356, 48.851))
assert.notEqual(containingCellKey(2.35, 48.85), containingCellKey(2.35 + 1 / 120, 48.85))
console.log('geometry.test.js ok')
