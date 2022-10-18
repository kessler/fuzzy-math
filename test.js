const test = require('ava')
const {
  FuzzySet,
  core,
  support,
  height,
  alphaCut,
  strongAlphaCut,
  isConvex,
  isEqual,
  isNormalized
} = require('./index')

const MU = x => {
  if (x === 2) return 1
  if (x < 2 && x > 0) return 0.5
  if (x > 2 && x < 4) return 0.5
  return 0
}

const nonConvexMU = x => {
  if (x === 2) return 1
  if (x <= 9 && x > 6) return 0.5

  return 0
}

const normalCrispSet = [-1, 0, 1, 2, 3, 4, 5, 6]
const subNormalCrispSet = [5, 6]

test('core', t => {
  t.deepEqual(core(MU, normalCrispSet), [2])
  t.deepEqual(core(MU, subNormalCrispSet), [])
})

test('support', t => {
  t.deepEqual(support(MU, normalCrispSet), [1, 2, 3])
  t.deepEqual(support(MU, subNormalCrispSet), [])
})

test('height', t => {
  t.deepEqual(height(MU, normalCrispSet), 1)
  t.deepEqual(height(MU, subNormalCrispSet), 0)
})

test('alphaCut', t => {
  t.deepEqual(alphaCut(MU, normalCrispSet, 0), normalCrispSet)
  t.deepEqual(alphaCut(MU, normalCrispSet, 0.5), [1, 2, 3])
  t.deepEqual(alphaCut(MU, normalCrispSet, 0.7), [2])
  t.deepEqual(alphaCut(MU, subNormalCrispSet, 0.2), [])
  t.deepEqual(alphaCut(MU, subNormalCrispSet, 0), subNormalCrispSet)
})

test('strongAlphaCut', t => {
  t.deepEqual(strongAlphaCut(MU, normalCrispSet, 0), [1, 2, 3])
  t.deepEqual(strongAlphaCut(MU, normalCrispSet, 0.5), [2])

  // so strong alpha cut of 1 is always empty ??
  // since alpha can bet between 0 - 1 inclusive
  t.deepEqual(strongAlphaCut(MU, normalCrispSet, 1), [])
  t.deepEqual(strongAlphaCut(MU, subNormalCrispSet, 0), [])
})

test('isNormalized', t => {
  t.true(isNormalized(MU, normalCrispSet))
  t.false(isNormalized(MU, subNormalCrispSet))
})

test('isConvex', t => {
  const aSet = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
  t.false(isConvex(nonConvexMU, 9, 2, 0.5))
  t.true(isConvex(MU, 0, 2, 0.5))
})

test('isEqual', t => {
  t.true(isEqual(MU, MU, normalCrispSet))
  t.true(isEqual(MU, MU, [...normalCrispSet, 10, 8, 11]))
  t.false(isEqual(nonConvexMU, MU, normalCrispSet))
})

test('isSubset', t => {

})