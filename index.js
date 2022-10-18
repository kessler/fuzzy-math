class FuzzySet {
  constructor(mu, set) {
    this._mu = mu
    this._set = set
  }

  // kernel
  core() {
    return core(this._mu, this._set)
  }

  support() {
    return support(this._mu, this._set)
  }

  height() {
    return height(this._mu, this._set)
  }

  // alpha level set
  alphaCut(alpha) {
    return alphaCut(this._mu, this._set, alpha)
  }

  // strong alpha is where MU(x) > alpha instead of >=
  strongAlphaCut(alpha) {
    return strongAlphaCut(this._mu, this._set, alpha)
  }

  isNormalizedSet() {
    return isNormalizedSet(this._mu, this._set)
  }
}

// kernel
function core(MU, set) {
  return set.filter(x => MU(x) === 1)
}

function support(MU, set) {
  return strongAlphaCut(MU, set, 0)
}

function height(MU, set) {
  let max = -Infinity
  for (const member of set) {
    max = Math.max(MU(member), max)
  }
  return max
}

// alpha level set
function alphaCut(MU, set, alpha) {
  if (alpha < 0 || alpha > 1) {
    throw new TypeError('alpha must be between 0 and 1')
  }
  return set.filter(x => MU(x) >= alpha)
}

// strong alpha is where MU(x) > alpha instead of >=
function strongAlphaCut(MU, set, alpha) {
  if (alpha < 0 || alpha > 1) {
    throw new TypeError('alpha must be between 0 and 1')
  }
  return set.filter(x => MU(x) > alpha)
}

function isNormalizedSet(MU, set) {
  return height(MU, set) === 1
}


module.exports = {
  core,
  support,
  height,
  alphaCut,
  strongAlphaCut,
  isNormalizedSet,
  FuzzySet
}
