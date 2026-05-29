/**
 * Core fuzzy set operations (Layer 1 — Zadeh 1965 base).
 *
 * Covers: foundations (membership functions), standard operations,
 * α-cuts, support/core structure, and the extension principle.
 *
 * References:
 *   [1]  Zadeh L.A. (1965) Fuzzy Sets. Information and Control 8(3): 338–353.
 *        https://www.marksmannet.com/RobertMarks/Classes/ENGR5358/Papers/Zadeh1965/ZadehPaper65.pdf
 *   [2]  Fuzzy set — Wikipedia. https://en.wikipedia.org/wiki/Fuzzy_set
 *   [25] Zimmermann H.-J. (2010) Fuzzy set theory. WIREs Comp Stat 2: 317–332.
 */

class DiscreteFuzzySet {
  constructor(MU, U) {
    if (MU === undefined) {
      throw new Error('invalid membership function MU argument in constructor')
    }

    if (U === undefined) {
      throw new Error('invalid universe of discourse U argument in constructor')
    }

    this._MU = MU
    this._U = U
  }

  get universe() {
    return [...this._U]
  }

  get members() {
    return this._U.filter(x => isMember(this._MU, x))
  }

  get alphaMap() {
    return alphaMap(this._MU, this._U)
  }

  // kernel
  get core() {
    return core(this._MU, this._U)
  }

  get support() {
    return support(this._MU, this._U)
  }

  get height() {
    return height(this._MU, this._U)
  }

  get isNormalized() {
    return isNormalized(this._MU, this._U)
  }

  get isConvex() {
    return isConvex(this._MU, this._U)
  }

  MU(x) {
    return this._MU(x)
  }

  isMember(x) {
    return isMember(this._MU, x)
  }

  // alpha level set
  alphaCut(alpha) {
    return alphaCut(this._MU, this._U, alpha)
  }

  // strong alpha is where MU(x) > alpha instead of >=
  strongAlphaCut(alpha) {
    return strongAlphaCut(this._MU, this._U, alpha)
  }

  [Symbol.iterator]() {
    let value
    let position = 0
    const set = this
    return {
      next() {
        while (position < set._U.length) {
          const x = set._U[position++]
          const alpha = checkMembership(set._MU(x))
          if (alpha > 0) {
            value = [x, alpha]
            break
          }
        }
        return this
      },
      get done() {
        return position === set._U.length
      },
      get value() {
        return value
      }
    }
  }

  static of (MU, U) {
    return new DiscreteFuzzySet(MU, U)
  }
}

/**
 * Core (kernel): { x ∈ U : μ_A(x) = 1 }, i.e. the α = 1 cut.
 *
 * @see [2] Wikipedia "Fuzzy set" — core
 */
function core(MU, U) {
  return alphaCut(MU, U, 1)
}

/**
 * Support: { x ∈ U : μ_A(x) > 0 } — equivalently the strong α-cut at α = 0.
 *
 * @see [2] Wikipedia "Fuzzy set" — support
 */
function support(MU, U) {
  return U.filter(x => isMember(MU, x)) // deepEquals( strongAlphaCut(MU, U, 0) )
}

/**
 * Height: sup over U of μ_A(x). A set is normal iff its height is 1.
 *
 * @see [2] Wikipedia "Fuzzy set" — height / normalization
 */
function height(MU, U) {
  // cannot be below zero
  let max = 0
  for (const member of U) {
    const alpha = MU(member)
    if (isNotMemberA(alpha)) continue
    max = Math.max(alpha, max)
  }
  return max
}

/**
 * α-cut (α-level set): { x ∈ U : μ_A(x) ≥ α }.
 *
 * @see [1] Zadeh 1965 §III
 * @see [2] Wikipedia "Fuzzy set" — α-cut subsection
 */
function alphaCut(MU, U, alpha) {
  checkZeroToOne(alpha)

  return U.filter(x => {
    const MUx = checkMembership(MU(x))
    return MUx >= alpha && MUx > 0
  })
}

/**
 * Strict (strong) α-cut: { x ∈ U : μ_A(x) > α }.
 *
 * @see [2] Wikipedia "Fuzzy set" — strict α-cut
 */
function strongAlphaCut(MU, U, alpha) {
  checkZeroToOne(alpha)

  return U.filter(x => {
    const MUx = checkMembership(MU(x))
    return MUx > alpha && MUx > 0
  })
}

function isNormalized(MU, U) {
  return height(MU, U) === 1
}

/**
 * Convexity, the right way: A is convex iff every α-cut A_α is a classical
 * convex subset of the (sorted) universe — i.e. a contiguous run — for every
 * α appearing in μ(U). This is the standard convex-fuzzy-set theorem, and it
 * is the actual property of A, not a single-sample necessary condition.
 *
 * Complexity is O(|U|² · |distinct α|): fine for realistic fuzzy sets.
 *
 * @see [1] Zadeh 1965 §III — convex fuzzy sets
 * @see [2] Wikipedia "Fuzzy set" — convexity via α-cuts
 *
 * @param {(x: number) => number} MU — membership function
 * @param {Array<number>} U — universe of discourse (subset of ℝ)
 * @returns {boolean}
 */
