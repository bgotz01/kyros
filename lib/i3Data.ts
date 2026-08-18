// ─── I³ dataset ───────────────────────────────────────────────────────────────
// Each development is scored across three dimensions, each 0–10.
//
//   Inversion  — How strongly does it invert the previous paradigm?
//                High score: replaces a fundamental assumption or method.
//
//   Incentives — How obviously relevant and useful is it?
//                High score: once available, powerful reasons to adopt it exist.
//
//   Inflection — How unique and useful is it?
//                High score: introduces something genuinely new that matters.
//
// I³ score = Inversion × Incentives × Inflection  (range 0 – 1,000)
//
// Multiplication encodes a structural claim: paradigm-defining developments
// require convergence across all three dimensions. A development that is
// extremely useful but not novel, or radically novel but not useful, scores
// far below one that achieves all three simultaneously.

export type I3Category =
    | 'Architecture'
    | 'Scaling'
    | 'Alignment'
    | 'Reasoning'
    | 'Efficiency'
    | 'Multimodal'
    | 'Reinforcement Learning'
    | 'Distribution';

export interface I3Scores {
    inversion: number;   // 0–10
    incentives: number;  // 0–10
    inflection: number;  // 0–10
}

export interface I3Entry {
    id: string;
    label: string;
    year: number;
    month: number;
    category: I3Category;
    /** One or two sentences describing what this development actually was. */
    description?: string;
    /** Brief description of the prior approach that was being displaced. */
    previousParadigm?: string;
    /** One sentence on the core claim — why this mattered. */
    thesis: string;
    i3: I3Scores;
    /** Derived. Do not set manually — computed below. */
    i3Score: number;
    consequenceYear?: number;
    consequenceNote?: string;
    /** Per-dimension rationale, shown in the detail panel. */
    rationale: {
        inversion: string;
        incentives: string;
        inflection: string;
    };
}

// ─── raw entries (i3Score computed at the bottom) ─────────────────────────────

