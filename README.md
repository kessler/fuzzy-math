# fuzzy-math (WIP)

It's math stuff, so there's gonna be a lot of explaining, mostly for myself :-)

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

## thoughts

#### where is U in (U,m) ?

In this implementation U is almost always the equivalent of R inside a computer. I should probably think about incorporating U into the mix somehow, becaue obviously it's not always the computerized version of R

#### Set vs Simple array as main data structure
- Set is the "natural" choice, since it maintains an important quality of classic mathematical sets which is, the distinctness of it's members.

- Looking at the code though, I noticed that iteration is probably the most used operation. Some quick research on the internet yields that arrays are faster that sets.

- The array api (reduce, filter etc) is much more cleaner than the Set's. Having similar api on a Set will require additional coding.

So for now I choose Array over Set.

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

### todo
- fuzzy numbers
- intervals?
- fuzzy analysis

### reference material
- https://www-liphy.univ-grenoble-alpes.fr/pagesperso/bahram/biblio/Zadeh_FuzzySetTheory_1965.pdf
- https://www.youtube.com/watch?v=oWqXwCEfY78 and subsequent lectures
- https://core.ac.uk/download/pdf/82275055.pdf
- https://en.wikipedia.org/wiki/Fuzzy_set
- 