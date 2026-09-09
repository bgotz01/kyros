# The Standing Frame

**Last reviewed: 2026-09-08.** This file is the frame every candidate is judged
against. It is not attached by choice — it is always present. Everything else in
the corpus is evidence; this is the instrument.

Three parts:

1. **The laws** — what is being measured.
2. **The prevailing paradigm** — what a candidate would have to invert.
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

**This law cannot be scored without §2 of this file.** "Opposite" is meaningless
until the prevailing assumption is written down.

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

- **10** — relieves a constraint in `Bottlenecks/` that is marked binding, or
  serves a numbered item in `Bottlenecks · Desired Capabilities`, and the benefit
  needs no explanation to anyone in the field.
- **1** — the value requires an argument. Nobody's constraint moved, and nothing
  new is known about any of them.

Name the bottleneck. An unnamed bottleneck is not an incentive.

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

Not "is it important." Outlierness is a measure of distance from the pack. Read
the last two years of work on the same problem and ask where this sits. Most
papers cluster; the ones that matter are usually visibly off the axis on
publication day.

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

| Score | Band |
|---|---|
| 900+ | Historical outlier |
| 600+ | Exceptional inflection |
| 300+ | Paradigm-defining |
| 100+ | Structural shift |
| 27+ | Significant contribution |
| 1+ | Enabling contribution |

**The bands are provisional calibration; the mathematics is not.** The product is
the score. The bands are a reading aid fitted to eighteen canon entries, several
of which are pending rescore, and they should be re-fitted as the ledger grows.
Never adjust a law's score to land a candidate in a band.

Multiplication encodes a structural claim: **a paradigm-defining development
requires convergence across all three.** Radically novel but not obvious, or
obvious but not opposite, collapses toward zero — correctly. The Transformer is a
statistical freak because it scored 10 × 10 × 10.

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

*What a candidate arriving today would have to invert.* I¹ is unscoreable without
this list, and this list decays. Re-date it on review; a stale frame silently
mis-scores every candidate after it.

Each assumption below is **currently load-bearing** in the field. The sources are
this corpus's own bottleneck files.

1. **Capability follows compute and data at predictable exponents.**
   `Canon · Scaling Laws`, `Canon · Chinchilla`. Partially inverted already by
   `Canon · Test-Time Compute` — inference is now a second scaling axis — but the
   underlying belief that spend converts to capability is intact and is what the
   current capital cycle is built on.

2. **Reasoning gains transfer from verifiable to judgement domains.**
   Named in `Bottlenecks · Reliability and Verification` as *the most important
   open question in the field*, assumed by a large share of current investment,
   and **not yet evidenced**. The single highest-value assumption to watch: a
   credible inversion here reprices the sector.

3. **Weights are frozen at training; learning happens in the context window.**
   `Bottlenecks · Memory and Continual Learning` — binding, unsolved, oldest open
   problem in the corpus.

4. **The binding constraint is industrial, not algorithmic.**
   Fabrication, advanced packaging, grid interconnection, cooling. Multi-year lead
   times that do not respond to capital on a software timescale
   (`Bottlenecks · Compute and Energy`). Historically the fastest relief valve has
   been order-of-magnitude efficiency, not new supply.

5. **Efficiency gains increase total consumption.** The Jevons branch has been the
   empirical norm. Any candidate cutting inference cost must be modelled on both
   branches — this was the central analytical question of the DeepSeek-R1 market
   reaction.

6. **Autonomous horizon is limited by arithmetic, not intelligence.**
   95% per-step over twenty steps is ~36% end-to-end. This killed
   `False Positives · The AutoGPT Wave` and still governs.

7. **What limits deployment is permission, not capability.**
   `Bottlenecks · Agency` — audit trails, liability, insurance and delegated
   authority move on a slower clock than the technology, and the *capable /
   permitted* gap is widening.

8. **High-quality training text is finite and access is closing.**
   `Bottlenecks · Data` — the resolution here is more likely legal than technical.

9. **Deployment economics are set by where verification effort lands.**
   If a human must check everything carefully, the labour saved is small and
   sometimes negative.

### Known gap in this frame

**The canon ends at January 2025** (`Canon · DeepSeek-R1`). Nothing between then
and this review date has been scored or added. Any candidate whose inversion
target is an assumption formed *after* Jan 2025 cannot currently be scored
correctly against this list. Closing that gap is prerequisite to running the
frame forward, and it is the known weakness of every verdict issued until it is.

---

# 3 — The corpus

| Folder | What it is | How to use it |
|---|---|---|
| `Canon` | Resolved cases that confirmed | Calibrate the top of the scale |
| `False Positives` | Resolved cases that did not | Counter-calibrate; the more useful half |
| `Bottlenecks` | The live constraint surface, status-tagged | Score I² against it |
| `Bottlenecks · Desired Capabilities` | The demand side | Which numbered item does the candidate advance? |
| `Method` | Procedure | How to run a candidate through |

The corpus is not a reading list. It is a set of resolved cases used to calibrate
judgement on unresolved ones. It is calibration, not scripture: a candidate that
fits no case in the corpus is not thereby noise.

**Use the false positives at least as hard as the canon.** Every entry there was
defensible at the time.

---

# Order of operations

1. Locate the candidate against §2. Which assumption does it contradict? If none,
   I¹ is low and the rest usually follows.
2. Score I¹, I², I³ independently, each on the artefact alone. Do not let one
   score justify another — that defeats the multiplication.
3. Multiply. Read the band.
4. **Freeze the score with its date.** It is now a prediction.
5. Pre-register the confirmation: the observable that would settle it, and roughly
   when. `Signals and Base Rates` gives the window.
6. Do not issue a verdict the evidence does not support. `latent` — real inversion,
   consequence not yet surfaced — is a complete answer and is preferred to a
   forced call.

Kyros tolerates false negatives more readily than false positives. An honest
"not yet resolvable, and here is what would resolve it" is a finished answer.
