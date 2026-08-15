# Compute and Energy

**Status: binding. The most physical of the constraints, and the slowest to
relieve.**

## The constraint

Frontier training and large-scale inference are limited by four stacked
dependencies, each with a different clock speed:

1. **Advanced logic fabrication** — concentrated in a very small number of
   facilities, with leading-edge lithography from a single supplier. New capacity
   takes years.
2. **Advanced packaging and high-bandwidth memory** — repeatedly the binding
   sub-constraint rather than wafer supply itself.
3. **Grid interconnection** — the wait for a large new datacentre connection is
   measured in years in most developed markets. Generation is often available;
   the queue to connect to it is not.
4. **Cooling and water** — siting is increasingly decided by thermal and water
   access, and increasingly contested locally.

## Why it does not clear quickly

Every layer has a multi-year lead time and none can be bought forward with
software. This is the sharpest structural difference between AI and previous
software paradigms: the constraint is industrial and it does not respond to
capital on a software timescale.

## What would relieve it

- Order-of-magnitude efficiency gains at algorithm or kernel level — see
  `Canon · FlashAttention` and `Canon · Sparse Mixture of Experts`. Historically
  this has been the fastest-acting relief valve.
- A viable non-GPU substrate reaching production maturity (accelerators built
  around inference economics rather than training throughput).
- Behind-the-meter generation decoupling deployment from interconnection queues.
- A demand-side surprise: if capability saturates below the current spend
  trajectory, the constraint dissolves without being solved.

## What a relieving candidate looks like

- Reports **wall-clock and energy per unit capability**, not benchmark scores.
- Preserves output quality exactly (drop-in) rather than trading accuracy — this
  is the difference between FlashAttention's near-total adoption and the
  approximate-attention literature's near-zero adoption.
- Is reproducible on hardware the reader already owns.

## Watch for the Jevons inversion

Efficiency gains here have historically *increased* total consumption by opening
new applications. When scoring a candidate that cuts inference cost, model both
branches: reduced total demand, and expanded total demand. The second has been
the empirical norm, and mistaking one for the other was the central analytical
question of the DeepSeek-R1 market reaction — see `Canon · DeepSeek-R1`.
