# Candidate Template

Every candidate is scored into this shape. The fields are fixed so that fifty
candidates are comparable to each other and to the canon — a free-form writeup is
not a record, and a ledger of free-form writeups cannot be calibrated.

Copy the block below into `context/ai/candidates/<slug>.md`, or scaffold it with
`npm run candidate <arxiv-id>`.

---

## The order is the method

Four steps, and they run in this order because each one is the **subject** of the
next:

```
1  Summary      What is it?              — mechanism only, no judgement
2  Inversion    What does it invert?     — I¹   ← names the subject
3  Incentive    Who wants THAT?          — I²   ← about the §2 inversion
4  Outlier      Has THAT been done?      — I³   ← about the §2 inversion
```

**Chained subject, independent scores.** Steps 3 and 4 are about the specific
inversion named in step 2 — that is what stops I² drifting into "is this field
important" and I³ into "is this paper famous". But the three numbers stay
independent: a large I¹ is never a reason to raise I². The multiplication exists
precisely to punish a large inversion that nobody wants, and a wanted improvement
that inverts nothing.

Fill 1 and 2 before writing any number. A candidate that cannot be located has
already answered the question.

---

## Step 1 — Summary

Mechanism, not marketing. Three to five sentences: what it does, how it works,
what it reports. **No significance claim.** If the summary contains the words
"breakthrough", "paradigm" or "revolutionise", it is describing the abstract's
rhetoric rather than the artefact.

Establish the primary artefact here. Paper, weights, code, or a reproducible
result. A press release is not an artefact, and a digest entry is a pointer to
one, not the thing itself.

---

## Step 2 — Inversion · I¹

**Every paper offers something different, or it would not have been written.**
The question is never whether there is an inversion — it is how large the
inversion is, and at what level of the stack it lands.

State it mechanically:

```
Inverts:  <held necessary>  →  <shown optional>
```

Then locate it. Inversions land at a level, and naming the level keeps the claim
honest — "improves reasoning" is not locatable, "removes the KV cache" is.

| Level | What lives there |
|---|---|
| **Representation** | Tokens, tokenization, embeddings, positional encoding |
| **Model architecture** | Transformers, attention, Q/K/V, MLP, residuals, normalization, MoE |
| **Training** | Pretraining, loss, backprop, optimizers, SFT, RLHF/RL, distillation |
| **Inference** | Autoregression, logits, sampling, KV cache, GQA, quantization, test-time compute |
| **AI systems** | RAG, tools, agents, memory, multimodality |

### Magnitude

| Score | | |
|---|---|---|
| **1–3** | **Local** | Inverts a technique inside one subsystem. The subsystem's own assumptions survive intact. Most papers live here, and that is not a criticism. |
| **4–6** | **Subsystem** | Inverts how a whole stage is done. Neighbouring levels carry on unchanged. |
| **7–8** | **Stack** | Inverts something several levels were built on. Other levels have to move in response. |
| **9–10** | **Paradigm** | Negates an item on the frame's §2 list. The prior approach becomes obsolete rather than outperformed. |

If the `Inverts:` line cannot be written at all, say so and score 0–1. That is a
finding, not a failure — record it and move on.

**Failure mode:** a new *result* read as a new *constraint structure*.

---

## Step 3 — Incentive · I²

**Is there incentive for *this* inversion?** The subject is what step 2 named, not
the field it sits in. An inversion nobody is paid to carry stays a curiosity
however elegant it is.

Run the named inversion against the constraint surface:

- Which entry in `Bottlenecks/` does it relieve, and is that entry marked binding?
- Which item in `Desired Capabilities` (1–8) does it advance?
- Whose cost falls, and by what factor?
- Would anyone in the field need the value explained?

Maps to nothing binding and no desired capability → I² is low, whatever step 2
scored.

**Counter-check:** a head-on attack on a famous desired capability earns a
*lower* prior, not a higher one. Relief has historically arrived obliquely.

**Failure mode:** grading the craft instead of the need. Good work on a
constraint nobody is paying to relieve scores low here, correctly.

---

## Step 4 — Outlier · I³

**Has this inversion been done before, and does it change the game?** Again the
subject is step 2's inversion, not the paper's reputation.

- What is the standard approach to this problem, and how far off it is this?
- Had any prior system demonstrated this inversion at all?
- Outlier in what — objective, product, domain, or strategy?
- If it changes the game, **name the game.** An unnamed game is not a claim.
- What would have to be true for this to be ordinary?

**Failure mode:** grading consequence instead of distance. If the rationale
contains a date later than the publication date, the confirmation pass has leaked
into the score.

---

# The template

```markdown
# <Title>

Source:     arXiv:XXXX.XXXXX | <url>
Authors:    <lab, or first author et al.>
Published:  YYYY-MM-DD
Ingested:   YYYY-MM-DD
Scored:     YYYY-MM-DD  — frozen
Frame:      YYYY-MM-DD  — §2 version scored against

## 1 · Summary — what is it?

<Three to five sentences. Mechanism, not marketing. No significance claim.>

Primary artefact:  paper | weights | code | reproducible result | none
Open:              weights / code / neither
Reproduced by:     <lab, or "not yet">

## 2 · Inversion — what does it invert?

Inverts:     <held necessary>  →  <shown optional>
Level:       Representation | Model architecture | Training | Inference | AI systems
Magnitude:   local | subsystem | stack | paradigm
Assumption:  <which §2 prevailing-paradigm item it contradicts — or "none on the
             list; local inversion only">

<Rationale. What did practitioners believe was required that this shows is not?
What was expensive that is now cheap, and by what factor? Which incumbent
advantage stops being an advantage?>

I¹: N/10

## 3 · Incentive — is there incentive for this inversion?

Bottleneck:  <which Bottlenecks/ entry, and its status> — or "none"
Capability:  <which Desired Capabilities item, 1–8> — or "none"
Cost falls:  <for whom, by what factor>

<Rationale. Would anyone in the field need the value explained? Apply the
counter-check.>

I²: N/10

## 4 · Outlier — is this inversion unprecedented?

Standard approach:  <what the pack does on this problem>
Distance:           <how far off it this is>
Outlier in:         objective | product | domain | strategy | none
Changes the game:   <name the game — or "no">

<Rationale. Had any prior system demonstrated this? What would have to be true
for this to be ordinary?>

I³: N/10

## 5 · Reading

I³ score:    N × N × N = NNN  (<band>)
Verdict:     inflection | latent | noise
Confidence:  low | moderate | high
Resolves by: <third-party checkable observable>
Due:         YYYY-MM  — <9–30 months out; pick from the closest canon analogue>

## 6 · Confirmation log

Append only. Never edit sections 2–5 after `Scored:`.

- YYYY-MM-DD — <what was checked, what was found, resolver open/confirmed/failed>
```
