# GPT-3 — Language Models are Few-Shot Learners

**Brown et al. (OpenAI) — NeurIPS 2020 (arXiv May 2020).** 175B parameters.

Demonstrated that a sufficiently large language model performs new tasks from
examples supplied in its prompt, with no gradient updates.

## Inversion

The assumption that adapting a model to a task required fine-tuning — labelled
data, a training run, and a separate artefact per task. In-context learning
collapsed that pipeline into a text string.

The constraint that disappeared was **the labelled dataset**. A capability that
previously required a data-collection project became available to anyone who
could describe the task in English.

This also inverted who could build with AI. The interface became natural
language, so the addressable population of builders went from people who could
train models to people who could write.

## Incentives

Enormous but initially bottlenecked on access — the model was API-gated, and the
waitlist period (2020–2021) throttled diffusion. Every software company had a
reason to integrate; almost none could, at first.

The API-only release is itself the strategically important move: it kept the
weights closed while still building an ecosystem dependent on them, and it
established the business model the industry now runs on.

## Inflection

Real, but the consequence lagged the artefact by **roughly thirty months** — the
longest gap in the canon. The capability existed in May 2020. The world noticed
in November 2022, when the same underlying family was put behind a chat box.

## Lesson for Kyros

The clearest case in the corpus that **capability and consequence are separate
inflections**. GPT-3 was the capability event; ChatGPT was the distribution
event. An analyst tracking only papers would have called the first and been early
by two and a half years; one tracking only adoption would have called the second
and been on time but with no edge.

Kyros must date both, and say which one it is calling.
