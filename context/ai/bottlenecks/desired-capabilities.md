# Desired Capabilities — the Demand Side

The bottleneck files describe what blocks progress. This describes what is wanted
and does not yet exist — the pull side of the analysis.

A candidate paper should be scored against this list as well as against the
bottlenecks. **A result that serves none of these is almost certainly noise,
however technically elegant.**

---

## 1. A system that improves from its own use

Compounding skill rather than a fixed baseline reset each session. Blocked by
`Bottlenecks · Memory and Continual Learning`. This is the capability with the
largest gap between how obviously it is wanted and how little progress exists.

## 2. Reliable delegation of a multi-day task

Not a chat turn and not a ten-step trajectory — a piece of work handed over with
a goal and a deadline, returned complete. Blocked by horizon arithmetic and by
`Bottlenecks · Agency, Tool Use and the Action Surface`.

## 3. Knowing when it does not know

Calibrated uncertainty reliable enough to route work automatically. Would rescue
the deployment economics of most current applications without requiring any
increase in raw capability. Arguably the highest value-per-unit-difficulty item
on this list.

## 4. Verified reasoning in judgement domains

Extending the RL-against-a-verifier result out of mathematics and code into
strategy, diagnosis and law, where no verifier exists. The central open question
of `Bottlenecks · Reliability and Verification`, and the assumption underneath a
large share of current investment.

## 5. Genuine scientific generation

`Canon · AlphaFold 2` predicted structures within a well-posed problem. What is
wanted is hypothesis generation and experimental design — proposing what to test,
not solving a stated task. Materials, drug discovery and climate modelling are
the named targets.

## 6. Cheap frontier capability on owned hardware

Regulated industries and states want capability without sending data to a third
party. `Canon · LoRA` and `Canon · DeepSeek-R1` moved this substantially; the
demand is far from satisfied and is politically as well as commercially driven.

## 7. Persistent, controllable identity

Systems whose behaviour is stable, auditable and correctable over time, rather
than shifting with each model update. A precondition for institutional deployment
and almost entirely unaddressed by current research.

## 8. Physical competence

Manipulation and navigation in unstructured environments. The largest untouched
labour market. Data scarcity is the binding constraint — there is no internet-scale
corpus of physical interaction, and `Bottlenecks · Data and the Token Supply`
applies with unusual force.

---

## How to use this list

When a candidate arrives, ask which numbered item it advances and by how much.

Then apply the counter-check from
`False Positives · Neural Turing Machines and the Differentiable Neural Computer`:
a paper that attacks a well-known desired capability head-on should attract a
*lower* prior, not a higher one. Many groups are attacking each of these; most
will fail; the historical pattern is that the eventual relief arrives obliquely,
from work that was aimed at something else entirely.
