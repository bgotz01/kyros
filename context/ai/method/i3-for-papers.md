# Running I³ on an AI Paper

The procedure. The definitions live in the **Standing Frame** — this file does not
restate them, it sequences them.

The corpus is not a reading list. It is a set of resolved cases used to calibrate
judgement on unresolved ones.

---

## Before you start: two passes, not one

| | Scoring pass | Confirmation pass |
|---|---|---|
| **When** | Publication day | 9–30 months later |
| **Reads** | The artefact | The world |
| **Asks** | Opposite? Obvious? Outlier? | Did the consequence arrive? |
| **Produces** | A frozen I³ score | `consequenceYear` / `consequenceNote` |

Everything below is the scoring pass unless marked otherwise. **Do not import
confirmation questions into it.** "Did anyone adopt this" is unanswerable on
publication day and its absence is not evidence against a candidate.

---

## Step 0 — Locate it

Read §2 of the Standing Frame. Which prevailing assumption does this candidate
contradict?

If none — no assumption on the list is threatened — I¹ is low, and in almost every
case the other two follow. Say so and stop early rather than manufacturing a
reading. Stopping early is a valid outcome and costs nothing.

---

## Step 1 — I¹ · Is it the opposite?

- What did practitioners believe was necessary that this shows is not?
- What was expensive that is now cheap, and by what factor?
- Which incumbent advantage stops being an advantage?

One sentence naming the inverted assumption, then elaborate. No sentence, no
inversion.

**Failure mode:** a new *result* read as a new *constraint structure*. Most SOTA
papers move a number inside an unchanged paradigm.

---

## Step 2 — I² · Is it obvious?

- Which entry in `Bottlenecks/` does it relieve, and is that entry marked binding?
- Which numbered item in `Bottlenecks · Desired Capabilities` does it advance?
- Whose cost falls, and by what factor?
- Would anyone in the field need the value explained?

**Counter-check:** a head-on attack on a famous desired capability earns a *lower*
prior. See `False Positives · Neural Turing Machines`.

**Failure mode:** grading the craft instead of the need. `Capsule Networks` was
good work. Nobody's cost fell.

---

## Step 3 — I³ · Is it an outlier?

- What is the standard approach to this problem, and how far off it is this?
- Variant of the pack, or genuinely off-distribution?
- Had any prior system demonstrated this at all?
- What would have to be true for this to be ordinary?

**Failure mode:** grading consequence instead of distance. If your rationale
contains a date later than the publication date, you have left the scoring pass.

---

## Step 4 — Multiply and freeze

`I¹ × I² × I³`. Read the band from the Standing Frame.

Score each law independently before multiplying. Do not let a high I¹ pull I² up —
that defeats the multiplication, which exists precisely to punish the candidate
that is strong on one axis and weak on another.

Then **freeze it with its date.** It is now a prediction and will be graded.

---

## Step 5 — Pre-register the confirmation

Name the observable that would settle it, and roughly when. Without this the
candidate cannot be re-checked and the ledger becomes a list of things that once
seemed interesting.

`Signals and Base Rates` gives the window: **9–30 months** from artefact to
consensus. Use the closest analogue in the canon to pick the date.

Good resolvers are checkable by a third party and dated:

> *A second lab reproduces the result at comparable cost by Q3 2027.*
> *Inference cost per token for this class falls below $X by mid-2027.*
> *Frontier labs ship this in a production system within 18 months.*

Bad resolvers are unfalsifiable:

> *~~The field increasingly recognises its importance.~~*

---

## Output format

```
I³ score:    I¹ x I² x I³ = <product>  (<band>)
Scored:      <YYYY-MM-DD>  — frozen
Verdict:     inflection | latent | noise
Confidence:  low | moderate | high
Resolves by: <observable, and roughly when>
```

`latent` — a real inversion whose consequence has not surfaced — is the
transformer between June 2017 and mid-2018. It is the most valuable verdict Kyros
can issue and the easiest to get wrong. Use it when I¹ and I² are both clearly
satisfied and only the timing is open.

---

## The confirmation pass

*Run on open candidates, not on new ones.* This is where the adoption questions
belong, and it is the pass that turns a score into a track record.

- Has anyone outside the originating lab reproduced it?
- Whose cost actually fell, and by what factor?
- Are the weights or code public? Open artefacts become ecosystems within months;
  closed ones become a product and a moat.
- What did practitioners build differently in the 90 days after?
- Who was structurally opposed, and did they succeed in absorbing it?
- Did the pre-registered observable fire?

Record the outcome on the confirmation axis. **Do not move the frozen score.** A
high score that never confirmed is the most informative record the corpus holds —
it is how the instrument gets calibrated. Overwriting it destroys the only
evidence that the framework works or does not.

A candidate whose resolver fired negative moves to `False Positives/`, with its
original score intact.

**Failure mode of this pass:** the premature call. Being directionally right and
temporally wrong is indistinguishable from being wrong, for years. See
`False Positives · Autonomous Driving Timelines` and `False Positives · AutoGPT Wave`.
