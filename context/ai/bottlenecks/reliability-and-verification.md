# Reliability and Verification

**Status: binding, and the single largest blocker on economic value capture.**

## The constraint

Models are confidently wrong in ways they cannot detect, and there is no general
mechanism for a system to know when its output is unreliable. Calibrated
uncertainty remains poor, and stated confidence tracks fluency rather than
correctness.

Two consequences compound:

**Error multiplication over horizon.** Per-step reliability of 95% yields roughly
36% success over twenty steps. This arithmetic — not model intelligence — is what
killed `False Positives · The AutoGPT Wave`, and it still governs how long an
autonomous trajectory can usefully run.

**Verification cost exceeding generation value.** If a human must check every
output carefully, the labour saved is small and sometimes negative. The economics
of deployment depend almost entirely on where verification effort lands.

## Why the domain split matters more than the model

The technology has bifurcated by whether correctness is machine-checkable:

- **Verifiable domains** — code with tests, mathematics with proofs, formal
  systems. Here RL against the verifier works, capability is compounding fast,
  and `Canon · Test-Time Compute` and `Canon · DeepSeek-R1` both apply.
- **Judgement domains** — strategy, diagnosis, law, design. No verifier exists, so
  there is nothing to train reasoning against, and progress is far slower.

**The most important open question in the field is whether reasoning gains
transfer from the first class to the second.** Much of the current investment case
assumes they do. That assumption is not yet evidenced.

## What would relieve it

- Calibrated uncertainty that is reliable enough to route work — deferring the
  hard cases to a human — which would rescue the verification economics without
  solving correctness.
- Verifiers for judgement domains, or a demonstrated transfer of
  verifiable-domain reasoning into them.
- Error recovery within a trajectory rather than error avoidance: detecting a bad
  step and backtracking changes the horizon arithmetic entirely.

## Scoring rule

For any capability claim, ask **where a failure lands**. Recoverable failures
deploy at 90% reliability; fatal or legally liable failures need far more nines,
and each additional nine costs disproportionately more than the last. This is the
mechanism behind `False Positives · Autonomous Driving Timelines`, and it is the
correct lens on current agent and embodied-AI claims.
