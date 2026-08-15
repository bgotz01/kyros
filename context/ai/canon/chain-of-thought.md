# Chain-of-Thought Prompting

**Wei et al. (Google) — arXiv, January 2022.**

Showed that prompting a model to produce intermediate reasoning steps
substantially improves performance on arithmetic, commonsense and symbolic
reasoning — and that the effect emerges only at sufficient scale.

## Inversion

The assumption that a model's capability was fixed at training time and read out
at inference. Chain-of-thought showed that **capability is partly a function of
how much computation the model is allowed to do at inference**, and that this
could be unlocked with a prompt rather than a training run.

The constraint that disappeared: improving reasoning no longer required
retraining. It required asking differently.

## Incentives

Immediate, universal and free. It cost nothing to adopt, worked on models people
already had, and improved measured performance. Diffusion was near-instant among
practitioners; the wider recognition of what it implied took about a year.

The deeper incentive arrived later: if inference compute buys capability, then
inference becomes a place to spend money, and the economics of serving models
change permanently — from a cost to be minimised into a dial to be turned.

## Inflection

Real, and larger in retrospect than it appeared. It opened the axis that o1 and
DeepSeek-R1 later industrialised: test-time compute as a scaling dimension
independent of parameters and training data.

It also established that model capability is *elicited*, not merely possessed —
which complicates every evaluation claim made before or since, because a
benchmark number is now a statement about a prompt as much as about a model.

## Lesson for Kyros

The inflection was **a prompting technique**, which is the lowest-status possible
form for an important result to take. It was widely treated as a trick.

Weight results by what they imply about the shape of the system, not by the
apparent seriousness of the artefact. A paper that changes what a fixed model can
do has found a free variable nobody knew existed.
