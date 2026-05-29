// Browser entry for the demo bundle.
//
// Intentionally pulls only the Layer 1 *core* surface (which has no external
// dependencies) — NOT index.js, which would drag mathjs (via SugenoFIS) into
// the bundle. Built to docs/fuzzy-math.js by `npm run build:demo`.

const coreOps = require('../lib/core')
const { extend, fuzzyArith } = require('../lib/extend')
const { FuzzyNumber } = require('../lib/FuzzyNumber')

module.exports = {
  ...coreOps,
  extend,
  fuzzyArith,
  FuzzyNumber
}
