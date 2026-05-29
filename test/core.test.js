/**
 * Tests for Layer 1 core fuzzy set operations.
 *
 * References under test:
 *   [1]  Zadeh L.A. (1965) Fuzzy Sets. Information and Control 8(3): 338–353.
 *   [2]  Fuzzy set — Wikipedia. https://en.wikipedia.org/wiki/Fuzzy_set
 */

const test = require('ava')

const {
  DiscreteFuzzySet,
  core,
  support,
  height,
  alphaCut,
  strongAlphaCut,
  isConvex,
  convexAt,
  isEqual,
  isNormalized,
  isSubset,
  isProperSubset,
  scalarCardinality,
  relativeCardinality,
  fuzzyCardinality,
  complement,
  union,
  intersection,
  simpleDifference,
  alphaMap,
  discreteFuzzySet,
  msfFromDiscreteFuzzySet,
  checkMembership,
  triangularMSF,
  trapezoidalMSF,
  bellMSF,
  gaussianMSF,
  sigmoidMSF
} = require('../lib/core.js')

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

test('isConvex — triangular MSF is convex', t => {
  const U = [0, 1, 2, 3, 4]
  t.true(isConvex(triangularMSF(0, 2, 4), U))
})

test('isConvex — trapezoidal MSF is convex', t => {
  const U = [0, 1, 2, 3, 4, 5]
  t.true(isConvex(trapezoidalMSF(0, 1, 4, 5), U))
})

test('isConvex — two-hump MSF is not convex', t => {
  // nonConvexMU peaks at 2, then again on (6, 9]; the α = 0.5 cut is
  // {2, 7, 8, 9}, which is not a contiguous run in the universe.
  const U = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
  t.false(isConvex(nonConvexMU, U))
})

test('isConvex — a single non-contiguous α-cut forces false', t => {
  // contiguous everywhere except at α = 0.5
  const gapMU = x => {
    if (x === 1) return 1
    if (x === 0 || x === 3) return 0.5  // gap at x = 2 ⇒ {0, 1, 3} not contiguous
    return 0
  }
  t.false(isConvex(gapMU, [0, 1, 2, 3]))

  const contiguousMU = x => {
    if (x === 1) return 1
    if (x === 0 || x === 2) return 0.5  // {0, 1, 2} is contiguous
    return 0
  }
  t.true(isConvex(contiguousMU, [0, 1, 2, 3]))
})

