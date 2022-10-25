const core = require('./lib/core')
const sugeno = require('./lib/SugenoFIS')
const ascify = require('./lib/ascify')

// very dangerous mixing like that...
module.exports = {
  ...core,
  ...sugeno,
  ascify
}