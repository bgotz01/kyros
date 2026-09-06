// ─── AI application layer ────────────────────────────────────────────────────
// What people actually use, not the models underneath.
//
// Four lists: the assistants, the platforms everything is distributed through,
// the open-source layer, and the applications built on top.
//
// Selection rule: diffusion. A product earns a place by changing how a large
// number of people work or create — not by benchmark, funding or demo.
// `year` is first public release. Compiled through mid-2026.
//
// A row can name more than one product (Runway · Veo · Kling), so links are a
// list rather than a single url — each name carries its own destination.

export const APPS_REVIEWED = '2026-09';

export interface AppLink {
    label: string;
    url: string;
}

export interface AppEntry {
    /** One or more products sharing a row. First label is the row identity. */
    links: AppLink[];
    maker: string;
    year: number;
    /** One line: what this changed. Not a feature description. */
    note: string;
    /** Applications only — the domain it operates in. */
    tag?: string;
}

// ─── 01 · assistants ─────────────────────────────────────────────────────────

export const CHATBOTS: AppEntry[] = [
    {
        links: [{ label: 'ChatGPT', url: 'https://chatgpt.com' }],
        maker: 'OpenAI', year: 2022,
        note: 'The distribution event. Set the format every competitor now copies, and still the default.',
    },
    {
        links: [{ label: 'Gemini', url: 'https://gemini.google.com' }],
        maker: 'Google', year: 2023,
        note: 'Pushed through Search, Android and Workspace — reach without having to win anyone over.',
    },
    {
        links: [{ label: 'Claude', url: 'https://claude.ai' }],
        maker: 'Anthropic', year: 2023,
        note: 'Positioned on reliability and long-form work. Strongest pull among developers and enterprises.',
    },
    {
        links: [{ label: 'Grok', url: 'https://grok.com' }],
        maker: 'xAI', year: 2023,
        note: 'Distribution through X, and a deliberately looser posture used as positioning.',
    },
    {
        links: [{ label: 'DeepSeek', url: 'https://chat.deepseek.com' }],
        maker: 'DeepSeek', year: 2025,
        note: 'Top of the US App Store on open weights — inverted the assumed price of frontier access.',
    },
];

// ─── 02 · platforms ──────────────────────────────────────────────────────────

export const PLATFORMS: AppEntry[] = [
    {
        links: [{ label: 'Hugging Face', url: 'https://huggingface.co' }],
        maker: 'Hugging Face', year: 2016,
        note: 'The registry. Open weights have a distribution channel because this exists.',
    },
    {
        links: [{ label: 'OpenRouter', url: 'https://openrouter.ai' }],
        maker: 'OpenRouter', year: 2023,
        note: 'One API across every model. What makes any single model substitutable.',
    },
    {
        links: [{ label: 'Replicate', url: 'https://replicate.com' }],
        maker: 'Replicate', year: 2019,
        note: 'Any open model as a hosted endpoint, without touching a GPU.',
    },
    {
        links: [{ label: 'LMArena', url: 'https://lmarena.ai' }],
        maker: 'LMSYS', year: 2023,
        note: 'Blind human preference. The only ranking labs actually compete on.',
    },
    {
        links: [
            { label: 'Groq', url: 'https://groq.com' },
            { label: 'Together', url: 'https://www.together.ai' },
            { label: 'Fireworks', url: 'https://fireworks.ai' },
        ],
        maker: 'hosted inference', year: 2023,
        note: 'Inference sold as a commodity, priced per million tokens and falling.',
    },
];

// ─── 03 · open source ────────────────────────────────────────────────────────

export const OPEN_SOURCE: AppEntry[] = [
    {
        links: [
            { label: 'Llama', url: 'https://huggingface.co/meta-llama' },
            { label: 'Qwen', url: 'https://huggingface.co/Qwen' },
            { label: 'DeepSeek', url: 'https://huggingface.co/deepseek-ai' },
            { label: 'Mistral', url: 'https://huggingface.co/mistralai' },
            { label: 'gpt-oss', url: 'https://huggingface.co/openai' },
        ],
        maker: 'open weights', year: 2023,
        note: 'Near-frontier models you can download, fine-tune and run with nobody in the loop.',
    },
    {
        links: [{ label: 'llama.cpp', url: 'https://github.com/ggml-org/llama.cpp' }],
        maker: 'Georgi Gerganov', year: 2023,
        note: 'Quantised inference on a laptop CPU. The project that made local models real.',
    },
    {
        links: [{ label: 'Ollama', url: 'https://ollama.com' }],
        maker: 'Ollama', year: 2023,
        note: 'One command to pull and run a model locally. The package manager for weights.',
    },
    {
        links: [{ label: 'vLLM', url: 'https://github.com/vllm-project/vllm' }],
        maker: 'UC Berkeley', year: 2023,
        note: 'The serving engine most self-hosted inference actually runs on.',
    },
    {
        links: [{ label: 'ComfyUI', url: 'https://github.com/comfyanonymous/ComfyUI' }],
        maker: 'comfyanonymous', year: 2023,
        note: 'Node-graph control over image and video generation. Where the open creative stack lives.',
    },
    {
        links: [{ label: 'Whisper', url: 'https://github.com/openai/whisper' }],
        maker: 'OpenAI', year: 2022,
        note: 'Open transcription that collapsed the price of speech-to-text to near zero.',
    },
];

