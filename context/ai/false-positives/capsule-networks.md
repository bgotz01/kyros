# Capsule Networks

**Sabour, Frosst, Hinton — "Dynamic Routing Between Capsules", NeurIPS 2017.**

Proposed replacing scalar neurons and pooling with vector-valued "capsules"
encoding pose and part-whole relationships, routed by agreement.

## Why it looked like an inflection

- Hinton's authorship. He had been publicly critical of convolutional pooling for
  years — "the pooling operation is a big mistake" — and this was presented as
  the successor.
- A genuine conceptual argument: CNNs discard spatial hierarchy, capsules
  preserve it. The critique of the incumbent was correct and well-formed.
- Heavy press treatment as the next architecture after CNNs.

## What actually happened

Results held on small datasets (MNIST and variants) and degraded on anything
larger. Routing-by-agreement was expensive and did not parallelise well on the
hardware everyone had. Attempts to scale to ImageNet-class problems were
unconvincing.

By 2019–2020 the line was effectively dormant. The problem it targeted —
representing part-whole structure — was addressed instead by scale and attention,
neither of which had a principled account of the problem at all.

## Diagnosis

**Inversion: real but unbanked.** The criticism of pooling was sound. A correct
diagnosis of a flaw in the incumbent does not make the proposed replacement an
inflection.

**Incentives: absent.** This is the decisive failure. Nobody's cost fell.
Capsules were slower on existing hardware and better only where nobody had a
problem. There was no actor for whom adopting this was economically obvious, and
so — despite the author, the venue and the coverage — no one adopted it.

**Inflection: none.** No cost curve moved, no second lab built on it, and it never
left its home domain.

## Lesson for Kyros

**Authority is not a signal.** Weight who wrote a paper at approximately zero.
The corpus contains work by unknowns that reorganised the field and work by the
most cited researcher in it that did nothing.

The specific trap: a compelling critique of the status quo feels like evidence
for the proposed alternative. It is not. Score I¹ on the alternative's own merits
and then insist on I² — *whose cost falls?* Capsule networks fail that question
outright, and the answer was available in 2017.
