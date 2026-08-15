# Running I³ on an AI Paper

The corpus is not a reading list. It is a set of resolved cases used to calibrate
judgement on unresolved ones.

When a paper, model release or lab announcement is put to the council, run it
through the three stages in order. Do not skip to the verdict.

---

## I¹ — Inversion

**What assumption does this overturn?**

A paper that improves a benchmark inverts nothing. A paper that removes a
constraint inverts something.

Ask:

- What did practitioners believe was necessary that this shows is not?
  (Recurrence was necessary for sequence modelling. Human game records were
  necessary for superhuman play. Task-specific fine-tuning was necessary for
  task performance.)
- What was expensive that is now cheap, and by what factor? Order-of-magnitude
  cost inversions matter; 20% improvements do not.
- Which incumbent advantage stops being an advantage?

If you cannot state the overturned assumption in one sentence, there probably
isn't one. Say so.

**Failure mode:** mistaking a new *result* for a new *constraint structure*.
Most SOTA papers move a number inside an unchanged paradigm.

---

## I² — Incentives

**Why would this spread?**

A real inversion still dies if nobody is paid to carry it.

Ask:

- Who can deploy this without permission? Techniques that require only a GPU and
  a weekend spread differently from ones requiring a fab, a regulator or a
  10,000-GPU cluster.
- Does it lower cost for someone already spending, or does it require new
  spending against uncertain return? The first is adopted quietly and fast; the
  second needs a believer with a budget.
- Are the weights, code or method open? Open artefacts convert a paper into an
  ecosystem within months (LoRA, Stable Diffusion). Closed ones convert into a
  product and a moat.
- Who is structurally opposed, and how much power do they have?

**Failure mode:** assuming technical superiority implies adoption. It does not.
Capsule networks were interesting and went nowhere; nobody's cost fell.

---

## I³ — Inflection

**Is the trajectory actually different now?**

Ask:

- What is the *observable consequence* that would be absent if this were noise?
  Name it, and name when it should appear.
- What precedent does this rhyme with, and how did that resolve? Use the
  false-positive files, not only the canon.
- Second and third order: if this holds, what becomes possible in 18 months that
  was not possible before? Who has to respond?
- **What would have to be true for this to be nothing?** Answer this honestly
  before issuing a verdict. If the answer is "very little", the verdict is noise.

**Failure mode:** the premature call. Being directionally right and temporally
wrong is indistinguishable from being wrong, for years. See
`False Positives · Autonomous Driving Timelines` and `False Positives · AutoGPT Wave`.

---

## Verdict format

End with three lines and nothing else:

```
Verdict:     inflection | latent | noise
Confidence:  low | moderate | high
Resolves by: <the observable that would settle it, and roughly when>
```

`latent` is a real inflection whose consequences have not yet surfaced —
the transformer between June 2017 and mid-2018. It is the most valuable verdict
Kyros can issue and the easiest to get wrong. Use it only when I¹ and I² are
both clearly satisfied and only the timing is open.
