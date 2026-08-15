# Memory and Continual Learning

**Status: binding, unsolved, and the oldest open problem in the corpus.**

## The constraint

Deployed models do not learn from use. Weights are frozen at training; everything
that happens afterward lives in a context window that is discarded, or in a
retrieval layer bolted alongside.

Three distinct problems, routinely conflated:

1. **Working memory** — largely relieved. Long context plus retrieval covers most
   of what was needed, without any explicit memory mechanism.
2. **Persistent memory** — partially handled by retrieval, but retrieval stores
   text, not learned skill. A system can recall that it failed and still fail the
   same way.
3. **Continual learning** — genuinely unsolved. Updating weights on new
   experience without catastrophic forgetting, without a full retraining run, and
   without the update being unauditable.

## Why it matters more than it appears

It is the difference between a tool and a colleague. A system that cannot
accumulate skill from its own experience resets to baseline every session,
however capable that baseline is. Compounding is the mechanism by which human
expertise becomes valuable, and no deployed system currently has it.

It is also the constraint underneath the agent problem: an agent that cannot
learn from a failed trajectory will repeat it.

## What would relieve it

- Continual or online weight updates that are stable, cheap and reversible.
- Composable adapters accumulated per user or per task — `Canon · LoRA` made the
  mechanism cheap; nobody has made the *curation and merging* work at scale.
- Architectures where memory is native rather than external.
- A retrieval formulation that stores procedure rather than text.

## The trap

`False Positives · Neural Turing Machines and the Differentiable Neural Computer`
attacked precisely this bottleneck, from a strong lab, with the right diagnosis —
and failed. The problem was then partly dissolved from an unrelated direction:
attention over long context, which was not designed as a memory mechanism at all.

**Lower the prior on any paper that attacks this head-on with an explicit memory
module.** That approach has a long failure record. Raise it for work that makes
the question stop mattering.
