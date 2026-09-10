# The Engine

How a paper becomes a score, and which file decides what.

`IDEA.md` is the vision and `STYLE.md` is the interface. This is the machine: the
part of Kyros that reads one artefact and returns one comparable row.

---

## 1 — What it does

Every score is **three comparisons**, each against one collection in a dated
historical snapshot. Nothing else.

| Law | Compared against | The question | The selection |
|---|---|---|---|
| **I¹** Inversion | `baseline` | What did it reverse? | the claim it moves **furthest** |
| **I²** Incentives | `pressures` | Why was there a reason for it to exist? | the pressure it acts on most **directly** |
| **I³** Inflection | `existingClasses` | What had not meaningfully existed? | the **closest** class |

The selection verb differs by law, and that difference *is* the definition of the
law. I¹ and I² look for the entry the creation moves most; I³ looks for the
nearest thing that already existed, because the distance from it is the measure.

Each law is then scored in three steps, always in this order:

```
SELECT     name an id from that law's collection
CLASSIFY   place the creation on the 0–5 ladder
SCORE      write a 0–10 score inside the band that rung opened
```

Choosing a number first and reverse-engineering a level to fit is the failure the
order exists to prevent. A score outside its band is clamped and the clamp is
recorded, so a level 2 with a 9 is stored as the contradiction it is.

**The scale means something specific.**

```
0–6    progress WITHIN the paradigm
7–8    INTERACTION with the paradigm
9–10   DEFINITION of the paradigm
```

Boundaries never move; the names differ by law, because I¹ and I³ measure
movement of the paradigm while I² measures the strength of an incentive. A row
reading `I¹ 6 · I² 10 · I³ 6` is precise and true: an enormous answer to an
enormous need, inside the standing paradigm. There is deliberately **no combined
"this creation is paradigm-defining" verdict** — a 9–10 means paradigm-defining
*on that law*, and the product carries overall magnitude.

The three laws multiply. They are supposed to disagree — and one disagreement is
so common it is worth naming. **While a baseline claim stands, every creation that
contradicts it scores high on I¹, the tenth as much as the first.** The tenth then
scores low on I³, because by then the class is crowded. High I¹ with low I³ is the
normal shape of a creation arriving into a crowded direction, not an error. Using
prior art to argue I¹ down collapses the two laws into one.

---

## 2 — Where everything lives

```
lib/engine/          paradigm.ts  paradigmStore.ts  prompts.ts
                     scoring.ts   store.ts  data.ts  routes.ts  external.ts
app/engine/          page.tsx · ai/ (page, EngineAI, three hooks) · components/ (21)
app/api/engine/      analyze · critique · external · runs · weeks · notes
                     paradigm · guide · aside · usage
context/ai/          frame.md · paradigm/*.json · canon/ · false-positives/
scripts/             backtest.ts · score.ts
```

Two things cannot move: `app/api/engine/**/route.ts` and `app/engine/**/page.tsx`
are the Next.js router, and their paths are their URLs.

---

## 3 — The four files that decide a score

| File | Decides |
|---|---|
| `context/ai/paradigm/YYYY-MM.json` | The 24 objects a creation is measured **against** |
| `lib/engine/paradigm.ts` | The vocabulary and the arithmetic — bands, ladder, actions, clamping |
| `lib/engine/prompts.ts` | What the model is **told** — procedure and reasoning discipline |
| `context/ai/frame.md` §1 | The law definitions and the canon anchors |

Change a baseline claim in the JSON and every I¹ in the ledger moves. Change
`LEVEL_BAND` in `lib/engine/paradigm.ts` and the meaning of every stored number
moves.

### What actually reaches the model

Measured on a real call:

```
frame.md §1 (the laws)      20,227 chars   44%
ENGINE_SYSTEM (procedure)   22,944 chars   50%
rendered snapshot            3,050 chars    6%
                            ──────────────
                            46,225 chars
```

**The snapshot is 6% of what the model reads** — the most load-bearing input and
by far the smallest. The other 94% is instruction. That ratio is worth
remembering when a score looks wrong: it is far more often the instruction than
the snapshot.

### Three more that shape the result

| File | Role |
|---|---|
| `lib/engine/scoring.ts` | `buildScore` — **enforces** SELECT → CLASSIFY → SCORE. The model can say anything; this decides what is recorded. |
| `lib/engine/paradigmStore.ts` | Which snapshot a paper is judged against, and the list-limit warnings. |
| `lib/engine/store.ts` | `effectiveScore` — re-clamps after an accepted critic correction. |

Everything else is I/O or presentation. `app/api/engine/analyze/route.ts` is 215
lines of calling a model and writing a row; it makes no scoring decision at all.

---

## 4 — Where to make a change

