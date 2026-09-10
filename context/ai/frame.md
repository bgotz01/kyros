# The Standing Frame

**Last reviewed: 2026-09-09.** This file is the frame every candidate is judged
against. It is not attached by choice — it is always present. Everything else in
the corpus is evidence; this is the instrument.

Three parts:

1. **The laws** — what is being measured.
2. **The prevailing paradigm** — where the thing to invert is written down.
3. **The corpus** — what the evidence is and how to read it.

---

# 1 — The laws

```
Poesis = O³        Kyros = I³
create             observe
```

Poesis asks what should exist next. Kyros asks where it is already emerging.
Same three laws, opposite orientation.

| | Poesis · create | Kyros · observe | The question |
|---|---|---|---|
| **1** | Opposites | Inversion | Is it the **opposite**? |
| **2** | Obvious | Incentives | Is it **obvious**? |
| **3** | Outliers | Inflection | Is it an **outlier**? |

**All three are properties of the artefact, readable on the day it is published.**
None of them asks what happened afterward. This is the single most important
sentence in this file, and the easiest to drift away from — see §Scoring below.

---

## I¹ — Inversion · *is it the opposite?*

Does it do the opposite of what the prevailing paradigm assumes is necessary?

Not "is it better." Better is a scalar inside an unchanged frame. Inversion is a
sign change: the thing everyone treated as required turns out to be optional, or
the thing treated as impossible turns out to be routine.

- **10** — the prior assumption is not improved but negated. Recurrence was
  necessary for sequence modelling; the Transformer removed it. Human game records
  were necessary for superhuman play; AlphaZero removed them.
- **1** — moves a number inside the existing frame. The assumptions survive intact.

State the inverted assumption in one sentence before elaborating. If you cannot,
there probably isn't one — say so and score low.

**Failure mode:** mistaking a new *result* for a new *constraint structure*.

**This law cannot be scored without a dated paradigm snapshot.** "Opposite" is
meaningless until the prevailing assumption is written down. The snapshot's
`baseline` is that writing-down: a list of atomic, falsifiable claims about what
is normal, and I¹ names exactly one of them.

**Examples**

| Held necessary | Inverted by | I¹ |
|---|---|---|
| Recurrence, for sequence modelling | `Canon · Attention Is All You Need` — attention alone | **10** |
| Hand-engineered features, trained on CPUs | `Canon · AlexNet` — learned features on two consumer GPUs | **9** |
| Task-specific fine-tuning, for task performance | `Canon · GPT-3` — the task described in the prompt | **9** |
| Human game records, for superhuman play | `Canon · AlphaGo / AlphaZero` — self-play from zero | **8** |
| Parameters are the scarce input | `Canon · Chinchilla` — tokens are; models were undertrained | **5** |
| Frontier reasoning needs closed weights and nine figures | `Canon · DeepSeek-R1` — open weights at ~20× lower cost | **6** |

The shape is always **A → not-A**, never A → better-A. *RNN → Transformer* and
*CPU → GPU* are the same move at different layers: the substrate the computation
must run **as**, and the substrate it must run **on**. Both were held to be
settled; both flipped sign.

**Prior attempts do not deflate an inversion.** I¹ asks whether the creation
contradicts the claim as written — not whether anyone tried before. While a
baseline claim stands, *every* creation that contradicts it inverts it, the tenth
as much as the first; the tenth then scores low on **I³**, because by then the
class is crowded. High I¹ with low I³ is not a contradiction to be smoothed away.
It is the normal shape of a creation arriving into a crowded direction, and
producing it is what having three laws is for.

Using prior art to argue I¹ down is the commonest way the two collapse into one.
`open-weight-llms` existing in December 2023 does not falsify "frontier capability
is concentrated in closed providers" — the snapshot's own evidence records that
the best open model *trailed the closed frontier on every public benchmark*. An
open model that later reaches parity contradicts the claim outright, however many
tried before it.

**Counter-example.** `Canon · FlashAttention` scores **2** here. It computes
exactly the same attention, faster. Nothing held necessary was shown to be
optional — it is an engineering win inside an unchanged frame. Enormously
valuable, near-zero inversion, and the score has to say so.

---

## I² — Incentives · *is it obvious?*

Does it act on a bottleneck everyone already knows is binding?

**The measure is the constraint, not the customer.** I² asks what this does to
the field's constraint surface — the named, dated list of things that are
stopping progress. Commercial pull is *evidence* that a constraint binds, not the
thing being scored: money moves toward binding constraints, which is why a
result that relieves one usually spreads. Where the two come apart, score the
constraint. A result that moves a binding constraint but has no market yet is a
high I²; a product with obvious buyers that moves no listed constraint is not.

