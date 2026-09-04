//app/ai/architecture

'use client';

import { useState } from 'react';

// ─── data ─────────────────────────────────────────────────────────────────────

type Level = {
    id: string;
    label: string;
    concepts: string[];
};

type Entry = {
    id: string;
    level: string;
    title: string;
    body: React.ReactNode;
};

const LEVELS: Level[] = [
    {
        id: 'representation',
        label: 'Representation',
        concepts: ['Tokens', 'Tokenization', 'Embeddings', 'Positional encoding'],
    },
    {
        id: 'architecture',
        label: 'Model architecture',
        concepts: ['Transformers', 'Attention', 'Q/K/V', 'MLP', 'Residuals', 'Normalization', 'MoE'],
    },
    {
        id: 'training',
        label: 'Training',
        concepts: ['Pretraining', 'Loss', 'Backpropagation', 'Optimizers', 'SFT', 'RLHF / RL', 'Distillation'],
    },
    {
        id: 'inference',
        label: 'Inference',
        concepts: ['Autoregression', 'Logits', 'Sampling', 'KV cache', 'GQA', 'Quantization', 'Test-time compute'],
    },
    {
        id: 'systems',
        label: 'AI systems',
        concepts: ['RAG', 'Tools', 'Agents', 'Memory', 'Multimodality'],
    },
];

