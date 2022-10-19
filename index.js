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
function support(MU, U) {
  return strongAlphaCut(MU, U, 0)
}

function height(MU, U) {
  // cannot be below zero
  let max = 0
  for (const member of U) {
    max = Math.max(MU(member), max)
  }
  return max
}

// alpha level set
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

// A fuzzy subset of B if 
// all MUa(x) <= MUb(x)
function isSubset(MUa, MUb, U) {
  for (const member of U) {
    if (MUa(member) > MUb(member)) {
      return false
    }
  }

  return true
}

// A fuzzy subset of B if 
// all MUa(x) < MUb(x)
function isProperSubset(MUa, MUb, U) {
  for (const member of U) {
    if (MUa(member) >= MUb(member)) {
      console.log(MUa(member), MUb(member))
      return false
    }
  }

  return true
}

function scalarCardinality(MU, U) {
  return U.reduce((prev, curr) => prev + MU(curr))
}

function relativeCardinality(MU, U) {
  const scalar = scalarCardinality(MU, U) / U.length
}

function fuzzyCardinality() {
  // for each alpha (how do I select which alphas??? => strongAlphaCut(0)?)
  // cadinality is simply the length (alpha is a crisp set)
  // then the fuzzy cradinality is an ordered pair:
  // {alphaCut(MU, U, alpha).length, alpha}
  // 
  // so it's basically just a map from alpha to its crisp set
}

// in classis set theory compliment is
// X - universal set
// A = {x memberOf X : some condition}
// Ac (compliment) = {x memberOf X : x notMemberOf A}
// maybe I can forgo the x member of X for Ac, but meh...
//
// in fuzzy set theory compliment is simply
// a negation of MU; 1-MU(x)
function compliment() {

}

function union(MUa, MUb, U) {
  // C = A ∪ B
  // MUc = MAX(MUa(x), MUb(x)) for each member of U
}

function intersection(MUa, MUb, U) {
  // C = A ∩ B
  // MUc = MIN(MUa(x), MUb(x)) for each member of U
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
  FuzzySet
}