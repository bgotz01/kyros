# Test-Time Compute — the o1 Family

**OpenAI — o1-preview, September 2024.** A model trained to produce extended
internal reasoning before answering, with performance improving as a function of
inference-time compute.

## Inversion

The assumption that a model's capability is fixed once training ends, and that
inference is a cost to minimise.

Test-time compute established a **second scaling axis**. Where the 2020 scaling
laws said capability is a function of training spend, this said capability is
also a function of thinking spend at query time — and that the two can be traded.

The constraint that disappeared: improving a model on hard problems no longer
required a new training run. It required letting it think longer.

## Incentives

Reshapes the economics of serving. Inference stops being a commodity cost per
token and becomes a quality dial that can be priced — cheap fast answers and
expensive careful ones from the same weights.

It also changes the hardware demand curve. If a large share of compute moves from
training to inference, the demand profile shifts from large synchronous clusters
toward distributed, latency-sensitive, always-on capacity. Datacentre siting,
energy contracting and chip design all follow different curves under that
assumption.

## Inflection

Real, and still resolving. The strongest confirming evidence is independent
reproduction — DeepSeek-R1 (January 2025) showed the effect was not proprietary,
which converted it from one lab's product to a property of the technology.

Open question, appropriate for a `latent` component: whether the gains extend
beyond domains with verifiable rewards (mathematics, code, formal reasoning) into
open-ended judgement, where there is no signal to train the reasoning against.

## Lesson for Kyros

The closed-lab problem in its purest form. o1 arrived as a product with no paper,
no weights and no method disclosure. There was nothing to reproduce and nothing
to inspect.

**Rule: when the artefact is a product rather than a result, the confirming
observable is independent reproduction — and until that arrives, confidence is
capped at moderate regardless of how impressive the demo is.** Four months later
the reproduction arrived. That interval, not the announcement, was the analysable
window.
