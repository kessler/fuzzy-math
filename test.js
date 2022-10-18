const test = require('ava')
const {
  FuzzySet,
  core,
  support,
  height,
  alphaCut,
  strongAlphaCut,
  isNormalizedSet
} = require('./index')

const MU = x => {
  if (x === 2) return 1
  if (x < 2 && x > 0) return 0.5
  if (x > 2 && x < 4) return 0.5
  return 0
}

const normalSet = [-1, 0, 1, 2, 3, 4, 5, 6]
const outOfBoundsSet = [5, 6]


test('core', t => {
  t.deepEqual(core(MU, normalSet), [2])
  t.deepEqual(core(MU, outOfBoundsSet), [])
})

test('support', t => {
  t.deepEqual(support(MU, normalSet), [1, 2, 3])
  t.deepEqual(support(MU, outOfBoundsSet), [])
})

test('height', t => {
  t.deepEqual(height(MU, normalSet), 1)
  t.deepEqual(height(MU, outOfBoundsSet), 0)
})

test('alphaCut', t => {
  t.deepEqual(alphaCut(MU, normalSet, 0), normalSet)
  t.deepEqual(alphaCut(MU, normalSet, 0.5), [1, 2, 3])
  t.deepEqual(alphaCut(MU, normalSet, 0.7), [2])
  t.deepEqual(alphaCut(MU, outOfBoundsSet, 0.2), [])
  t.deepEqual(alphaCut(MU, outOfBoundsSet, 0), outOfBoundsSet)
})

test('strongAlphaCut', t => {
  t.deepEqual(strongAlphaCut(MU, normalSet, 0), [1, 2, 3])
  t.deepEqual(strongAlphaCut(MU, normalSet, 0.5), [2])

  // so strong alpha cut of 1 is always empty ??
  // since alpha can bet between 0 - 1 inclusive
  t.deepEqual(strongAlphaCut(MU, normalSet, 1), [])
  t.deepEqual(strongAlphaCut(MU, outOfBoundsSet, 0), [])
})

test('isNormalizedSet', t => {
  t.true(isNormalizedSet(MU, normalSet))
  t.false(isNormalizedSet(MU, outOfBoundsSet))
})
