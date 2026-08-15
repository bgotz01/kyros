# FlashAttention

**Dao, Fu, Ermon, Rudra, Ré (Stanford) — NeurIPS 2022; FlashAttention-2, 2023.**

An IO-aware exact attention implementation that tiles the computation to avoid
materialising the full attention matrix in high-bandwidth memory, delivering
large wall-clock speedups and much lower memory use — with identical
mathematical output.

## Inversion

The assumption that attention's quadratic cost was an *algorithmic* problem
requiring an approximation. A long line of work traded accuracy for speed with
sparse and linear attention variants, and none displaced standard attention.

FlashAttention showed the bottleneck was memory bandwidth, not arithmetic. The
constraint that disappeared was the belief that long context required giving
something up. It required writing the kernel correctly.

## Incentives

Total and frictionless. Exact same outputs, strictly less cost, drop-in. Adopted
across essentially every serious training and inference stack within about a
year — one of the fastest diffusions in the corpus, precisely because it required
no one to accept a tradeoff.

Second-order: it made large context windows commercially viable, which enabled
retrieval-heavy applications, long-document workflows, and much of what agent
systems now assume.

## Inflection

Real, and almost invisible outside systems circles because it produced no
capability and no demo. Its consequence is legible only in what it made
affordable: the move from 2k–4k contexts to 100k+ within roughly two years is
substantially downstream of kernel-level work of this kind.

## Lesson for Kyros

**Some inflections are engineering, not science**, and they are the ones a
paper-scanning process is worst at detecting. There is no conceptual novelty
here; there is a large change in what is economically possible.

Also the case study in *approximation versus implementation*. A decade of
approximate-attention papers assumed the cost was fundamental. When a field has
many competing approximations to a problem and none wins, suspect that the
problem has been misdiagnosed — and treat the paper that re-diagnoses it as a
high-priority candidate.
