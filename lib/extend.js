/**
 * Zadeh's extension principle (Layer 1 — Zadeh 1965 base), discrete-universe case.
 *
 * Generalises a crisp function f: Xⁿ → Y to a function on fuzzy sets. For the
 * unary case the image f(A) has membership
 *
 *     μ_{f(A)}(y) = sup_{x ∈ f⁻¹(y)} μ_A(x)
 *
 * with the convention sup ∅ = 0. For the n-ary case the input memberships are
 * combined with the t-norm — here min, Zadeh's original (Gödel) convention.
 * Layer 2 will parameterize the t-norm; Layer 1 hard-codes min.
 *
 * References:
 *   [1]  Zadeh L.A. (1965) Fuzzy Sets. Information and Control 8(3): 338–353.
 *   [2]  Fuzzy set — Wikipedia. https://en.wikipedia.org/wiki/Fuzzy_set
 *   [25] Zimmermann H.-J. (2010) Fuzzy set theory. WIREs Comp Stat 2: 317–332.
 */

const { DiscreteFuzzySet, checkMembership } = require('./core.js')

/**
 * Lazily enumerate the Cartesian product of the given arrays. Yields one
 * combination at a time so the full product is never materialized — important
 * because |U₁ × … × Uₙ| grows multiplicatively.
 *
 * @param {Array<Array>} arrays
 * @returns {Generator<Array>}
 */
function* cartesian(arrays) {
  if (arrays.length === 0) {
    yield []
    return
  }

  const [first, ...rest] = arrays
  for (const x of first) {
    for (const combo of cartesian(rest)) {
      yield [x, ...combo]
    }
  }
}

/**
 * Apply the extension principle: extend a crisp function f over n fuzzy sets.
 *
 * @see [1] Zadeh 1965 §III — extension principle
 * @see [2] Wikipedia "Fuzzy set" — extension principle
 * @see [25] Zimmermann 2010 — fuzzy arithmetic via the extension principle
 *
 * @param {(...xs: number[]) => number} f — crisp function Xⁿ → Y
 * @param {Array<{universe: number[], MU: (x: number) => number}>} fuzzySets
 *        — the n input fuzzy sets (DiscreteFuzzySet instances work directly)
 * @returns {DiscreteFuzzySet} the image fuzzy set f(A₁, …, Aₙ) on Y
 */
function extend(f, fuzzySets) {
  const universes = fuzzySets.map(fs => fs.universe)
  const yToAlpha = new Map()

  for (const xs of cartesian(universes)) {
    const y = f(...xs)
    // intersection on the input side: combine input memberships with min
    const t = Math.min(...xs.map((x, i) => checkMembership(fuzzySets[i].MU(x))))
    const prev = yToAlpha.get(y) ?? 0
    yToAlpha.set(y, Math.max(prev, t))   // sup over the preimage of y
  }

  const U = Array.from(yToAlpha.keys())
  const MU = y => yToAlpha.get(y) ?? 0
  return DiscreteFuzzySet.of(MU, U)
}

/**
 * Convenience wrapper: extend a binary operation over two fuzzy sets.
 * This is the engine behind FuzzyNumber arithmetic.
 *
 * @see [25] Zimmermann 2010 — fuzzy arithmetic on fuzzy numbers
 */
function fuzzyArith(op, A, B) {
  return extend((a, b) => op(a, b), [A, B])
}

module.exports = {
  extend,
  fuzzyArith,
  cartesian
}