| You want to change… | Edit |
|---|---|
| What the field looked like on a date | the snapshot JSON |
| What a score *means* | `lib/engine/paradigm.ts` |
| How the scorer should *reason* | `lib/engine/prompts.ts` |
| What the instrument *permits* | `lib/engine/scoring.ts` |
| What a reader sees | `app/engine/components/*` |

`lib/engine/paradigm.ts` is the single source of truth for the scoring vocabulary. The
prompt prints its tables, the route enforces them, the guide modal renders them
and the API serves them — all from the same constants. Change `LEVEL_RUBRIC` and
every one of those follows automatically. The previous instrument kept its
ceilings in two places and they drifted; that is why this rule exists.

### The one drift risk

`context/ai/frame.md` §1 is prose. It restates the laws, the bands and the canon
anchors, and **nothing enforces its agreement with the code**. It is 44% of the
prompt. After changing a ladder or a band in `lib/engine/paradigm.ts`, read §1 and check it
still says the same thing.

---

## 5 — The snapshot

A dated historical reference frame, written only from evidence published on or
before its own date. That is the whole reason a backtest means anything.

Three collections, **five to ten entries each**, one admission test apiece:

| Collection | Admission test |
|---|---|
| `baseline` | Does this define **how the field works**? |
| `pressures` | Does this define **what the field wants solved**? |
| `existingClasses` | Does this define **what the field can already make**? |

> If a list exceeds ten, combine or remove detail until only the
> paradigm-defining categories remain.

The limit is not tidiness. **The scale and the list length hold each other up**:
7–8 means "interacts with the paradigm", and that is only a real threshold if the
lists contain nothing minor to match against. Let a list grow to forty objects
and a 7 becomes cheap, silently. `lib/engine/paradigmStore.ts` warns on load when a list
passes ten.

Nothing is weighted. There are no importance scores — **membership is the
judgement**, made once when the snapshot is authored. `existingClasses` holds
classes, not techniques: DPO and parameter-efficient fine-tuning are how things
are made, not things the field can make.

Every entry carries dated evidence; every class carries an instance that shipped
on or before `asOf`. Weak instances belong — the 2023 agent wave produced nothing
that worked and established `autonomous-agents` all the same, which is what stops
a later agent scoring 10 for being the first *good* one.

### Which snapshot a paper gets

The newest snapshot standing **strictly before** the paper's publication month —
never one that already names it.

**Cadence is the live constraint.** With annual snapshots a December 2024 paper is
judged against December 2023 — twelve months stale, against a paradigm the year
had already eroded. The loader takes any `YYYY-MM`, so cadence is purely an
authoring question, and at 24 objects a snapshot is cheap enough to write
quarterly. Quarterly puts the worst case at three months rather than twelve.

A snapshot that moves is not a problem for comparability, it is the point: as
`closed-frontier` softens across a year of open-weight releases, the same kind of
creation correctly scores lower on I¹ later in the year. That is the instrument
tracking a paradigm actually shifting. If no converted snapshot covers the period, scoring is **refused** with a
409 rather than run against nothing.

Snapshots still in the retired layer/bottleneck schema live in
`context/ai/paradigm/legacy/` and are invisible to the loader.

---

## 6 — The seats

Three models, each with one job.

**Analyst** (`ENGINE_SYSTEM`) reads a paper and returns one row.
**Critic** (`CRITIC_SYSTEM`) reads the same paper *and* the analyst's row, and
objects only where it can name the error and the correction. It carries the
edge-case policing deliberately, so the analyst prompt can stay close to the
three questions.
**External** (`EXTERNAL_SYSTEM`) sorts a paper's repository links, telling its own
artefact from the ones it merely cites.

A stored score is **never edited**. A critic's accepted correction is recorded on
its own note and layered at read time by `effectiveScore`, so both the original
prediction and the correction survive. A frozen score is the only thing that can
later be graded.

---

## 7 — Running it

```bash
npm run score -- 2411.02337          # one paper, printed, nothing stored
npm run backtest -- --n 40           # a sample against the snapshot, nothing stored
```

Neither writes to the database. A backtest is an instrument check, not a reading;
filling the ledger with rows scored to answer a question about the rubric would
destroy the thing the ledger is for. Output lands in `backtest/` (gitignored).

The report answers the questions a calibration pass actually needs: does the
instrument still spread, do the laws stay independent, is the model selecting
real ids, does the ladder bind, and how often does the 9–10 band fire. The last
one should be **rare** — a digest where paradigm-defining fires often is not
measuring it.

---

## 8 — Reading a row in the interface

**Paradigm snapshot** shows what a creation was measured against.
**Scoring guide** shows how the measuring is done — the scale, the ladder, and
the literal prompts each seat was given. Its rules tab is served from
`lib/engine/paradigm.ts`, so it cannot drift from the instrument.
**How this score was reached** (the ⚖ on a card) shows the three objects that row
selected and which end of which band moved the number.