const RAW: Omit<I3Entry, 'i3Score'>[] = [
    {
        id: 'attention-is-all-you-need',
        label: 'Attention Is All You Need',
        year: 2017,
        month: 6,
        category: 'Architecture',
        description:
            'A Google paper proposing the Transformer — a neural network architecture that processes sequences using self-attention instead of recurrence. Every token attends directly to every other, so training is fully parallel across the sequence.',
        previousParadigm:
            'Recurrent neural networks (RNNs, LSTMs, GRUs) processed sequences step-by-step. Each token depended on the previous hidden state, making training sequential and long-range dependencies hard to preserve.',
        thesis:
            'Removing recurrence made training embarrassingly parallel, converting capital directly into capability and establishing the architecture that underlies virtually all subsequent progress.',
        i3: { inversion: 10, incentives: 10, inflection: 10 },
        consequenceYear: 2019,
        consequenceNote: 'BERT and GPT-2 revealed the generality beyond translation',
        rationale: {
            inversion:
                'Completely replaced recurrence — the assumed requirement for sequence modelling — with attention alone. No partial reform; the prior architecture became obsolete.',
            incentives:
                'Parallelism converts capital directly into capability. Every organisation with a GPU cluster had an immediate reason to adopt it. Incentive to use it was total.',
            inflection:
                'The generality turned out to apply beyond NLP to vision, protein structure, audio and almost all of machine learning. Nothing before it had this breadth.',
        },
    },
    {
        id: 'gpt-3',
        label: 'GPT-3',
        year: 2020,
        month: 5,
        category: 'Scaling',
        description:
            'OpenAI\'s 175-billion-parameter language model — at the time the largest ever trained. It demonstrated that a single model, shown a few examples in its prompt, could perform translation, coding, arithmetic and question-answering without any task-specific training.',
        previousParadigm:
            'Each task required its own fine-tuned model trained on labelled examples. Adapting a pretrained model to a new task meant running a new training job with task-specific data.',
        thesis:
            'Demonstrated that a sufficiently large language model performs new tasks from examples in its prompt, collapsing task-specific adaptation pipelines and expanding the population of builders to anyone who could write.',
        i3: { inversion: 9, incentives: 10, inflection: 10 },
        consequenceYear: 2022,
        consequenceNote: 'ChatGPT made the underlying capability legible to the world',
        rationale: {
            inversion:
                'Inverted the assumption that adapting a model to a task required labelled data and a training run. In-context learning collapsed that pipeline into a text string.',
            incentives:
                'One model suddenly addressed many tasks through natural language. Every software company had an immediate reason to integrate it.',
            inflection:
                'The combination of scale, few-shot behaviour and emergent generality was genuinely unprecedented. No prior system had demonstrated this.',
        },
    },
    {
        id: 'alexnet',
        label: 'AlexNet',
        year: 2012,
        month: 9,
        category: 'Architecture',
        description:
            'A deep convolutional neural network trained on two consumer GPUs that won the 2012 ImageNet competition by a 10-point margin. It was the first network to demonstrate that depth plus GPU compute beat the field decisively on a large-scale vision benchmark.',
        previousParadigm:
            'Hand-engineered feature extractors (SIFT, HOG) fed into shallow classifiers like SVMs. Domain experts designed the features; the model only learned the final classification boundary.',
        thesis:
            "Deep networks trained on consumer GPUs beat hand-engineered features by a margin wide enough to redirect what researchers believed was worth pursuing.",
        i3: { inversion: 9, incentives: 9, inflection: 9 },
        rationale: {
            inversion:
                'Inverted the assumption that hand-engineered features plus SVMs were the right approach. Learned features won decisively enough to end a subfield.',
            incentives:
                'Vision was already commercially valuable and the barrier to entry was a gaming GPU. Every lab could reproduce it; every company with images had a reason to.',
            inflection:
                'The combination of deep networks, GPU training and scale beating engineered systems was genuinely new. It changed what researchers believed was worth pursuing.',
        },
    },
    {
        id: 'chatgpt-release',
        label: 'ChatGPT',
        year: 2022,
        month: 11,
        category: 'Distribution',
        description:
            'OpenAI\'s free public release of a chat interface wrapping an RLHF-tuned GPT-3.5 model. It reached 1 million users in 5 days and 100 million in 2 months — the fastest consumer adoption in history — without introducing any new technical capability.',
        previousParadigm:
            'AI access was mediated by APIs, research demos and developer tools. Consumer interaction with powerful models required prompt engineering literacy and API keys.',
        thesis:
            'No new capability — every component pre-existed — but a chat interface converted AI from a research programme into a competitive emergency, a revenue line and a political object simultaneously.',
        i3: { inversion: 7, incentives: 10, inflection: 9 },
        rationale: {
            inversion:
                'Inverted the public model of what software does: from a tool you instruct precisely to something you ask. No technical novelty — a social and interface inversion.',
            incentives:
                'Triggered code red at Google, accelerated the Microsoft–OpenAI investment, and converted the capex cycle into a political object. The incentive event of the era.',
            inflection:
                'The inflection was attention, capital and regulation all shifting simultaneously. The technical trajectory did not change; everything else did at once.',
        },
    },
    {
        id: 'scaling-laws',
        label: 'Scaling Laws',
        year: 2020,
        month: 1,
        category: 'Scaling',
        description:
            'A Kaplan et al. paper at OpenAI showing that language model loss follows smooth power laws as compute, data and parameters are scaled — and that these curves are predictable across many orders of magnitude.',
        previousParadigm:
            'AI progress was assumed to come from architectural innovation and algorithmic insight. Researchers evaluated new ideas primarily through qualitative ablations and benchmark improvements, not quantitative spend forecasts.',
        thesis:
            'Showed that capability follows smooth power laws in compute, converting AI research from a discovery process into a capital allocation process.',
        i3: { inversion: 7, incentives: 9, inflection: 7 },
        rationale: {
            inversion:
                'Inverted the assumption that progress came from architectural insight. Within a fixed architecture, capability was predictable from spend.',
            incentives:
                'If capability is purchasable and predictable, the actor with the most capital wins. This is the paper that underwrites multi-billion-dollar training runs.',
            inflection:
                'A claim about the shape of a curve, with no new capability demonstrated. These are the most under-weighted inflections; this one reshaped the industry.',
        },
    },
    {
        id: 'bert',
        label: 'BERT',
        year: 2018,
        month: 10,
        category: 'Architecture',
        description:
            'Google\'s Bidirectional Encoder Representations from Transformers. Pretrained on masked-language-modelling and next-sentence prediction, then fine-tuned on downstream NLP tasks. Bidirectional context let it outperform left-to-right GPT-style models on most understanding benchmarks.',
        previousParadigm:
            'NLP models were trained from scratch on each task with task-specific architectures. Transfer learning from pretraining was nascent; unidirectional language models (left-to-right) were the default for sequence representations.',
        thesis:
            "Established the pretrain-then-fine-tune paradigm as the dominant NLP template — the critical intermediate step between task-specific models and GPT-3's prompting paradigm.",
        i3: { inversion: 7, incentives: 9, inflection: 8 },
        consequenceYear: 2020,
        consequenceNote: 'GPT-3 made the next move from fine-tuning to prompting',
        rationale: {
            inversion:
                'Replaced task-specific training from scratch with pretrained representations plus fine-tuning. A whole field reorganised around this template within a year.',
            incentives:
                'Immediately improved every NLP benchmark. Every NLP practitioner had strong reason to switch. Diffusion was near-total within months.',
            inflection:
                'Bidirectional pretraining was genuinely new; the masked-language-model objective produced representations that transferred across tasks in a way nothing prior had.',
        },
    },
    {
        id: 'instructgpt-rlhf',
        label: 'InstructGPT / RLHF',
        year: 2022,
        month: 3,
        category: 'Alignment',
        description:
            'OpenAI\'s method of fine-tuning GPT-3 using Reinforcement Learning from Human Feedback: human labellers ranked model outputs, a reward model was trained on those rankings, and the policy was optimised against it. A 1.3B InstructGPT model was preferred over 175B raw GPT-3.',
        previousParadigm:
            'Raw language models were prompted or fine-tuned on supervised demonstrations. They followed the statistical distribution of training text rather than human intent, producing outputs that were fluent but unreliable for instruction-following.',
        thesis:
            'Showed that preference-tuning on human feedback converted a research artefact into something shippable to non-experts, making consumer AI viable.',
        i3: { inversion: 6, incentives: 9, inflection: 7 },
        rationale: {
            inversion:
                'Separated capability from usefulness. A 1.3B model that followed instructions was preferred over 175B GPT-3. Scale was not the only axis.',
            incentives:
                'Created the product surface for consumer distribution and therefore the entire revenue base of the industry. Enormous product-shaped incentive.',
            inflection:
                'Introduced almost no new technical machinery — RL and human feedback both pre-existed — yet was one of the highest-consequence results of the decade.',
        },
    },
    {
        id: 'alphago-alphazero',
        label: 'AlphaGo / AlphaZero',
        year: 2016,
        month: 1,
        category: 'Reinforcement Learning',
        description:
            'AlphaGo (2016) beat the world Go champion using deep networks trained on human games plus Monte Carlo tree search. AlphaZero (2017) discarded the human corpus entirely, learning solely through self-play from random initialisation — and surpassed AlphaGo within days.',
        previousParadigm:
            'Game-playing AI relied on human knowledge: handcrafted evaluation functions, opening books and endgame tablebases. The prevailing assumption was that superhuman performance required encoding human expertise.',
        thesis:
            'AlphaZero showed human demonstrations are a constraint rather than a resource — RL against a verifiable signal can exceed the human ceiling wherever correctness is checkable.',
        i3: { inversion: 8, incentives: 6, inflection: 8 },
        consequenceYear: 2024,
        consequenceNote: 'RL against verifiable rewards industrialised in o1 and R1 reasoning models',
        rationale: {
            inversion:
                'Removing the human corpus improved rather than degraded performance. Human knowledge was revealed as a ceiling, not a floor — a clean paradigm inversion.',
            incentives:
                'Board games have no market; the direct incentive was weak. The transferable method only found its economic use case nearly a decade later.',
            inflection:
                'The result that RL against a verifiable signal can exceed the human ceiling was genuinely novel and turned out to matter enormously once applicable domains emerged.',
        },
    },
    {
        id: 'alphafold-2',
        label: 'AlphaFold 2',
        year: 2020,
        month: 11,
        category: 'Architecture',
        description:
            'DeepMind\'s system that predicts a protein\'s 3D structure from its amino acid sequence with near-experimental accuracy. It won CASP14 by a margin that made the competition effectively over, and DeepMind subsequently released 200M+ predicted structures freely.',
        previousParadigm:
            'Protein structure determination required X-ray crystallography, cryo-electron microscopy or NMR — experimental techniques that took months to years per protein and required specialist equipment. Computational prediction had plateaued for decades.',
        thesis:
            'Collapsed protein structure prediction from laboratory-years to compute-minutes — the clearest demonstration that the paradigm reaches beyond language.',
        i3: { inversion: 8, incentives: 8, inflection: 7 },
        rationale: {
            inversion:
                'Replaced physical experiment — X-ray crystallography, NMR, cryo-EM — as the method for a large class of structure determinations. A bottleneck measured in years collapsed.',
            incentives:
                'DeepMind released 200M+ structures free. Adoption in structural biology was immediate and near-universal — the fastest diffusion in the canon after AlexNet.',
            inflection:
                'The transformer leaving NLP entirely to solve a fifty-year biology problem is the strongest possible evidence a result is general rather than local.',
        },
    },
    {
        id: 'stable-diffusion',
        label: 'Stable Diffusion',
        year: 2022,
        month: 8,
        category: 'Distribution',
        description:
            'A latent diffusion model for text-to-image generation released openly by Stability AI with full weights. Running on a consumer GPU, it could generate photorealistic images from text prompts in seconds — and anyone could download, fine-tune or redistribute it.',
        previousParadigm:
            'Frontier image generation (DALL·E 2, Midjourney) was gated behind APIs and waitlists controlled by the developers. High-quality generation required datacentre hardware.',
        thesis:
            'The open-weight release of a consumer-runnable image model created an independent ecosystem — the clearest case that distribution method can be a larger inflection than the underlying capability.',
        i3: { inversion: 6, incentives: 9, inflection: 7 },
        rationale: {
            inversion:
                'Inverted the assumption that image generation required a datacentre. The open release specifically inverted who could participate — no permission required.',
            incentives:
                'Within months there were thousands of fine-tunes, LoRAs and commercial tools. Every creative professional had a reason to engage; every platform had a reason to integrate.',
            inflection:
                'The contrast with gated DALL·E 2 demonstrates the inflection was the release decision, not the architecture. The open one produced an industry; the closed one produced a product.',
        },
    },
    {
        id: 'chinchilla',
        label: 'Chinchilla',
        year: 2022,
        month: 3,
        category: 'Scaling',
        description:
            'A DeepMind paper showing that Kaplan\'s scaling laws had underweighted training data relative to parameters. A 70B-parameter model trained on 1.4 trillion tokens (Chinchilla) outperformed the 280B Gopher trained on 300B tokens, at four times lower compute cost.',
        previousParadigm:
            'Kaplan et al.\'s 2020 scaling laws suggested parameters should scale faster than data. The industry had raced to train ever-larger models on relatively fixed datasets — GPT-3 (175B), Gopher (280B), PaLM (540B).',
        thesis:
            "Corrected Kaplan's scaling coefficients: data, not parameters, was the binding input — enabling small capable open-weight models and triggering the data licensing industry.",
        i3: { inversion: 5, incentives: 8, inflection: 6 },
        rationale: {
            inversion:
                "Ended the parameter-count race by showing the race was being run on the wrong variable. Kaplan's coefficients were wrong; the scaling phenomenon survived.",
            incentives:
                'Immediate cost reduction for anyone training a model. Adoption was near-total within a year. Made small powerful models economically sensible.',
            inflection:
                'Made data the binding input, which made scraping valuable, which made it litigated. One technical correction triggered a legal and commercial chain.',
        },
    },
    {
        id: 'word2vec',
        label: 'word2vec',
        year: 2013,
        month: 1,
        category: 'Architecture',
        description:
            'A Google method training a shallow neural network to predict surrounding words, producing dense vector representations where semantic similarity corresponds to geometric proximity — "king − man + woman ≈ queen".',
        previousParadigm:
            'Words were represented as one-hot sparse vectors or via hand-built lexical resources (WordNet, synonym dictionaries). Semantic relationships had to be encoded explicitly by humans.',
        thesis:
            'Showed that learned dense representations encode semantic relationships at scale, establishing the vector as the practical substrate for meaning in NLP.',
        i3: { inversion: 6, incentives: 7, inflection: 6 },
        rationale: {
            inversion:
                'Replaced symbolic knowledge representation — dictionaries, ontologies, hand-built graphs — with vectors learned from raw co-occurrence statistics.',
            incentives:
                'Improved search ranking, recommendation and translation at low cost. Adoption was quiet, commercial and near-universal in industry NLP.',
            inflection:
                'The technique was superseded within years, but the premise — meaning is geometric and learnable from raw text — became permanent infrastructure.',
        },
    },
    {
        id: 'test-time-compute',
        label: 'Test-Time Compute (o1)',
        year: 2024,
        month: 9,
        category: 'Reasoning',
        description:
            'OpenAI\'s o1 model, trained to spend variable amounts of compute at inference time by generating extended internal reasoning chains before answering. Performance on hard math and coding problems scaled with the reasoning budget, independent of model size.',
        previousParadigm:
            'Model capability was a fixed property of trained weights. Inference was a cost to minimise — one forward pass per token, with quality determined entirely by training.',
        thesis:
            'Established inference compute as a second scaling axis — capability as a dial to be turned rather than a fixed property of trained weights.',
        i3: { inversion: 7, incentives: 8, inflection: 7 },
        consequenceYear: 2025,
        consequenceNote: 'DeepSeek-R1 confirmed the effect is not proprietary',
        rationale: {
            inversion:
                'Inverted the assumption that capability is fixed once training ends. Inference stops being a cost to minimise and becomes a quality dial.',
            incentives:
                'Reshapes serving economics: cheap fast answers and expensive careful ones from the same weights. Every AI product company has a reason to adopt this model.',
            inflection:
                'A second scaling axis independent of training spend was not anticipated. Whether it extends beyond verifiable domains remains open.',
        },
    },
    {
        id: 'chain-of-thought',
        label: 'Chain-of-Thought',
        year: 2022,
        month: 1,
        category: 'Reasoning',
        description:
            'A Wei et al. paper showing that prompting large language models to produce intermediate reasoning steps — "let\'s think step by step" — dramatically improved performance on arithmetic, symbolic and commonsense reasoning tasks that direct prompting failed.',
        previousParadigm:
            'Models were prompted to answer directly. Reasoning capability was assumed to be a fixed property of model weights, with no way to elicit more careful thinking at inference time.',
        thesis:
            'Discovered that capability is partly a function of inference-time computation, unlockable with a prompt — the conceptual ancestor of the test-time compute axis.',
        i3: { inversion: 3, incentives: 7, inflection: 4 },
        consequenceYear: 2024,
        consequenceNote: 'Industrialised as the basis of o1 and R1 reasoning training',
        rationale: {
            inversion:
                'Partial inversion: it showed capability is elicited, not merely possessed, but did not replace the training paradigm — it supplemented it.',
            incentives:
                'Free to adopt, worked on models already in use, improved measured performance. Near-instant diffusion among practitioners.',
            inflection:
                'Opened the inference-compute axis that o1 later industrialised. A prompting technique is the lowest-status form for an important result; this one was widely treated as a trick.',
        },
    },
    {
        id: 'lora',
        label: 'LoRA',
        year: 2021,
        month: 6,
        category: 'Efficiency',
        description:
            'Low-Rank Adaptation: instead of updating all model weights during fine-tuning, LoRA freezes the original weights and injects small trainable rank-decomposition matrices into each layer. The adapter is typically <1% of the base model\'s parameter count.',
        previousParadigm:
            'Fine-tuning a large model required updating and storing all its parameters — computationally and memory-intensive enough to require multi-GPU datacentre setups inaccessible to most practitioners.',
        thesis:
            'Moved model customisation across a capital threshold — from a datacentre operation to a consumer GPU — enabling the open-weight ecosystem.',
        i3: { inversion: 4, incentives: 8, inflection: 5 },
        rationale: {
            inversion:
                'Did not invert the fine-tuning paradigm — it made fine-tuning cheaper. The prior approach was not wrong, just expensive.',
            incentives:
                'Huge at the periphery: everyone outside frontier labs could now participate. The ecosystem of shared adapters it enabled had strong adoption incentives.',
            inflection:
                'Moved a capability across a price threshold, changing the population of actors. A change in who can do something is a structural change even when the method is unchanged.',
        },
    },
    {
        id: 'flash-attention',
        label: 'FlashAttention',
        year: 2022,
        month: 5,
        category: 'Efficiency',
        description:
            'A Dao et al. algorithm that restructures the attention computation to minimise slow HBM (GPU memory) reads and writes, keeping activations in fast SRAM. Produces mathematically identical outputs to standard attention, 2–4× faster, with no accuracy loss.',
        previousParadigm:
            'Standard attention wrote all intermediate attention matrices to GPU memory. As context length grew, memory bandwidth became the bottleneck, making long sequences prohibitively expensive.',
        thesis:
            "Reframed attention's cost as a memory-bandwidth problem, making long context windows commercially viable without any accuracy trade-off.",
        i3: { inversion: 2, incentives: 8, inflection: 4 },
        rationale: {
            inversion:
                'Did not invert the attention paradigm. Showed the bottleneck was misdiagnosed, but the architecture and use case remained unchanged.',
            incentives:
                'Exact same outputs, strictly lower cost, drop-in replacement. Adopted across essentially every serious training stack within a year.',
            inflection:
                'Engineering, not science — no conceptual novelty. Its consequence is legible only in what it made affordable: context windows went from 4k to 100k+ within two years.',
        },
    },
    {
        id: 'mixture-of-experts',
        label: 'Sparse MoE',
        year: 2017,
        month: 1,
        category: 'Architecture',
        description:
            'A Shazeer et al. architecture introducing a learned routing layer that sends each token to only a small subset of specialised "expert" sub-networks, rather than the full model. Total parameters can be enormous while per-token compute stays constant.',
        previousParadigm:
            'Dense models activated every parameter for every token. Scaling capacity meant proportionally scaling compute cost — larger models were uniformly more expensive to run.',
        thesis:
            'Decoupled total model capacity from per-token compute cost — demonstrable in 2017, engineerable in 2023, now assumed in most frontier systems.',
        i3: { inversion: 3, incentives: 7, inflection: 3 },
        consequenceYear: 2023,
        consequenceNote: 'Widely adopted at frontier; Mixtral made the design openly available',
        rationale: {
            inversion:
                'Partial architectural inversion: broke the coupling between capacity and compute cost, but within the existing transformer paradigm.',
            incentives:
                'Strong for anyone serving at volume, but the engineering barriers kept the incentive from materialising for six years.',
            inflection:
                'The gap between demonstrated and engineerable was half a decade. During that gap it was indistinguishable from a false positive.',
        },
    },
    {
        id: 'deepseek-r1',
        label: 'DeepSeek-R1',
        year: 2025,
        month: 1,
        category: 'Reinforcement Learning',
        description:
            'A Chinese lab\'s open-weights reasoning model trained with RL against verifiable math and code rewards — achieving performance competitive with o1 at a reported training cost roughly 20× lower. Weights were released publicly.',
        previousParadigm:
            'Frontier reasoning models (o1) were closed-weights and assumed to require nine-figure training budgets only accessible to well-capitalised Western labs.',
        thesis:
            "Open-weights frontier-adjacent reasoning at a fraction of Western training cost — challenging the capital moat assumption and converting test-time compute from one lab's product into an openly available phenomenon.",
        i3: { inversion: 6, incentives: 8, inflection: 6 },
        rationale: {
            inversion:
                'Challenged the assumption that frontier reasoning required closed weights and nine-figure budgets. Did not invert the technical paradigm — o1 had already established it.',
            incentives:
                'Immediate for enterprises wanting on-premises deployment, states wanting sovereign capability, and researchers wanting something to study.',
            inflection:
                'Converted test-time compute from a single lab product into an openly reproducible phenomenon. The geopolitical and financial consequences were more significant than the technical ones.',
        },
    },
];

// ─── compute i3Score ──────────────────────────────────────────────────────────

export const I3_DATA: I3Entry[] = RAW.map((e) => ({
    ...e,
    i3Score: e.i3.inversion * e.i3.incentives * e.i3.inflection,
}));

// ─── derived helpers ──────────────────────────────────────────────────────────

export const I3_CATEGORIES = Array.from(
    new Set(I3_DATA.map((d) => d.category)),
).sort() as I3Category[];

export const I3_CATEGORY_COLORS: Record<I3Category, string> = {
    Architecture: 'var(--color-bronze)',
    Scaling: 'var(--color-platinum)',
    Alignment: '#7a9e87',
    Reasoning: '#7e9ec4',
    Efficiency: '#9e8c7a',
    Multimodal: '#a07e9e',
    'Reinforcement Learning': '#c4a87e',
    Distribution: '#c47e7e',
};

export const I3_MIN_YEAR = Math.min(...I3_DATA.map((d) => d.year));
export const I3_MAX_YEAR = Math.max(...I3_DATA.map((d) => d.consequenceYear ?? d.year));

/** Max possible I³ score: 10 × 10 × 10 = 1000 */
export const I3_MAX_SCORE = 1000;
