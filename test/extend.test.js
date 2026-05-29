/**
 * Tests for Zadeh's extension principle (discrete-universe case).
 *
 * References under test:
 *   [1]  Zadeh L.A. (1965) Fuzzy Sets. Information and Control 8(3): 338–353.
 *   [2]  Fuzzy set — Wikipedia. https://en.wikipedia.org/wiki/Fuzzy_set
 *   [25] Zimmermann H.-J. (2010) Fuzzy set theory. WIREs Comp Stat 2: 317–332.
 */

const test = require('ava')

const { DiscreteFuzzySet } = require('../lib/core.js')
const { extend, fuzzyArith, cartesian } = require('../lib/extend.js')

// "around 2": a small triangular-ish fuzzy number on integers
const aroundTwo = DiscreteFuzzySet.of(
  msf([[1, 0.5], [2, 1], [3, 0.5]]),
  [1, 2, 3]
)

// "around 3"
const aroundThree = DiscreteFuzzySet.of(
  msf([[2, 0.5], [3, 1], [4, 0.5]]),
  [2, 3, 4]
)

function msf(pairs) {
  const m = new Map(pairs)
  return x => m.get(x) ?? 0
}

test('cartesian — lazily enumerates the product', t => {
  const combos = [...cartesian([[1, 2], ['a', 'b']])]
  t.deepEqual(combos, [
    [1, 'a'],
    [1, 'b'],
    [2, 'a'],
    [2, 'b']
  ])
})

test('cartesian — empty input yields a single empty tuple', t => {
  t.deepEqual([...cartesian([])], [[]])
})

test('extend — addition of "around 2" and "around 3" peaks at 5', t => {
  const sum = extend((x, y) => x + y, [aroundTwo, aroundThree])

  // the peak (μ = 1) is at 2 + 3 = 5
  t.is(sum.MU(5), 1)
  t.deepEqual(sum.core, [5])
})

test('extend — sup over the preimage takes the max membership', t => {
  // y = 5 is reachable as 1+4, 2+3, 3+2 with input mins 0.5, 1, 0.5;
  // sup ⇒ 1. y = 4 reachable as 1+3 (0.5), 2+2 (0.5) ⇒ 0.5.
  const sum = extend((x, y) => x + y, [aroundTwo, aroundThree])
  t.is(sum.MU(5), 1)
  t.is(sum.MU(4), 0.5)
  t.is(sum.MU(3), 0.5)   // only 1+2 = min(0.5, 0.5)
  t.is(sum.MU(7), 0.5)   // only 3+4 = min(0.5, 0.5)
})

test('extend — empty preimage has membership 0', t => {
  const sum = extend((x, y) => x + y, [aroundTwo, aroundThree])
  t.is(sum.MU(100), 0)
})

test('extend — unary function (squaring) merges preimages via sup', t => {
  // A = {-1: 0.4, 1: 0.8} ; squaring maps both to 1, sup ⇒ 0.8
  const A = DiscreteFuzzySet.of(msf([[-1, 0.4], [1, 0.8]]), [-1, 1])
  const sq = extend(x => x * x, [A])
  t.is(sq.MU(1), 0.8)
})

test('fuzzyArith — binary wrapper agrees with extend', t => {
  const viaArith = fuzzyArith((a, b) => a + b, aroundTwo, aroundThree)
  const viaExtend = extend((x, y) => x + y, [aroundTwo, aroundThree])
  t.is(viaArith.MU(5), viaExtend.MU(5))
  t.is(viaArith.MU(4), viaExtend.MU(4))
})