const ENTRIES: Entry[] = [
    {
        id: 'tokenization',
        level: 'representation',
        title: 'Tokenization',
        body: (
            <div className="space-y-4">
                <p>Before a model can process text, the text gets broken into tokens.</p>
                <div className="border border-stone-line bg-obsidian px-5 py-4">
                    <p className="font-mono text-[0.72rem] tracking-[0.08em] text-bronze-bright">"Transformers are powerful"</p>
                    <p className="mt-2 font-mono text-[0.72rem] tracking-[0.08em] text-platinum-dim">→ ["Transform", "ers", " are", " powerful"]</p>
                    <p className="mt-2 font-mono text-[0.72rem] tracking-[0.08em] text-platinum-dim">→ [4theid, 999, 527, 3477]</p>
                </div>
                <p>An LLM does not see words. It sees sequences of token IDs. Different models use different tokenizers and vocabularies — often tens or hundreds of thousands of tokens.</p>
            </div>
        ),
    },
    {
        id: 'embeddings',
        level: 'representation',
        title: 'Embeddings',
        body: (
            <div className="space-y-4">
                <p>A token ID by itself has no useful meaning. The model converts every token into a vector.</p>
                <div className="border border-stone-line bg-obsidian px-5 py-4">
                    <p className="font-mono text-[0.72rem] tracking-[0.08em] text-bronze-bright">token → [0.14, −0.72, 1.21, ...]</p>
                </div>
                <p>Instead of representing concepts as discrete labels, neural networks represent them as locations and directions in a high-dimensional mathematical space.</p>
                <div className="border-l-2 border-bronze-dim pl-4">
                    <p className="font-mono text-[0.7rem] tracking-[0.08em] text-platinum-dim">tokenization  =  language → symbols</p>
                    <p className="mt-1 font-mono text-[0.7rem] tracking-[0.08em] text-platinum-dim">embedding     =  symbols → geometry</p>
                </div>
                <p>Embeddings are one of the foundational concepts of modern AI — not just LLMs.</p>
            </div>
        ),
    },
    {
        id: 'neural-networks',
        level: 'representation',
        title: 'Neural networks',
        body: (
            <div className="space-y-4">
                <p>An LLM is a gigantic neural network. The basic operation is surprisingly simple.</p>
                <div className="border border-stone-line bg-obsidian px-5 py-4">
                    <p className="font-mono text-[0.72rem] tracking-[0.08em] text-bronze-bright">output = activation(input × weights + bias)</p>
                </div>
                <p>Training adjusts billions or trillions of weights so that the network becomes better at predicting the desired output. A "parameter" is one of these learned numerical values.</p>
                <div className="border border-stone-line bg-obsidian px-5 py-4 font-mono text-[0.7rem] tracking-[0.08em] text-platinum-dim">
                    <p>7B model  = ~7 billion parameters</p>
                    <p className="mt-1">70B model = ~70 billion parameters</p>
                </div>
            </div>
        ),
    },
    {
        id: 'transformers',
        level: 'architecture',
        title: 'Transformers',
        body: (
            <div className="space-y-4">
                <p>The Transformer was introduced in 2017 and replaced older architectures that processed language primarily one word at a time. Its central mechanism is <span className="text-bronze-bright">attention</span>.</p>
                <p>Instead of only looking at the immediately preceding state, the model determines which other tokens are relevant to understanding a given token.</p>
                <div className="border border-stone-line bg-obsidian px-5 py-4">
                    <p className="font-mono text-[0.7rem] tracking-[0.06em] text-platinum-dim">"The animal didn't cross the street because <span className="text-bronze-bright">it</span> was tired."</p>
                    <p className="mt-3 font-mono text-[0.7rem] tracking-[0.06em] text-platinum-dim">
                        The <span className="text-bronze-bright">animal</span> didn't cross the street because <span className="text-bronze-bright">it</span> was tired
                    </p>
                    <p className="mt-1 font-mono text-[0.68rem] tracking-[0.06em] text-stone-line-strong">
                        {"     ↑___________________________________↑"}
                    </p>
                    <p className="mt-1 font-mono text-[0.68rem] tracking-[0.06em] text-platinum-dim">attention connects "it" → "animal"</p>
                </div>
                <p>This ability to dynamically relate tokens to any other token in the sequence is why Transformers became dominant.</p>
            </div>
        ),
    },
    {
        id: 'self-attention',
        level: 'architecture',
        title: 'Self-attention & Q/K/V',
        body: (
            <div className="space-y-4">
                <p>In an LLM, tokens attend to other tokens within the same sequence — hence <span className="text-bronze-bright">self-attention</span>. Each token generates three representations.</p>
                <div className="border border-stone-line bg-obsidian px-5 py-4 space-y-2 font-mono text-[0.7rem] tracking-[0.08em]">
                    <p><span className="text-bronze-bright">Q — Query</span>  <span className="text-platinum-dim ml-4">"What am I looking for?"</span></p>
                    <p><span className="text-bronze-bright">K — Key</span>    <span className="text-platinum-dim ml-4">"What information do I contain?"</span></p>
                    <p><span className="text-bronze-bright">V — Value</span>  <span className="text-platinum-dim ml-4">"What information should I contribute?"</span></p>
                </div>
                <p>The model compares <code className="font-mono text-[0.72rem] text-bronze">Query × Key</code> to determine relevance, then retrieves from the corresponding Values.</p>
                <div className="border-l-2 border-bronze-dim pl-4">
                    <p className="text-platinum-dim">Q/K determine relevance. V carries the information.</p>
                </div>
            </div>
        ),
    },
    {
        id: 'multi-head-attention',
        level: 'architecture',
        title: 'Multi-head attention',
        body: (
            <div className="space-y-4">
                <p>The model performs attention multiple times in parallel. Different heads can capture different relationships simultaneously.</p>
                <div className="border border-stone-line bg-obsidian px-5 py-4 font-mono text-[0.7rem] tracking-[0.08em] text-platinum-dim space-y-1">
                    <p>→ syntax</p>
                    <p>→ subject / object relationships</p>
                    <p>→ positional relationships</p>
                    <p>→ semantic similarity</p>
                    <p>→ long-range dependencies</p>
                </div>
                <p>Their outputs are combined. Hence: <span className="text-bronze-bright">Multi-Head Attention</span>.</p>
            </div>
        ),
    },
    {
        id: 'transformer-block',
        level: 'architecture',
        title: 'The Transformer block',
        body: (
            <div className="space-y-4">
                <p>Attention is not the whole Transformer. A block looks like this, and many blocks are stacked in sequence.</p>
                <div className="border border-stone-line bg-obsidian px-5 py-4 font-mono text-[0.7rem] tracking-[0.08em] text-platinum-dim space-y-1">
                    <p className="text-bronze-bright">Input</p>
                    <p>  ↓  Attention</p>
                    <p>  ↓  Residual connection</p>
                    <p>  ↓  Normalization</p>
                    <p>  ↓  Feed-forward (MLP)</p>
                    <p>  ↓  Residual connection</p>
                    <p className="text-bronze-bright">  ↓  Normalization</p>
                </div>
                <div className="border-l-2 border-bronze-dim pl-4 space-y-1">
                    <p className="text-platinum-dim">Attention = communication between tokens.</p>
                    <p className="text-platinum-dim">MLP = computation within each token representation.</p>
                </div>
            </div>
        ),
    },
    {
        id: 'mlp',
        level: 'architecture',
        title: 'MLP / Feed-forward network',
        body: (
            <div className="space-y-4">
                <p>After attention lets tokens exchange information, each token passes through an MLP or FFN. A large fraction of an LLM's parameters live here.</p>
                <div className="border-l-2 border-bronze-dim pl-4 space-y-1">
                    <p className="text-platinum-dim">Attention: "What information elsewhere matters?"</p>
                    <p className="text-platinum-dim">MLP: "Now what should I do with that information?"</p>
                </div>
                <p>This distinction leads directly to the next major architectural concept — MoE.</p>
            </div>
        ),
    },
    {
        id: 'moe',
        level: 'architecture',
        title: 'Mixture of Experts (MoE)',
        body: (
            <div className="space-y-4">
                <p>MoE replaces the single MLP with many expert MLPs. A small router decides which experts process each token.</p>
                <div className="border border-stone-line bg-obsidian px-5 py-4 font-mono text-[0.7rem] tracking-[0.08em] text-platinum-dim">
                    <p className="text-bronze-bright mb-2">Dense</p>
                    <p>Token → entire network → output</p>
                    <p className="text-bronze-bright mt-4 mb-2">MoE</p>
                    <p>Token → router → Expert 2, Expert 7 → output</p>
                    <p className="mt-2 text-[0.65rem]">(64 experts total, 2–4 activated per token)</p>
                </div>
                <p>This produces a critical distinction: <span className="text-bronze-bright">total parameters</span> vs <span className="text-bronze-bright">active parameters</span>. A 500B model might use only 40B per token — sparse activation.</p>
                <p>MoE is one of the most important architectures for scaling models efficiently. Its tradeoffs include routing complexity, memory requirements, and communication overhead.</p>
            </div>
        ),
    },
    {
        id: 'positional-encoding',
        level: 'representation',
        title: 'Positional encoding & RoPE',
        body: (
            <div className="space-y-4">
                <p>Attention by itself doesn't understand order. But word order matters — "dog bites man" ≠ "man bites dog".</p>
                <p>Modern LLMs use <span className="text-bronze-bright">RoPE</span> — Rotary Positional Embeddings — which mathematically rotates Q/K representations according to token position.</p>
                <div className="border-l-2 border-bronze-dim pl-4">
                    <p className="text-platinum-dim">RoPE gives attention information about relative token positions. It also determines how well a model handles long context windows.</p>
                </div>
            </div>
        ),
    },
    {
        id: 'context-window',
        level: 'inference',
        title: 'Context window',
        body: (
            <div className="space-y-4">
                <p>The context window is how many tokens the model can work with during a single inference call — 32K, 128K, 1M tokens.</p>
                <div className="border-l-2 border-bronze-dim pl-4 space-y-1">
                    <p className="text-platinum-dim"><span className="text-marble">Weights</span> = what the model learned during training.</p>
                    <p className="text-platinum-dim"><span className="text-marble">Context</span> = information currently placed in front of it.</p>
                </div>
                <p>Context is not permanent memory. A larger context window allows more documents, history, and code to be considered at once — but everything in context is transient.</p>
            </div>
        ),
    },
    {
        id: 'kv-cache',
        level: 'inference',
        title: 'KV cache',
        body: (
            <div className="space-y-4">
                <p>When generating text the model doesn't recompute everything from scratch for every new token. Previous attention Keys and Values are cached.</p>
                <div className="border border-stone-line bg-obsidian px-5 py-4">
                    <p className="font-mono text-[0.7rem] tracking-[0.08em] text-platinum-dim">"The capital of France is" → generate next token</p>
                    <p className="mt-2 font-mono text-[0.7rem] tracking-[0.08em] text-platinum-dim">K/V from prior tokens are stored, not recomputed.</p>
                </div>
                <p>KV cache dramatically speeds generation but consumes significant memory — especially with long contexts, large batches, and many attention heads. This pressure drove GQA.</p>
            </div>
        ),
    },
    {
        id: 'gqa',
        level: 'inference',
        title: 'MHA, MQA and GQA',
        body: (
            <div className="space-y-4">
                <p>Three variants of multi-head attention, differing in how K/V heads are shared.</p>
                <div className="border border-stone-line bg-obsidian px-5 py-4 font-mono text-[0.7rem] tracking-[0.08em]">
                    <p className="text-bronze-bright mb-2">MHA — Multi-Head Attention</p>
                    <p className="text-platinum-dim">Q1→K1V1  Q2→K2V2  Q3→K3V3  Q4→K4V4</p>
                    <p className="text-bronze-bright mt-4 mb-2">GQA — Grouped-Query Attention</p>
                    <p className="text-platinum-dim">Q1,Q2 → K1V1</p>
                    <p className="text-platinum-dim">Q3,Q4 → K2V2</p>
                </div>
                <p><span className="text-bronze-bright">GQA</span> reduces KV-cache memory while retaining much of MHA's quality. It is now the standard in most production LLMs.</p>
            </div>
        ),
    },
    {
        id: 'autoregression',
        level: 'inference',
        title: 'Autoregressive generation',
        body: (
            <div className="space-y-4">
                <p>Most LLMs generate one token at a time, appending each to the sequence and predicting the next.</p>
                <div className="border border-stone-line bg-obsidian px-5 py-4 font-mono text-[0.7rem] tracking-[0.08em] text-platinum-dim space-y-1">
                    <p>"The capital of France is"</p>
                    <p className="text-bronze-bright">→ Paris (0.94)</p>
                    <p>"The capital of France is Paris"</p>
                    <p className="text-bronze-bright">→ . (0.71)</p>
                </div>
                <div className="border-l-2 border-bronze-dim pl-4">
                    <p className="text-platinum-dim">predict next token → append → predict next token → repeat</p>
                </div>
                <p>The remarkable part is how much sophisticated behavior emerges from this simple objective at sufficient scale.</p>
            </div>
        ),
    },
    {
        id: 'logits-sampling',
        level: 'inference',
        title: 'Logits, softmax & temperature',
        body: (
            <div className="space-y-4">
                <p>The model's final layer produces <span className="text-bronze-bright">logits</span> — raw scores for possible next tokens. Softmax converts them into a probability distribution.</p>
                <div className="border border-stone-line bg-obsidian px-5 py-4 font-mono text-[0.7rem] tracking-[0.08em] space-y-1">
                    <p className="text-bronze-bright mb-2">Temperature</p>
                    <p className="text-platinum-dim">Low  → concentrated / predictable</p>
                    <p className="text-platinum-dim">High → diverse / unpredictable</p>
                </div>
                <p>Other decoding strategies include top-k and top-p sampling. These are inference strategies, not model architecture.</p>
            </div>
        ),
    },
    {
        id: 'pretraining',
        level: 'training',
        title: 'Pretraining',
        body: (
            <div className="space-y-4">
                <p>During pretraining, enormous amounts of text and code are fed into the model. The basic task is simply: <span className="text-bronze-bright">predict the next token</span>.</p>
                <div className="border border-stone-line bg-obsidian px-5 py-4">
                    <p className="font-mono text-[0.7rem] tracking-[0.08em] text-platinum-dim">"Paris is the capital of ___"</p>
                    <p className="mt-2 font-mono text-[0.7rem] tracking-[0.08em] text-platinum-dim">→ loss computed → backpropagation → weights adjusted</p>
                    <p className="mt-2 font-mono text-[0.7rem] tracking-[0.08em] text-platinum-dim">→ repeat trillions of times</p>
                </div>
                <div className="border-l-2 border-bronze-dim pl-4">
                    <p className="text-platinum-dim">Pretraining builds broad capability. Post-training shapes behavior.</p>
                </div>
            </div>
        ),
    },
    {
        id: 'post-training',
        level: 'training',
        title: 'Post-training & fine-tuning',
        body: (
            <div className="space-y-4">
                <p>A pretrained model isn't automatically a useful assistant. Post-training teaches behavior.</p>
                <div className="border border-stone-line bg-obsidian px-5 py-4 font-mono text-[0.7rem] tracking-[0.08em] space-y-1">
                    <p className="text-bronze-bright">SFT</p>
                    <p className="text-platinum-dim ml-4">Supervised fine-tuning on good question → answer examples.</p>
                    <p className="text-bronze-bright mt-2">RLHF</p>
                    <p className="text-platinum-dim ml-4">Humans provide preference feedback; model trained against it.</p>
                    <p className="text-bronze-bright mt-2">DPO</p>
                    <p className="text-platinum-dim ml-4">Directly optimize preferred responses vs rejected responses.</p>
                </div>
                <p>More recent reasoning-oriented training rewards models for successfully solving tasks rather than imitating answers — shifting from behavioral to outcome-based training.</p>
            </div>
        ),
    },
    {
        id: 'reasoning',
        level: 'inference',
        title: 'Reasoning models & test-time compute',
        body: (
            <div className="space-y-4">
                <p>A "reasoning model" is not a fundamentally different architecture. It typically means the model can spend substantially more computation solving difficult problems.</p>
                <div className="border-l-2 border-bronze-dim pl-4 space-y-1">
                    <p className="text-platinum-dim">Traditional scaling: <span className="text-marble">bigger training run → better model.</span></p>
                    <p className="text-platinum-dim">Reasoning scaling: <span className="text-marble">more compute after the question is asked → better answer.</span></p>
                </div>
                <p>Test-time compute is becoming one of the major dimensions of AI scaling, complementary to training-time scaling.</p>
            </div>
        ),
    },
    {
        id: 'quantization',
        level: 'inference',
        title: 'Quantization',
        body: (
            <div className="space-y-4">
                <p>Model weights can be stored in lower precision formats to reduce memory and compute requirements.</p>
                <div className="border border-stone-line bg-obsidian px-5 py-4 font-mono text-[0.7rem] tracking-[0.08em] text-platinum-dim space-y-1">
                    <p>FP16 (16-bit)  ~100 GB</p>
                    <p className="text-stone-line-strong">  ↓ quantize</p>
                    <p>INT8 (8-bit)   ~50 GB</p>
                    <p className="text-stone-line-strong">  ↓ quantize</p>
                    <p>INT4 (4-bit)   ~25 GB</p>
                </div>
                <p>Quantization allows large models to run much more cheaply and sometimes locally. The tradeoff is potential accuracy degradation at aggressive quantization levels.</p>
            </div>
        ),
    },
    {
        id: 'distillation',
        level: 'training',
        title: 'Distillation',
        body: (
            <div className="space-y-4">
                <p>A large, expensive model (the <span className="text-bronze-bright">teacher</span>) generates outputs used to train a smaller model (the <span className="text-bronze-bright">student</span>).</p>
                <div className="border border-stone-line bg-obsidian px-5 py-4 font-mono text-[0.7rem] tracking-[0.08em] text-platinum-dim">
                    <p>Huge frontier model</p>
                    <p className="text-stone-line-strong">  ↓ generated knowledge</p>
                    <p>Smaller efficient model</p>
                </div>
                <p>Distillation is one route for turning expensive frontier capabilities into cheaper, deployable models. The student learns to approximate the teacher's behavior rather than learning from raw data alone.</p>
            </div>
        ),
    },
    {
        id: 'rag',
        level: 'systems',
        title: 'RAG',
        body: (
            <div className="space-y-4">
                <p>Retrieval-Augmented Generation extends the model with an external retrieval step.</p>
                <div className="border border-stone-line bg-obsidian px-5 py-4 font-mono text-[0.7rem] tracking-[0.08em] text-platinum-dim space-y-1">
                    <p>User question</p>
                    <p>  ↓  search / retrieval</p>
                    <p>  ↓  relevant documents → inserted into context</p>
                    <p className="text-bronze-bright">  ↓  LLM answer</p>
                </div>
                <div className="border-l-2 border-bronze-dim pl-4 space-y-1">
                    <p className="text-platinum-dim"><span className="text-marble">Parametric knowledge</span> → encoded in weights, learned at training time.</p>
                    <p className="text-platinum-dim"><span className="text-marble">Retrieved knowledge</span> → inserted into context at inference time.</p>
                </div>
            </div>
        ),
    },
    {
        id: 'tools-agents',
        level: 'systems',
        title: 'Tool use & agents',
        body: (
            <div className="space-y-4">
                <p>Another layer sits entirely outside the model weights. Instead of merely generating text, the model is given access to actions.</p>
                <div className="border border-stone-line bg-obsidian px-5 py-4 font-mono text-[0.7rem] tracking-[0.08em] text-platinum-dim space-y-1">
                    <p>LLM → Tools</p>
                    <p className="ml-6">→ Search web</p>
                    <p className="ml-6">→ Run Python</p>
                    <p className="ml-6">→ Query database</p>
                    <p className="ml-6">→ Execute code</p>
                </div>
                <p>The model reasons about a problem, calls a tool, observes the result, and continues. This is the foundation of agentic AI — systems that act, not just respond.</p>
            </div>
        ),
    },
];

