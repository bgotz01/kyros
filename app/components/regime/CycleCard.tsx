'use client';

interface CycleCardProps {
    cycleNumber: number;
    title: string;
    subtitle?: string;
    period: string;
    accent: string;
    borderAccent: string;
    isExpanded: boolean;
    onToggle: () => void;
    isCurrent?: boolean;
    children: React.ReactNode;
}

export default function CycleCard({
    cycleNumber,
    title,
    subtitle,
    period,
    accent,
    borderAccent,
    isExpanded,
    onToggle,
    isCurrent,
    children,
}: CycleCardProps) {
    return (
        <div
            className={`group overflow-hidden rounded-sm border border-l-4 transition-all ${borderAccent}`}
            style={{ borderColor: 'var(--surface-border)' }}
        >
            <button
                onClick={onToggle}
                className="w-full text-left transition-colors hover:opacity-80"
                style={isExpanded ? {} : {}}
            >
                <div className="flex items-start justify-between gap-4 p-5">
                    <div className="flex items-start gap-4">
                        <div
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm border text-sm font-bold"
                            style={{ borderColor: 'var(--surface-border)', backgroundColor: 'var(--surface)', color: 'var(--text-primary)' }}
                        >
                            {cycleNumber}
                        </div>
                        <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <h2 className="text-base font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                                    {title}
                                </h2>
                                {isCurrent && (
                                    <span className="rounded-sm px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]"
                                        style={{ backgroundColor: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid var(--accent)' }}>
                                        Current
                                    </span>
                                )}
                            </div>
                            {subtitle && (
                                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>
                            )}
                            <p className="text-[11px] font-medium uppercase tracking-[0.14em]" style={{ color: 'var(--text-muted)' }}>
                                {period}
                            </p>
                        </div>
                    </div>
                    <div
                        className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border text-lg"
                        style={{ borderColor: 'var(--surface-border)', backgroundColor: 'var(--surface)', color: 'var(--text-muted)' }}
                    >
                        <span className={`${isExpanded ? 'rotate-45' : ''} transition-transform inline-block`}>+</span>
                    </div>
                </div>
            </button>
            {isExpanded && (
                <div className="border-t px-5 py-5" style={{ borderColor: 'var(--surface-border)', backgroundColor: 'var(--surface)' }}>
                    <div className="space-y-4">{children}</div>
                </div>
            )}
        </div>
    );
}

export function Section({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="rounded-sm border px-4 py-3" style={{ borderColor: 'var(--surface-border)', backgroundColor: 'var(--surface-raised)' }}>
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: 'var(--text-muted)' }}>{label}</div>
            <div className="text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>{children}</div>
        </div>
    );
}

interface PhaseProps {
    title: string;
    subtitle: string;
    period: string;
    isCurrent?: boolean;
    children: React.ReactNode;
}

export function Phase({ title, subtitle, period, isCurrent, children }: PhaseProps) {
    return (
        <div className="rounded-sm border p-4" style={{
            borderColor: isCurrent ? 'var(--accent)' : 'var(--surface-border)',
            backgroundColor: isCurrent ? 'var(--accent-dim)' : 'var(--surface-raised)',
        }}>
            <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: 'var(--text-muted)' }}>{title}</span>
                        {isCurrent && (
                            <span className="rounded-sm px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]"
                                style={{ backgroundColor: 'var(--accent-dim)', color: 'var(--accent)' }}>
                                Live
                            </span>
                        )}
                    </div>
                    <h3 className="mt-1 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{subtitle}</h3>
                </div>
                <span className="rounded-sm border px-2.5 py-1 text-[11px] font-medium"
                    style={{ borderColor: 'var(--surface-border)', backgroundColor: 'var(--surface)', color: 'var(--text-muted)' }}>
                    {period}
                </span>
            </div>
            <div className="space-y-3">{children}</div>
        </div>
    );
}

export function Row({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex items-start gap-3">
            <div className="w-20 shrink-0 pt-[3px] text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: 'var(--text-muted)' }}>
                {label}
            </div>
            <div className="flex-1 text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>{children}</div>
        </div>
    );
}

export function MiniNote({ children }: { children: React.ReactNode }) {
    return (
        <div className="rounded-sm border border-dashed px-3 py-2 text-xs italic leading-5"
            style={{ borderColor: 'var(--surface-border)', color: 'var(--text-muted)' }}>
            {children}
        </div>
    );
}

export function Break({ kind, children }: { kind: 'phase' | 'regime'; children: React.ReactNode }) {
    const isRegime = kind === 'regime';
    return (
        <div className="rounded-sm border px-4 py-3 text-sm leading-6"
            style={{
                borderColor: isRegime ? 'var(--accent)' : 'var(--surface-border)',
                backgroundColor: isRegime ? 'var(--accent-dim)' : 'var(--surface-raised)',
                color: isRegime ? 'var(--accent)' : 'var(--text-muted)',
            }}>
            <div className="flex items-start gap-3">
                <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: isRegime ? 'var(--accent)' : 'var(--text-muted)' }} />
                <div>{children}</div>
            </div>
        </div>
    );
}

export function RegimeEvent({ year, title, description, breakdown }: {
    year: string; title: string; description: string; breakdown: string;
}) {
    return (
        <div className="overflow-hidden rounded-sm border" style={{ borderColor: 'rgba(239,68,68,0.4)', backgroundColor: 'rgba(239,68,68,0.06)' }}>
            <div className="border-b px-4 py-3" style={{ borderColor: 'rgba(239,68,68,0.2)' }}>
                <div className="mb-1 flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                    <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-red-500">{title}</span>
                    <span className="rounded-sm border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-red-500"
                        style={{ borderColor: 'rgba(239,68,68,0.3)', backgroundColor: 'rgba(239,68,68,0.1)' }}>
                        {year}
                    </span>
                </div>
                <div className="text-sm font-semibold leading-6 text-red-400">{description}</div>
            </div>
            <div className="px-4 py-3">
                <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.14em] text-red-500">Transmission Breakdown</div>
                <div className="text-sm leading-6 text-red-400">{breakdown}</div>
            </div>
        </div>
    );
}
