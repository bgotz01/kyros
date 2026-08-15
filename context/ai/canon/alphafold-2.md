# AlphaFold 2

**Jumper et al. (DeepMind) — CASP14, November 2020; Nature, July 2021.**

Predicted protein structures at accuracy competitive with experimental methods,
achieving a median GDT around 92 at CASP14 — treated in the field as having
substantially solved single-chain structure prediction, a fifty-year problem.

## Inversion

The assumption that determining protein structure required physical
experiment — X-ray crystallography, NMR, cryo-EM — at a cost of months to years
and considerable money per structure.

The constraint that disappeared was **the experiment itself**, for a large class
of cases. A bottleneck measured in laboratory-years collapsed to compute-minutes.

## Incentives

Strong and unusually well-routed, because DeepMind released the structures rather
than selling them. The AlphaFold Protein Structure Database published predictions
for over 200 million proteins, free. Adoption in structural biology was immediate
and near-universal — the fastest diffusion in the canon after AlexNet.

The choice to give it away is the reason it became infrastructure rather than a
product. A licensed AlphaFold would have been a business; a free one reorganised
a scientific field.

## Inflection

Real, and the clearest evidence that the paradigm reaches beyond software. It
established the template now being attempted across materials science, weather
prediction, and drug discovery: where a domain has abundant structured data and a
crisp objective, learned models can displace experimental workflows.

## Lesson for Kyros

The domain-transfer case. The transformer left NLP entirely and solved a biology
problem — which is the strongest possible evidence that an inversion is general
rather than local.

**Screening question:** has this method been used successfully outside the field
that produced it? A yes upgrades a candidate substantially. It is also the exact
test capsule networks and neural Turing machines failed.

Second lesson: the release decision determined the magnitude of the consequence.
When analysing a lab result, analyse the distribution choice as a separate
variable — it is often the larger term.
