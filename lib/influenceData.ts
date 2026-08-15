// ─── AI impact dataset ───────────────────────────────────────────────────────
// Each entry is scored on counterfactual historical impact:
//
//   How different would the subsequent trajectory of AI have been
//   if this development had not occurred when it did?
//
// Scale 0–100 — 50 is not average, it is extraordinary.
// Appearing in this dataset already means the development mattered.
//
//   90–100  historical outlier
//   70–89   exceptional inflection
//   50–69   paradigm-defining
//   30–49   structural shift
//   10–29   significant contribution
//    1–9    enabling contribution
//    0      minimum canon threshold

export type InfluenceCategory =
    | 'Architecture'
    | 'Scaling'
    | 'Alignment'
    | 'Reasoning'
    | 'Efficiency'
    | 'Multimodal'
    | 'Reinforcement Learning'
    | 'Distribution';

export interface InfluenceEntry {
    id: string;
    label: string;
    /** Year the result appeared (paper, model, or product — whichever is the
     *  dated inflection). */
    year: number;
    /** Month (1-indexed). Used for sub-year ordering; default 6 if unknown. */
    month: number;
    /** 0–100. Counterfactual historical impact score. */
    score: number;
    category: InfluenceCategory;
    /** The strongest one-sentence claim about why this development mattered. */
    thesis: string;
    /** Optional: a second inflection date — capability events whose consequences
     *  landed years later. */
    consequenceYear?: number;
    /** What the consequence year represents. */
    consequenceNote?: string;
}

