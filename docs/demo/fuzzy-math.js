var fuzzyMath = (() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };

  // lib/core.js
  var require_core = __commonJS({
    "lib/core.js"(exports, module) {
      var DiscreteFuzzySet = class _DiscreteFuzzySet {
        constructor(MU, U) {
          if (MU === void 0) {
            throw new Error("invalid membership function MU argument in constructor");
          }
          if (U === void 0) {
            throw new Error("invalid universe of discourse U argument in constructor");
          }
          this._MU = MU;
          this._U = U;
        }
        get universe() {
          return [...this._U];
        }
        get members() {
          return this._U.filter((x) => isMember(this._MU, x));
        }
        get alphaMap() {
          return alphaMap(this._MU, this._U);
        }
        // kernel
        get core() {
          return core(this._MU, this._U);
        }
        get support() {
          return support(this._MU, this._U);
        }
        get height() {
          return height(this._MU, this._U);
        }
        get isNormalized() {
          return isNormalized(this._MU, this._U);
        }
        get isConvex() {
          return isConvex(this._MU, this._U);
        }
        MU(x) {
          return this._MU(x);
        }
        isMember(x) {
          return isMember(this._MU, x);
        }
        // alpha level set
        alphaCut(alpha) {
          return alphaCut(this._MU, this._U, alpha);
        }
        // strong alpha is where MU(x) > alpha instead of >=
        strongAlphaCut(alpha) {
          return strongAlphaCut(this._MU, this._U, alpha);
        }
        [Symbol.iterator]() {
          let value;
          let position = 0;
          const set = this;
          return {
            next() {
              while (position < set._U.length) {
                const x = set._U[position++];
                const alpha = checkMembership(set._MU(x));
                if (alpha > 0) {
                  value = [x, alpha];
                  break;
                }
              }
              return this;
            },
            get done() {
              return position === set._U.length;
            },
            get value() {
              return value;
            }
          };
        }
        static of(MU, U) {
          return new _DiscreteFuzzySet(MU, U);
        }
      };
      function core(MU, U) {
        return alphaCut(MU, U, 1);
      }
      function support(MU, U) {
        return U.filter((x) => isMember(MU, x));
      }
      function height(MU, U) {
        let max = 0;
        for (const member of U) {
          const alpha = MU(member);
          if (isNotMemberA(alpha)) continue;
          max = Math.max(alpha, max);
        }
        return max;
      }
      function alphaCut(MU, U, alpha) {
        checkZeroToOne(alpha);
        return U.filter((x) => {
          const MUx = checkMembership(MU(x));
          return MUx >= alpha && MUx > 0;
        });
      }
      function strongAlphaCut(MU, U, alpha) {
        checkZeroToOne(alpha);
        return U.filter((x) => {
          const MUx = checkMembership(MU(x));
          return MUx > alpha && MUx > 0;
        });
      }
      function isNormalized(MU, U) {
        return height(MU, U) === 1;
      }
      function isConvex(MU, U) {
        const sorted = [...U].sort((a, b) => a - b);
        const alphas = /* @__PURE__ */ new Set();
        for (const x of sorted) {
          const a = checkMembership(MU(x));
          if (a > 0) alphas.add(a);
        }
        for (const alpha of alphas) {
          const cut = sorted.filter((x) => MU(x) >= alpha);
          if (!isContiguous(cut, sorted)) return false;
        }
        return true;
      }
      function isContiguous(cut, sorted) {
        if (cut.length <= 1) return true;
        const firstIdx = sorted.indexOf(cut[0]);
        for (let i = 0; i < cut.length; i++) {
          if (sorted[firstIdx + i] !== cut[i]) return false;
        }
        return true;
      }
      function convexAt(MU, x1, x2, lambda) {
        checkZeroToOne(lambda, "lambda");
        const crispConvex = lambda * x1 + (1 - lambda) * x2;
        const muX1 = MU(x1);
        const muX2 = MU(x2);
        const muT = MU(crispConvex);
        return muT >= Math.min(muX1, muX2);
      }
      function isEqual(MUa, MUb, U) {
        for (const member of U) {
          if (checkMembership(MUa(member)) !== checkMembership(MUb(member))) {
            return false;
          }
        }
        return true;
      }
      function isSubset(MUa, MUb, U) {
        for (const member of U) {
          const yA = checkMembership(MUa(member));
          if (yA === 0) continue;
          if (yA > checkMembership(MUb(member))) return false;
        }
        return true;
      }
      function isProperSubset(MUa, MUb, U) {
        let strictlyLessSomewhere = false;
        for (const member of U) {
          const yA = checkMembership(MUa(member));
          const yB = checkMembership(MUb(member));
          if (yA > yB) return false;
          if (yA < yB) strictlyLessSomewhere = true;
        }
        return strictlyLessSomewhere;
      }
      function scalarCardinality(MU, U) {
        return U.reduce((prev, curr) => prev + checkMembership(MU(curr)), 0);
      }
      function relativeCardinality(MU, U) {
        return scalarCardinality(MU, U) / U.length;
      }
      function fuzzyCardinality(MU, U) {
        const aMap = alphaMap(MU, U);
        for (const alpha of aMap.keys()) {
          aMap.set(alpha, aMap.get(alpha).length);
        }
        return aMap;
      }
      function complement(MU) {
        return (x) => 1 - MU(x);
      }
      function union(MUa, MUb) {
        return (x) => Math.max(MUa(x), MUb(x));
      }
      function intersection(MUa, MUb) {
        return (x) => Math.min(MUa(x), MUb(x));
      }
      function simpleDifference(MUa, MUb) {
        const bComp = complement(MUb);
        return intersection(MUa, bComp);
      }
      function checkZeroToOne(alpha, name = "alpha") {
        if (alpha < 0 || alpha > 1) {
          throw new TypeError(`${name} must be between 0 and 1`);
        }
      }
      function alphaMap(MU, U) {
        const result = /* @__PURE__ */ new Map();
        for (const member of U) {
          const alpha = MU(member);
          if (isNotMemberA(alpha)) continue;
          let levelMembers = result.get(alpha);
          if (!levelMembers) {
            levelMembers = /* @__PURE__ */ new Set();
            result.set(alpha, levelMembers);
          }
          levelMembers.add(member);
        }
        for (const [alpha, level] of result) {
          result.set(alpha, Array.from(level));
        }
        return result;
      }
      function isMember(MU, x) {
        const alpha = MU(x);
        return isMemberA(alpha);
      }
      function checkMembership(alpha) {
        if (alpha < 0 || alpha > 1) {
          throw new RangeError(`membership value ${alpha} outside [0,1]`);
        }
        return alpha;
      }
      function isMemberA(alpha) {
        checkMembership(alpha);
        return alpha > 0;
      }
      function isNotMemberA(alpha) {
        return !isMemberA(alpha);
      }
      function discreteFuzzySet(MU, U) {
        const result = [];
        for (const member of U) {
          const alpha = checkMembership(MU(member));
          if (alpha === 0) continue;
          result.push([member, alpha]);
        }
        return result;
      }
      function msfFromDiscreteFuzzySet(discreteFuzzySet2) {
        const internal = /* @__PURE__ */ new Map();
        for (const [x, alpha] of discreteFuzzySet2) {
          if (alpha === 0) continue;
          internal.set(x, alpha);
        }
        return (x) => {
          const alpha = internal.get(x);
          return alpha === void 0 ? 0 : alpha;
        };
      }
      function triangularMSF(a, b, c) {
        return (x) => Math.max(Math.min((x - a) / (b - a), 1, (c - x) / (c - b)), 0);
      }
      function trapezoidalMSF(a, b, c, d) {
        return (x) => Math.max(Math.min((x - a) / (b - a), 1, (d - x) / (d - c)), 0);
      }
      function bellMSF(a, b, c) {
        return (x) => 1 / (1 + Math.abs((x - c) / a) ** (2 * b));
      }
      function gaussianMSF(mean, sigma, m = 2) {
        if (sigma === 0) throw new TypeError("sigma cannot be zero");
        return (x) => Math.exp(-0.5 * ((x - mean) / sigma) ** m);
      }
      function dynamicGaussianMSF(mean, sigma, m = 2) {
        if (sigma === 0) throw new TypeError("sigma cannot be zero");
        return (x) => Math.exp(-0.5 * ((x - mean()) / sigma()) ** m);
      }
      function sigmoidMSF(rate, center) {
        return (x) => 1 / (1 + Math.exp(-rate * (x - center)));
      }
      function dynamicSigmoidMSF(rate, center) {
        return (x) => 1 / (1 + Math.exp(-rate() * (x - center())));
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
      };
    }
  });

  // lib/extend.js
  var require_extend = __commonJS({
    "lib/extend.js"(exports, module) {
      var { DiscreteFuzzySet, checkMembership } = require_core();
      function* cartesian(arrays) {
        if (arrays.length === 0) {
          yield [];
          return;
        }
        const [first, ...rest] = arrays;
        for (const x of first) {
          for (const combo of cartesian(rest)) {
            yield [x, ...combo];
          }
        }
      }
      function extend(f, fuzzySets) {
        const universes = fuzzySets.map((fs) => fs.universe);
        const yToAlpha = /* @__PURE__ */ new Map();
        for (const xs of cartesian(universes)) {
          const y = f(...xs);
          const t = Math.min(...xs.map((x, i) => checkMembership(fuzzySets[i].MU(x))));
          const prev = yToAlpha.get(y) ?? 0;
          yToAlpha.set(y, Math.max(prev, t));
        }
        const U = Array.from(yToAlpha.keys());
        const MU = (y) => yToAlpha.get(y) ?? 0;
        return DiscreteFuzzySet.of(MU, U);
      }
      function fuzzyArith(op, A, B) {
        return extend((a, b) => op(a, b), [A, B]);
      }
      module.exports = {
        extend,
        fuzzyArith,
        cartesian
      };
    }
  });

  // lib/FuzzyNumber.js
  var require_FuzzyNumber = __commonJS({
    "lib/FuzzyNumber.js"(exports, module) {
      var { DiscreteFuzzySet, isConvex } = require_core();
      var { fuzzyArith } = require_extend();
      var FuzzyNumber = class _FuzzyNumber extends DiscreteFuzzySet {
        /**
         * @param {(x: number) => number} MU — membership function on ℝ
         * @param {Array<number>} U — discrete universe of discourse
         * @throws {Error} if the set is not normal (height ≠ 1)
         * @throws {Error} if the set is not convex (per the α-cut test)
         *
         * @see [2] Wikipedia "Fuzzy set" — fuzzy numbers (convex, normal)
         * @see [25] Zimmermann 2010 — fuzzy numbers and arithmetic
         */
        constructor(MU, U) {
          super(MU, U);
          if (!this.isNormalized) {
            throw new Error("fuzzy number must be normalized (height = 1)");
          }
          if (!isConvex(MU, U)) {
            throw new Error("fuzzy number must be convex");
          }
        }
        // A + B via the extension principle. // [25] Zimmermann 2010
        add(other) {
          return fuzzyArith((a, b) => a + b, this, other);
        }
        // A − B via the extension principle.
        sub(other) {
          return fuzzyArith((a, b) => a - b, this, other);
        }
        // A · B via the extension principle.
        mul(other) {
          return fuzzyArith((a, b) => a * b, this, other);
        }
        // A / B via the extension principle. Undefined when 0 ∈ supp(B).
        div(other) {
          if (other.MU(0) > 0) {
            throw new Error("divisor support contains 0");
          }
          return fuzzyArith((a, b) => a / b, this, other);
        }
        static of(MU, U) {
          return new _FuzzyNumber(MU, U);
        }
      };
      module.exports = { FuzzyNumber };
    }
  });

  // demo/entry.js
  var require_entry = __commonJS({
    "demo/entry.js"(exports, module) {
      var coreOps = require_core();
      var { extend, fuzzyArith } = require_extend();
      var { FuzzyNumber } = require_FuzzyNumber();
      module.exports = {
        ...coreOps,
        extend,
        fuzzyArith,
        FuzzyNumber
      };
    }
  });
  return require_entry();
})();
