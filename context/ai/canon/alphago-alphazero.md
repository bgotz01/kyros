# AlphaGo and AlphaZero

**Silver et al. (DeepMind) — Nature, January 2016; AlphaGo vs Lee Sedol, March
2016; AlphaZero, December 2017 / Science 2018.**

AlphaGo combined deep networks with Monte Carlo tree search to defeat a top Go
professional. AlphaZero then reached superhuman play in Go, chess and shogi from
self-play alone, with no human game records.

## Inversion

AlphaGo inverted the timeline: Go was widely held to be a decade or more away
because the search space defeated brute force and evaluation resisted
hand-coding.

AlphaZero inverted something larger and more durable — **that human data was a
necessary input**. Removing the human corpus did not degrade performance; it
improved it. Human knowledge was revealed to be a constraint on the system, not
a resource for it.

## Incentives

Weak in the direct sense, and this is the instructive part. Board games have no
market. DeepMind's incentive was demonstration and talent attraction, not
revenue.

The transferable asset was the *method* — self-play, search over learned
evaluation, RL without labels — and its incentive only materialised years later
when the same shape reappeared in reasoning models trained with RL against
verifiable rewards.

## Inflection

Real, but on a much longer fuse than its 2016 reception suggested. The immediate
predictions ("AGI is close") were wrong. The actual consequence — that RL against
a verifiable signal can exceed the human ceiling in domains where correctness is
checkable — took until roughly 2024–2025 to become industrially relevant.

## Lesson for Kyros

Two failure modes at once, in opposite directions.

The **overcall**: 2016 commentary generalised from a closed, perfectly-specified,
cheaply-simulable game to open-ended reality. The conditions that made Go
tractable — a perfect simulator and an unambiguous reward — do not hold for most
valuable problems, and *that gap, not the algorithm, is the story*.

The **undercall**: those who dismissed it as a stunt missed that "RL beats humans
wherever the reward is verifiable" would eventually be worth a great deal, in
mathematics, code and formal verification.

The correct 2016 verdict was `latent`, with the resolving observable stated as:
*does this method produce value in a domain with an economic reward function?*
