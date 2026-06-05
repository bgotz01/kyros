'use client';

import { useState, useCallback, useEffect } from 'react';
import {
    ComposedChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import type { RegimeFamily } from '@/app/lib/regime-state-machine';
import { REGIME_METADATA, REGIME_TRIGGERS } from '@/app/lib/regime-state-machine';

// ─── Strategy DSL types ───────────────────────────────────────────────────────

type IndicatorType =
    | 'price_vs_ma'
    | 'ma_slope'
    | 'ma_crossover'
    | 'rsi'
    | 'price_vs_ma_and_slope';

type Operator = '>' | '>=' | '<' | '<=' | '==';
type SignalType = 'long' | 'short' | 'flat';
type AssetKey = 'SPX' | 'NDX';

interface Condition {
    id: string;
    indicator: IndicatorType;
    // price_vs_ma / ma_slope / price_vs_ma_and_slope
    period?: number;
    operator: Operator;
    threshold: number;
    // ma_crossover
    fast?: number;
    slow?: number;
    // price_vs_ma_and_slope extra
    slope_operator?: Operator;
    slope_threshold?: number;
}

interface Rule {
    id: string;
    conditions: Condition[];
    signal: SignalType;
}

interface Strategy {
    name: string;
    asset: AssetKey;
    rules: Rule[];
    default_signal: SignalType;
}

// ─── Backtest result types ────────────────────────────────────────────────────

interface Trade {
    entry_date: string;
    exit_date: string;
    direction: 'long' | 'short';
    entry_price: number;
    exit_price: number;
    return_pct: number;
    days_held: number;
    open_at_period_end?: boolean;
}

interface PeriodResult {
    start_date: string;
    end_date: string;
    is_current: boolean;
    skipped?: boolean;
    reason?: string;
    period_return?: number;
    trade_count?: number;
    trades?: Trade[];
}

interface EquityPoint {
    date: string;
    equity: number;
    position: number;
    close: number;
    ma200?: number | null;
}

interface BacktestStats {
    total_return: number;
    cagr: number | null;
    sharpe: number | null;
    max_drawdown: number;
    calmar: number | null;
    trade_count: number;
    win_rate: number | null;
    avg_win: number | null;
    avg_loss: number | null;
    avg_trade_return: number | null;
}

interface BacktestResult {
    regime: string;
    asset: string;
    strategy_name: string;
    period_count: number;
    periods_traded: number;
    stats: BacktestStats;
    period_results: PeriodResult[];
    equity_curve: EquityPoint[];
}

interface SavedStrategy {
    id: string;
    name: string;
    description?: string;
    regime: string;
    asset: string;
    rules: unknown;
    defaultSignal: string;
    createdAt: string;
    updatedAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

let idCounter = 0;
function uid() { return `id_${++idCounter}_${Math.random().toString(36).slice(2, 7)}`; }

function defaultCondition(): Condition {
    return { id: uid(), indicator: 'price_vs_ma', period: 200, operator: '>', threshold: 1.10 };
}

function defaultRule(signal: SignalType = 'short'): Rule {
    return { id: uid(), conditions: [defaultCondition()], signal };
}

function fmt(v: number | null | undefined, suffix = '%', decimals = 2): string {
    if (v == null) return '—';
    const sign = v > 0 ? '+' : '';
    return `${sign}${v.toFixed(decimals)}${suffix}`;
}

const INDICATOR_LABELS: Record<IndicatorType, string> = {
    price_vs_ma: 'Price vs MA',
    ma_slope: 'MA Slope',
    ma_crossover: 'MA Crossover',
    rsi: 'RSI',
    price_vs_ma_and_slope: 'Price vs MA + Slope',
};

const SIGNAL_COLORS: Record<SignalType, string> = {
    long: '#4ade80',
    short: '#f87171',
    flat: '#6b7280',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function ConditionEditor({
    cond,
    onChange,
    onRemove,
    canRemove,
}: {
    cond: Condition;
    onChange: (c: Condition) => void;
    onRemove: () => void;
    canRemove: boolean;
}) {
    const inputCls = "bg-transparent border px-2 py-1 text-[11px] outline-none focus:border-[var(--accent)] rounded-sm";
    const inputStyle = { borderColor: 'var(--surface-border)', color: 'var(--text-primary)' };
    const selectStyle = { ...inputStyle, backgroundColor: 'var(--surface)' };

    return (
        <div className="flex flex-wrap items-center gap-2 py-1.5">
            {/* Indicator type */}
            <select
                value={cond.indicator}
                onChange={e => onChange({ ...cond, indicator: e.target.value as IndicatorType })}
                className={`${inputCls} min-w-[160px]`}
                style={selectStyle}
            >
                {Object.entries(INDICATOR_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                ))}
            </select>

            {/* Params depending on indicator */}
            {(cond.indicator === 'price_vs_ma' || cond.indicator === 'ma_slope' || cond.indicator === 'price_vs_ma_and_slope') && (
                <>
                    <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>period</span>
                    <input
                        type="number" min={5} max={500}
                        value={cond.period ?? 200}
                        onChange={e => onChange({ ...cond, period: parseInt(e.target.value) || 200 })}
                        className={`${inputCls} w-16`} style={inputStyle}
                    />
                </>
            )}

            {cond.indicator === 'ma_crossover' && (
                <>
                    <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>fast</span>
                    <input type="number" min={5} max={200} value={cond.fast ?? 50}
                        onChange={e => onChange({ ...cond, fast: parseInt(e.target.value) || 50 })}
                        className={`${inputCls} w-16`} style={inputStyle} />
                    <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>slow</span>
                    <input type="number" min={20} max={500} value={cond.slow ?? 200}
                        onChange={e => onChange({ ...cond, slow: parseInt(e.target.value) || 200 })}
                        className={`${inputCls} w-16`} style={inputStyle} />
                </>
            )}

            {cond.indicator === 'rsi' && (
                <>
                    <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>period</span>
                    <input type="number" min={2} max={100} value={cond.period ?? 14}
                        onChange={e => onChange({ ...cond, period: parseInt(e.target.value) || 14 })}
                        className={`${inputCls} w-16`} style={inputStyle} />
                </>
            )}

            {/* Operator */}
            <select value={cond.operator}
                onChange={e => onChange({ ...cond, operator: e.target.value as Operator })}
                className={`${inputCls} w-16`} style={selectStyle}>
                {(['>', '>=', '<', '<=', '=='] as Operator[]).map(op => (
                    <option key={op} value={op}>{op}</option>
                ))}
            </select>

            {/* Threshold */}
            <input
                type="number" step="0.01"
                value={cond.threshold}
                onChange={e => onChange({ ...cond, threshold: parseFloat(e.target.value) || 0 })}
                className={`${inputCls} w-20`} style={inputStyle}
            />

            {/* price_vs_ma_and_slope extra slope condition */}
            {cond.indicator === 'price_vs_ma_and_slope' && (
                <>
                    <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>& slope</span>
                    <select value={cond.slope_operator ?? '<'}
                        onChange={e => onChange({ ...cond, slope_operator: e.target.value as Operator })}
                        className={`${inputCls} w-16`} style={selectStyle}>
                        {(['>', '>=', '<', '<='] as Operator[]).map(op => (
                            <option key={op} value={op}>{op}</option>
                        ))}
                    </select>
                    <input type="number" step="0.01" value={cond.slope_threshold ?? 0}
                        onChange={e => onChange({ ...cond, slope_threshold: parseFloat(e.target.value) || 0 })}
                        className={`${inputCls} w-20`} style={inputStyle} />
                </>
            )}

            {canRemove && (
                <button onClick={onRemove}
                    className="text-[11px] opacity-40 hover:opacity-80 transition-opacity px-1"
                    style={{ color: '#f87171' }}>
                    ✕
                </button>
            )}
        </div>
    );
}

function RuleEditor({
    rule,
    onChange,
    onRemove,
    index,
}: {
    rule: Rule;
    onChange: (r: Rule) => void;
    onRemove: () => void;
    index: number;
}) {
    const updateCondition = (idx: number, c: Condition) => {
        const conditions = [...rule.conditions];
        conditions[idx] = c;
        onChange({ ...rule, conditions });
    };
    const removeCondition = (idx: number) => {
        onChange({ ...rule, conditions: rule.conditions.filter((_, i) => i !== idx) });
    };
    const addCondition = () => {
        onChange({ ...rule, conditions: [...rule.conditions, defaultCondition()] });
    };

    return (
        <div className="border p-3 space-y-2"
            style={{ borderColor: 'var(--surface-border)', backgroundColor: 'var(--surface)' }}>
            <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-[0.2em]"
                    style={{ color: 'var(--text-muted)' }}>Rule {index + 1}</span>
                <button onClick={onRemove}
                    className="text-[10px] uppercase tracking-wider hover:opacity-70 transition-opacity"
                    style={{ color: '#f87171' }}>
                    Remove rule
                </button>
            </div>

            {/* Conditions (AND logic) */}
            <div className="space-y-1">
                {rule.conditions.map((cond, i) => (
                    <div key={cond.id}>
                        {i > 0 && (
                            <div className="text-[9px] uppercase tracking-widest py-0.5"
                                style={{ color: 'var(--text-muted)' }}>AND</div>
                        )}
                        <ConditionEditor
                            cond={cond}
                            onChange={c => updateCondition(i, c)}
                            onRemove={() => removeCondition(i)}
                            canRemove={rule.conditions.length > 1}
                        />
                    </div>
                ))}
            </div>

            <div className="flex items-center gap-3 pt-1 border-t"
                style={{ borderColor: 'var(--surface-border)' }}>
                <button onClick={addCondition}
                    className="text-[10px] uppercase tracking-wider hover:opacity-70 transition-opacity"
                    style={{ color: 'var(--accent)' }}>
                    + AND condition
                </button>

                <div className="ml-auto flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-wider"
                        style={{ color: 'var(--text-muted)' }}>→ Signal:</span>
                    {(['long', 'short', 'flat'] as SignalType[]).map(s => (
                        <button
                            key={s}
                            onClick={() => onChange({ ...rule, signal: s })}
                            className="px-2 py-0.5 text-[10px] uppercase tracking-wider border rounded-sm transition-opacity"
                            style={{
                                borderColor: rule.signal === s ? SIGNAL_COLORS[s] : 'var(--surface-border)',
                                color: rule.signal === s ? SIGNAL_COLORS[s] : 'var(--text-muted)',
                                backgroundColor: rule.signal === s ? SIGNAL_COLORS[s] + '18' : 'transparent',
                            }}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ─── Equity curve chart ───────────────────────────────────────────────────────

function EquityCurveChart({ data, color }: { data: EquityPoint[]; color: string }) {
    if (!data.length) return null;

    // Sample for performance: max 2000 points
    const sampled = data.length > 2000
        ? data.filter((_, i) => i % Math.ceil(data.length / 2000) === 0)
        : data;

    const chartData = sampled.map(pt => ({
        date: pt.date,
        equity: pt.equity,
        position: pt.position,
    }));

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (!active || !payload?.length) return null;
        const equity = payload.find((p: any) => p.dataKey === 'equity')?.value;
        const position = payload.find((p: any) => p.dataKey === 'position')?.value;
        const posLabel = position === 1 ? 'Long' : position === -1 ? 'Short' : 'Flat';
        const posColor = position === 1 ? '#4ade80' : position === -1 ? '#f87171' : '#6b7280';
        return (
            <div className="border px-3 py-2 text-[11px] space-y-1"
                style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--surface-border)' }}>
                <div style={{ color: 'var(--text-muted)' }}>{label}</div>
                <div style={{ color }}>Equity: {equity?.toFixed(2)}</div>
                <div style={{ color: posColor }}>Position: {posLabel}</div>
            </div>
        );
    };

    return (
        <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(181,139,74,0.08)" />
                <XAxis
                    dataKey="date"
                    tick={{ fontSize: 9, fill: 'var(--text-muted)' }}
                    tickFormatter={d => d.slice(0, 7)}
                    interval={Math.floor(chartData.length / 8)}
                />
                <YAxis
                    tick={{ fontSize: 9, fill: 'var(--text-muted)' }}
                    tickFormatter={v => `${v.toFixed(0)}`}
                    width={40}
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={100} stroke="rgba(181,139,74,0.3)" strokeDasharray="4 4" />
                <Line
                    type="monotone"
                    dataKey="equity"
                    stroke={color}
                    strokeWidth={1.5}
                    dot={false}
                    activeDot={{ r: 3 }}
                />
            </ComposedChart>
        </ResponsiveContainer>
    );
}

// ─── Stat chip ────────────────────────────────────────────────────────────────

function StatChip({ label, value, positive, negative }: {
    label: string; value: string;
    positive?: boolean; negative?: boolean;
}) {
    const color = positive ? '#4ade80' : negative ? '#f87171' : 'var(--text-primary)';
    return (
        <div className="border p-2.5 text-center"
            style={{ borderColor: 'var(--surface-border)', backgroundColor: 'var(--surface)' }}>
            <div className="text-[9px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>{label}</div>
            <div className="text-sm tabular-nums font-medium" style={{ color }}>{value}</div>
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props { regime: RegimeFamily; }

const DEFAULT_STRATEGY: Strategy = {
    name: 'Mean Reversion',
    asset: 'SPX',
    rules: [
        {
            id: 'r1',
            conditions: [{
                id: 'c1',
                indicator: 'price_vs_ma',
                period: 200,
                operator: '>',
                threshold: 1.10,
            }],
            signal: 'short',
        },
        {
            id: 'r2',
            conditions: [{
                id: 'c2',
                indicator: 'price_vs_ma',
                period: 200,
                operator: '<',
                threshold: 0.85,
            }],
            signal: 'long',
        },
    ],
    default_signal: 'flat',
};

export default function RegimeBacktester({ regime }: Props) {
    const [strategy, setStrategy] = useState<Strategy>(() => ({
        ...DEFAULT_STRATEGY,
        rules: DEFAULT_STRATEGY.rules.map(r => ({ ...r, id: uid(), conditions: r.conditions.map(c => ({ ...c, id: uid() })) })),
    }));
    const [result, setResult] = useState<BacktestResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'curve' | 'periods'>('curve');
    const [expandedPeriod, setExpandedPeriod] = useState<number | null>(null);

    // ── Save / load state ────────────────────────────────────────────────────
    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState<string | null>(null);
    const [savedStrategies, setSavedStrategies] = useState<SavedStrategy[]>([]);
    const [loadingStrategies, setLoadingStrategies] = useState(false);
    const [showSaved, setShowSaved] = useState(false);
    const [savedStrategyId, setSavedStrategyId] = useState<string | null>(null);

    // ── AI suggest state ─────────────────────────────────────────────────────
    const [suggesting, setSuggesting] = useState(false);
    const [suggestError, setSuggestError] = useState<string | null>(null);
    const [aiRationale, setAiRationale] = useState<string | null>(null);

    // ── Regime periods (date windows for context) ────────────────────────────
    const [regimePeriods, setRegimePeriods] = useState<{ startDate: string; endDate: string; months: number; isCurrent?: boolean }[]>([]);

    useEffect(() => {
        fetch('/api/regime/history')
            .then(r => r.json())
            .then(d => {
                const all: { regime: string; startDate: string; endDate: string; months: number }[] = d.periods ?? [];
                setRegimePeriods(
                    all
                        .filter(p => p.regime === regime)
                        .map(p => ({
                            startDate: p.startDate,
                            endDate: p.endDate,
                            months: p.months,
                            isCurrent: p.endDate === 'Current',
                        }))
                );
            })
            .catch(() => { });
    }, [regime]);

    const meta = REGIME_METADATA[regime];
    const color = meta.color;

    // Load saved strategies for this regime
    const loadSavedStrategies = useCallback(async () => {
        setLoadingStrategies(true);
        try {
            const res = await fetch(`/api/backtest/strategies?regime=${encodeURIComponent(regime)}`);
            const data = await res.json();
            setSavedStrategies(data.strategies ?? []);
        } catch {
            // non-fatal
        } finally {
            setLoadingStrategies(false);
        }
    }, [regime]);

    // Load a saved strategy into the builder
    const loadStrategy = useCallback((saved: SavedStrategy) => {
        const rules = (saved.rules as Rule[]).map(r => ({
            ...r,
            id: uid(),
            conditions: (r.conditions ?? []).map((c: Condition) => ({ ...c, id: uid() })),
        }));
        setStrategy({
            name: saved.name,
            asset: saved.asset as AssetKey,
            rules,
            default_signal: (saved.defaultSignal ?? 'flat') as SignalType,
        });
        setSavedStrategyId(saved.id);
        setResult(null);
        setError(null);
    }, []);

    // Save current strategy + run to DB
    const saveStrategy = useCallback(async () => {
        if (!result) return;
        setSaving(true);
        setSaveMsg(null);

        try {
            const rulesPayload = strategy.rules.map(r => ({
                conditions: r.conditions.map(({ id: _id, ...c }) => c),
                signal: r.signal,
            }));

            // 1. Save strategy
            const stratRes = await fetch('/api/backtest/strategies', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: strategy.name,
                    regime,
                    asset: strategy.asset,
                    rules: rulesPayload,
                    defaultSignal: strategy.default_signal,
                }),
            });
            const stratData = await stratRes.json();
            if (!stratRes.ok || stratData.error) throw new Error(stratData.error ?? 'Save failed');

            const strategyId = stratData.strategy.id;
            setSavedStrategyId(strategyId);

            // 2. Save the run result
            await fetch('/api/backtest/runs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    strategyId,
                    rulesSnapshot: rulesPayload,
                    stats: result.stats,
                    equityCurve: result.equity_curve,
                    periodResults: result.period_results,
                    periodCount: result.period_count,
                }),
            });

            setSaveMsg('Saved');
            // Refresh saved list if panel is open
            if (showSaved) loadSavedStrategies();
        } catch (e: unknown) {
            setSaveMsg(e instanceof Error ? e.message : 'Save error');
        } finally {
            setSaving(false);
        }
    }, [strategy, result, regime, showSaved, loadSavedStrategies]);

    // Ask AI to generate a strategy for this regime
    const suggestStrategy = useCallback(async () => {
        setSuggesting(true);
        setSuggestError(null);
        setAiRationale(null);

        try {
            const res = await fetch('/api/backtest/suggest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    regime,
                    description: meta.description,
                    guidance: meta.guidance,
                    entryDescription: REGIME_TRIGGERS[regime].entryDescription,
                    exitDescription: REGIME_TRIGGERS[regime].exitDescription,
                }),
            });
            const data = await res.json();
            if (!res.ok || data.error) throw new Error(data.error ?? `HTTP ${res.status}`);

            const { strategy: aiStrategy, rationale } = data as {
                strategy: { name: string; asset: string; rules: Rule[]; defaultSignal: string };
                rationale: string;
            };

            // Hydrate IDs for React keys
            const rules = (aiStrategy.rules ?? []).map((r: Rule) => ({
                ...r,
                id: uid(),
                conditions: (r.conditions ?? []).map((c: Condition) => ({ ...c, id: uid() })),
            }));

            setStrategy({
                name: aiStrategy.name ?? `${regime} Strategy`,
                asset: (['SPX', 'NDX'].includes(aiStrategy.asset) ? aiStrategy.asset : 'SPX') as AssetKey,
                rules,
                default_signal: (['long', 'short', 'flat'].includes(aiStrategy.defaultSignal)
                    ? aiStrategy.defaultSignal : 'flat') as SignalType,
            });
            setAiRationale(rationale ?? null);
            setResult(null);
            setSavedStrategyId(null);
        } catch (e: unknown) {
            setSuggestError(e instanceof Error ? e.message : 'AI error');
        } finally {
            setSuggesting(false);
        }
    }, [regime, meta]);

    const updateRule = useCallback((idx: number, rule: Rule) => {
        setStrategy(s => {
            const rules = [...s.rules];
            rules[idx] = rule;
            return { ...s, rules };
        });
    }, []);

    const removeRule = useCallback((idx: number) => {
        setStrategy(s => ({ ...s, rules: s.rules.filter((_, i) => i !== idx) }));
    }, []);

    const addRule = useCallback(() => {
        setStrategy(s => ({ ...s, rules: [...s.rules, defaultRule('flat')] }));
    }, []);

    async function runBacktest() {
        setLoading(true);
        setError(null);
        setResult(null);

        const payload = {
            name: strategy.name,
            regime,
            asset: strategy.asset,
            rules: strategy.rules.map(r => ({
                conditions: r.conditions.map(({ id: _id, ...c }) => c),
                signal: r.signal,
            })),
            default_signal: strategy.default_signal,
        };

        try {
            const res = await fetch('/api/backtest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (!res.ok || data.error) {
                setError(data.error ?? `HTTP ${res.status}`);
            } else {
                setResult(data);
            }
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Network error');
        } finally {
            setLoading(false);
        }
    }

    const inputCls = "bg-transparent border px-2 py-1 text-[11px] outline-none focus:border-[var(--accent)] rounded-sm";
    const inputStyle = { borderColor: 'var(--surface-border)', color: 'var(--text-primary)' };
    const selectStyle = { ...inputStyle, backgroundColor: 'var(--surface)' };

    return (
        <div className="border space-y-0 overflow-hidden"
            style={{ borderColor: 'var(--surface-border)' }}>

            {/* ── Header ─────────────────────────────────────────────── */}
            <div className="px-5 py-4 flex items-center justify-between border-b"
                style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--surface-border)' }}>
                <div>
                    <div className="text-[10px] uppercase tracking-[0.3em] mb-1" style={{ color: 'var(--accent)' }}>
                        Strategy Backtester
                    </div>
                    <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                        Rules run over daily prices within each {regime} period
                    </p>
                </div>
                <button
                    onClick={() => {
                        setShowSaved(s => !s);
                        if (!showSaved && savedStrategies.length === 0) loadSavedStrategies();
                    }}
                    className="text-[10px] uppercase tracking-wider px-3 py-1.5 border transition-opacity hover:opacity-70"
                    style={{ borderColor: 'var(--surface-border)', color: 'var(--text-muted)' }}
                >
                    {showSaved ? '▲ Hide Saved' : '▼ Saved Strategies'}
                </button>
            </div>

            {/* ── Saved strategies panel ─────────────────────────────── */}
            {showSaved && (
                <div className="border-b px-5 py-4 space-y-2"
                    style={{ borderColor: 'var(--surface-border)', backgroundColor: 'var(--surface)' }}>
                    {loadingStrategies ? (
                        <div className="text-[11px] py-2" style={{ color: 'var(--text-muted)' }}>Loading…</div>
                    ) : savedStrategies.length === 0 ? (
                        <div className="text-[11px] py-2" style={{ color: 'var(--text-muted)' }}>
                            No saved strategies for this regime yet.
                        </div>
                    ) : (
                        <div className="space-y-1.5">
                            {savedStrategies.map(s => (
                                <div key={s.id}
                                    className="flex items-center justify-between border px-3 py-2"
                                    style={{ borderColor: 'var(--surface-border)' }}>
                                    <div>
                                        <div className="text-[11px] font-medium" style={{ color: 'var(--text-primary)' }}>
                                            {s.name}
                                        </div>
                                        <div className="text-[10px] tabular-nums" style={{ color: 'var(--text-muted)' }}>
                                            {s.asset} · saved {new Date(s.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => { loadStrategy(s); setShowSaved(false); }}
                                        className="text-[10px] uppercase tracking-wider px-2 py-1 border hover:opacity-70 transition-opacity"
                                        style={{ borderColor: color, color }}
                                    >
                                        Load
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <div className="p-5 space-y-4" style={{ backgroundColor: 'var(--surface-raised)' }}>

                {/* ── Regime context: date windows ───────────────────── */}
                {regimePeriods.length > 0 && (
                    <div className="border p-3 space-y-2"
                        style={{ borderColor: color + '40', backgroundColor: color + '08' }}>
                        <div className="flex items-center justify-between">
                            <span className="text-[9px] uppercase tracking-[0.25em]" style={{ color }}>
                                Backtest Windows — {regimePeriods.length} {regime} periods
                            </span>
                            <span className="text-[9px] uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                                Strategy only runs within these dates
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {regimePeriods.map((p, i) => (
                                <div key={i}
                                    className="flex items-center gap-1.5 border px-2 py-1 text-[10px] tabular-nums"
                                    style={{
                                        borderColor: p.isCurrent ? color : 'var(--surface-border)',
                                        backgroundColor: p.isCurrent ? color + '12' : 'transparent',
                                        color: 'var(--text-secondary)',
                                    }}>
                                    <span>{p.startDate.slice(0, 7)}</span>
                                    <span style={{ color: 'var(--text-muted)' }}>→</span>
                                    <span style={{ color: p.isCurrent ? color : 'var(--text-secondary)' }}>
                                        {p.isCurrent ? 'Now' : p.endDate.slice(0, 7)}
                                    </span>
                                    <span className="font-mono" style={{ color: 'var(--text-muted)' }}>
                                        {p.months}mo
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Strategy meta ──────────────────────────────────── */}
                <div className="grid grid-cols-[1fr_auto_auto] gap-3 items-center">
                    <input
                        placeholder="Strategy name"
                        value={strategy.name}
                        onChange={e => setStrategy(s => ({ ...s, name: e.target.value }))}
                        className={`${inputCls} w-full`}
                        style={inputStyle}
                    />
                    <select
                        value={strategy.asset}
                        onChange={e => setStrategy(s => ({ ...s, asset: e.target.value as AssetKey }))}
                        className={inputCls}
                        style={selectStyle}
                    >
                        <option value="SPX">SPX (1960+)</option>
                        <option value="NDX">NDX (1985+)</option>
                    </select>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase tracking-wider"
                            style={{ color: 'var(--text-muted)' }}>Default:</span>
                        {(['long', 'short', 'flat'] as SignalType[]).map(s => (
                            <button
                                key={s}
                                onClick={() => setStrategy(st => ({ ...st, default_signal: s }))}
                                className="px-2 py-0.5 text-[10px] uppercase border rounded-sm"
                                style={{
                                    borderColor: strategy.default_signal === s ? SIGNAL_COLORS[s] : 'var(--surface-border)',
                                    color: strategy.default_signal === s ? SIGNAL_COLORS[s] : 'var(--text-muted)',
                                    backgroundColor: strategy.default_signal === s ? SIGNAL_COLORS[s] + '15' : 'transparent',
                                }}
                            >{s}</button>
                        ))}
                    </div>
                </div>

                {/* ── Rules ─────────────────────────────────────────── */}
                <div className="space-y-2">
                    {strategy.rules.map((rule, i) => (
                        <RuleEditor
                            key={rule.id}
                            rule={rule}
                            index={i}
                            onChange={r => updateRule(i, r)}
                            onRemove={() => removeRule(i)}
                        />
                    ))}
                </div>

                <div className="flex items-center gap-3 pt-1">
                    <button
                        onClick={addRule}
                        className="text-[11px] uppercase tracking-wider px-3 py-1.5 border hover:opacity-80 transition-opacity"
                        style={{ borderColor: 'var(--surface-border)', color: 'var(--text-muted)' }}
                    >
                        + Add Rule
                    </button>
                    <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                        First matching rule wins · Multiple conditions = AND
                    </div>
                    <button
                        onClick={suggestStrategy}
                        disabled={suggesting}
                        className="px-3 py-1.5 text-[11px] uppercase tracking-wider border transition-opacity disabled:opacity-40 hover:opacity-70"
                        style={{ borderColor: 'var(--surface-border)', color: 'var(--text-muted)' }}
                    >
                        {suggesting ? 'Thinking…' : '✦ Ask AI'}
                    </button>
                    <button
                        onClick={runBacktest}
                        disabled={loading || strategy.rules.length === 0}
                        className="ml-auto px-4 py-1.5 text-[11px] uppercase tracking-wider border font-medium transition-opacity disabled:opacity-40"
                        style={{
                            borderColor: color,
                            color: color,
                            backgroundColor: color + '18',
                        }}
                    >
                        {loading ? 'Running…' : 'Run Backtest →'}
                    </button>
                </div>

                {/* AI rationale */}
                {aiRationale && (
                    <div className="border-l-2 pl-3 py-1 text-[11px] leading-5"
                        style={{ borderColor: color, color: 'var(--text-secondary)' }}>
                        <span className="text-[9px] uppercase tracking-widest mr-2" style={{ color }}>AI</span>
                        {aiRationale}
                    </div>
                )}

                {suggestError && (
                    <div className="text-[11px] px-1" style={{ color: '#f87171' }}>
                        AI error: {suggestError}
                    </div>
                )}

                {error && (
                    <div className="border p-3 text-[11px]"
                        style={{ borderColor: '#f87171', color: '#f87171' }}>
                        {error}
                    </div>
                )}
            </div>

            {/* ── Results ────────────────────────────────────────────── */}
            {result && (
                <div className="border-t" style={{ borderColor: 'var(--surface-border)' }}>

                    {/* Save bar */}
                    <div className="px-5 py-3 flex items-center justify-between border-b"
                        style={{ borderColor: 'var(--surface-border)', backgroundColor: 'var(--surface)' }}>
                        <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                            {result.periods_traded} periods · {result.stats.trade_count} trades
                        </span>
                        <div className="flex items-center gap-3">
                            {saveMsg && (
                                <span className="text-[10px] uppercase tracking-wider"
                                    style={{ color: saveMsg === 'Saved' ? '#4ade80' : '#f87171' }}>
                                    {saveMsg}
                                </span>
                            )}
                            <button
                                onClick={saveStrategy}
                                disabled={saving}
                                className="text-[10px] uppercase tracking-wider px-3 py-1.5 border transition-opacity hover:opacity-70 disabled:opacity-40"
                                style={{ borderColor: color, color }}
                            >
                                {saving ? 'Saving…' : savedStrategyId ? '✓ Saved' : 'Save Strategy'}
                            </button>
                        </div>
                    </div>

                    {/* Stats grid */}
                    <div className="p-5 grid grid-cols-5 gap-2">
                        <StatChip label="Total Return"
                            value={fmt(result.stats.total_return)}
                            positive={(result.stats.total_return ?? 0) > 0}
                            negative={(result.stats.total_return ?? 0) < 0} />
                        <StatChip label="CAGR"
                            value={fmt(result.stats.cagr)}
                            positive={(result.stats.cagr ?? 0) > 0}
                            negative={(result.stats.cagr ?? 0) < 0} />
                        <StatChip label="Sharpe"
                            value={result.stats.sharpe?.toFixed(2) ?? '—'}
                            positive={(result.stats.sharpe ?? 0) > 1} />
                        <StatChip label="Max Drawdown"
                            value={fmt(result.stats.max_drawdown)}
                            negative={true} />
                        <StatChip label="Win Rate"
                            value={result.stats.win_rate != null ? `${result.stats.win_rate}%` : '—'}
                            positive={(result.stats.win_rate ?? 0) > 50} />
                    </div>

                    <div className="px-5 pb-2 grid grid-cols-4 gap-2">
                        <StatChip label="Calmar" value={result.stats.calmar?.toFixed(2) ?? '—'} />
                        <StatChip label="Trades" value={String(result.stats.trade_count)} />
                        <StatChip label="Avg Win"
                            value={fmt(result.stats.avg_win)}
                            positive={true} />
                        <StatChip label="Avg Loss"
                            value={fmt(result.stats.avg_loss)}
                            negative={true} />
                    </div>

                    {/* Tabs */}
                    <div className="flex border-t border-b px-5"
                        style={{ borderColor: 'var(--surface-border)' }}>
                        {(['curve', 'periods'] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className="px-4 py-2.5 text-[10px] uppercase tracking-wider border-b-2 transition-colors"
                                style={{
                                    borderColor: activeTab === tab ? color : 'transparent',
                                    color: activeTab === tab ? color : 'var(--text-muted)',
                                }}
                            >
                                {tab === 'curve' ? 'Equity Curve' : 'By Period'}
                            </button>
                        ))}
                    </div>

                    <div className="p-5">
                        {/* Equity curve */}
                        {activeTab === 'curve' && (
                            <div>
                                <div className="text-[10px] uppercase tracking-wider mb-3"
                                    style={{ color: 'var(--text-muted)' }}>
                                    Equity curve · {result.periods_traded} {regime} periods · {strategy.asset}
                                </div>
                                <EquityCurveChart data={result.equity_curve} color={color} />
                            </div>
                        )}

                        {/* Period breakdown */}
                        {activeTab === 'periods' && (
                            <div className="space-y-1">
                                {result.period_results.map((p, i) => {
                                    const isExpanded = expandedPeriod === i;
                                    const trades = p.trades ?? [];
                                    const retColor = (p.period_return ?? 0) > 0 ? '#4ade80'
                                        : (p.period_return ?? 0) < 0 ? '#f87171'
                                            : 'var(--text-muted)';

                                    return (
                                        <div key={i} className="border overflow-hidden"
                                            style={{ borderColor: p.skipped ? 'var(--surface-border)' : color + '40' }}>
                                            {/* Period row — clickable to expand trades */}
                                            <button
                                                className="w-full flex items-center gap-4 px-4 py-2.5 text-left hover:opacity-80 transition-opacity"
                                                style={{ backgroundColor: p.is_current ? color + '08' : 'transparent' }}
                                                onClick={() => !p.skipped && trades.length > 0 && setExpandedPeriod(isExpanded ? null : i)}
                                            >
                                                {/* Regime window */}
                                                <div className="flex items-center gap-1.5 tabular-nums text-[11px] min-w-[180px]"
                                                    style={{ color: 'var(--text-secondary)' }}>
                                                    <span
                                                        className="h-1.5 w-1.5 rounded-full shrink-0"
                                                        style={{ backgroundColor: p.is_current ? color : 'var(--text-muted)' }}
                                                    />
                                                    <span>{p.start_date.slice(0, 7)}</span>
                                                    <span style={{ color: 'var(--text-muted)' }}>→</span>
                                                    <span style={{ color: p.is_current ? color : 'var(--text-secondary)' }}>
                                                        {p.end_date === 'Current' ? 'Now' : p.end_date.slice(0, 7)}
                                                    </span>
                                                </div>

                                                {/* Strategy return */}
                                                <div className="text-[12px] font-medium tabular-nums w-16 text-right"
                                                    style={{ color: p.skipped ? 'var(--text-muted)' : retColor }}>
                                                    {p.skipped ? '—' : fmt(p.period_return ?? null)}
                                                </div>

                                                {/* Trade count */}
                                                <div className="text-[10px] tabular-nums"
                                                    style={{ color: 'var(--text-muted)' }}>
                                                    {p.skipped ? (
                                                        <span style={{ color: '#f87171' }}>{p.reason}</span>
                                                    ) : (
                                                        `${p.trade_count ?? 0} trade${(p.trade_count ?? 0) !== 1 ? 's' : ''}`
                                                    )}
                                                </div>

                                                {/* Status badge */}
                                                {p.is_current && (
                                                    <span className="ml-1 text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded-sm"
                                                        style={{ backgroundColor: color + '20', color }}>
                                                        Live
                                                    </span>
                                                )}

                                                {/* Expand indicator */}
                                                {!p.skipped && trades.length > 0 && (
                                                    <span className="ml-auto text-[10px]"
                                                        style={{ color: 'var(--text-muted)' }}>
                                                        {isExpanded ? '▲' : '▼'}
                                                    </span>
                                                )}
                                            </button>

                                            {/* Inline trades */}
                                            {isExpanded && trades.length > 0 && (
                                                <div className="border-t"
                                                    style={{ borderColor: 'var(--surface-border)' }}>
                                                    <table className="min-w-full">
                                                        <thead>
                                                            <tr style={{ backgroundColor: 'var(--surface)' }}>
                                                                {['Dir', 'Entry Date', 'Exit Date', 'Days', 'Entry', 'Exit', 'Return'].map(h => (
                                                                    <th key={h}
                                                                        className="px-4 py-1.5 text-left text-[9px] uppercase tracking-wider"
                                                                        style={{ color: 'var(--text-muted)' }}>
                                                                        {h}
                                                                    </th>
                                                                ))}
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {trades.map((t, ti) => (
                                                                <tr key={ti}
                                                                    className="border-t"
                                                                    style={{ borderColor: 'var(--surface-border)' }}>
                                                                    <td className="px-4 py-1.5">
                                                                        <span
                                                                            className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 border rounded-sm"
                                                                            style={{
                                                                                borderColor: t.direction === 'long' ? '#4ade80' : '#f87171',
                                                                                color: t.direction === 'long' ? '#4ade80' : '#f87171',
                                                                            }}>
                                                                            {t.direction}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-4 py-1.5 text-[10px] tabular-nums" style={{ color: 'var(--text-secondary)' }}>
                                                                        {t.entry_date.slice(0, 10)}
                                                                    </td>
                                                                    <td className="px-4 py-1.5 text-[10px] tabular-nums" style={{ color: 'var(--text-secondary)' }}>
                                                                        {t.exit_date.slice(0, 10)}
                                                                    </td>
                                                                    <td className="px-4 py-1.5 text-[10px] tabular-nums font-mono" style={{ color: 'var(--text-muted)' }}>
                                                                        {t.days_held}d
                                                                    </td>
                                                                    <td className="px-4 py-1.5 text-[10px] tabular-nums" style={{ color: 'var(--text-muted)' }}>
                                                                        {t.entry_price.toLocaleString()}
                                                                    </td>
                                                                    <td className="px-4 py-1.5 text-[10px] tabular-nums" style={{ color: 'var(--text-muted)' }}>
                                                                        {t.exit_price.toLocaleString()}
                                                                    </td>
                                                                    <td className="px-4 py-1.5 text-[11px] tabular-nums font-medium">
                                                                        <span style={{
                                                                            color: t.return_pct > 0 ? '#4ade80'
                                                                                : t.return_pct < 0 ? '#f87171'
                                                                                    : 'var(--text-muted)',
                                                                        }}>
                                                                            {fmt(t.return_pct)}
                                                                        </span>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                    </div>
                </div>
            )}
        </div>
    );
}
