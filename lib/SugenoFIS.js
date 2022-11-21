const { compile } = require('mathjs')
const debuglog = require('util').debuglog('fuzzy-math')

class SugenoRule {
  constructor({ expressions, msfRegistry, outputMsf, andMethod = Math.min, ruleText }) {
    this._expressions = expressions
    this._outputMsf = outputMsf
    this._andMethod = andMethod
    this._msfRegistry = msfRegistry
    this._ruleText = ruleText
  }

  evaluate(args, context = {}) {
    
    const alphas = Object.entries(args)
      .filter(([parameter, args]) => this._expressions[parameter] !== undefined)
      .map(([parameter, arg]) => {
        if (context[parameter]) {
          throw new Error('context cannot have parameters that are part of the antecedent')
        }

        return this._msfRegistry.get(this._expressions[parameter])(arg)
      })

    const w = this._andMethod(...alphas)
    if (isNaN(w)) {
      debuglog('alphas %o %o', alphas, args)
      throw new Error('and method yielded NaN, check your sets')
    }

    const z = this._outputMsf.evaluate({ ...args, ...context })
    if (isNaN(z)) {
      throw new Error('output msf yielded NaN, check if you are missing arguments')
    }
    debuglog('%s alphas %o w [%d] z [%d]', this._ruleText, alphas.map(a => a.toFixed(20)), w.toFixed(20), z, args)
    return { w, z }
  }
}

class SugenoFIS {
  constructor(rules = []) {
    this._liguisticVariableMSF = new Map()
    this._rules = rules
    this._ruleText = new Set()
  }

  setLinguisticVariable(name, msf) {
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

    //debuglog('addRule %o %s', expressions, ruleText)
    this._rules.push(new SugenoRule({
      expressions,
      outputMsf,
      msfRegistry: this._liguisticVariableMSF,
      ruleText
    }))
  }

  evaluate(args, context) {
    if (!(typeof args === 'object')) {
      throw new Error('args should be a map of parameters and arguments, eg { x: 1, y: 2 }')
    }

    const results = this._rules.map(rule => rule.evaluate(args, context))
    
    let wzSum = 0
    let wSum = 0
    
    for (const { w, z } of results) {
      wzSum += (w * z)
      wSum += w
    }

    // not sure about this:
    // need to consult books or gili
    if (wSum === 0) return 0

    const result = wzSum / wSum 

    debuglog('result [%d] wzSum [%d] wSum [%d]', result, wzSum, wSum)

    return result
  }

  valueOf(setName, x) {
    return this._liguisticVariableMSF.get(setName)(x)
  }

  static from({ rules, sets }) {
    const fis = new SugenoFIS()
    Object.entries(sets)
      .forEach(([name, msf]) => fis.setLinguisticVariable(name, msf))

    rules.forEach(ruleText => fis.addRule(ruleText))
    return fis
  }
}

module.exports = { SugenoFIS }