// ─── level pill colors ────────────────────────────────────────────────────────

const LEVEL_COLOR: Record<string, string> = {
    representation: 'var(--color-bronze-dim)',
    architecture: 'var(--color-bronze)',
    training: '#8b7355',
    inference: '#6b8b9e',
    systems: '#7a8b6b',
};

// ─── page ─────────────────────────────────────────────────────────────────────

export default function AIArchitecturePage() {
    const [activeLevel, setActiveLevel] = useState<string | null>(null);
    const [openId, setOpenId] = useState<string | null>(null);

    const filtered = activeLevel
        ? ENTRIES.filter((e) => e.level === activeLevel)
        : ENTRIES;

    function toggle(id: string) {
        setOpenId((prev) => (prev === id ? null : id));
    }

    return (
        <div className="flex h-[calc(100svh-4rem-1px)] flex-col overflow-hidden">

            {/* header */}
            <header className="shrink-0 border-b border-stone-line px-8 py-4">
                <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
                    <h1 className="font-serif text-2xl font-light tracking-[0.16em] text-marble">
                        AI ARCHITECTURE
                    </h1>
                    <p className="hidden font-mono text-[0.7rem] tracking-[0.14em] text-platinum-dim lg:block">
                        {ENTRIES.length} concepts · 5 levels
                    </p>

                    {/* level filters */}
                    <div className="ml-auto flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setActiveLevel(null)}
                            className={`font-sans text-[0.68rem] uppercase tracking-[0.22em] transition-colors duration-500 ease-mechanical ${activeLevel === null ? 'text-bronze' : 'text-platinum-dim hover:text-platinum'}`}
                        >
                            All
                        </button>
                        {LEVELS.map((lv) => (
                            <button
                                key={lv.id}
                                type="button"
                                onClick={() => setActiveLevel(lv.id === activeLevel ? null : lv.id)}
                                className={`flex items-center gap-1.5 border px-2.5 py-1 font-sans text-[0.65rem] uppercase tracking-[0.18em] transition-colors duration-500 ease-mechanical ${activeLevel === lv.id
                                    ? 'border-stone-line-strong text-platinum'
                                    : 'border-transparent text-platinum-dim hover:text-platinum'
                                    }`}
                            >
                                <span
                                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                                    style={{
                                        background: LEVEL_COLOR[lv.id],
                                        opacity: activeLevel === null || activeLevel === lv.id ? 1 : 0.3,
                                    }}
                                />
                                {lv.label}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            {/* body */}
            <div className="flex min-h-0 flex-1 overflow-hidden">

                {/* left — level map */}
                <aside className="hidden w-64 shrink-0 flex-col gap-px overflow-y-auto border-r border-stone-line py-6 lg:flex">
                    {LEVELS.map((lv) => {
                        const isActive = activeLevel === lv.id || activeLevel === null;
                        return (
                            <button
                                key={lv.id}
                                type="button"
                                onClick={() => setActiveLevel(lv.id === activeLevel ? null : lv.id)}
                                className={`group flex flex-col gap-2 px-6 py-4 text-left transition-colors duration-300 ease-mechanical hover:bg-obsidian/50 ${activeLevel === lv.id ? 'bg-obsidian/40' : ''}`}
                            >
                                <div className="flex items-center gap-2">
                                    <span
                                        className="h-2 w-2 shrink-0 rounded-full"
                                        style={{ background: LEVEL_COLOR[lv.id], opacity: isActive ? 1 : 0.4 }}
                                    />
                                    <span className={`font-sans text-[0.65rem] uppercase tracking-[0.22em] transition-colors duration-300 ${activeLevel === lv.id ? 'text-marble' : 'text-platinum-dim group-hover:text-platinum'}`}>
                                        {lv.label}
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-1 pl-4">
                                    {lv.concepts.map((c) => (
                                        <span key={c} className="font-mono text-[0.58rem] tracking-[0.06em] text-platinum-dim opacity-60">
                                            {c}
                                        </span>
                                    ))}
                                </div>
                            </button>
                        );
                    })}
                </aside>

                {/* right — entry stack */}
                <main className="flex-1 overflow-y-auto">
                    <div className="divide-y divide-stone-line">
                        {filtered.map((entry) => {
                            const isOpen = openId === entry.id;
                            const level = LEVELS.find((l) => l.id === entry.level)!;
                            return (
                                <div key={entry.id} className={`transition-colors duration-300 ease-mechanical ${isOpen ? 'bg-obsidian/30' : 'hover:bg-obsidian/20'}`}>
                                    <button
                                        type="button"
                                        onClick={() => toggle(entry.id)}
                                        aria-expanded={isOpen}
                                        className="flex w-full items-center gap-4 px-8 py-5 text-left"
                                    >
                                        {/* level dot */}
                                        <span
                                            className="h-2 w-2 shrink-0 rounded-full"
                                            style={{ background: LEVEL_COLOR[entry.level] }}
                                        />

                                        {/* title */}
                                        <span className={`flex-1 font-serif text-base font-light tracking-[0.08em] transition-colors duration-300 ${isOpen ? 'text-marble' : 'text-platinum group-hover:text-marble'}`}>
                                            {entry.title}
                                        </span>

                                        {/* level tag — desktop */}
                                        <span className="hidden font-sans text-[0.6rem] uppercase tracking-[0.2em] text-platinum-dim lg:block">
                                            {level.label}
                                        </span>

                                        {/* chevron */}
                                        <svg
                                            width="10"
                                            height="10"
                                            viewBox="0 0 10 10"
                                            fill="none"
                                            aria-hidden
                                            className={`shrink-0 text-platinum-dim transition-transform duration-500 ease-mechanical ${isOpen ? 'rotate-180' : ''}`}
                                        >
                                            <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </button>

                                    {/* expanded body */}
                                    {isOpen && (
                                        <div className="border-t border-stone-line px-8 py-6">
                                            <div className="max-w-2xl font-sans text-[0.78rem] leading-relaxed tracking-[0.03em] text-platinum-dim">
                                                {entry.body}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </main>
            </div>
        </div>
    );
}
