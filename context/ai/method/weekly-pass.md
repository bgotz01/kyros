# The Weekly Pass

The standing procedure. Runs once a week and takes about ninety minutes. Two
passes run in the same sitting and must not be confused with each other:

- **Scoring** — new candidates, scored on the artefact, frozen.
- **Confirmation** — old candidates whose resolver has come due.

The confirmation pass is the one that produces a track record, and it is the one
that gets skipped. Run it first, so a long scoring queue cannot crowd it out.

---

## 0 · During the week — collect, do not judge

Drop everything into `papers/inbox/`. Links, PDFs, screenshots. No filtering, no
reading, no opinion. Collection and judgement in the same motion is how a reading
list turns into a conviction.

Nothing in `papers/` is read by the council. It is a pile. The year digests in
`papers/digests/` are an index into the pile — never evidence, and never scored
from directly.

---

## 1 · Confirmation sweep · ~20 min

```bash
npm run due
```

Lists every candidate in the ledger whose `Due:` has passed and whose resolver is
still open. For each one, run the confirmation questions from
`Method · Running I³ on an AI Paper`:

- Has anyone outside the originating lab reproduced it?
- Whose cost actually fell, and by what factor?
- What did practitioners build differently in the 90 days after?
- **Did the pre-registered observable fire?**

Then append one line to section 6. **Do not touch sections 2–5.**

| Outcome | Action |
|---|---|
| Resolver fired | Append `confirmed`. Candidate is eligible for promotion to `Canon`. |
| Resolver failed | Append `failed`. Move the file to `context/ai/false-positives/`, score intact. |
| Ambiguous | Append `inconclusive`, set a new `Due:` — **once**. A resolver that needs a third extension was a bad resolver; say so in the log. |

A high score that never confirmed is the most valuable row in the ledger. It is
how the instrument gets calibrated. Do not quietly delete it.

---

## 2 · Gate · ~15 min

Empty the inbox. Three mechanical questions per item, no reading beyond the
abstract:

1. **Is there a primary artefact?** Paper, weights, code, or a reproducible
   result. No artefact → drop. This kills rumour cycles, which generate enormous
   interpretive activity around nothing checkable. A digest entry is a pointer to
   an artefact, not the artefact — follow the link.
2. **Does it name a constraint?** Which entry in `Bottlenecks/`, or which item in
   `Desired Capabilities`? Relieves neither → drop.
3. **Order of magnitude, or percentage?** A percentage claim is not automatically
   dropped, but it starts at a low prior.

**The gate does not score, and it does not ask "is this significant?"** That
question, asked weekly, always produces an answer. Expect to drop the large
majority. A week with zero survivors is a normal week, not a failed pass.

Log the counts — how many in, how many out. Without the funnel numbers you cannot
tell whether the gate is calibrated or merely strict.

---

## 3 · Scaffold · ~5 min

```bash
npm run pull                  # the oldest week not yet held
npm run week 2025 "January 6" # read it as a gate worksheet
npm run candidate 2501.04519  # scaffold a record for a survivor
```

Pulling the week up front is fine — it is ten papers. What must not expand is
what reaches the council.

Writes `context/ai/candidates/<slug>.md` from `Method · Candidate Template`, with
title, authors and publication date filled in and every scoring field blank.

No arXiv id — a lab blog post, a model card, a product launch — copy the template
by hand. The template is the contract; the script is a convenience.

Then file the source under `papers/archive/<publication year>/`, keyed on the
arXiv id prefix — `2412.*` is 2024 even when it surfaces in a 2025 digest.

---

## 4 · Summarise and invert · ~10 min per candidate

Fill **sections 1 and 2 before any number is written.**

First the summary: mechanism, not marketing, no significance claim. Then the
inversion, stated mechanically as `A → not-A`, located at a stack level and sized
against the magnitude scale.

Every paper offers something different or it would not have been written, so the
question is never *whether* — it is *how large*, and most land at `local`. That is
the normal answer, not a failed one.

If the `Inverts:` line cannot be written at all, stop here. Write `Verdict: noise`
with one line of reasoning and file it. Stopping early is a valid outcome and
costs nothing; manufacturing a reading costs the ledger its calibration.

Pull the text first — `npm run fetch <id>` writes the paper's `.md` into
`papers/archive/<year>/`, working from the id alone. No download required. **Read the abstract and method section, not the whole file.**
Full text only when the inversion claim is contested or the numbers matter.

---

## 5 · Council · ~20 min per candidate

Open the council in **Cascade** — each seat reads the ones before it, which is
what forces the three laws to argue rather than agree. Parallel loses the
cross-examination.

Attach, in this order:

- `Method · Candidate Template` — the shape of the answer
- `Bottlenecks · <the one the inversion lands on>` — the I² anchor
- The closest **canon** analogue, and the closest **false positive**

The standing frame is always present and never needs attaching.

Paste the candidate's sections 1–2 as the opening message — the summary and the
named inversion. Those are the **subject** of everything that follows: seat two
asks who wants *that inversion*, seat three asks whether *that inversion* is
unprecedented. Neither is asked whether the field is important.

Let the seats fill sections 2, 3 and 4 in order. Agent Three closes with the
reading block.

Argue with them. The council is an instrument, not an oracle: where a seat has
graded consequence instead of the artefact, say so and make it re-answer. That
correction is the single highest-value thing in the sitting.

Save the session. It is the audit trail for the score.

---

## 6 · Freeze · ~5 min per candidate

Write section 5 — the Reading. Set `Scored:` to today and `Frame:` to the frame's current
`Last reviewed` date.

Pre-register the resolver before you look at the score. Third-party checkable and
dated:

> *A second lab reproduces this at comparable cost by Q3 2027.*
> *Inference cost per token for this class falls below $X by mid-2027.*

Not:

> *~~The field increasingly recognises its importance.~~*

Then commit. **Git is the freeze mechanism** — the ledger is append-only because
the history is. A later edit to sections 2–5 shows up in the diff as exactly what
it is.

```bash
git add context/ai/candidates papers/
git commit -m "week of YYYY-MM-DD: N scored, M confirmed"
```

PDFs are committed as the archive of record. If the repo grows uncomfortable,
move `papers/archive/` behind LFS rather than deleting sources — a score whose
artefact has vanished cannot be audited.

---

## 7 · Promotion — not weekly

A confirmed candidate becomes canon: a file in `context/ai/canon/` and an entry in
`lib/i3Data.ts`, carrying **the frozen score, not a fresh one.** Rescoring on
promotion destroys the prediction and turns the timeline back into a description
of the past.

Do this deliberately and rarely. Most weeks promote nothing.

---

## What this costs when it is working

| | |
|---|---|
| Inbox per week | 20–60 items collected |
| Through the gate | 0–5 |
| Scored | 0–3 |
| Promoted to canon | a few per year |
| Sitting | ~90 min |

The failure mode is not missing a week. It is scoring twelve candidates in a week
because the week felt busy. The gate exists to keep the council's attention
scarce.
