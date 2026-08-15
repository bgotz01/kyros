// ─── model catalogue ─────────────────────────────────────────────────────────
// Every model is reached through OpenRouter, so `id` is an OpenRouter model
// slug. Costs are USD per 1M tokens (input / output) and are display-only —
// OpenRouter bills the true rate.

export function formatCost(inputCost: number, outputCost: number): string {
    return `$${inputCost.toFixed(2)} / $${outputCost.toFixed(2)}`;
}

const RAW_MODELS = [
    { id: 'deepseek/deepseek-v4-flash', label: 'DeepSeek V4 Flash', inputCost: 0.09, outputCost: 0.18, context: '1M', maxTokens: 8000 },
    { id: 'google/gemma-4-26b-a4b-it', label: 'Gemma 4 26B A4B', inputCost: 0.06, outputCost: 0.33, context: '262K', maxTokens: 8000 },
    { id: 'xiaomi/mimo-v2.5', label: 'Xiaomi MiMo-V2.5', inputCost: 0.14, outputCost: 0.28, context: '1M', maxTokens: 8000 },
    { id: 'deepseek/deepseek-v3.2', label: 'DeepSeek V3.2', inputCost: 0.23, outputCost: 0.34, context: '131K', maxTokens: 8000 },
    { id: 'google/gemini-3.1-flash-lite', label: 'Gemini 3.1 Flash Lite', inputCost: 0.25, outputCost: 1.50, context: '1M', maxTokens: 8000 },
    { id: 'minimax/minimax-m3', label: 'MiniMax M3', inputCost: 0.30, outputCost: 1.20, context: '1M', maxTokens: 8000 },
    { id: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash', inputCost: 0.30, outputCost: 2.50, context: '1M', maxTokens: 8000 },
    { id: 'qwen/qwen3.7-plus', label: 'Qwen3.7 Plus', inputCost: 0.32, outputCost: 1.28, context: '1M', maxTokens: 8000 },
    { id: 'deepseek/deepseek-v4-pro', label: 'DeepSeek V4 Pro', inputCost: 0.44, outputCost: 0.87, context: '1M', maxTokens: 8000 },
    { id: 'z-ai/glm-5.2', label: 'Z.ai GLM 5.2', inputCost: 0.49, outputCost: 1.54, context: '1M', maxTokens: 4000 },
    { id: 'qwen/qwen3.7-max', label: 'Qwen3.7 Max', inputCost: 1.25, outputCost: 3.75, context: '1M', maxTokens: 8000 },
    { id: 'google/gemini-3.6-flash', label: 'Gemini 3.6 Flash', inputCost: 0.75, outputCost: 3.75, context: '1M', maxTokens: 8000 },
    { id: 'openai/gpt-5.6-luna', label: 'GPT-5.6 Luna', inputCost: 0.10, outputCost: 0.60, context: '1M', maxTokens: 8000 },
    { id: 'anthropic/claude-sonnet-5', label: 'Claude Sonnet 5', inputCost: 2.00, outputCost: 10.00, context: '1M', maxTokens: 8000 },
    { id: 'moonshotai/kimi-k3', label: 'Kimi K3', inputCost: 3.00, outputCost: 15.00, context: '1M', maxTokens: 8000 },
    { id: 'anthropic/claude-opus-4.8', label: 'Claude Opus 4.8', inputCost: 5.00, outputCost: 25.00, context: '1M', maxTokens: 8000 },
    { id: 'anthropic/claude-opus-5', label: 'Claude Opus 5', inputCost: 5.00, outputCost: 25.00, context: '1M', maxTokens: 8000 },
] as const;

export interface Model {
    id: string;
    label: string;
    inputCost: number;
    outputCost: number;
    cost: string;
    context: string;
    maxTokens: number;
}

export const MODELS: Model[] = RAW_MODELS.map((m) => ({
    ...m,
    cost: formatCost(m.inputCost, m.outputCost),
}));

export const DEFAULT_MODEL = 'qwen/qwen3.7-max';

/** One model per council seat. Deliberately mixed — three heads of the same
 *  family tend to agree, which defeats the point of a council. */
export const COUNCIL_DEFAULT_MODELS = [
    'qwen/qwen3.7-max',
    'z-ai/glm-5.2',
    'google/gemini-3.1-flash-lite',
] as const;

// ─── tier classification (by output cost per 1M tokens) ──────────────────────

export type ModelTier = 'low' | 'mid' | 'high';

export function modelTier(m: { outputCost: number }): ModelTier {
    if (m.outputCost >= 10) return 'high';
    if (m.outputCost >= 3) return 'mid';
    return 'low';
}

export const TIER_LABELS: Record<ModelTier, string> = {
    low: 'Low  ·  under $3',
    mid: 'Mid  ·  $3 – $10',
    high: 'High  ·  $10+',
};

export const TIER_ORDER: ModelTier[] = ['low', 'mid', 'high'];

/** The catalogue grouped by tier, sorted by output cost ascending. */
export function modelsByTier(): Record<ModelTier, Model[]> {
    const groups: Record<ModelTier, Model[]> = { low: [], mid: [], high: [] };
    for (const m of MODELS) groups[modelTier(m)].push(m);
    for (const tier of TIER_ORDER) groups[tier].sort((a, b) => a.outputCost - b.outputCost);
    return groups;
}