**"Obvious" means an obvious evolutionary direction:** the next move is legible
because the system already contains a pressure toward it. This is what joins the
two labels. Poesis reads that pressure as a direction to build toward; Kyros
reads the same pressure as an incentive already acting on everyone else. One
force, named from the two ends.

This is a question about the *legibility and size of the need*, not about whether
adoption subsequently occurred. Obviousness is visible on day one.

**A constraint can be moved without being reduced.** Name what the paper does to
it — this is `action`, and it bounds the score:

| Action | What it does to the constraint | Tops out at |
|---|---|---|
| **relieves** | reduces it — the thing costs less, works better, becomes feasible | **10** |
| **reveals** | establishes that it binds where the field assumed it did not | **7** |
| **measures** | first makes it reproducibly measurable, so progress on it becomes legible | **6** |
| **bounds** | shows how far the current approach can move it, and no further | **6** |
| **none** | shares its subject matter and nothing more | **2** |

Relief tops the scale because a constraint that stops binding is the strongest
thing a paper can do to it. The others sit below it and above zero: knowing a
wall is there, or being able to measure the distance to it, is worth less than
removing the wall and considerably more than nothing. An instrument that scores
only relief cannot see the result that redirects the field without improving it.

- **10** — acts on one of the `pressures` in the dated snapshot, and the benefit
  needs no explanation to anyone in the field.
- **1** — the value requires an argument. Nobody's constraint moved, and nothing
  new is known about any of them.

Name the pressure, by its id in the snapshot. An unnamed pressure is not an
incentive. Every pressure a snapshot admits is major by construction, so the
score measures how directly the creation acts on the one it names — not how
important that pressure is against the others.

**Failure mode:** scoring the *quality* of the work rather than the obviousness of
the need it serves. Elegant work on a constraint nobody is paying to relieve
scores low here, correctly. Capsule networks were interesting; no one's cost fell.

**Second failure mode:** reading "does not relieve" as "does nothing". A paper
that demonstrates a binding constraint the field believed it had handled has
acted on the constraint surface, and the correct answer is `reveals` at a
material score — not `none` because no benchmark improved. Evaluation work that
first makes a constraint measurable is `measures`, not `adjacent`. Ask what the
field must now work on that it did not have to before.

**Counter-check** (from `False Positives · Neural Turing Machines`): a paper that
attacks a famous desired capability *head-on* attracts a **lower** prior, not a
higher one. Relief has historically arrived obliquely.

**Examples — the standing obvious needs**

These are legible to everyone in the field today. A candidate that answers one
scores high here however unoriginal it is; a candidate that answers none scores
low however elegant it is.

| The obvious question | Named in | Status |
|---|---|---|
| Frontier models are closed — can a comparable open-weights model exist? | `Desired Capabilities · 6` | Partly answered by `Canon · DeepSeek-R1` (I² **8**). Demand far from satisfied, and political as well as commercial |
| What is it trained on — and is that true, licensed, or biased? | `Bottlenecks · Data and the Token Supply` | Open. More likely to resolve legally than technically |
| Is there enough energy and silicon to run this at scale? | `Bottlenecks · Compute and Energy` | Binding. Multi-year lead times that do not respond to capital |
| Does it know when it does not know? | `Desired Capabilities · 3` | Open. Highest value per unit of difficulty on the list |
| Can a task be handed over for days, not turns? | `Desired Capabilities · 2` | Open, and the one most likely to attract a premature call |

**Obvious is not opposite.** `Canon · FlashAttention` scores I¹ **2** and I² **8**:
it inverted nothing, and everyone wanted it the day it appeared. That combination
is common, and pricing it correctly is exactly what the multiplication is for.

---

## I³ — Inflection · *is it an outlier?*

Is the approach radically different — an outlier against the distribution of work
in its field, and therefore a potential inflection in the field's trajectory?

**Inflection is the observational manifestation of outlierness, not its
aftermath.** An outlier is what a change of trajectory looks like from the
outside on the day it appears, which is why the observational lens names the law
for the trajectory while the creative lens names it for the artefact. The word
*potential* carries the whole distinction: you are scoring the outlier in front
of you. The consequences that would confirm it belong to the confirmation pass.

Not "is it important." Outlierness is a measure of distance from the pack. The
snapshot's `existingClasses` is that pack, written down: the five to ten classes
of thing the field could already make, every one carrying an instance that
actually shipped. I³ names the closest and says how far past it this lands. Most papers cluster; the ones
that matter are usually visibly off the axis on publication day.

