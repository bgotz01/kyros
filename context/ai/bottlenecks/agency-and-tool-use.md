# Agency, Tool Use and the Action Surface

**Status: partially relieved and moving fast — the most volatile entry here.**

## The constraint

A model that only emits text requires a human to act on it. Value capture depends
on the model acting directly: calling systems, executing changes, operating over
long horizons without supervision.

Sub-constraints, roughly in order of how far each has been relieved:

1. **Tool invocation** — largely solved. Reliable structured calling is standard.
2. **Interface availability** — improving. The binding issue is that most
   enterprise value sits behind systems with no usable programmatic surface, and
   screen-level operation remains slow and brittle.
3. **Horizon length** — see `Bottlenecks · Reliability and Verification`. This is
   arithmetic, not intelligence, and it is the hard limit.
4. **Permission and liability** — barely addressed. There is no mature model for
   what an autonomous system may do unsupervised, who is accountable when it errs,
   or how authority is delegated and revoked. This is legal and organisational
   infrastructure, and it moves on a slower clock than the technology.

## The non-technical blocker is now the binding one

Technical agency is improving faster than the institutional machinery to permit
it. Organisations lack the audit trails, insurance products, and internal
authority structures to let a system act. Expect the gap between *capable* and
*permitted* to widen, and expect that gap — not model capability — to determine
deployment timing in regulated sectors.

## What would relieve it

- Error recovery within trajectories, which converts horizon from a hard limit to
  a cost.
- Audit and rollback infrastructure making autonomous action reversible and
  therefore insurable.
- Standardised delegation: scoped, revocable, machine-readable authority.
- Insurance products pricing autonomous-agent liability, which would signal that
  the risk has become quantifiable.

## Warning attached to this entry

This is the bottleneck most likely to attract premature inflection calls, because
the demand is enormous and demos are compelling — the exact conditions that
produced `False Positives · The AutoGPT Wave`.

Require, before upgrading a candidate: production deployment with money behind it,
a measured end-to-end success rate over a stated horizon length, and an account of
what happens on failure. Demo videos, star counts and benchmark suites do not
qualify.