export const INFLUENCE_DATA: InfluenceEntry[] = [
    {
        id: 'attention-is-all-you-need',
        label: 'Attention Is All You Need',
        year: 2017,
        month: 6,
        score: 96,
        category: 'Architecture',
        thesis:
            'Removing recurrence made training embarrassingly parallel, converting capital directly into capability and establishing the architecture that underlies virtually all subsequent progress.',
        consequenceYear: 2019,
        consequenceNote: 'BERT and GPT-2 revealed the generality beyond translation',
    },
    {
        id: 'gpt-3',
        label: 'GPT-3',
        year: 2020,
        month: 5,
        score: 76,
        category: 'Scaling',
        thesis:
            'Demonstrated that a sufficiently large language model performs new tasks from examples in its prompt, collapsing task-specific adaptation pipelines and expanding the population of builders from ML practitioners to anyone who could write.',
        consequenceYear: 2022,
        consequenceNote: 'ChatGPT made the underlying capability legible to the world',
    },
    {
        id: 'alexnet',
        label: 'AlexNet',
        year: 2012,
        month: 9,
        score: 61,
        category: 'Architecture',
        thesis:
            "Deep networks trained on consumer GPUs beat hand-engineered features decisively enough to redirect what researchers believed was worth pursuing — the combination of deep learning, GPU compute and scale changed the field's default assumptions overnight.",
    },
    {
        id: 'chatgpt-release',
        label: 'ChatGPT',
        year: 2022,
        month: 11,
        score: 55,
        category: 'Distribution',
        thesis:
            'No new capability — every component pre-existed — but placing it behind a chat interface converted AI from a research programme into a competitive emergency, a revenue line and a political object simultaneously.',
    },
    {
        id: 'scaling-laws',
        label: 'Scaling Laws',
        year: 2020,
        month: 1,
        score: 43,
        category: 'Scaling',
        thesis:
            'Showed that capability follows smooth power laws in compute across many orders of magnitude, converting AI research from a discovery process into a capital allocation process and justifying multi-billion-dollar training runs before the results existed.',
    },
    {
        id: 'instructgpt-rlhf',
        label: 'InstructGPT / RLHF',
        year: 2022,
        month: 3,
        score: 34,
        category: 'Alignment',
        thesis:
            'Showed that a 1.3B model preference-tuned on human feedback was preferred over 175B GPT-3, separating capability from usability and creating the product surface that made consumer AI viable.',
    },
    {
        id: 'bert',
        label: 'BERT',
        year: 2018,
        month: 10,
        score: 38,
        category: 'Architecture',
        thesis:
            "Established the pretrain-then-fine-tune paradigm as the dominant template for NLP, reorienting an entire field around large pretrained representations — the critical intermediate step between task-specific models and GPT-3's prompting paradigm.",
        consequenceYear: 2020,
        consequenceNote: 'GPT-3 made the next move from fine-tuning to prompting',
    },
    {
        id: 'alphafold-2',
        label: 'AlphaFold 2',
        year: 2020,
        month: 11,
        score: 28,
        category: 'Architecture',
        thesis:
            'Collapsed protein structure prediction from laboratory-years to compute-minutes and demonstrated that transformer-based learned models could displace experimental workflows in hard scientific domains — the clearest evidence the paradigm reaches beyond language.',
    },
    {
        id: 'alphago-alphazero',
        label: 'AlphaGo / AlphaZero',
        year: 2016,
        month: 1,
        score: 25,
        category: 'Reinforcement Learning',
        thesis:
            'AlphaZero demonstrated that human demonstrations are a constraint rather than a resource — RL against a verifiable signal can exceed the human ceiling wherever correctness is checkable, a result whose full industrial consequence took nearly a decade to arrive.',
        consequenceYear: 2024,
        consequenceNote: 'RL against verifiable rewards industrialised in o1 and R1 reasoning models',
    },
    {
        id: 'stable-diffusion',
        label: 'Stable Diffusion',
        year: 2022,
        month: 8,
        score: 22,
        category: 'Distribution',
        thesis:
            'The open-weight release of a consumer-runnable image model created an independent ecosystem overnight — the contrast with gated DALL\u00b7E 2 is the clearest single case that distribution method can be a larger inflection than the underlying capability.',
    },
    {
        id: 'deepseek-r1',
        label: 'DeepSeek-R1',
        year: 2025,
        month: 1,
        score: 15,
        category: 'Reinforcement Learning',
        thesis:
            "Demonstrated open-weights frontier-adjacent reasoning at a fraction of Western training cost, challenging assumptions that reasoning capability required closed models and nine-figure budgets, and converting test-time compute from one lab's product into an openly available phenomenon.",
    },
    {
        id: 'chinchilla',
        label: 'Chinchilla',
        year: 2022,
        month: 3,
        score: 17,
        category: 'Scaling',
        thesis:
            "Corrected Kaplan's scaling coefficients and ended the parameter-count race by demonstrating that data, not parameters, was the binding input — making small capable open-weight models economically sensible and triggering the data licensing and synthetic data industries.",
    },
    {
        id: 'word2vec',
        label: 'word2vec',
        year: 2013,
        month: 1,
        score: 13,
        category: 'Architecture',
        thesis:
            'Showed that simple learned dense representations encode useful semantic relationships at scale, establishing the vector as the practical substrate for downstream NLP and eventually for retrieval, semantic search and embedding-based systems.',
    },
    {
        id: 'lora',
        label: 'LoRA',
        year: 2021,
        month: 6,
        score: 9,
        category: 'Efficiency',
        thesis:
            'Reduced model adaptation from a datacentre operation to a consumer GPU by training small low-rank update matrices instead of full weights, moving customisation across a capital threshold and enabling the open-weight ecosystem.',
    },
    {
        id: 'test-time-compute',
        label: 'Test-Time Compute (o1)',
        year: 2024,
        month: 9,
        score: 8,
        category: 'Reasoning',
        thesis:
            'Established inference compute as a second scaling axis independent of training, showing that capability is a dial to be turned rather than a fixed property — reshaping inference economics, hardware demand and competitive strategy across the industry.',
        consequenceYear: 2025,
        consequenceNote: 'DeepSeek-R1 confirmed the effect is not proprietary; industrialisation began',
    },
    {
        id: 'chain-of-thought',
        label: 'Chain-of-Thought',
        year: 2022,
        month: 1,
        score: 6,
        category: 'Reasoning',
        thesis:
            'Discovered that model capability is partly a function of how much computation it is allowed to do at inference, and that this can be unlocked with a prompt rather than a training run — the conceptual ancestor of the entire test-time compute axis.',
        consequenceYear: 2024,
        consequenceNote: 'Industrialised as the basis of o1 and R1 reasoning training',
    },
    {
        id: 'flash-attention',
        label: 'FlashAttention',
        year: 2022,
        month: 5,
        score: 4,
        category: 'Efficiency',
        thesis:
            "Reframed attention's cost as a memory-bandwidth problem rather than an algorithmic one — an IO-aware kernel delivering exact outputs at lower cost, making long context windows commercially viable and ending a decade of approximation research.",
    },
    {
        id: 'mixture-of-experts',
        label: 'Sparse MoE',
        year: 2017,
        month: 1,
        score: 3,
        category: 'Architecture',
        thesis:
            'Decoupled total model capacity from per-token compute cost, making the profitable at-scale serving of very large models possible — demonstrable in 2017, engineerable in 2023, now assumed in most frontier systems.',
        consequenceYear: 2023,
        consequenceNote: 'Widely adopted at frontier; Mixtral made the design openly available',
    },
];

// ─── derived helpers ──────────────────────────────────────────────────────────

export const CATEGORIES = Array.from(
    new Set(INFLUENCE_DATA.map((d) => d.category)),
).sort() as InfluenceCategory[];

export const CATEGORY_COLORS: Record<InfluenceCategory, string> = {
    Architecture: 'var(--color-bronze)',
    Scaling: 'var(--color-platinum)',
    Alignment: '#7a9e87',
    Reasoning: '#7e9ec4',
    Efficiency: '#9e8c7a',
    Multimodal: '#a07e9e',
    'Reinforcement Learning': '#c4a87e',
    Distribution: '#c47e7e',
};

export const MIN_YEAR = Math.min(...INFLUENCE_DATA.map((d) => d.year));
export const MAX_YEAR = Math.max(...INFLUENCE_DATA.map((d) => d.consequenceYear ?? d.year));