function isConvex(MU, U) {
  const sorted = [...U].sort((a, b) => a - b)
  const alphas = new Set()
  for (const x of sorted) {
    const a = checkMembership(MU(x))
    if (a > 0) alphas.add(a)
  }

  for (const alpha of alphas) {
    const cut = sorted.filter(x => MU(x) >= alpha)
    if (!isContiguous(cut, sorted)) return false
  }

  return true
}

// is `cut` a contiguous run within `sorted` (a convex subset of the universe)?
function isContiguous(cut, sorted) {
  if (cut.length <= 1) return true

  const firstIdx = sorted.indexOf(cut[0])
  for (let i = 0; i < cut.length; i++) {
    if (sorted[firstIdx + i] !== cut[i]) return false
  }

  return true
}

/**
 * The single-(x1, x2, λ) convexity inequality
 * μ(λx1 + (1−λ)x2) ≥ min(μ(x1), μ(x2)).
 *
 * This is only a *necessary* condition for convexity at one sample point —
 * kept under an honest name for callers who specifically want it. Use
 * {@link isConvex} to actually decide convexity of A.
 *
 * @see [1] Zadeh 1965 §III — convexity inequality
 */
function convexAt(MU, x1, x2, lambda) {
  checkZeroToOne(lambda, 'lambda')

  const crispConvex = lambda * x1 + ((1 - lambda) * x2)

  const muX1 = MU(x1)
  const muX2 = MU(x2)
  const muT = MU(crispConvex)

  return muT >= Math.min(muX1, muX2)
}

function isEqual(MUa, MUb, U) {
  for (const member of U) {
    if (checkMembership(MUa(member)) !== checkMembership(MUb(member))) {
      return false
    }
  }

  return true
}

/**
 * Containment: A ⊆ B iff μ_A(x) ≤ μ_B(x) for every x ∈ U.
 *
 * The quantifier ranges over the whole universe — there is no early exit on
 * the B side, because μ_B(x) = 0 with μ_A(x) > 0 is precisely the case that
 * must yield false (the prior implementation wrongly skipped it).
 *
 * @see [1] Zadeh 1965 §III — containment
 * @see [2] Wikipedia "Fuzzy set" — inclusion
 */
function isSubset(MUa, MUb, U) {
  for (const member of U) {
    const yA = checkMembership(MUa(member))
    if (yA === 0) continue              // 0 ≤ μ_B(x) holds vacuously

    if (yA > checkMembership(MUb(member))) return false
  }

  return true
}

/**
 * Proper containment: A ⊆ B and A ≠ B — i.e. μ_A(x) ≤ μ_B(x) everywhere and
 * μ_A(x) < μ_B(x) for at least one x. This is the standard definition; the
 * prior implementation demanded strict inequality *everywhere*, which is far
 * too strong.
 *
 * @see [1] Zadeh 1965 §III — containment
 * @see [2] Wikipedia "Fuzzy set" — proper subset
 */
function isProperSubset(MUa, MUb, U) {
  let strictlyLessSomewhere = false
  for (const member of U) {
    const yA = checkMembership(MUa(member))
    const yB = checkMembership(MUb(member))
    if (yA > yB) return false
    if (yA < yB) strictlyLessSomewhere = true
  }

  return strictlyLessSomewhere
}

// the sum of all the alphas
function scalarCardinality(MU, U) {
  return U.reduce((prev, curr) => prev + checkMembership(MU(curr)), 0)
}

// ratio of scalarCardinality to length of U
function relativeCardinality(MU, U) {
  return scalarCardinality(MU, U) / U.length
}

// the length or size of each alpha level
function fuzzyCardinality(MU, U) {
  const aMap = alphaMap(MU, U)
  for (const alpha of aMap.keys()) {
    aMap.set(alpha, aMap.get(alpha).length)
  }
  return aMap
}

// in classic set theory complement is
// X - universal set
// A = {x memberOf X : some condition}
// Ac (complement) = {x memberOf X : x notMemberOf A}
//
// a fuzzy set complement is the m.s.f MUc = 1-MU(x)
// of course many times it doesn't make sense to return
// the actual members of the complement, since it might
// be infinite or, inside a computer, very big.
// instead I return the complement membership function
// Complement: μ_{A'}(x) = 1 − μ_A(x). // @see [1] Zadeh 1965 §III
function complement(MU) {
  return x => 1 - MU(x)
}

// C = A ∪ B
// MUc = MAX(MUa(x), MUb(x)) for each member of U
// with union no membership filtering is performed prior to the union
// calculation, because a member of U might have alpha = 0 in fuzzy set A
// but not in B
// @see [1] Zadeh 1965 §III — union as max
function union(MUa, MUb) {
  return x => Math.max(MUa(x), MUb(x))
}

// C = A ∩ B
// MUc = MIN(MUa(x), MUb(x)) for each member of U
// @see [1] Zadeh 1965 §III — intersection as min
function intersection(MUa, MUb) {
  return x => Math.min(MUa(x), MUb(x))
}

