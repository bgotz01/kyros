# Sparse Mixture of Experts

**Shazeer et al. — "Outrageously Large Neural Networks", ICLR 2017. Fedus, Zoph,
Shazeer — "Switch Transformer", 2021/JMLR 2022.**

Routes each token to a small subset of expert subnetworks, so total parameter
count and per-token compute stop being the same number.

## Inversion

The assumption that model capacity and inference cost scale together — that a
larger model necessarily costs more to run per token.

Sparsity broke the coupling. A model can hold very large total capacity while
activating only a fraction per token. The constraint that disappeared was the
serving cost of scale, which is the constraint that actually governs whether a
large model can be offered to millions of users profitably.

## Incentives

Strong for anyone serving at volume, and weak for everyone else — the memory
footprint of holding all experts remains large even though the compute does not,
so MoE favours actors with substantial hardware. This is a rare case where an
efficiency gain *concentrates* rather than democratises.

Adoption was slow (2017 → widespread ~2023–2024) because the engineering is hard:
routing instability, load balancing, expert collapse, and distributed training
complexity all had to be solved before the theoretical win was realisable.

## Inflection

Real, on a long fuse — roughly six years from the first strong result to
industrial standard. By 2024 sparse architectures were assumed in most frontier
systems, and Mixtral's open-weight release made the design broadly available.

## Lesson for Kyros

**The gap between "demonstrated" and "engineerable" can be half a decade**, and
during that gap the candidate looks like a false positive. MoE spent years as a
technique that clearly should work and mostly did not, in practice.

The distinguishing feature from a true false positive: the barrier was known,
named, and being worked on by many groups (routing, balancing, distribution) —
not vague. When a method stalls against *specified* engineering obstacles, hold
it as `latent` and watch the obstacles. When it stalls against nothing anyone can
name, it is dying.
