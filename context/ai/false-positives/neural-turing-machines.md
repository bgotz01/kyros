# Neural Turing Machines and the Differentiable Neural Computer

**Graves, Wayne, Danihelka — "Neural Turing Machines", 2014. Graves et al. —
"Hybrid computing using a neural network with dynamic external memory"
(the DNC), Nature, 2016.**

Neural networks coupled to an external, differentiable memory addressed by
content and location — a learnable read-write store.

## Why it looked like an inflection

- A Nature paper from DeepMind at the height of its post-AlphaGo prestige.
- It targeted the acknowledged weakness of neural networks: no persistent,
  addressable memory. Everyone agreed this was the gap.
- The framing was irresistible — a neural network learning to use memory like a
  computer, bridging connectionist and symbolic computation.
- Demonstrated algorithmic tasks (copying, sorting, graph traversal) that had
  been considered out of reach for learned systems.

## What actually happened

Extremely difficult to train, unstable, and slow. Results stayed on synthetic
tasks. No production system of consequence was ever built on it.

The memory problem it addressed was then largely dissolved by a different route:
attention over a long context window gave models effective working memory without
any explicit read-write mechanism. Retrieval systems supplied the rest. The
architecture that solved the problem was not designed to solve it.

## Diagnosis

**Inversion: real, and correctly aimed.** The identified gap was the right gap.
This case is genuinely instructive because the *problem selection* was excellent.

**Incentives: absent.** Too fragile to deploy, so no one's cost fell.

**Inflection: none.** The trajectory changed — models did acquire usable memory —
but not through this.

## Lesson for Kyros

**Correctly identifying the bottleneck does not mean you have identified the
solution.** This is the failure mode most likely to catch the council, because
the Bottlenecks group biases us toward candidates that address a known gap.

Rule: when a paper targets a bottleneck everyone agrees on, the prior should
*fall*, not rise. Many groups are attacking it; most will fail; the eventual
solution frequently arrives from an unrelated direction and dissolves the problem
rather than solving it.

Attention was not proposed as a memory mechanism. Ask, for any bottleneck: what
would make this question stop mattering?
