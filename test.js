const test = require('ava')
const ascify = require('./ascify')
const {
  FuzzySet,
  core,
  support,
  height,
  alphaCut,
  strongAlphaCut,
  isConvex,
  isEqual,
  isNormalized,
  isSubset,
  isProperSubset,
  scalarCardinality,
  relativeCardinality,
  fuzzyCardinality,
  compliment,
  union,
  intersection,
  alphaMap
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

const normalCrispSet = Object.freeze([-1, 0, 1, 2, 3, 4, 5, 6])
const subNormalCrispSet = Object.freeze([5, 6])

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
  t.deepEqual(alphaCut(MU, normalCrispSet, 0.5), [1, 2, 3])
  t.deepEqual(alphaCut(MU, normalCrispSet, 0.7), [2])
  t.deepEqual(alphaCut(MU, subNormalCrispSet, 0.2), [])
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

test.skip('isConvex', t => {
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
  const MUsub = x => {
    return Math.max(0, MU(x) - 0.2)
  }

  t.true(isSubset(MUsub, MU, normalCrispSet))

  const MUnotsub = x => {
    return Math.min(1, MU(x) + 0.7)
  }

  t.false(isSubset(MUnotsub, MU, normalCrispSet))

  // MU is subset of MU?
  t.true(isSubset(MU, MU, normalCrispSet))
})

test('isProperSubset', t => {
  const MUsub = x => {
    return Math.max(0, MU(x) - 0.3)
  }

  t.true(isProperSubset(MUsub, MU, normalCrispSet))

  const MUnotsub = x => {
    return Math.min(1, MU(x) + 0.7)
  }

  t.false(isProperSubset(MUnotsub, MU, normalCrispSet))

  // MU not a proper subset of MU
  t.false(isProperSubset(MU, MU, normalCrispSet))
})


test('alphaMap', t => {
  const aMap = alphaMap(MU, normalCrispSet)
  t.is(aMap.size, 2)
  t.deepEqual(aMap.get(0.5), [1, 3])
  t.deepEqual(aMap.get(1), [2])
})

test('scalarCadinality', t => {
  t.is(scalarCardinality(MU, normalCrispSet), 2)
})

test('relativeCardinality', t => {
  t.is(relativeCardinality(MU, normalCrispSet), scalarCardinality(MU, normalCrispSet) / normalCrispSet.length)
})

test('fuzzyCardinality', t => {
  const fCard = fuzzyCardinality(MU, normalCrispSet)
  t.is(fCard.size, 2)
  t.is(fCard.get(0.5), 2)
  t.is(fCard.get(1), 1)
})

test.skip('union', t => {})
test.skip('intersection', t => {})