# fuzzy-math

A small, dependency-light fuzzy set theory library for JavaScript — membership
functions, the standard set operations, α-cuts, Zadeh's extension principle, and
fuzzy-number arithmetic. Built layer by layer against the primary literature,
with each operation annotated to its source.

**▶ [Try the interactive demo](https://kessler.github.io/fuzzy-math/demo/)** — membership-function playground, set operations, fuzzy arithmetic, and an α-cut explorer, all running on the library in your browser.

> **⚠️ Work in progress.** This is genuinely WIP.
>
> <small>I'm not a mathematician and this library has not undergone rigorous
> inspection by one. I wrote it while learning the subject, so there may still be
> mistakes. The Layer 1 core (below) has been reworked for correctness and is
> covered by tests, but treat the wider surface with care until it's reviewed.</small>

## Install

```sh
npm install fuzzy-math
```

## What is a fuzzy set?

A classical (crisp) set draws a hard boundary: an element is either in or out.
A **fuzzy set** softens that boundary — each element has a *grade of membership*
between 0 and 1.

> A fuzzy set is a pair `(U, m)` where `U` is the universe of discourse and
> `m : U → [0,1]` is a membership function. For each `x ∈ U`, the value `m(x)` is
> the grade of membership of `x`. — [Wikipedia](https://en.wikipedia.org/wiki/Fuzzy_set)

Throughout the code the membership function is written `μ` (or `MU`) and the
universe is `U`.

## Quick start

```js
const { core } = require('fuzzy-math')
const { DiscreteFuzzySet, msfFromDiscreteFuzzySet } = core

// "tall" defined over a handful of heights (cm), μ given explicitly
const tall = DiscreteFuzzySet.of(
  msfFromDiscreteFuzzySet([[160, 0.2], [170, 0.5], [180, 0.8], [190, 1]]),
  [160, 170, 180, 190, 200]
)

tall.MU(180)        // 0.8
tall.height         // 1            — the largest membership
tall.isNormalized   // true         — height === 1
tall.core           // [190]        — members with μ === 1
tall.support        // [160, 170, 180, 190]   — members with μ > 0
tall.alphaCut(0.5)  // [170, 180, 190]        — members with μ ≥ 0.5
tall.isConvex       // true
```

## API

The package exposes three namespaces:

```js
const { core, sugeno, ascify } = require('fuzzy-math')
```

- **`core`** — the fuzzy set foundation (Layer 1). Documented below.
- **`sugeno`** — a Takagi–Sugeno fuzzy inference system (`SugenoFIS`). *WIP.*
- **`ascify`** — render a fuzzy set as an ASCII chart in the terminal. *WIP.*

### Two ways to use `core`

**Classy API** — `DiscreteFuzzySet` wraps a `(μ, U)` pair so you don't have to
pass them around:

```js
const { DiscreteFuzzySet, triangularMSF } = core
const warm = DiscreteFuzzySet.of(triangularMSF(15, 22, 30), [10, 15, 20, 25, 30])

warm.support        // members with μ > 0
warm.alphaCut(0.7)  // α-level set
for (const [x, mu] of warm) { /* iterate members and their grades */ }
```

**Low-level API** — plain functions that take `μ` and `U` (or just `μ` for the
operations that return a new membership function):

```js
const { union, intersection, complement, support } = core

const a = x => (x === 1 ? 0.6 : x === 2 ? 0.3 : 0)
const b = x => (x === 2 ? 0.7 : x === 3 ? 0.9 : 0)
const U = [1, 2, 3]

support(union(a, b), U)         // [1, 2, 3]
support(intersection(a, b), U)  // [2]
complement(a)(1)                // 0.4
```

### Membership contract

Every membership function must satisfy `μ : U → [0,1]` [1][2]. A value outside
`[0,1]` throws a `RangeError` rather than being silently filtered — a membership
of `1.2` is a bug in your MSF, and the library says so.

### Standard operations [1]

| Function | Definition |
|---|---|
| `union(μA, μB)` | `μ(x) = max(μA(x), μB(x))` |
| `intersection(μA, μB)` | `μ(x) = min(μA(x), μB(x))` |
| `complement(μ)` | `μ'(x) = 1 − μ(x)` |
| `simpleDifference(μA, μB)` | `A ∩ Bᶜ = min(μA(x), 1 − μB(x))` |
| `isSubset(μA, μB, U)` | `A ⊆ B` iff `μA(x) ≤ μB(x)` for **all** `x ∈ U` |
| `isProperSubset(μA, μB, U)` | `A ⊆ B` **and** `μA(x) < μB(x)` somewhere |
| `isEqual(μA, μB, U)` | `μA(x) === μB(x)` for all `x ∈ U` |

### α-cuts and structure [2]

`alphaCut(μ, U, α)` (`{x : μ(x) ≥ α}`), `strongAlphaCut` (`{x : μ(x) > α}`),
`support`, `core`, `height`, `isNormalized`, plus cardinalities
(`scalarCardinality`, `relativeCardinality`, `fuzzyCardinality`) and `alphaMap`.

### Convexity [1][2]

`isConvex(μ, U)` decides convexity *correctly*: A is convex iff every α-cut is a
contiguous run in the sorted universe. The older single-point inequality
`μ(λx₁ + (1−λ)x₂) ≥ min(μ(x₁), μ(x₂))` is preserved under the honest name
`convexAt(μ, x1, x2, λ)` — a *necessary* condition only.

### Membership function generators

`triangularMSF(a, b, c)`, `trapezoidalMSF(a, b, c, d)`, `bellMSF(a, b, c)`,
`gaussianMSF(mean, sigma, m=2)`, `sigmoidMSF(rate, center)`, and dynamic
(re-parameterizable) variants `dynamicGaussianMSF` / `dynamicSigmoidMSF`.

### Extension principle [2][25]

`extend(f, [A, ...])` lifts any crisp function `f` to fuzzy sets via
`μ_{f(A)}(y) = sup_{x ∈ f⁻¹(y)} μ_A(x)`, combining inputs with `min` (Zadeh's
original convention). It is the engine of fuzzy arithmetic.

```js
const { extend, DiscreteFuzzySet, msfFromDiscreteFuzzySet } = core

const around2 = DiscreteFuzzySet.of(msfFromDiscreteFuzzySet([[1, 0.5], [2, 1], [3, 0.5]]), [1, 2, 3])
const around3 = DiscreteFuzzySet.of(msfFromDiscreteFuzzySet([[2, 0.5], [3, 1], [4, 0.5]]), [2, 3, 4])

const sum = extend((x, y) => x + y, [around2, around3])
sum.MU(5)  // 1    — 2 + 3, the peak
sum.MU(7)  // 0.5  — 3 + 4
```

### Fuzzy numbers [25]

`FuzzyNumber` is a convex, normal fuzzy set on ℝ with `add` / `sub` / `mul` /
`div` implemented via the extension principle. The convex + normal invariants
are enforced strictly at construction (an invalid set throws).

```js
const { FuzzyNumber, triangularMSF } = core

// triangular fuzzy numbers ≈ (1,2,3) and (2,3,4) on a half-integer grid
const A = new FuzzyNumber(triangularMSF(1, 2, 3), [1, 1.5, 2, 2.5, 3])
const B = new FuzzyNumber(triangularMSF(2, 3, 4), [2, 2.5, 3, 3.5, 4])

const sum = A.add(B)   // reproduces the triangular number (3, 5, 7)
sum.MU(5)              // 1   — peak at 2 + 3
sum.core               // [5]
```

## Layer roadmap

The library is being built in layers, each anchored to the literature:

- **Layer 1 — Zadeh 1965 base** *(implemented)*: membership functions, standard
  operations, α-cuts, convexity, the extension principle, fuzzy numbers.
- **Layer 2 — t-norms & t-conorms** *(planned)*: parameterized `union` /
  `intersection`, residuated implications. This is where the hard-coded `min` in
  `extend` becomes pluggable.
- **Layer 3 — applications** *(planned)*: controllers, fuzzy clustering, ANFIS.

See [CHANGELOG.md](./CHANGELOG.md) for what changed in each release.

## References

The capabilities above are annotated against these primary sources:

- **[1]** Zadeh, L.A. (1965). *Fuzzy Sets*. Information and Control 8(3): 338–353.
- **[2]** *Fuzzy set* — Wikipedia. https://en.wikipedia.org/wiki/Fuzzy_set
- **[25]** Zimmermann, H.-J. (2010). *Fuzzy set theory*. WIREs Computational Statistics 2: 317–332.

## Design notes

Informal working notes, design tradeoffs, and the TODO list live in
[NOTES.md](./NOTES.md).

## License

Apache-2.0
