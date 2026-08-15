# Autonomous Driving Timelines

**Roughly 2015–2017: multiple manufacturers and technology firms publicly
committed to full self-driving deployment by 2020. Waymo's driverless commercial
service began in Phoenix in 2020 and remained geographically constrained for
years afterward.**

## Why it looked like an inflection

- Real, rapid technical progress. The DARPA Grand Challenges (2004–2007) went from
  total failure to completion in three years; the extrapolation felt justified.
- Enormous capital: tens of billions across Waymo, Uber ATG, Cruise, Argo, Aurora
  and the manufacturers.
- A vast, unambiguous market — transport, logistics, insurance, urban land use.
- Public timeline commitments from named executives at credible firms, which
  markets read as information rather than as positioning.

## What actually happened

The last few percent of the problem consumed more effort than the first ninety.
Long-tail edge cases, adversarial human behaviour, weather, construction zones and
regulatory validation each proved harder than the core driving task.

Several programmes were written off (Uber ATG sold, Argo AI shut down in 2022).
Deployment happened — but geofenced, slow, city by city, roughly a decade behind
the announced schedule and still expanding under constraint.

## Diagnosis

**Inversion: real.** Learned perception and control genuinely removed a constraint
that hand-coded robotics could not.

**Incentives: overwhelming.** More capital than almost any technology programme of
the period. It did not compress the timeline, because the binding constraint was
not funding.

**Inflection: real, and misdated by about a decade.** The technology arrived. The
schedule was fiction.

## Lesson for Kyros

**The timing case, and the source of the field's most expensive errors.** Nobody
was wrong that autonomous vehicles would work. Positions taken on the 2020 date
were destroyed regardless.

Diagnostics this argues for:

- **Identify whether the remaining work is on the head or the tail of the
  distribution.** Head progress is fast and visible; tail progress is slow,
  unglamorous and dominates the schedule. Demos exercise the head exclusively.
- **Where does a failure land?** Systems whose errors are recoverable (a bad
  paragraph) deploy at 90% reliability. Systems whose errors are fatal or legally
  liable need far more nines, and each nine costs disproportionately more than the
  last. Adjust timelines by consequence-of-failure, not by capability.
- **Executive timelines are positioning, not forecasts.** They are made under
  incentives to appear ahead. Weight them at approximately zero and derive the
  date from the defect-rate curve instead.

Apply all three to current claims about agents and embodied AI, where the same
structure — impressive head, brutal tail, liability on failure — is present.
