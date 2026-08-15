# LoRA — Low-Rank Adaptation of Large Language Models

**Hu et al. (Microsoft) — arXiv, June 2021.**

Freezes the pretrained weights and trains small low-rank update matrices instead,
cutting the trainable parameter count for adaptation by orders of magnitude with
little quality loss.

## Inversion

The assumption that customising a large model meant fine-tuning all of it —
requiring the full optimiser state in memory, a serious machine, and a full model
copy stored per task.

The constraint that disappeared was **capital**. Adaptation went from a
datacentre operation to something runnable on a single consumer GPU, and the
resulting artefact was megabytes rather than hundreds of gigabytes.

## Incentives

Very strong at the periphery, weak at the centre — which is what makes it
interesting. Frontier labs gained little; they already had the hardware. Everyone
else gained the ability to participate at all.

The result was structural: an ecosystem of shared, composable adapters, a
distribution layer (Hugging Face) that made them findable, and a viable
open-weight track running alongside the frontier labs rather than inside them.

## Inflection

Real, with a lag of roughly eighteen months. Recognised in 2023 when open-weight
base models (Llama and successors) met cheap adaptation and produced thousands of
specialised variants within months.

Downstream: on-premises and sovereign deployment for regulated industries,
serving architectures that host many adapters against one base model, and the
persistence of a competitive open tier that would otherwise have been priced out.

## Lesson for Kyros

**Efficiency results are systematically under-weighted because they demonstrate
no new capability.** LoRA did nothing a full fine-tune could not. It changed who
could afford to do it, which changed the structure of the industry.

Screening question: does this move a capability across a *price threshold* — from
institutional to individual, or from capex to consumer? Threshold crossings
change the population of actors, and a change in the population of actors is a
paradigm change even when the technology is unchanged.