// simple difference m.s.f = A ∩ complement(B) = min(μ_A(x), 1 − μ_B(x))
// @see [1] Zadeh 1965 §III — derived from intersection + complement
function simpleDifference(MUa, MUb) {
  const bComp = complement(MUb)
  return intersection(MUa, bComp)
}

function checkZeroToOne(alpha, name = 'alpha') {
  if (alpha < 0 || alpha > 1) {
    throw new TypeError(`${name} must be between 0 and 1`)
  }
}

// create an (alpha) MU(x) => x mapping
function alphaMap(MU, U) {
  const result = new Map()
  for (const member of U) {
    const alpha = MU(member)

    if (isNotMemberA(alpha)) continue

    let levelMembers = result.get(alpha)
    if (!levelMembers) {
      levelMembers = new Set()
      result.set(alpha, levelMembers)
    }
    levelMembers.add(member)
  }

  // for the sake of consistency ?
  // need to think about this some more...
  for (const [alpha, level] of result) {
    result.set(alpha, Array.from(level))
  }

  return result
}

function isMember(MU, x) {
  const alpha = MU(x)
  return isMemberA(alpha)
}

/**
 * Enforce the membership contract μ_A : X → [0,1]. A value outside [0,1] is a
 * defect in the membership function and must surface loudly rather than be
 * silently filtered away.
 *
 * @see [1] Zadeh 1965 §I — grade of membership "ranging between zero and one"
 * @see [2] Wikipedia "Fuzzy set" — membership function m : U → [0,1]
 *
 * @param {number} alpha — a membership value produced by an MSF
 * @returns {number} alpha, unchanged, when in range
 * @throws {RangeError} when alpha < 0 or alpha > 1
 */
function checkMembership(alpha) {
  if (alpha < 0 || alpha > 1) {
    throw new RangeError(`membership value ${alpha} outside [0,1]`)
  }
  return alpha
}

// a real member has μ > 0; checkMembership guarantees μ ≤ 1 first.
function isMemberA(alpha) {
  checkMembership(alpha)
  return alpha > 0
}

function isNotMemberA(alpha) {
  return !isMemberA(alpha)
}

function discreteFuzzySet(MU, U) {
  const result = []
  for (const member of U) {
    const alpha = checkMembership(MU(member))
    if (alpha === 0) continue

    result.push([member, alpha])
  }
  return result
}

// take a "static" fuzzy set array:
// [ [1, 0.5], [2, 0.2]]
// and return a membership function
function msfFromDiscreteFuzzySet(discreteFuzzySet) {
  const internal = new Map()

  for (const [x, alpha] of discreteFuzzySet) {
    if (alpha === 0) continue
    internal.set(x, alpha)
  }

  return x => {
    const alpha = internal.get(x)
    return alpha === undefined ? 0 : alpha
  }
}

function triangularMSF(a, b, c) {
  return x => Math.max(Math.min((x - a) / (b - a), 1, (c - x) / (c - b)), 0)
}

function trapezoidalMSF(a, b, c, d) {
  return x => Math.max(Math.min((x - a) / (b - a), 1, (d - x) / (d - c)), 0)
}

function bellMSF(a, b, c) {
  return x => 1 / (1 + (Math.abs((x - c) / a) ** (2 * b)))
}

// from: https://en.wikipedia.org/wiki/Gaussian_function
// The graph of a Gaussian is a characteristic symmetric "bell curve" shape. 
// The parameter a is the height of the curve's peak, b is the position of the center of the peak, 
// and c (the standard deviation, sometimes called the Gaussian RMS width) controls the width of the "bell". 
//
// the "a" or the height (a*exp(...)) is always 1 so it's omitted here
// mean === b, sigma === c
function gaussianMSF(mean, sigma, m = 2) {
  if (sigma === 0) throw new TypeError('sigma cannot be zero')
  return x => Math.exp(-0.5 * (((x - mean) / sigma) ** m))
}

function dynamicGaussianMSF(mean, sigma, m = 2) {
  if (sigma === 0) throw new TypeError('sigma cannot be zero')
  return x => Math.exp(-0.5 * (((x - mean()) / sigma()) ** m))
}

// rate: the logistic growth rate or steepness of the curve
// center: f(center) = 0.5
function sigmoidMSF(rate, center) {
  return x => 1 / (1 + Math.exp(-rate * (x - center)))
}

function dynamicSigmoidMSF(rate, center) {
  return x => 1 / (1 + Math.exp(-rate() * (x - center())))
}

module.exports = {
  core,
  support,
  height,
  alphaCut,
  strongAlphaCut,
  isNormalized,
  isConvex,
  convexAt,
  isEqual,
  isSubset,
  isProperSubset,
  isMember,
  isMemberA,
  isNotMemberA,
  checkMembership,
  alphaMap,
  scalarCardinality,
  relativeCardinality,
  fuzzyCardinality,
  complement,
  union,
  intersection,
  simpleDifference,
  discreteFuzzySet,
  msfFromDiscreteFuzzySet,
  triangularMSF,
  trapezoidalMSF,
  bellMSF,
  gaussianMSF,
  dynamicGaussianMSF,
  sigmoidMSF,
  dynamicSigmoidMSF,
  DiscreteFuzzySet
}