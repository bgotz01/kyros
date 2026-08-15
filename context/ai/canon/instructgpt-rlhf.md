# InstructGPT — Training Language Models to Follow Instructions with Human Feedback

**Ouyang et al. (OpenAI) — arXiv, March 2022.**

Applied reinforcement learning from human feedback to align model outputs with
user intent. Human raters preferred the 1.3B InstructGPT over the 175B GPT-3.

## Inversion

The assumption that capability and usefulness were the same axis, and that both
came from scale. A model over a hundred times smaller was preferred, because
preference tracks *intent-following*, not raw capability.

The constraint that disappeared was the prompt-engineering burden. Before,
extracting good behaviour from a base model required skill; after, it required
asking. This is what made the technology addressable by the general public.

## Incentives

Overwhelming and product-shaped. RLHF converted a research artefact into
something shippable to non-experts, which is the precondition for consumer
distribution and therefore for the entire revenue base of the industry.

It also created a new input market — human preference data — and with it an
annotation labour supply chain, with the working-conditions and geography
questions that follow.

## Inflection

Real, and structurally the direct precondition for ChatGPT eight months later.
Also the origin of the alignment-as-product-surface pattern: every frontier lab
now ships a preference-tuned model, and the tuning is a competitive asset
distinct from the base model.

Downstream: constitutional AI and RLAIF, preference optimisation methods (DPO and
successors), and the reasoning-model RL training that followed in 2024–2025.

## Lesson for Kyros

**Usability is a capability.** The council's default failure is to weight
technical novelty over interface, because papers describe the former. InstructGPT
introduced almost no new technical machinery — RL and human feedback both
pre-existed — and was one of the highest-consequence results of the decade.

Ask of every candidate: does this change who can use the thing? That question
finds inflections that a purely technical reading misses entirely.
