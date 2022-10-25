const { compile } = require('mathjs')
const debuglog = require('util').debuglog('fuzzy-math')

class SugenoRule {
  constructor({ expressions, msfRegistry, outputMsf, andMethod = Math.min }) {
    this._expressions = expressions
    this._outputMsf = outputMsf
    this._andMethod = andMethod
    this._msfRegistry = msfRegistry
  }

  evaluate(args) {
    const alphas = Object.entries(args)
      .map(([parameter, arg]) => this._msfRegistry.get(this._expressions[parameter])(arg))

    const w = this._andMethod(...alphas)
    const z = this._outputMsf.evaluate(args)

    debuglog('alphas %o w [%d] z [%d]', alphas, w, z)
    return { w, z }
  }
}

class SugenoFIS {
  constructor(rules = []) {
    this._liguisticVariableMSF = new Map()
    this._rules = rules
    this._ruleText = new Set()
  }

  addLinguisticVariable(name, msf) {
    this._liguisticVariableMSF.set(name, msf)
  }

  /**
   *  a rule of the form "if x is A and y is B then 2x+y+1" 
   */
  addRule(ruleText) {
    ruleText = ruleText.toLowerCase()
    debuglog('add rule [%s]', ruleText)
    if (this._ruleText.has(ruleText)) {
      throw new TypeError('rule already added')
    }

    this._ruleText.add(ruleText)

    ruleText = ruleText.slice(3)
    const [antecedent, consequent] = ruleText.split(' then ')
    const outputMsf = compile(consequent)
    const expressions = {}
    antecedent.split(' and ').forEach(expression => {
      const [parameter, linguisticVariableName] = expression.split(' is ')

      if (!this._liguisticVariableMSF.has(linguisticVariableName)) {
        throw new TypeError(`unknow liguistic variable ${linguisticVariableName}`)
      }

      expressions[parameter] = linguisticVariableName
    })

    this._rules.push(new SugenoRule({
      expressions,
      outputMsf,
      msfRegistry: this._liguisticVariableMSF
    }))
  }

  evaluate(args) {
    if (!(typeof args === 'object')) {
      throw new Error('args should be a map of parameters and arguments, eg { x: 1, y: 2 }')
    }

    const results = this._rules.map(rule => rule.evaluate(args))
    let wzSum = 0
    let wSum = 0
    for (const { w, z } of results) {
      wzSum += (w * z)
      wSum += w
    }
    
    debuglog('wzSum [%d] wSum [%d]', wzSum, wSum)
    
    // not sure about this:
    // need to consult books or gili
    if (wSum === 0) return 0

    return wzSum / wSum
  }

  static from({ rules, sets }) {
    const fis = new SugenoFIS()
    Object.entries(sets)
      .forEach(([name, msf]) => fis.addLinguisticVariable(name, msf))

    rules.forEach(ruleText => fis.addRule(ruleText))
    return fis
  }
}

module.exports = { SugenoFIS }