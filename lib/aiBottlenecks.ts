// ─── AI bottlenecks ──────────────────────────────────────────────────────────
// The five constraints the corpus currently marks as binding, drawn from
// context/ai/bottlenecks/. Agency and tool use is deliberately excluded — it is
// the one entry whose status reads "partially relieved", and it is recorded
// below as the sixth rather than ranked among the five.
//
// Ordered outward: from what the model itself cannot do, through what it is
// built from, to what the world has not yet reorganised to absorb. This is not
// a difficulty ranking — compute is the hardest to relieve and sits fourth.

export interface Bottleneck {
    id: string;
    label: string;
    /** The one-line status the corpus file opens with. */
    status: string;
    /** The constraint stated as a single sentence. */
    claim: string;
    /** Two or three sentences on the mechanism. */
    constraint: string;
    /** The parts it decomposes into, each "name — meaning". */
    components: string[];
    /** What would actually relieve it. */
    relief: string[];
    /** The scoring rule, trap or warning the corpus attaches to this entry. */
    rule: { label: string; text: string };
}

export const BOTTLENECKS: Bottleneck[] = [
    {
        id: 'reliability',
        label: 'Reliability & verification',
        status: 'Binding · the largest blocker on value capture',
        claim: 'Models are confidently wrong in ways they cannot detect.',
        constraint:
            'There is no general mechanism for a system to know when its own output is unreliable. Stated confidence tracks fluency rather than correctness, and calibration remains poor. Two consequences compound from there, and neither is a question of intelligence.',
        components: [
            'Error multiplication — 95% per step is roughly 36% over twenty steps. This arithmetic, not model capability, is what killed the 2023 agent wave.',
            'Verification cost — if a human must carefully check every output, the labour saved is small and sometimes negative.',
            'The domain split — where correctness is machine-checkable (code, mathematics, formal systems) capability compounds fast. Where it is a matter of judgement (strategy, diagnosis, law) there is no verifier to train against.',
        ],
        relief: [
            'Calibrated uncertainty reliable enough to route work — deferring hard cases to a human rescues the economics without solving correctness.',
            'Verifiers for judgement domains, or demonstrated transfer of verifiable-domain reasoning into them.',
            'Error recovery inside a trajectory rather than error avoidance, which changes the horizon arithmetic entirely.',
        ],
        rule: {
            label: 'Scoring rule',
            text: 'Ask where a failure lands. Recoverable failures deploy at 90% reliability; fatal or legally liable ones need far more nines, and each additional nine costs disproportionately more than the last.',
        },
    },
    {
        id: 'memory',
        label: 'Memory & continual learning',
        status: 'Binding · unsolved · the oldest open problem in the corpus',
        claim: 'Deployed models do not learn from use.',
        constraint:
            'Weights are frozen at training. Everything that happens afterward lives in a context window that is discarded, or in a retrieval layer bolted alongside. It is the difference between a tool and a colleague: a system that cannot accumulate skill resets to baseline every session, however capable that baseline is.',
        components: [
            'Working memory — largely relieved. Long context plus retrieval covers most of what was needed.',
            'Persistent memory — partially handled, but retrieval stores text, not learned skill. A system can recall that it failed and fail the same way again.',
            'Continual learning — genuinely unsolved. Updating weights on new experience without catastrophic forgetting, without a full retraining run, and without the update being unauditable.',
        ],
        relief: [
            'Online weight updates that are stable, cheap and reversible.',
            'Composable adapters accumulated per user or task — LoRA made the mechanism cheap; nobody has made the curation and merging work at scale.',
            'Architectures where memory is native rather than external, or retrieval that stores procedure rather than text.',
        ],
        rule: {
            label: 'The trap',
            text: 'Neural Turing Machines attacked this head-on, from a strong lab, with the right diagnosis — and failed. The problem was then partly dissolved sideways by attention over long context, which was never designed as a memory mechanism. Lower the prior on explicit memory modules; raise it for work that makes the question stop mattering.',
        },
    },
    {
        id: 'data',
        label: 'Data & the token supply',
        status: 'Binding for pretraining · likely to resolve legally, not technically',
        claim: 'Data availability is roughly inverse to data value.',
        constraint:
            'Chinchilla made data the binding input by showing models needed far more tokens per parameter than assumed. The domains with the most economic value — clinical records, proprietary code, industrial telemetry, legal work product — are precisely the most restricted.',
        components: [
            'Supply — high-quality text is finite and largely already consumed. Remaining volume is lower quality per token.',
            'Access — the open web is closing. Platforms that permitted free scraping now license, rate-limit or litigate.',
            'Contamination — as model output floods the corpus, later scrapes become self-referential, with degradation risk over repeated generations.',
        ],
        relief: [
            'Synthetic data that provably adds information rather than recycling it — works where a verifier exists, unproven where correctness is judgement.',
            'Sample efficiency improving enough that the ceiling stops binding. The deepest possible relief, and no current line of work convincingly delivers it.',
            'Learning from interaction — environments, tool use and RL against outcomes rather than text prediction.',
        ],
        rule: {
            label: 'The historical rhyme',
            text: 'Expert systems failed on exactly this axis: capability required expert-hours as an input with no mechanism to scale it. Ask of every training method what the per-unit-capability input is, and what scales it. If the answer is human labour or a finite stock with no regeneration path, the ceiling is structural rather than temporary.',
        },
    },
    {
        id: 'compute',
        label: 'Compute & energy',
        status: 'Binding · the most physical constraint, and the slowest to relieve',
        claim: 'The constraint is industrial, and it does not respond to capital on a software timescale.',
        constraint:
            'Frontier training and large-scale inference sit on four stacked dependencies, each with a different clock speed and none of which can be bought forward with software. This is the sharpest structural difference between AI and previous software paradigms.',
        components: [
            'Advanced logic fabrication — a very small number of facilities, with leading-edge lithography from a single supplier. New capacity takes years.',
            'Packaging and high-bandwidth memory — repeatedly the binding sub-constraint, rather than wafer supply itself.',
            'Grid interconnection — the wait for a large new datacentre connection is measured in years. Generation is often available; the queue to connect to it is not.',
            'Cooling and water — siting is increasingly decided by thermal and water access, and increasingly contested locally.',
        ],
        relief: [
            'Order-of-magnitude efficiency at algorithm or kernel level. Historically the fastest-acting valve — FlashAttention and sparse MoE are the reference cases.',
            'A viable non-GPU substrate reaching production maturity, built around inference economics rather than training throughput.',
            'Behind-the-meter generation, decoupling deployment from interconnection queues.',
            'A demand-side surprise: if capability saturates below the current spend trajectory, the constraint dissolves without being solved.',
        ],
        rule: {
            label: 'Watch for the Jevons inversion',
            text: 'Efficiency gains here have historically increased total consumption by opening new applications. For any candidate that cuts inference cost, model both branches — reduced total demand and expanded total demand. The second has been the empirical norm, and mistaking one for the other was the central question of the DeepSeek-R1 market reaction.',
        },
    },
    {
        id: 'diffusion',
        label: 'Economics & diffusion',
        status: 'Binding · the constraint most often omitted from technical analysis',
        claim: 'Capability has run far ahead of realised productivity, and the gap is not a technology gap.',
        constraint:
            'Electrification took decades to appear in productivity statistics, because the gain required reorganising the factory rather than installing the motor. The same structure applies here. Diffusion is where a paradigm shift either converts into economic reality or stalls for a decade.',
        components: [
            'Absorption lag — enterprise process change runs on a multi-year clock.',
            'Verification labour — if the human must check the work, the saving is a fraction of the task.',
            'Unit economics of inference — test-time compute made quality a purchasable dial, so margin now depends on how much thinking each query is granted.',
            'Integration surface — value concentrates where a model touches proprietary systems, and that work is bespoke and slow.',
            'Skill and trust — adoption inside organisations is wildly uneven, and the binding constraint is frequently a manager willing to accept a machine-produced artefact, not the artefact.',
        ],
        relief: [
            'Deployment patterns where output is machine-verified, removing the human check from the loop.',
            'Native rebuilds rather than retrofits — which implies new entrants capture more value than incumbents.',
            'Liability and audit infrastructure, shared with the agency constraint below.',
        ],
        rule: {
            label: 'Screening question',
            text: 'Who has to change their behaviour for this to matter, and what is that actor switching cost? A technically decisive result whose adoption requires reorganising a regulated institution is a ten-year event, not a one-year event, and should be dated accordingly.',
        },
    },
];

// ─── the sixth ───────────────────────────────────────────────────────────────
// Excluded from the five because its status is the only one that is not
// binding — and because it is the entry most likely to attract a premature
// inflection call.

export const SIXTH = {
    label: 'Agency, tool use & the action surface',
    status: 'Partially relieved · moving fast · the most volatile entry',
    text: 'Tool invocation is largely solved. Horizon length is not a separate problem — it is the reliability arithmetic above. What remains barely addressed is permission and liability: there is no mature model for what an autonomous system may do unsupervised, who is accountable when it errs, or how authority is delegated and revoked. Technical agency is now improving faster than the institutional machinery to permit it, and that gap, not model capability, will decide deployment timing in regulated sectors.',
    guard: 'Before upgrading a candidate here, require production deployment with money behind it, a measured end-to-end success rate over a stated horizon, and an account of what happens on failure. Demo videos, star counts and benchmark suites do not qualify.',
};
