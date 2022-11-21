const { SugenoFIS } = require('../lib/SugenoFIS')
const test = require('ava')

test('SugenoFIS', t => {
  const fis = SugenoFIS.from({
    sets: {
      large: x => x >= 100 ? 1 : x >= 35 && x < 100 ? 0.5 : 0,
      small: x => x <= 25 ? 1 : x < 40 && x > 25 ? 0.5 : 0
    },

    rules: [
      'if x is large and y is small then 3x + 2y',
      'if x is small and y is large then 2x + 3y',
      'if x is small and y is small then x + y',
      'if x is large and y is large then 3x + 3y'
    ]
  })

  // rule 1
  t.is(fis.evaluate({ x: 100, y: 25 }), 350)

  // rule 2
  t.is(fis.evaluate({ x: 37, y: 75 }), 317.5)
})

test('SugenoFIS - provide context for output msf that is not part of the antecedent', t => {
  const fis = SugenoFIS.from({
    sets: {
      large: x => x >= 100 ? 1 : x >= 35 && x < 100 ? 0.5 : 0
    },

    rules: [
      'if x is large and y is large then t'
    ]
  })

  // rule 1
  t.is(fis.evaluate({ x: 100, y: 100 }, { t: 100 }), 100)
  t.throws(() => fis.evaluate({ x: 100, y: 100 }, { t: 100, y: 5 }), { message: 'context cannot have parameters that are part of the antecedent' })
})
