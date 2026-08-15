# Signals and Base Rates

What actually separated the canon from the false positives, and how long each
took to become visible.

---

## Lag between publication and visible consequence

| Event | Published | Consensus recognition | Lag |
|---|---|---|---|
| AlexNet | Sep 2012 | ~2013 | months |
| Transformer | Jun 2017 | ~late 2018 (BERT) | ~15 months |
| Scaling laws | Jan 2020 | ~2021 | ~12 months |
| GPT-3 | May 2020 | Nov 2022 (ChatGPT) | ~30 months |
| Chinchilla | Mar 2022 | ~2023 | ~9 months |
| Chain-of-thought | Jan 2022 | ~2023 | ~12 months |
| LoRA | Jun 2021 | ~2023 | ~18 months |
| AlphaFold 2 | Nov 2020 / Jul 2021 | immediate in-field, still diffusing outside | years |

**Base rate: 9–30 months from artefact to consensus.** A claim that something
published this week has "already changed everything" is nearly always wrong. A
claim that something published 18 months ago changed everything is checkable.

This is the window Kyros exists to operate in. Before the lag closes, the
information is public and the interpretation is not yet priced.

---

## Signals that preceded real inflections

1. **A cost curve breaks, not a benchmark.** AlexNet made vision training a GPU
   problem. FlashAttention made long context affordable. DeepSeek-R1 made
   frontier-adjacent reasoning cheap to reproduce. Benchmarks moved because
   economics moved, not the reverse.
2. **Practitioners change what they build, not what they cite.** The transformer
   was recognised when people stopped writing LSTMs, not when the paper was
   praised.
3. **A capability appears that nobody designed for.** In-context learning was not
   the objective GPT-3 was trained for. Emergent-but-unintended is a stronger
   signal than intended-and-achieved.
4. **The method transfers out of its home domain.** Transformers left NLP for
   vision, protein folding, and audio within four years. Capsule networks never
   left toy image tasks.
5. **A second lab reproduces it independently and quickly.** Reproduction is the
   single most reliable filter. Ideas that only work at one lab usually only
   work at one lab.
6. **Distribution arrives.** The technical inflection and the consequence
   inflection are different events, sometimes years apart. GPT-3 was the first;
   ChatGPT was the second.

---

## Signals that preceded false positives

1. **Authority substituting for adoption.** A famous researcher's name carrying a
   method that nobody outside the group uses (capsule networks, and much of
   neuro-symbolic AI).
2. **A demo without a deployment path.** Watson's Jeopardy! win, Gato's 604
   tasks. Impressive under curation; unclear who pays for it in production.
3. **Generality claimed before competence.** Systems marketed as general while
   underperforming specialists at every individual task.
4. **The timeline is asserted rather than derived.** "Full autonomy by 2020" was
   never backed by a defect-rate curve. Claims with no mechanism for the date
   are marketing.
5. **Star counts, downloads and discourse volume as evidence.** AutoGPT was the
   fastest-starred repository in GitHub's history and produced almost no durable
   deployment. Attention is not adoption.
6. **No primary artefact.** Rumour cycles (Q*) generate enormous interpretive
   activity around nothing checkable. If there is no paper, no weights and no
   reproducible result, there is no event to analyse — only a claim to date.

---

## The two error types, and which one to prefer

- **False positive:** calling an inflection that never arrives. Cost: credibility,
  and positioning against a paradigm that does not materialise.
- **False negative:** missing one. Cost: arriving with consensus, which is the
  same as arriving late.

Kyros should tolerate false negatives more readily than false positives, because
the `latent` verdict exists precisely to hold candidates open without committing.
An honest "not yet resolvable — here is what would resolve it" is a complete
answer and is preferred to a forced verdict.

---

## Standing questions for any candidate

- Has anyone outside the originating lab reproduced it?
- Whose cost fell, and by what factor?
- Are the weights or code public?
- What did practitioners build differently in the 90 days after?
- Which of the open bottlenecks does it actually relieve? (See the Bottlenecks
  group. A paper that relieves none is almost certainly noise, however elegant.)
