# Attention Is All You Need

**Vaswani, Shazeer, Parmar, Uszkoreit, Jones, Gomez, Kaiser, Polosukhin —
NeurIPS 2017.**

Introduced the Transformer: sequence modelling built entirely on attention, with
recurrence and convolution removed.

## Inversion

Sequence models were assumed to require recurrence — you processed tokens in
order because meaning depended on order. Recurrence made training inherently
sequential and therefore hard to parallelise, which capped model size in
practice.

Removing recurrence made training embarrassingly parallel across sequence
positions. The constraint that disappeared was not accuracy. It was *the ability
to spend compute*.

## Incentives

Initially modest and framed narrowly — the paper is presented as a machine
translation result. Its incentive structure only became visible once someone
noticed that a parallelisable architecture converts capital directly into
capability. From that moment, every organisation with capital had a reason to
build one, and the constraint moved from ideas to GPUs.

Open publication by Google meant the architecture was free to everyone,
including competitors. This is arguably the most consequential open-publication
decision in the field's history, and it was not treated as a strategic decision
at the time.

## Inflection

The central inflection of the modern era, and it was **latent for roughly fifteen
months**. Contemporary reception was positive but domain-bounded: a good
translation paper. BERT (Oct 2018) and GPT-2 (Feb 2019) made the generality
visible. By 2021 the architecture had left NLP entirely — vision (ViT), protein
structure (AlphaFold 2), audio, and eventually most of machine learning.

## Lesson for Kyros

The archetypal `latent` verdict, and the strongest argument for Kyros existing.
Everything needed to call it was public in June 2017. The inversion was clean and
statable in one sentence. The incentive analysis — parallelism converts capital
into capability — required no private information. The consequence took over a
year to become consensus.

Also the archetype of **the domain-bounded framing hiding the general result**.
The authors sold it as translation. Ask of every paper: what is this a special
case of?