- **10** — no prior system had demonstrated this, and the method is not a variant
  of the standard approach. Genuinely off-distribution.
- **1** — an increment on a well-populated line of work, distinguishable from its
  neighbours only by its numbers.

**Calibrate against the canon before writing a number.** The examples below are
the scale, and they are severe: AlphaFold 2 is a **7**. Before writing 7 or
above, name the canon case the candidate is standing beside and say why it
belongs there. A paper from a weekly digest is almost never one of these — the
normal answer is 2 to 4, and a ledger where a tenth of a year's papers sit at 7
is measuring something other than distance from the pack.

**Inflection measures unprecedented creation, not unprecedented execution
quality.** This is why weak instances still occupy a class in the snapshot. The
2023 agent wave produced nothing that reliably worked and established
`autonomous-agents` all the same — which is exactly what stops a later agent that
finally works from scoring 10 for being the first *good* one. Being much better at
something the field could already make is a 3–6, however large the margin.

**The class boundary is the test for the top two bands.** Having named the closest
class, ask what the creation does to it:

| | |
|---|---|
| **3–6** | It advances the class — a better instance of the same thing |
| **7–8** | It challenges the *boundary* of the class — the class still describes it, but barely |
| **9–10** | The class is *no longer sufficient* to describe what has been created |

A coding tool that suggests better completions advances `code-assistants`, however
good the completions. One that operates autonomously across a whole project for
hours is straining the word "assistant" — the 7–8 case. One where "coding
assistant" has stopped being a description of the thing has established something
the class cannot hold.

**Novelty by conjunction is not distance.** Every paper is a unique combination
of its own components, so "combines A, B, C and D" is a sentence that can be
written about anything and therefore scores nothing. A conjunction is an outlier
only when the combination is what produces the result — when removing any one
part loses the headline claim. A system that assembles components each of which
was already available, into a pipeline that works, is integration: real
engineering, `incremental` distance. If the justification for the score is a
list, the score is wrong.

**Failure mode:** grading consequence instead of distance. "This turned out to
matter enormously" is not an I³ observation — it is a confirmation observation,
and it belongs in the confirmation pass, not the score.

**Examples**

The question reaches past papers: **is this an unprecedented product or
strategy?** An outlier can be architectural, but it can equally be a release
decision, a business model, or a target nobody else was aiming at.

| Outlier in | Case | I³ |
|---|---|---|
| **Objective** | `Canon · GPT-3` — in-context learning was not what it was trained for | **10** |
| **Product** | `Canon · ChatGPT` — a chat surface over a two-year-old model; the packaging had no precedent, the architecture had | **9** |
| **Domain** | `Canon · AlphaFold 2` — a language architecture aimed at a fifty-year biology problem | **7** |
| **Strategy** | `Canon · Stable Diffusion` — open weights while the equivalent capability stayed gated | **7** |

The first is the strongest form: a capability nobody designed for.
Emergent-but-unintended outranks intended-and-achieved, every time.

**Low anchor.** `Canon · Chain-of-Thought` scores **4** — a prompting variant
among a great many prompting variants, small distance from the pack on the day it
appeared, whatever it later enabled.

---

## Scoring

Each law 0–10. `I³ score = I¹ × I² × I³`, range 0–1,000.

**A score is written in three steps, never one.** Select the object out of the
dated snapshot — a baseline claim, a pressure, an existing class. Classify the
relationship on the 0–5 ladder that law carries. Then write the 0–10 score inside
the band that classification opens:

| Level | 0 | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|---|
| **Band** | 0 | 1–2 | 3–4 | 5–6 | 7–8 | **9–10** |

The ladder is a classification, not a second scale. The 0–10 scores and the
anchors below are unchanged by it, and every canon figure in this file sits
inside its own rung's band — which is why the ladder could be adopted without
refitting a single historical score. Choosing a number first and reverse-engineering
a level to fit it is the failure the three steps exist to prevent.

### What a score means

The same scale, read the same way, for all three laws — and it has three tiers:

The boundaries never move; the **names differ by law**, because the laws differ.
I¹ and I³ measure movement of the paradigm. I² measures the **strength of the
incentive** — and a creation can answer the field's most fundamental pressure
without having defined anything.

| Score | I¹ Inversion · I³ Inflection | I² Incentives |
|---|---|---|
| **9–10** | **Paradigm defining** | **Exceptional incentive** |
| **7–8** | **Paradigm questioning** | **Paradigm-level incentive** |
| 5–6 | Workflow improvement | Workflow incentive |
| 3–4 | Minor improvement | Minor incentive |
| 0–2 | No relationship | No relationship |

