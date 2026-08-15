# Expert Systems and the Fifth Generation Project

**Japan's Fifth Generation Computer Systems project, 1982–1992. The commercial
expert systems boom, roughly 1980–1987, and the AI winter that followed.**

Rule-based systems encoding human expertise (MYCIN, XCON) produced real
commercial results, a hardware industry built on Lisp machines, and a national
industrial programme.

## Why it looked like an inflection

- Genuine early deployments with measurable returns. XCON reportedly saved DEC
  tens of millions per year configuring VAX systems. This was not vapour.
- A hardware ecosystem (Symbolics, Lisp Machines Inc.) and a real corporate
  market.
- State-level commitment: Japan's programme triggered defensive responses in the
  US and Europe. Governments do not usually respond to nothing.
- A coherent theory — intelligence as symbol manipulation — with decades of
  academic support.

## What actually happened

Knowledge acquisition did not scale. Every rule was hand-written by an expert
working with a knowledge engineer, systems became brittle at a few thousand
rules, and maintenance costs grew faster than capability. The systems could not
learn, so every change was manual.

General-purpose workstations then destroyed the specialised hardware market on
price. Funding collapsed. The second AI winter ran from roughly 1987 into the
mid-1990s.

## Diagnosis

**Inversion: real but bounded.** Encoding expertise in software genuinely worked —
within a narrow band of well-specified, stable, low-dimensional domains.

**Incentives: real, and they still were not enough.** Money, states and customers
were all aligned. The technology hit a scaling wall that no incentive could move.

**Inflection: none.** The trajectory reverted. What eventually solved the problem
was the opposite approach: learning representations from data rather than
eliciting them from experts — see `Canon · word2vec and Distributed
Representations`.

## Lesson for Kyros

**The essential base-rate case, and the reason the corpus starts before 2012.**
Every current claim about AI has a structural analogue in this period: real
deployments, real revenue, state involvement, expert consensus — followed by a
decade of reversal.

The specific diagnostic: **find the input that must scale, and ask what scales
it.** Expert systems required expert-hours per unit of capability, with no
mechanism to automate the input. That is a linear-cost technology wearing the
costume of an exponential one, and it is visible in advance.

Applied now: for any AI system, ask what its per-unit-capability input is, and
whether that input has its own scaling mechanism. Where the input is human
labour with no automation path, expect the same wall. See
`Bottlenecks · Data and the Token Supply`.