// ─── 04 · applications ───────────────────────────────────────────────────────

export const APPLICATIONS: AppEntry[] = [
    {
        tag: 'Code',
        links: [{ label: 'GitHub Copilot', url: 'https://github.com/features/copilot' }],
        maker: 'GitHub · Microsoft', year: 2021,
        note: 'The first large-model product people paid for monthly — a year before ChatGPT.',
    },
    {
        tag: 'Code',
        links: [{ label: 'Cursor', url: 'https://cursor.com' }],
        maker: 'Anysphere', year: 2023,
        note: 'The editor rebuilt around the model rather than the model added to the editor.',
    },
    {
        tag: 'Code',
        links: [{ label: 'Claude Code', url: 'https://github.com/anthropics/claude-code' }],
        maker: 'Anthropic', year: 2025,
        note: 'The agent in the terminal, working on the repository instead of the open file.',
    },
    {
        tag: 'Build',
        links: [
            { label: 'Lovable', url: 'https://lovable.dev' },
            { label: 'v0', url: 'https://v0.app' },
            { label: 'Bolt', url: 'https://bolt.new' },
        ],
        maker: 'Lovable · Vercel · StackBlitz', year: 2023,
        note: 'Prompt to deployed application. The clearest evidence non-engineers now ship software.',
    },
    {
        tag: 'Search',
        links: [{ label: 'Perplexity', url: 'https://www.perplexity.ai' }],
        maker: 'Perplexity', year: 2022,
        note: 'Made the cited answer a product and forced Google to answer directly in its own results.',
    },
    {
        tag: 'Research',
        links: [{ label: 'NotebookLM', url: 'https://notebooklm.google.com' }],
        maker: 'Google', year: 2023,
        note: 'Grounded strictly in your own documents. Audio Overviews made research listenable.',
    },
    {
        tag: 'Image',
        links: [{ label: 'Midjourney', url: 'https://www.midjourney.com' }],
        maker: 'Midjourney', year: 2022,
        note: 'Generated images crossed from acceptable to preferred. Taste as the defensible layer.',
    },
    {
        tag: 'Image',
        links: [
            { label: 'Stable Diffusion', url: 'https://stability.ai' },
            { label: 'FLUX', url: 'https://blackforestlabs.ai' },
        ],
        maker: 'Stability · Black Forest Labs', year: 2022,
        note: 'Open image weights. An entire ecosystem no lab controls, running on consumer GPUs.',
    },
    {
        tag: 'Video',
        links: [
            { label: 'Runway', url: 'https://runwayml.com' },
            { label: 'Veo', url: 'https://deepmind.google/models/veo' },
            { label: 'Kling', url: 'https://klingai.com' },
        ],
        maker: 'Runway · Google · Kuaishou', year: 2023,
        note: 'Video generation inside real production work, with synchronised audio from 2025.',
    },
    {
        tag: 'Voice',
        links: [{ label: 'ElevenLabs', url: 'https://elevenlabs.io' }],
        maker: 'ElevenLabs', year: 2023,
        note: 'Crossed the point where synthetic narration stopped being detectable, then sold it as an API.',
    },
    {
        tag: 'Music',
        links: [{ label: 'Suno', url: 'https://suno.com' }],
        maker: 'Suno', year: 2023,
        note: 'Full songs from a prompt. Litigation with the labels ended in licensing, not prohibition.',
    },
    {
        tag: 'Companion',
        links: [{ label: 'Character.AI', url: 'https://character.ai' }],
        maker: 'Character.AI', year: 2022,
        note: 'Session lengths no assistant approaches. Engagement, not utility, is the consumer pull.',
    },
    {
        tag: 'Agents',
        links: [{ label: 'Manus', url: 'https://manus.im' }],
        maker: 'Butterfly Effect', year: 2025,
        note: 'Long-running autonomous task execution — the first agent product to spread on results.',
    },
    {
        tag: 'Work',
        links: [{ label: 'Microsoft 365 Copilot', url: 'https://www.microsoft.com/microsoft-365/copilot' }],
        maker: 'Microsoft', year: 2023,
        note: 'Sold per seat into Office. The largest paid deployment, won on bundling alone.',
    },
    {
        tag: 'Legal',
        links: [{ label: 'Harvey', url: 'https://www.harvey.ai' }],
        maker: 'Harvey', year: 2023,
        note: 'The first credible model deployment inside a licensed profession.',
    },
    {
        tag: 'Medicine',
        links: [{ label: 'Abridge', url: 'https://www.abridge.com' }],
        maker: 'Abridge', year: 2023,
        note: 'Clinical notes written from the consultation. Measured in physician hours returned.',
    },
];
