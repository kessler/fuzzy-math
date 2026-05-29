/**
 * FuzzyNumber (Layer 1 — Zadeh 1965 base).
 *
 * A fuzzy number is a fuzzy set on ℝ that is convex, normal (height = 1) and
 * piecewise-continuous. Arithmetic is defined via Zadeh's extension principle
 * applied to the ordinary real operations, which is the canonical use case for
 * the principle.
 *
 * Invariants (normal + convex) are enforced strictly at construction: an
 * invalid set throws rather than constructing a silently-broken number.
 *
 * References:
 *   [1]  Zadeh L.A. (1965) Fuzzy Sets. Information and Control 8(3): 338–353.
 *   [2]  Fuzzy set — Wikipedia. https://en.wikipedia.org/wiki/Fuzzy_set
 *   [25] Zimmermann H.-J. (2010) Fuzzy set theory. WIREs Comp Stat 2: 317–332.
 */

const { DiscreteFuzzySet, isConvex } = require('./core.js')
const { fuzzyArith } = require('./extend.js')

class FuzzyNumber extends DiscreteFuzzySet {
  /**
   * @param {(x: number) => number} MU — membership function on ℝ
   * @param {Array<number>} U — discrete universe of discourse
   * @throws {Error} if the set is not normal (height ≠ 1)
   * @throws {Error} if the set is not convex (per the α-cut test)
   *
   * @see [2] Wikipedia "Fuzzy set" — fuzzy numbers (convex, normal)
   * @see [25] Zimmermann 2010 — fuzzy numbers and arithmetic
   */
  constructor(MU, U) {
    super(MU, U)

    if (!this.isNormalized) {
      throw new Error('fuzzy number must be normalized (height = 1)')
    }

    if (!isConvex(MU, U)) {
      throw new Error('fuzzy number must be convex')
    }
  }

  // A + B via the extension principle. // [25] Zimmermann 2010
  add(other) {
    return fuzzyArith((a, b) => a + b, this, other)
  }

  // A − B via the extension principle.
  sub(other) {
    return fuzzyArith((a, b) => a - b, this, other)
  }

  // A · B via the extension principle.
  mul(other) {
    return fuzzyArith((a, b) => a * b, this, other)
  }

  // A / B via the extension principle. Undefined when 0 ∈ supp(B).
  div(other) {
    if (other.MU(0) > 0) {
      throw new Error('divisor support contains 0')
    }
    return fuzzyArith((a, b) => a / b, this, other)
  }

  static of (MU, U) {
    return new FuzzyNumber(MU, U)
  }
}

module.exports = { FuzzyNumber }