**0–6 is progress inside the paradigm**, which is what almost all work is,
including work of enormous value. **7–8 claims the creation touched the paradigm.
9–10 claims it changed it** — or, on I², that it answers one of the paradigm's
most fundamental pressures.

So a row reading **I¹ 6 · I² 10 · I³ 6** says something precise and true: an
enormous answer to an enormous need, inside the standing paradigm. There is
deliberately **no overall "this creation is paradigm-defining" verdict** — a 9–10
means paradigm-defining *on that law*, and the product already carries overall
magnitude. A second threshold across the three would be another hand-tuned number
to calibrate before the evidence has asked for one.

> **Do not give 7 or above merely because a creation is important, impressive,
> highly cited, commercially successful, or technically difficult. Scores of 7+
> require a relationship to the paradigm itself.**

That sentence is the single strongest guard against inflation in this file. Every
historical over-score in the ledger has the same shape: the work was important,
and importance was read as paradigm relevance. It is not. A result can be the most
valuable paper of its year and still sit at 5.

Read per law:

| | I¹ Inversion | I² Incentives | I³ Inflection |
|---|---|---|---|
| **0–2** | No inversion | No meaningful pressure relationship | Nothing meaningfully new |
| **3–4** | Minor implementation variation | Small efficiency or convenience gain | Incremental product improvement |
| **5–6** | Meaningful workflow or process inversion | Solves an important workflow bottleneck | New workflow, or substantial improvement to a class |
| **7–8** | Directly questions or tests a core baseline assumption | Attacks or exposes a major paradigm-level pressure | Unprecedented enough to stretch the paradigm's boundaries |
| **9–10** | Overturns or makes a core baseline assumption obsolete | Resolves or reveals a pressure fundamental enough to reshape the paradigm | Introduces a genuinely paradigm-defining product, capability, architecture or approach |

**The scale and the list limit hold each other up.** A 7 means something only
because the snapshot's lists are short: with five to ten entries each, holding
only the most consequential assumptions, pressures and classes, a scorer *cannot*
reach 7 by matching a minor technical detail — there are none in the snapshot. Let
the lists grow to forty objects and a 7 becomes cheap, silently.

**Scope is part of the scale.** A baseline claim is a statement about the field,
so a result demonstrated on one benchmark or one narrow domain questions the claim
only where it was measured — a 5–6, however large the margin. And check what the
result actually beat: a general-purpose model evaluated zero-shot on a specialised
benchmark is a weak baseline, not the frontier defending its claim.

`Canon · FlashAttention` is the case to hold in mind at **I¹ 2, I² 8, I³ 2**: it
computes exactly the same attention, faster. Nothing about the architecture claim
is disturbed and no new class appears — and it attacks a major paradigm-level
pressure head-on. That is not a mixed verdict, it is a precise one.

**This is why the snapshot models no paradigm/within-paradigm distinction.** The
snapshot supplies the historical reference frame and nothing more; the *score*
decides which side of the line a creation falls on. Encoding the distinction in
the frame as well would be two sources of truth for one judgement.

### Score at publication. Confirm later.

The score is a **reading of the artefact** and is available immediately. Whether
the world subsequently reorganised around it is a **separate axis** carried by
`consequenceYear` / `consequenceNote`.

Keeping these apart is what makes the framework usable on the future rather than
only on the past:

- A score assigned at publication and **frozen** is a prediction, and can be graded.
- A score assigned in hindsight is a description, and cannot.

`Signals and Base Rates` puts the lag from artefact to consensus at **9–30 months**.
That lag governs when confirmation arrives. It does not govern when scoring happens.

**Never revise a frozen score because the consequence arrived or failed to.**
Record the outcome on the confirmation axis instead. A high score that never
confirmed is the most informative record the corpus can hold.

### Rationales pending rescore

Several canon entries were scored before these definitions were written down, and
their `inflection` rationales grade consequence rather than distance —
`ChatGPT`, `Stable Diffusion`, `Chinchilla`, `FlashAttention`, `Sparse MoE`.

Some of those numbers will survive a rescore. `Sparse MoE` at I³ **3** and
`FlashAttention` at I³ **4** probably will not: both are graded on how long
deployment took, not on how far off-distribution the method was on publication
day. Until they are revised, calibrate a new candidate against their I¹ and I²
figures rather than their I³.

---

# 2 — The prevailing paradigm

*What a candidate arriving today would have to invert.*

