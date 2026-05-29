/**
 * Tests for FuzzyNumber — convex-normal fuzzy sets with extension-principle
 * arithmetic.
 *
 * References under test:
 *   [1]  Zadeh L.A. (1965) Fuzzy Sets. Information and Control 8(3): 338–353.
 *   [2]  Fuzzy set — Wikipedia. https://en.wikipedia.org/wiki/Fuzzy_set
 *   [25] Zimmermann H.-J. (2010) Fuzzy set theory. WIREs Comp Stat 2: 317–332.
 */

const test = require('ava')

const { triangularMSF } = require('../lib/core.js')
const { FuzzyNumber } = require('../lib/FuzzyNumber.js')

// half-integer grids so the triangular shoulders are actually sampled
const gridA = [1, 1.5, 2, 2.5, 3]
const gridB = [2, 2.5, 3, 3.5, 4]

const A = new FuzzyNumber(triangularMSF(1, 2, 3), gridA)  // ≈ (1, 2, 3)
const B = new FuzzyNumber(triangularMSF(2, 3, 4), gridB)  // ≈ (2, 3, 4)

const sorted = arr => [...arr].sort((a, b) => a - b)

test('FuzzyNumber — rejects a non-normal set (height ≠ 1)', t => {
  // never reaches membership 1
  t.throws(() => new FuzzyNumber(() => 0.5, [0, 1, 2]), { message: /normalized/ })
})

test('FuzzyNumber — rejects a non-convex set', t => {
  // normal at x = 2, but a second hump on (6, 9] breaks convexity
  const twoHump = x => {
    if (x === 2) return 1
    if (x > 6 && x <= 9) return 0.5
    return 0
  }
  t.throws(() => new FuzzyNumber(twoHump, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]), { message: /convex/ })
})

test('FuzzyNumber — accepts a triangular (convex, normal) set', t => {
  t.notThrows(() => new FuzzyNumber(triangularMSF(1, 2, 3), gridA))
})

test('add — triangular (1,2,3) + (2,3,4) reproduces (3,5,7) by its α-cuts', t => {
  const sum = A.add(B)

  // peak (core, α = 1) of (3,5,7) is {5}
  t.deepEqual(sorted(sum.core), [5])

  // the 0.5-cut of (3,5,7) is [3+2·0.5, 7−2·0.5] = [4, 6]
  t.deepEqual(sorted(sum.alphaCut(0.5)), [4, 4.5, 5, 5.5, 6])

  t.is(sum.MU(5), 1)
})

test('sub — (2,3,4) − (1,2,3) peaks at 1', t => {
  const diff = B.sub(A)
  t.deepEqual(sorted(diff.core), [1])  // 3 − 2 = 1
})

test('mul — peak lands at the product of the peaks', t => {
  const prod = A.mul(B)
  t.deepEqual(sorted(prod.core), [6])  // 2 · 3 = 6
})

test('div — divisor whose support contains 0 is rejected', t => {
  // C straddles 0, so dividing by it is undefined
  const C = new FuzzyNumber(triangularMSF(-1, 0, 1), [-1, -0.5, 0, 0.5, 1])
  t.throws(() => A.div(C), { message: /divisor support contains 0/ })
})

test('div — peak lands at the quotient of the peaks', t => {
  const quot = B.div(A)
  t.deepEqual(sorted(quot.core), [1.5])  // 3 / 2 = 1.5
})
