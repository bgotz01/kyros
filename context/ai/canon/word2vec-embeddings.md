# word2vec and Distributed Representations

**Mikolov et al. (Google) — "Efficient Estimation of Word Representations in
Vector Space" and "Distributed Representations of Words and Phrases", 2013.**

Trained dense vector representations of words such that semantic relationships
appeared as geometry — the arithmetic analogies (king − man + woman ≈ queen)
being the demonstration that made it famous.

## Inversion

The assumption that meaning had to be represented symbolically — dictionaries,
ontologies, hand-built knowledge graphs, decades of work.

Meaning turned out to be recoverable from co-occurrence statistics alone, at
low cost, without supervision or human curation. The constraint that disappeared
was **the knowledge engineer**. An entire methodology for representing semantics
was rendered optional.

## Incentives

Strong and immediate in industry — search ranking, recommendation, ad targeting
and translation all improved from a technique that was cheap to train and easy to
deploy. Adoption was quiet and commercial rather than public.

## Inflection

Real but partial, and it deserves a place in the canon mostly for what it
established rather than what it did. Word2vec itself was superseded within a few
years by contextual representations (ELMo, BERT) and eventually absorbed entirely
into transformer models.

Its durable consequence is the **vector representation as the substrate of
meaning** — which is what retrieval-augmented generation, semantic search, and
the entire vector database industry are built on. The technique died; the
premise became infrastructure.

## Lesson for Kyros

**A method can be superseded while its underlying premise becomes permanent.**
Judging word2vec by its own survival would mark it a dead end. Judging it by
whether its central claim — that meaning is geometric and learnable from raw
text — survived gives the opposite answer.

Ask of every candidate: *what is the claim underneath the method?* Inflections
should be scored on the claim, because the specific artefact is nearly always
replaced. Methods have half-lives of a few years; premises last decades.
