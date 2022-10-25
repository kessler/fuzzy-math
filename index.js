const core = require('./lib/core')
const sugeno = require('./lib/SugenoFIS')

module.exports = {
  ...core,
  ...sugeno
}