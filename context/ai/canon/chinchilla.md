# Chinchilla — Training Compute-Optimal Large Language Models

**Hoffmann et al. (DeepMind) — arXiv, March 2022.**

Showed that for a fixed compute budget, existing large models were badly
over-parameterised and under-trained. A 70B model trained on ~1.4T tokens
outperformed the 280B Gopher, and other contemporaries several times its size.

## Inversion

The assumption — reinforced by a misreading of Kaplan (2020) — that parameter
count was the axis to push. The industry had been in a parameter-count race
(GPT-3 175B, Gopher 280B, Megatron-Turing 530B). Chinchilla showed the race was
being run on the wrong variable.

The constraint that appeared, rather than disappeared: **data became the binding
input**. If optimal training requires roughly twenty tokens per parameter, the
supply of high-quality text becomes a hard ceiling, and data acquisition becomes
a strategic activity rather than a preprocessing step.

## Incentives

Immediate and universal, because it was a cost reduction. Anyone training a model
could get more capability for the same spend by re-allocating. Adoption was
therefore quiet and near-total within a year — visible in Llama (Feb 2023), which
trained comparatively small models on far more tokens and made frontier-adjacent
capability runnable on modest hardware.

The second-order incentive is the one that mattered most: it made small, capable,
open-weight models economically sensible. The entire open-weight ecosystem rests
on this result.

## Inflection

Real, with a short lag (~9 months). Downstream chains: the data licensing market,
the scraping and copyright litigation wave, synthetic data as a research
priority, and the "small model, huge corpus" design that made local inference
viable.

## Lesson for Kyros

An inflection can be a **correction to a previous inflection's parameters**. It
produced no new capability and no demo — it re-allocated existing inputs — yet it
reshaped model design, hardware demand, and the legal landscape around training
data.

Also the case study for tracing a technical result into a legal one: Chinchilla
made data scarce, scarcity made scraping valuable, and value made it litigated.
