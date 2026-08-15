# Gato — "A Generalist Agent"

**Reed et al. (DeepMind) — arXiv, May 2022.** A single ~1.2B parameter
transformer trained across 604 tasks — Atari, image captioning, chat, robotic
stacking — with one set of weights.

## Why it looked like an inflection

- The generality claim was concrete and checkable: one model, one weight set,
  radically different modalities.
- It arrived amid public statements from senior DeepMind figures that the path to
  general intelligence was essentially a matter of scale, and was widely read as
  the demonstration of that thesis.
- It fed an intense "AGI is imminent" discourse cycle in mid-2022.

## What actually happened

Gato was mediocre at nearly everything. It underperformed specialist models on
individual tasks, often by wide margins, and was small precisely because
multi-modal control demanded latency the authors could not get from a larger
model.

No product, no follow-on system of consequence, no adoption. The actual advance
of 2022 came from a much less general direction: text-only models with
instruction tuning.

## Diagnosis

**Inversion: claimed, not demonstrated.** The assumption supposedly overturned —
that different modalities require different models — was not overturned, because
the unified model was worse. Showing a thing is *possible* while being *worse* is
not an inversion; the constraint is still binding.

**Incentives: none.** There is no buyer for a system that is worse at every task
than the specialist alternative. Generality has no market value in itself.

**Inflection: none.** The trajectory ran through instruction-tuned language
models, not generalist agents.

## Lesson for Kyros

**Distinguish existence proofs from capability proofs.** "This can be done at all"
and "this can be done better" are different claims. Only the second creates an
incentive, and only an incentive creates diffusion.

Second: **beware candidates that arrive pre-loaded with a narrative.** Gato was
released into a discourse that wanted evidence for a thesis, and it was read as
that evidence rather than on its results. When a paper is being cited as proof of
something larger than its own findings, discount it.

Third: generality is a *cost* until it is free. Score generality claims on
whether the general system matches specialists, never on the breadth of the task
list.
