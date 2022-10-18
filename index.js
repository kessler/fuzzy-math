class FuzzySet {
  constructor(mu, crispSet) {
    this._mu = mu
    this._crispSet = crispSet
  }

  // kernel
  core() {
    return core(this._mu, this._crispSet)
  }

  support() {
    return support(this._mu, this._crispSet)
  }

  height() {
    return height(this._mu, this._crispSet)
  }

  // alpha level set
  alphaCut(alpha) {
    return alphaCut(this._mu, this._crispSet, alpha)
  }

  // strong alpha is where MU(x) > alpha instead of >=
  strongAlphaCut(alpha) {
    return strongAlphaCut(this._mu, this._crispSet, alpha)
  }

  isNormalized() {
    return isNormalized(this._mu, this._crispSet)
  }

  isConvex() {
    return isConvex(this._mu, this._crispSet[0], this._crispSet[this._crispSet - 1], 0.5)
  }
}

// aka kernel
function core(MU, crispSet) {
  return alphaCut(MU, crispSet, 1)
}

// aka sup
function support(MU, crispSet) {
  return strongAlphaCut(MU, crispSet, 0)
}

function height(MU, crispSet) {
  let max = -Infinity
  for (const member of crispSet) {
    max = Math.max(MU(member), max)
  }
  return max
}

// alpha level set
function alphaCut(MU, crispSet, alpha) {
  if (alpha < 0 || alpha > 1) {
    throw new TypeError('alpha must be between 0 and 1')
  }
  return crispSet.filter(x => MU(x) >= alpha)
}

// strong alpha is where MU(x) > alpha instead of >=
function strongAlphaCut(MU, crispSet, alpha) {
  if (alpha < 0 || alpha > 1) {
    throw new TypeError('alpha must be between 0 and 1')
  }
  return crispSet.filter(x => MU(x) > alpha)
}

function isNormalized(MU, crispSet) {
  return height(MU, crispSet) === 1
}

function isConvex(MU, x1, x2, lambda) {
  if (lambda < 0 || lambda > 1) {
    throw new TypeError('lambda must be between 0 and 1')
  }

  // this should be a member of crispSet, but it's not??
  // maybe member means, in the range of?
  const crispConvex = lambda * x1 + ((1 - lambda) * x2)
  // if (!crispSet.includes(crispConvex)) {
  //   return false
  // }
  const muX1 = MU(x1)
  const muX2 = MU(x2)
  const muT = MU(crispConvex)
  
  return muT >= Math.min(muX1, muX2)
}

function isEqual(MUa, MUb, crispSet) {
  for (const member of crispSet) {
    if (MUa(member) !== MUb(member)) {
      return false
    }
  }

  return true
}

// A fuzzy subset of B if 
// all MUa(x) <= MUb(x)
function isSubset(MUa, MUb, crispSet) {
  for (const member of crispSet) {
    if (MUa(member) > MUb(x)) {
      return false
    }
  }

  return true
}

// A fuzzy subset of B if 
// all MUa(x) < MUb(x)
function isProperSubset(MUa, MUb, crispSet) {
  for (const member of crispSet) {
    if (MUa(member) >= MUb(x)) {
      return false
    }
  }

  return true
}

function scalarCardinality(MU, crispSet) {
  return crispSet.reduce((prev, curr) => prev + MU(curr))
}

function relativeCardinality(MU, crispSet) {
  const scalar = scalarCardinality(MU, crispSet) / crispSet.length
}

function fuzzyCardinality() {
  // for each alpha (how do I select which alphas???)
  // cadinality is simply the length (alpha is a crisp set)
  // then the fuzzy cradinality is an ordered pair:
  // {alphaCut(MU, crispSet, alpha).length, alpha}
  // don't understand this yet...
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

function union(MUa, MUb, crispSet) {
  // C = A ∪ B
  // MUc = MAX(MUa(x), MUb(x)) for each member of crispSet
}

function intersection(MUa, MUb, crispSet) {
  // C = A ∩ B
  // MUc = MIN(MUa(x), MUb(x)) for each member of crispSet
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
  FuzzySet
}