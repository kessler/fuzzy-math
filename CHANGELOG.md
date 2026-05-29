# Changelog

All notable changes to this project are documented here. This project adheres
to [Semantic Versioning](https://semver.org/).

## [2.0.0]

Layer 1 — bringing the Zadeh-1965 foundation to mathematical correctness and
adding the missing fundamentals (extension principle, fuzzy numbers).

### Breaking changes

- **`isSubset` containment fixed.** Now applies the definition literally —
  `A ⊆ B` iff `μ_A(x) ≤ μ_B(x)` for **all** `x ∈ U`. The previous
  implementation skipped elements where `μ_B(x) = 0`, so e.g.
  `isSubset(x => 0.5, x => 0, [1])` wrongly returned `true`; it now returns
  `false`.
- **`isProperSubset` semantics fixed.** Now means "A ⊆ B and A ≠ B": `μ_A ≤ μ_B`
  everywhere **and** `μ_A < μ_B` somewhere. The previous implementation required
  strict inequality *everywhere*, rejecting legitimate proper subsets that agree
  at a point.
- **`isConvex` signature changed:** `isConvex(MU, x1, x2, lambda)` →
  `isConvex(MU, U)`. It now decides convexity via the α-cut test (every α-cut is
  a contiguous run in the sorted universe) instead of checking a single-point
  inequality. The `DiscreteFuzzySet.isConvex` getter is updated accordingly.
- **Membership range now enforced.** Any membership value outside `[0,1]` throws
  a `RangeError` instead of being silently treated as a non-member. Affects all
  operations that read `μ(x)`.
- **`compliment` → `complement`** rename (landed pre-2.0.0, counted here).
- **API namespacing:** `extend`, `fuzzyArith`, and `FuzzyNumber` are exported
  under the `core` namespace (landed alongside the `index.js` refactor).

### Added

- **`convexAt(MU, x1, x2, lambda)`** — the old single-point convexity inequality,
  preserved under an honest name (a *necessary* condition only).
- **`checkMembership(alpha)`** — the `μ ∈ [0,1]` guard helper.
- **`extend(f, fuzzySets)`** — Zadeh's extension principle for discrete
  universes, lifting any crisp function to fuzzy sets (`min` t-norm convention).
  Lazily enumerates the Cartesian product to bound memory.
- **`fuzzyArith(op, A, B)`** — binary-operation convenience wrapper over `extend`.
- **`FuzzyNumber`** — convex, normal fuzzy set on ℝ with `add` / `sub` / `mul` /
  `div` via the extension principle; invariants enforced strictly at construction.

### Tests

- Regression tests for the containment and proper-subset fixes.
- α-cut convexity tests (triangular, trapezoidal, two-hump, contiguity).
- Membership-range enforcement tests.
- Table-driven MSF generator tests (triangular, trapezoidal, bell, gaussian,
  sigmoid).
- `simpleDifference` test (previously skipped).
- New `test/extend.test.js` and `test/FuzzyNumber.test.js`, including the
  textbook triangular addition `(1,2,3) + (2,3,4) = (3,5,7)` via α-cuts.