**This section no longer holds a list.** It used to carry nine numbered
assumptions, restated here by hand, and that was a rolling document: it destroyed
its own history on every review, so nothing could be scored against it
retrospectively, and it silently mis-scored every candidate whenever it went
stale.

The paradigm now lives in **dated snapshots** under `context/ai/paradigm/`, one
file per date, each written only from evidence published on or before its own
date. A candidate is judged against the newest snapshot standing *strictly
before* its publication month — never a later one, and never one that already
names it.

Each snapshot holds exactly three collections, one per law, and nothing else.
Each targets **five to ten entries**, and each has a one-line admission test:

| Collection | Law | Admission test | The comparison |
|---|---|---|---|
| `baseline` | I¹ | *Does this define how the field works?* | Which structural truth does this move? |
| `pressures` | I² | *Does this define what the field wants solved?* | Which constraint does this act on? |
| `existingClasses` | I³ | *Does this define what the field can already make?* | Which class is closest, and how far past it does this land? |

> **If a list exceeds ten, combine or remove detail until only the
> paradigm-defining categories remain.**

Combining is usually the right move. "NVIDIA is the default accelerator" is a
*manifestation* of "frontier capability requires massive centralised compute", not
a second structural truth; pretraining, scaling and preference alignment are one
claim about where capability comes from, not three.

`existingClasses` holds **classes, not techniques**. The first draft of the
December 2023 list ran to nineteen entries with DPO, process supervision,
inference kernels and parameter-efficient fine-tuning sitting beside "closed
frontier APIs" — which is what happens with no admission rule: it stopped being a
paradigm and became an index of the field. Those techniques still matter when
reading a particular creation; they do not define what exists.

A whole snapshot is therefore **twenty to thirty objects** — small enough to hold
in one view, which is the point. Every entry carries dated evidence, and every
class carries an instance that shipped on or before the snapshot date.

**Nothing in a snapshot is weighted.** There are no importance scores. Significance
is decided by *membership*, and the list limit is what keeps membership a real
filter.

Tags on snapshot entries (`compute`, `architecture`, `training`, `data`,
`interface`, `economics`) are filing for the interface and have **zero effect on
scoring**.

### Known gap in this frame

**The canon ends at January 2025** (`Canon · DeepSeek-R1`). Nothing between then
and this review date has been scored or added. Any candidate whose inversion
target is an assumption formed *after* Jan 2025 cannot currently be scored
correctly, and closing that gap is the known weakness of every verdict issued
until it is.

**Snapshot coverage is currently December 2023 only** (8 baseline claims, 8
pressures, 8 existing classes). The 2024 and 2025
snapshots are held in `context/ai/paradigm/legacy/` in the retired layer schema
and are not loadable: scoring is available for papers published after December
2023 and before the next authored snapshot, and refused elsewhere rather than run
against nothing. Converting them is gated on the 2024 backtest.

---

# 3 — The corpus

| Folder | What it is | How to use it |
|---|---|---|
| `Canon` | Resolved cases that confirmed | Calibrate the top of the scale |
| `False Positives` | Resolved cases that did not | Counter-calibrate; the more useful half |
| `Paradigm` | Dated snapshots — baseline, pressures, prior art | Score all three laws against the one standing at publication |
| `Bottlenecks` | The live constraint surface, as essays | Background reading. **Not** the I² list — that is the snapshot's `pressures` |
| `Method` | Procedure | How to run a candidate through |

The corpus is not a reading list. It is a set of resolved cases used to calibrate
judgement on unresolved ones. It is calibration, not scripture: a candidate that
fits no case in the corpus is not thereby noise.

**Use the false positives at least as hard as the canon.** Every entry there was
defensible at the time.

---

# Order of operations

1. Load the snapshot standing strictly before the candidate's publication month.
2. For each law, select the object, classify the level, then score inside its band.
   Which baseline claim does it contradict? If none, I¹ is 0 and the rest usually
   follows.
3. Score I¹, I², I³ independently, each on the artefact alone. Do not let one
   score justify another — that defeats the multiplication. Three identical levels
   is usually one judgement copied across.
4. Multiply. Read the band.
5. **Freeze the score with its date.** It is now a prediction.
6. Pre-register the confirmation: the observable that would settle it, and roughly
   when. `Signals and Base Rates` gives the window.
7. Do not issue a verdict the evidence does not support. `latent` — real inversion,
   consequence not yet surfaced — is a complete answer and is preferred to a
   forced call.

Kyros tolerates false negatives more readily than false positives. An honest
"not yet resolvable, and here is what would resolve it" is a finished answer.