test('convexAt — single-point necessary condition', t => {
  // the honestly-named single-(x1, x2, λ) inequality, preserved from the old isConvex
  t.true(convexAt(MU, 0, 2, 0.5))
  t.false(convexAt(nonConvexMU, 9, 2, 0.5))
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

test('isSubset — the containment bug: μ_A > μ_B = 0 is NOT a subset', t => {
  // the original defect returned true here by skipping x when μ_B(x) = 0
  t.false(isSubset(x => 0.5, x => 0, [1]))
})

test('isProperSubset — agrees at one point but strictly less elsewhere', t => {
  // A ⊆ B and A ≠ B: equal at x = 1, strictly less at x = 2
  const MUa = x => (x === 1 ? 0.5 : 0.3)
  const MUb = x => (x === 1 ? 0.5 : 0.6)
  t.true(isProperSubset(MUa, MUb, [1, 2]))
})

test('isProperSubset — requires a strict-less witness somewhere', t => {
  // μ_A ≤ μ_B everywhere with equality everywhere ⇒ not proper
  const MUa = x => 0.4
  const MUb = x => 0.4
  t.false(isProperSubset(MUa, MUb, [1, 2, 3]))
})

test('checkMembership / μ ∈ [0,1] enforcement — throws on out-of-range μ', t => {
  // μ > 1 must surface as a RangeError rather than be silently filtered
  t.throws(() => isSubset(x => 1.5, x => 0.5, [1]), { instanceOf: RangeError })
  // μ < 0 likewise
  t.throws(() => alphaCut(x => -0.2, [1], 0.5), { instanceOf: RangeError })
  // the helper itself
  t.throws(() => checkMembership(1.2), { instanceOf: RangeError })
  t.throws(() => checkMembership(-0.1), { instanceOf: RangeError })
  t.is(checkMembership(0), 0)
  t.is(checkMembership(1), 1)
  t.is(checkMembership(0.5), 0.5)
})

test('alphaMap', t => {
  const aMap = alphaMap(MU, normalCrispSet)
  t.is(aMap.size, 2)
  t.deepEqual(aMap.get(0.5), [1, 3])
  t.deepEqual(aMap.get(1), [2])
})

test('alphaMap — empty universe yields empty map', t => {
  const aMap = alphaMap(MU, [])
  t.is(aMap.size, 0)
})

test('discreteFuzzySet', t => {
  t.deepEqual(discreteFuzzySet(MU, normalCrispSet), [
    [1, 0.5],
    [2, 1],
    [3, 0.5]
  ])
})

test('msfFromDiscreteFuzzySet', t => {
  const set = discreteFuzzySet(MU, normalCrispSet)
  const staticMsf = msfFromDiscreteFuzzySet(set)
  t.true(isEqual(staticMsf, MU, normalCrispSet))
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

test('union', t => {
  const setA = [
    [1, .2],
    [2, .5],
    [3, .8],
    [4, 1],
    [5, .7],
    [6, .3]
  ]

  const MUa = msfFromDiscreteFuzzySet(setA)

  const setB = [
    [3, .2],
    [4, .4],
    [5, .6],
    [6, .8],
    [7, 1],
    [8, 1]
  ]

  const MUb = msfFromDiscreteFuzzySet(setB)

  const U = Array.from(new Set(setA.map(([x]) => x).concat(setB.map(([x]) => x))))

  const MUunion = union(MUa, MUb)
  t.deepEqual(discreteFuzzySet(MUunion, U), [
    [1, .2],
    [2, .5],
    [3, .8],
    [4, 1],
    [5, .7],
    [6, .8],
    [7, 1],
    [8, 1]
  ])
})

test('intersection', t => {
  const setA = [
    [1, .2],
    [2, .5],
    [3, .8],
    [4, 1],
    [5, .7],
    [6, .3]
  ]

  const MUa = msfFromDiscreteFuzzySet(setA)

  const setB = [
    [3, .2],
    [4, .4],
    [5, .6],
    [6, .8],
    [7, 1],
    [8, 1]
  ]

  const MUb = msfFromDiscreteFuzzySet(setB)

  const U = Array.from(new Set(setA.map(([x]) => x).concat(setB.map(([x]) => x))))

  const MUintersection = intersection(MUa, MUb)
  t.deepEqual(discreteFuzzySet(MUintersection, U), [
    [3, .2],
    [4, .4],
    [5, .6],
    [6, .3]
  ])
})

test('simpleDifference', t => {
  // A − B = A ∩ Bᶜ, with μ = min(μ_A, 1 − μ_B)
  const setA = [
    [1, 0.2],
    [2, 0.7],
    [3, 1],
    [4, 0.5]
  ]
  const setB = [
    [2, 0.4],
    [3, 0.5],
    [4, 0.5]
  ]

  const MUa = msfFromDiscreteFuzzySet(setA)
  const MUb = msfFromDiscreteFuzzySet(setB)
  const U = [1, 2, 3, 4]

  const MUdiff = simpleDifference(MUa, MUb)

  // equivalent to building it by hand from intersection + complement
  const MUexpected = intersection(MUa, complement(MUb))
  t.true(isEqual(MUdiff, MUexpected, U))

  // and the closed-form values: min(μ_A, 1 − μ_B)
  t.is(MUdiff(1), 0.2)          // min(0.2, 1 − 0)   = 0.2
  t.is(MUdiff(2), Math.min(0.7, 0.6))  // min(0.7, 0.6) = 0.6
  t.is(MUdiff(3), 0.5)          // min(1,   0.5)     = 0.5
  t.is(MUdiff(4), 0.5)          // min(0.5, 0.5)     = 0.5
})

test('triangularMSF — peak, edges, midpoints', t => {
  const mu = triangularMSF(0, 2, 4)
  const cases = [
    [0, 0],    // left foot
    [1, 0.5],  // rising midpoint
    [2, 1],    // peak
    [3, 0.5],  // falling midpoint
    [4, 0],    // right foot
    [5, 0]     // outside support, clamped to 0
  ]
  for (const [x, expected] of cases) {
    t.is(mu(x), expected, `triangular(0,2,4) at x=${x}`)
  }
})

test('trapezoidalMSF — shoulders form a plateau at 1', t => {
  const mu = trapezoidalMSF(0, 1, 3, 4)
  const cases = [
    [0, 0],
    [0.5, 0.5],
    [1, 1],    // left shoulder
    [2, 1],    // plateau
    [3, 1],    // right shoulder
    [4, 0],
    [5, 0]
  ]
  for (const [x, expected] of cases) {
    t.is(mu(x), expected, `trapezoidal(0,1,3,4) at x=${x}`)
  }
})

test('bellMSF — center is 1, crossover points are 0.5', t => {
  const mu = bellMSF(1, 1, 0)  // 1 / (1 + |x|^2)
  t.is(mu(0), 1)               // center
  t.is(mu(1), 0.5)             // |x| = a ⇒ 0.5
  t.is(mu(-1), 0.5)            // symmetric
})

test('gaussianMSF — peak is 1, symmetric, throws on sigma = 0', t => {
  const mu = gaussianMSF(0, 1)
  t.is(mu(0), 1)                                  // mean ⇒ height 1
  t.true(Math.abs(mu(1) - Math.exp(-0.5)) < 1e-12)
  t.is(mu(1), mu(-1))                             // symmetry
  t.throws(() => gaussianMSF(0, 0), { instanceOf: TypeError })
})

test('sigmoidMSF — center is 0.5, monotone increasing', t => {
  const mu = sigmoidMSF(1, 0)
  t.is(mu(0), 0.5)             // f(center) = 0.5
  t.true(mu(10) > mu(0))       // increasing
  t.true(mu(-10) < mu(0))
  t.true(mu(100) <= 1 && mu(-100) >= 0)
})

test('DiscreteFuzzySet', t => {
  const set = DiscreteFuzzySet.of(MU, normalCrispSet)
  t.is(set.MU(1), 0.5)
  t.is(set.MU(7), 0)
  t.true(set.isMember(1))
  t.false(set.isMember(7))
  t.deepEqual(set.universe, normalCrispSet)
  t.deepEqual(set.members, support(MU, normalCrispSet))
  t.deepEqual(set.alphaMap, alphaMap(MU, normalCrispSet))
  t.deepEqual(set.core, core(MU, normalCrispSet))
  t.deepEqual(set.height, height(MU, normalCrispSet))
  t.deepEqual(set.isNormalized, isNormalized(MU, normalCrispSet))
  t.deepEqual(set.isConvex, isConvex(MU, normalCrispSet))
  t.deepEqual(Array.from(set), discreteFuzzySet(MU, normalCrispSet))
})

