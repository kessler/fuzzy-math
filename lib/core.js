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
    const members = this.members
    return isConvex(this._MU, members[0], members[members.length - 1], 0.5)
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
          const alpha = set._MU(x)
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

// aka kernel
function core(MU, U) {
  return alphaCut(MU, U, 1)
}

// aka sup
// the all members of U which do not have alpha = 0
// this is also the strongAlphaCut where alpha is 0
function support(MU, U) {
  return U.filter(x => isMember(MU, x)) // deepEquals( strongAlphaCut(MU, U, 0) )
}

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

// alpha level set is made of all members MU(x) >= alpha
function alphaCut(MU, U, alpha) {
  checkZeroToOne(alpha)

  return U.filter(x => {
    const MUx = MU(x)
    return MUx >= alpha && isMemberA(MUx)
  })
}

// strong alpha is where MU(x) > alpha instead of >=
function strongAlphaCut(MU, U, alpha) {
  checkZeroToOne(alpha)

  return U.filter(x => {
    const MUx = MU(x)
    return MUx > alpha && isMemberA(MUx)
  })
}

function isNormalized(MU, U) {
  return height(MU, U) === 1
}

// Pretty sure i'm missing something here...
function isConvex(MU, x1, x2, lambda) {
  checkZeroToOne(lambda, 'lambda')

  // this should be a member of U, but it's not??
  // maybe member means, in the range of?
  const crispConvex = lambda * x1 + ((1 - lambda) * x2)

  const muX1 = MU(x1)
  const muX2 = MU(x2)
  const muT = MU(crispConvex)

  return muT >= Math.min(muX1, muX2)
}

function isEqual(MUa, MUb, U) {
  for (const member of U) {
    if (MUa(member) !== MUb(member)) {
      return false
    }
  }

  return true
}

// A is a fuzzy subset of B if 
// all MUa(x) <= MUb(x)
function isSubset(MUa, MUb, U) {
  for (const member of U) {
    const yA = MUa(member)
    if (isNotMemberA(yA)) continue

    const yB = MUb(member)
    if (isNotMemberA(yB)) continue

    // negation of MUa(x) <= MUb(x)
    if (yA > yB) {
      return false
    }
  }

  return true
}

// A is fuzzy subset of B if 
// all MUa(x) < MUb(x)
function isProperSubset(MUa, MUb, U) {
  for (const member of U) {
    const yA = MUa(member)
    if (isNotMemberA(yA)) continue

    const yB = MUb(member)
    if (isNotMemberA(yB)) continue

    // negation of MUa(x) < MUb(x)
    if (yA >= yB) {
      return false
    }
  }

  return true
}

// the sum of all the alphas
function scalarCardinality(MU, U) {
  return U.reduce((prev, curr) => prev + MU(curr), 0)
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

// in classic set theory compliment is
// X - universal set
// A = {x memberOf X : some condition}
// Ac (compliment) = {x memberOf X : x notMemberOf A}
//
// a fuzzy set compliment is the m.s.f MUc = 1-MU(x)
// of course many times it doesn't make sense to return
// the actual members of the compliment, since it might
// be infinite or, inside a computer, very big.
// instead I return the compliment membership function
function compliment(MU) {
  return x => 1 - MU(x)
}

// C = A ∪ B
// MUc = MAX(MUa(x), MUb(x)) for each member of U
// with union no membership filtering is performed prior to the union
// calculation, because a member of U might have alpha = 0 in fuzzy set A
// but not in B
function union(MUa, MUb) {
  return x => Math.max(MUa(x), MUb(x))
}

// C = A ∩ B
// MUc = MIN(MUa(x), MUb(x)) for each member of U
function intersection(MUa, MUb) {
  return x => Math.min(MUa(x), MUb(x))
}

// simple difference m.s.f = A U compliment(B)
function simpleDifference(MUa, MUb) {
  const bComp = compliment(MUb)
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

function isMemberA(alpha) {
  return alpha > 0 && alpha <= 1
}

function isNotMemberA(alpha) {
  return !isMemberA(alpha)
}

function discreteFuzzySet(MU, U) {
  const result = []
  for (const member of U) {
    const alpha = MU(member)
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
  isEqual,
  isSubset,
  isProperSubset,
  isMember,
  isMemberA,
  isNotMemberA,
  alphaMap,
  scalarCardinality,
  relativeCardinality,
  fuzzyCardinality,
  compliment,
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