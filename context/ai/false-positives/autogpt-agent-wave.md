# The AutoGPT Wave

**AutoGPT released late March 2023; BabyAGI and a large cohort of autonomous-agent
projects followed within weeks.** AutoGPT became one of the fastest-starred
repositories in GitHub's history.

## Why it looked like an inflection

- Explosive, measurable adoption signals — stars, forks, downloads, coverage.
- A coherent and genuinely important claim: if a model can plan, call tools and
  loop, then it is no longer a text generator but an actor. That reframing was
  correct.
- Compelling demonstrations. The failures were not visible in a two-minute video.

## What actually happened

The loops did not terminate usefully. Agents got stuck, repeated themselves,
burned tokens, and compounded small errors across steps until the trajectory was
worthless. Reliability at the per-step level — around 90–95% — produced
unacceptable end-to-end success over long horizons, because errors multiply.

Almost no durable production deployment emerged from that wave. Activity moved on
within months.

## Diagnosis

**Inversion: correctly identified, prematurely claimed.** The agentic reframing
was right. The models of March 2023 could not sustain it — insufficient context,
weak instruction adherence, no reliable tool calling, no error recovery.

**Incentives: real and enormous.** Everyone wanted this. Demand was never the
constraint, which is precisely why the failure is instructive: the wave had every
tailwind and still produced nothing durable.

**Inflection: not then.** Agentic systems did become substantively real later, as
tool-calling reliability, long context and reasoning improved. The direction was
right; the date was wrong by years.

## Lesson for Kyros

**The most dangerous false positive class: right thesis, wrong moment.** These are
harder than Watson or capsules, because the eventual vindication makes the early
call look prescient rather than wrong. It was not prescient. A call that is
correct three years early is indistinguishable in consequence from being wrong,
and positioning on it loses.

Discipline this requires:
- Separate *direction* from *timing*, and issue a verdict on both. `latent` is the
  correct verdict here, not `inflection`.
- Name the **specific blocking capability** and its current value. In March 2023
  the blocker was per-step reliability compounding over horizon length. That is
  measurable, and it was measurable then.
- **Adoption metrics that are free are not adoption.** Stars, downloads and demo
  volume cost nothing. Weight only signals with a price: production deployment,
  paid usage, staff hired against it.
