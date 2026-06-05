'use client';

import { useState, useEffect, useRef } from 'react';
import {
    PROVIDERS,
    PROVIDER_LABELS,
    PROVIDER_MODELS,
    AGENTS,
    type Provider,
    type AgentName,
} from '../lib/settings';
import { useSettings } from '../hooks/useSettings';

const AGENT_LABELS: Record<AgentName, { name: string; domain: string; glyph: string }> = {
    atlas: { name: 'Atlas', domain: 'Regime', glyph: '△' },
    janus: { name: 'Janus', domain: 'Transition', glyph: '◐' },
    sigma: { name: 'Sigma', domain: 'Asset', glyph: 'Σ' },
    achilles: { name: 'Achilles', domain: 'Asymmetry', glyph: '◇' },
    athena: { name: 'Athena', domain: 'Judgment', glyph: 'ϟ' },
};

interface Props {
    open: boolean;
    onClose: () => void;
}

export default function SettingsPanel({ open, onClose }: Props) {
    const { settings, setKey, removeKey, setAgentConfig, hasKey } = useSettings();
    const [tab, setTab] = useState<'keys' | 'agents'>('keys');
    const [revealed, setRevealed] = useState<Partial<Record<Provider, boolean>>>({});
    const [drafts, setDrafts] = useState<Partial<Record<Provider, string>>>({});
    const panelRef = useRef<HTMLDivElement>(null);

    // Close on Escape
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        if (open) document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [open, onClose]);

    // Trap focus inside panel when open
    useEffect(() => {
        if (open) panelRef.current?.focus();
    }, [open]);

    const handleSaveKey = (provider: Provider) => {
        const val = drafts[provider]?.trim();
        if (val) {
            setKey(provider, val);
            setDrafts((d) => { const n = { ...d }; delete n[provider]; return n; });
        }
    };

    const handleRemoveKey = (provider: Provider) => {
        removeKey(provider);
        setDrafts((d) => { const n = { ...d }; delete n[provider]; return n; });
        setRevealed((r) => { const n = { ...r }; delete n[provider]; return n; });
    };

    const maskKey = (key: string) => key.slice(0, 6) + '••••••••••••' + key.slice(-4);

    if (!open) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-[60]"
                style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)' }}
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Panel */}
            <div
                ref={panelRef}
                tabIndex={-1}
                role="dialog"
                aria-modal="true"
                aria-label="Settings"
                className="fixed right-0 top-0 bottom-0 z-[70] flex flex-col w-full max-w-md outline-none"
                style={{
                    backgroundColor: 'var(--surface-raised)',
                    borderLeft: '1px solid var(--surface-border)',
                }}
            >
                {/* Header */}
                <div
                    className="flex items-center justify-between px-6 py-4 border-b shrink-0"
                    style={{ borderColor: 'var(--surface-border)' }}
                >
                    <div>
                        <div
                            className="text-[11px] tracking-[0.4em] uppercase"
                            style={{ color: 'var(--accent)' }}
                        >
                            Settings
                        </div>
                        <div
                            className="mt-0.5 text-[9px] tracking-[0.2em] uppercase"
                            style={{ color: 'var(--text-muted)' }}
                        >
                            API keys &amp; agent configuration
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        aria-label="Close settings"
                        className="flex h-8 w-8 items-center justify-center border transition-opacity hover:opacity-70"
                        style={{ borderColor: 'var(--surface-border)', color: 'var(--text-muted)' }}
                    >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                            <path d="M1 1l10 10M11 1L1 11" />
                        </svg>
                    </button>
                </div>

                {/* Tabs */}
                <div
                    className="flex border-b shrink-0"
                    style={{ borderColor: 'var(--surface-border)' }}
                >
                    {(['keys', 'agents'] as const).map((t) => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className="flex-1 py-3 text-[10px] tracking-[0.3em] uppercase transition-colors"
                            style={{
                                color: tab === t ? 'var(--accent)' : 'var(--text-muted)',
                                borderBottom: tab === t ? '1px solid var(--accent)' : '1px solid transparent',
                            }}
                        >
                            {t === 'keys' ? 'API Keys' : 'Agent Models'}
                        </button>
                    ))}
                </div>

                {/* Scrollable content */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

                    {/* ── API Keys tab ──────────────────────────────────────────── */}
                    {tab === 'keys' && (
                        <>
                            <p className="text-[11px] leading-5" style={{ color: 'var(--text-muted)' }}>
                                Keys are saved locally in your browser and never sent anywhere except the provider's API endpoint.
                            </p>

                            {PROVIDERS.map((provider) => {
                                const saved = settings.keys[provider];
                                const draft = drafts[provider] ?? '';
                                const isRevealed = revealed[provider] ?? false;

                                return (
                                    <div
                                        key={provider}
                                        className="border p-4 space-y-3"
                                        style={{ borderColor: 'var(--surface-border)', backgroundColor: 'var(--surface)' }}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs tracking-[0.18em]" style={{ color: 'var(--text-primary)' }}>
                                                {PROVIDER_LABELS[provider]}
                                            </span>
                                            {saved ? (
                                                <span
                                                    className="flex items-center gap-1 text-[9px] tracking-[0.2em] uppercase"
                                                    style={{ color: '#6ea87a' }}
                                                >
                                                    <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor">
                                                        <circle cx="4" cy="4" r="4" />
                                                    </svg>
                                                    Configured
                                                </span>
                                            ) : (
                                                <span
                                                    className="text-[9px] tracking-[0.2em] uppercase"
                                                    style={{ color: 'var(--text-muted)' }}
                                                >
                                                    Not set
                                                </span>
                                            )}
                                        </div>

                                        {saved ? (
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className="flex-1 font-mono text-[11px] truncate"
                                                    style={{ color: 'var(--text-secondary)' }}
                                                >
                                                    {isRevealed ? saved : maskKey(saved)}
                                                </span>
                                                <button
                                                    onClick={() => setRevealed((r) => ({ ...r, [provider]: !isRevealed }))}
                                                    className="text-[9px] tracking-[0.2em] uppercase transition-opacity hover:opacity-70 shrink-0"
                                                    style={{ color: 'var(--text-muted)' }}
                                                    aria-label={isRevealed ? 'Hide key' : 'Reveal key'}
                                                >
                                                    {isRevealed ? 'Hide' : 'Show'}
                                                </button>
                                                <button
                                                    onClick={() => handleRemoveKey(provider)}
                                                    className="text-[9px] tracking-[0.2em] uppercase transition-opacity hover:opacity-70 shrink-0"
                                                    style={{ color: '#c47a7a' }}
                                                    aria-label={`Remove ${PROVIDER_LABELS[provider]} key`}
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex gap-2">
                                                <input
                                                    type="password"
                                                    value={draft}
                                                    onChange={(e) => setDrafts((d) => ({ ...d, [provider]: e.target.value }))}
                                                    onKeyDown={(e) => { if (e.key === 'Enter') handleSaveKey(provider); }}
                                                    placeholder={`Paste ${PROVIDER_LABELS[provider]} key…`}
                                                    className="flex-1 bg-transparent border px-3 py-2 text-xs font-mono outline-none transition-colors"
                                                    style={{
                                                        borderColor: draft ? 'var(--accent)' : 'var(--surface-border)',
                                                        color: 'var(--text-primary)',
                                                    }}
                                                    aria-label={`${PROVIDER_LABELS[provider]} API key`}
                                                />
                                                <button
                                                    onClick={() => handleSaveKey(provider)}
                                                    disabled={!draft.trim()}
                                                    className="px-4 py-2 text-[10px] tracking-[0.2em] uppercase border transition-opacity disabled:opacity-30"
                                                    style={{
                                                        borderColor: 'var(--accent)',
                                                        color: 'var(--accent)',
                                                    }}
                                                >
                                                    Save
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </>
                    )}

                    {/* ── Agent Models tab ──────────────────────────────────────── */}
                    {tab === 'agents' && (
                        <>
                            <p className="text-[11px] leading-5" style={{ color: 'var(--text-muted)' }}>
                                Assign each agent a provider and model. Only providers with a saved API key can be selected.
                            </p>

                            {AGENTS.map((agent) => {
                                const label = AGENT_LABELS[agent];
                                const config = settings.agents[agent];
                                const models = PROVIDER_MODELS[config.provider] ?? [];

                                return (
                                    <div
                                        key={agent}
                                        className="border p-4 space-y-3"
                                        style={{ borderColor: 'var(--surface-border)', backgroundColor: 'var(--surface)' }}
                                    >
                                        {/* Agent identity */}
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="flex h-8 w-8 items-center justify-center border text-sm shrink-0"
                                                style={{ borderColor: 'rgba(181,139,74,0.30)', color: 'var(--accent)' }}
                                            >
                                                {label.glyph}
                                            </div>
                                            <div>
                                                <div className="text-xs tracking-[0.15em]" style={{ color: 'var(--text-primary)' }}>
                                                    {label.name}
                                                </div>
                                                <div className="text-[9px] uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>
                                                    {label.domain}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Provider select */}
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="space-y-1">
                                                <label
                                                    className="text-[9px] uppercase tracking-[0.2em]"
                                                    style={{ color: 'var(--text-muted)' }}
                                                >
                                                    Provider
                                                </label>
                                                <select
                                                    value={config.provider}
                                                    onChange={(e) => {
                                                        const provider = e.target.value as typeof PROVIDERS[number];
                                                        const model = PROVIDER_MODELS[provider][0];
                                                        setAgentConfig(agent, { provider, model });
                                                    }}
                                                    className="w-full border px-2 py-1.5 text-xs outline-none appearance-none cursor-pointer"
                                                    style={{
                                                        borderColor: 'var(--surface-border)',
                                                        backgroundColor: 'var(--surface-raised)',
                                                        color: 'var(--text-primary)',
                                                    }}
                                                >
                                                    {PROVIDERS.map((p) => (
                                                        <option key={p} value={p} disabled={!hasKey(p)}>
                                                            {PROVIDER_LABELS[p]}{!hasKey(p) ? ' (no key)' : ''}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Model select */}
                                            <div className="space-y-1">
                                                <label
                                                    className="text-[9px] uppercase tracking-[0.2em]"
                                                    style={{ color: 'var(--text-muted)' }}
                                                >
                                                    Model
                                                </label>
                                                <select
                                                    value={config.model}
                                                    onChange={(e) =>
                                                        setAgentConfig(agent, { ...config, model: e.target.value })
                                                    }
                                                    className="w-full border px-2 py-1.5 text-xs outline-none appearance-none cursor-pointer"
                                                    style={{
                                                        borderColor: 'var(--surface-border)',
                                                        backgroundColor: 'var(--surface-raised)',
                                                        color: 'var(--text-primary)',
                                                    }}
                                                >
                                                    {models.map((m) => (
                                                        <option key={m} value={m}>{m}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        {!hasKey(config.provider) && (
                                            <p className="text-[10px]" style={{ color: '#c47a7a' }}>
                                                Add a {PROVIDER_LABELS[config.provider]} key in the API Keys tab to activate this agent.
                                            </p>
                                        )}
                                    </div>
                                );
                            })}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div
                    className="px-6 py-3 border-t shrink-0"
                    style={{ borderColor: 'var(--surface-border)' }}
                >
                    <p className="text-[10px] leading-4" style={{ color: 'var(--text-muted)' }}>
                        Keys are stored in <code className="font-mono">localStorage</code> and never leave your device except in direct calls to the provider API.
                    </p>
                </div>
            </div>
        </>
    );
}
