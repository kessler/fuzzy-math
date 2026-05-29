const coreOps = require('./lib/core')
const { extend, fuzzyArith } = require('./lib/extend')
const { FuzzyNumber } = require('./lib/FuzzyNumber')
const sugeno = require('./lib/SugenoFIS')
const ascify = require('./lib/ascify')

const core = {
  ...coreOps,
  extend,
  fuzzyArith,
  FuzzyNumber
}

module.exports = {
  core,
  sugeno,
  ascify
}
