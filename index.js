class FuzzySet {
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

  MU(x) {
    return this._MU(x)
  }

  isMember(x) {
    return isMember(this._MU, x)
  }

  members() {
    return this._U.filter(x => isMember(this._MU, x))
  }

  alphaMap() {
    return alphaMap(this._MU, this._U)
  }

  // kernel
  core() {
    return core(this._MU, this._U)
  }

  support() {
    return support(this._MU, this._U)
  }

  height() {
    return height(this._MU, this._U)
  }

  // alpha level set
  alphaCut(alpha) {
    return alphaCut(this._MU, this._U, alpha)
  }

  // strong alpha is where MU(x) > alpha instead of >=
  strongAlphaCut(alpha) {
    return strongAlphaCut(this._MU, this._U, alpha)
  }

  isNormalized() {
    return isNormalized(this._MU, this._U)
  }

  isConvex() {
    const members = this.members()
    return isConvex(this._MU, members[0], members[members.length - 1], 0.5)
  }

  [Symbol.iterator]() {

  }

  static of (MU, U) {
    return new FuzzySet(MU, U)
  }
}

function isMember(MU, x) {
  return MU(x) > 0
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
    max = Math.max(MU(member), max)
  }
  return max
}

// alpha level set is made of all members MU(x) >= alpha
function alphaCut(MU, U, alpha) {
  checkZeroToOne(alpha)

  return U.filter(x => {
    const MUx = MU(x)
    return MUx >= alpha && MUx > 0
  })
}

// strong alpha is where MU(x) > alpha instead of >=
function strongAlphaCut(MU, U, alpha) {
  checkZeroToOne(alpha)

  return U.filter(x => {
    const MUx = MU(x)
    return MUx > alpha && MUx > 0
  })
}

function isNormalized(MU, U) {
  return height(MU, U) === 1
}

// Pretty sure i'm missing something here...
function isConvex(MU, x1, x2, lambda) {
  throw new Error('probably wrong')

  checkZeroToOne(lambda, 'lambda')

  // this should be a member of U, but it's not??
  // maybe member means, in the range of?
  const crispConvex = lambda * x1 + ((1 - lambda) * x2)
  // if (!U.includes(crispConvex)) {
  //   return false
  // }
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
    if (yA === 0) continue

    const yB = MUb(member)
    if (yB === 0) continue

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
    if (yA === 0) continue

    const yB = MUb(member)
    if (yB === 0) continue

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
// maybe I can forgo the x member of X for Ac, but meh...
//
// a fuzzy set compliment has a MUc = 1-MU(x)
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
  return x => Math.max(MUa(member), MUb(member))
}

// C = A ∩ B
// MUc = MIN(MUa(x), MUb(x)) for each member of U
function intersection(MUa, MUb) {
  return x => Math.min(MUa(x), MUb(x))
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

    // not a member
    if (alpha === 0) continue

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
  alphaMap,
  scalarCardinality,
  relativeCardinality,
  fuzzyCardinality,
  compliment,
  union,
  intersection,
  FuzzySet
}