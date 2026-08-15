# Data and the Token Supply

**Status: binding for pretraining, and the constraint most likely to produce a
legal rather than technical resolution.**

## The constraint

`Canon · Chinchilla` made data the binding input by showing models needed far
more tokens per parameter than assumed. Three pressures followed:

1. **Supply.** High-quality text is finite and largely already consumed by
   frontier pretraining runs. Remaining volume is lower quality per token.
2. **Access.** The open web is closing. Platforms that previously permitted free
   scraping now license, rate-limit or litigate. Training data is becoming a
   purchased input with a price.
3. **Contamination.** As model output floods the corpus, later scrapes are
   increasingly self-referential, with degradation risk under repeated
   generations of training on synthetic text.

The domains with the most economic value — clinical records, proprietary code,
industrial telemetry, legal work product, engineering documentation — are also
the most restricted. Data availability is roughly inverse to data value.

## What would relieve it

- **Synthetic data that provably adds information** rather than recycling it.
  Works where a verifier exists (mathematics, code, formal systems); unproven
  where correctness is a matter of judgement.
- **Sample efficiency** — capability per token improving enough that the ceiling
  stops binding. This would be the deepest possible relief and there is no
  current line of work convincingly delivering it.
- **Licensing markets maturing**, converting a legal risk into a line item and
  advantaging incumbents who can pay.
- **Learning from interaction** rather than corpora — environments, tool use,
  and RL against outcomes rather than text prediction.

## What a relieving candidate looks like

- Demonstrates capability gains **at fixed or reduced token count**.
- Shows the synthetic-data loop does not degrade over multiple generations —
  most papers test one generation, which proves little.
- Trains on interaction traces or verified outcomes rather than scraped text.

## The historical rhyme

`False Positives · Expert Systems and the Fifth Generation` failed on exactly this
axis: capability required expert-hours as an input, with no mechanism to scale the
input. Ask of every training method: **what is the per-unit-capability input, and
what scales it?** If the answer is human labour or a finite stock with no
regeneration path, the ceiling is structural, not temporary.
