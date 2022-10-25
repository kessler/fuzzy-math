const { compile } = require('mathjs')
const debuglog = require('util').debuglog('fuzzy-math')

class SugenoRule {
  constructor({ expressions, outputMsf, andMethod = Math.min }) {
    this._expressions = expressions
    this._outputMsf = outputMsf
    this._andMethod = andMethod
  }

  evaluate(args) {
    const alphas = Object.entries(args)
      .map(([parameter, arg]) => this._expressions[parameter](arg))
    const w = this._andMethod(...alphas)
    const z = this._outputMsf.evaluate(args)
    debuglog(alphas, w, z)
    return { w, z }
  }
}

class SugenoFIS {
  constructor(rules = []) {
    this._liguisticVariableMSF = new Map()
    this._rules = rules
  }

  addLinguisticVariable(name, msf) {
    if (this._liguisticVariableMSF.has(name)) {
      throw new Error('variable already in system')
    }

    this._liguisticVariableMSF.set(name, msf)
  }

  /**
   *  a rule of the form "if x is A and y is B then 2x+y+1" 
   */
  addRule(ruleText) {
    debuglog('add rule [%s]', ruleText)
    
    ruleText = ruleText.slice(3)
    const [antecedent, consequent] = ruleText.split(' then ')
    const outputMsf = compile(consequent)
    const expressions = {}
    antecedent.split(' and ').forEach(expression => {
      const [parameter, linguisticVariableName] = expression.split(' is ')
      const msf = this._liguisticVariableMSF.get(linguisticVariableName)

      if (!msf) {
        throw new Error(`unknow liguistic variable ${linguisticVariableName}`)
      }

      expressions[parameter] = msf
    })

    this._rules.push(new SugenoRule({ expressions, outputMsf }))
  }

  evaluate(args) {
    const results = this._rules.map(rule => rule.evaluate(args))
    let wzSum = 0
    let wSum = 0
    for (const { w, z } of results) {
      wzSum += (w * z)
      wSum += w
    }
    debuglog(wzSum, wSum)
    return wzSum / wSum
  }

  static from({ rules, universe }) {
    const fis = new SugenoFIS()
    Object.entries(universe)
      .forEach(([name, msf]) => fis.addLinguisticVariable(name, msf))

    rules.forEach(ruleText => fis.addRule(ruleText))
    return fis
  }
}

module.exports = { SugenoFIS }