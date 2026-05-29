# fuzzy-math (WIP)

Seriously this is really WIP!

<small>I'm not a mathematician and this library did not undergo any rigorious inspection by one. More over I wrote this library while learning the subject matter, so there are probably serious mistakes in it. However, at some point, I will collaborate with a mathematician to rectify this situation.</small>

## Fuzzy Sets

from [wikipedia](https://en.wikipedia.org/wiki/Fuzzy_set):

> A fuzzy set is a pair ( U , m ) where U is a set (often required to be non-empty) and m : U → [ 0 , 1 ] a membership function. The reference set U (sometimes denoted by Ω or X is called universe of discourse, and for each x ∈ U, the value m ( x ) is called the grade of membership of x in ( U , m ). The function m = μ A is called the membership function of the fuzzy set A = ( U , m ). 

### api

#### classy api

The classy api will simply save you the trouble of stating μ and U all the time. 

TBD: examples and reference

#### low level api

the low level API is implemented as simple functions that will almost always take a μ and a U to operate on.

TBD: examples and reference

## Layer 1 capabilities (Zadeh 1965 base)

The `core` namespace implements the foundational layer of fuzzy set theory — what every fuzzy set *is* before you choose connectives or applications.

**Membership contract.** Every membership function must satisfy `μ : U → [0,1]` [1][2]. A value outside `[0,1]` throws a `RangeError` rather than being silently filtered — a membership of `1.2` is a bug in your MSF, and the library says so.

**Standard operations** [1]:

| Operation | Definition |
|---|---|
| `union(μA, μB)` | `μ(x) = max(μA(x), μB(x))` |
| `intersection(μA, μB)` | `μ(x) = min(μA(x), μB(x))` |
| `complement(μ)` | `μ'(x) = 1 − μ(x)` |
| `simpleDifference(μA, μB)` | `A ∩ Bᶜ = min(μA(x), 1 − μB(x))` |
| `isSubset(μA, μB, U)` | `A ⊆ B` iff `μA(x) ≤ μB(x)` for **all** `x ∈ U` |
| `isProperSubset(μA, μB, U)` | `A ⊆ B` **and** `μA(x) < μB(x)` somewhere |

**α-cuts and structure** [2]: `alphaCut` (`{x : μ(x) ≥ α}`), `strongAlphaCut` (`{x : μ(x) > α}`), `support`, `core`, `height`, `isNormalized`.

**Convexity** [1][2]: `isConvex(μ, U)` decides convexity *correctly* — A is convex iff every α-cut is a contiguous run in the (sorted) universe. The older single-point inequality `μ(λx₁ + (1−λ)x₂) ≥ min(μ(x₁), μ(x₂))` is preserved under the honest name `convexAt(μ, x1, x2, lambda)` (a *necessary* condition only).

**Extension principle** [2][25]: `extend(f, [A, ...])` lifts any crisp function `f` to fuzzy sets via `μ_{f(A)}(y) = sup_{x ∈ f⁻¹(y)} μ_A(x)`, combining inputs with `min` (Zadeh's original convention). This is the engine of fuzzy arithmetic.

**Fuzzy numbers** [25]: `FuzzyNumber` is a convex, normal fuzzy set on ℝ with `add` / `sub` / `mul` / `div` implemented via the extension principle. Invariants (convex + normal) are enforced strictly at construction.

## thoughts

#### Set vs Simple array as main data structure
- Set is the "natural" choice, since it maintains an important quality of classic mathematical sets which is, the distinctness of it's members.

- Looking at the code though, I noticed that iteration is probably the most used operation. Some quick research on the internet yields that arrays are faster that sets.

- The array api (reduce, filter etc) is much more cleaner than the Set's. Having similar api on a Set will require additional coding.

So for now I choose Array over Set.

- it seems like MU is not a proper subset of MU but is a subset

#### not just numerical fuzzy sets

Using objects as member should work pretty great, as long as you make your MU play nicely with them:

```js
class Member {
  gt(something) {}
  eq(something) {}
  lt(something) {}
  ... etc
}

const MU = x => {
  if (x.gt(5)) return 1
  if (x.lt(0)) return 0.5
  return 0
}

```

#### serialization 
- Serializing and de-serializing code might be a serious security risk. How to safely serialize fuzzy sets then, without serializing the membership function code?

- perhaps there can be a "static" and "dynamic" versions of a fuzzy set. The dynamic one will have a user provided function and can only be created at run time. The static one will serialize the fuzzy set array `[[x, MU(x)...]]` and when loaded will have an internal membership function that outputs from that array (practically this should be an object with a map from x => alpha)


### todo

#### repeatative code
when I started to write this the code was very nice, small and clean, but pretty quickly stuff got verbose and icky. Membership filtering from the crisp in low level api is one example but not the only one. Need to deal with that at some point, but in a way that's not going to double or triple the amount of iterations.

#### normalization
When no member of the crisp set has an alpha of one

#### big ones
- fuzzy numbers
- intervals?
- fuzzy analysis

### reference material
- https://www-liphy.univ-grenoble-alpes.fr/pagesperso/bahram/biblio/Zadeh_FuzzySetTheory_1965.pdf
- https://www.youtube.com/watch?v=oWqXwCEfY78 and subsequent lectures
- https://core.ac.uk/download/pdf/82275055.pdf
- https://en.wikipedia.org/wiki/Fuzzy_set
-

### References

The Layer 1 capabilities above are annotated against these primary sources:

- **[1]** Zadeh, L.A. (1965). *Fuzzy Sets*. Information and Control 8(3): 338–353.
- **[2]** *Fuzzy set* — Wikipedia. https://en.wikipedia.org/wiki/Fuzzy_set
- **[25]** Zimmermann, H.-J. (2010). *Fuzzy set theory*. WIREs Computational Statistics 2: 317–332.