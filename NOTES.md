# Design notes & open questions

Working notes written while building `fuzzy-math` — design tradeoffs, things I'm
unsure about, and a running TODO. Moved out of the README to keep that focused
on usage. These are deliberately informal.

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


## todo

#### repeatative code
when I started to write this the code was very nice, small and clean, but pretty quickly stuff got verbose and icky. Membership filtering from the crisp in low level api is one example but not the only one. Need to deal with that at some point, but in a way that's not going to double or triple the amount of iterations.

#### normalization
When no member of the crisp set has an alpha of one

#### big ones
- fuzzy numbers
- intervals?
- fuzzy analysis

## learning resources

Material I leaned on while learning the subject:

- https://www-liphy.univ-grenoble-alpes.fr/pagesperso/bahram/biblio/Zadeh_FuzzySetTheory_1965.pdf
- https://www.youtube.com/watch?v=oWqXwCEfY78 and subsequent lectures
- https://core.ac.uk/download/pdf/82275055.pdf
- https://en.wikipedia.org/wiki/Fuzzy_set
