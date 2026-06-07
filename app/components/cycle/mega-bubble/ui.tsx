'use client';

export function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <div className="text-[9px] uppercase tracking-[0.35em] mb-2" style={{ color: 'var(--accent)' }}>
            {children}
        </div>
    );
}

export function StatCell({ label, value, color }: { label: string; value: string; color?: string }) {
    return (
        <div className="border p-2.5 rounded-sm text-center"
            style={{ borderColor: 'var(--surface-border)', backgroundColor: 'var(--surface)' }}>
            <div className="text-[9px] uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>{label}</div>
            <div className="text-[13px] font-bold tabular-nums" style={{ color: color ?? 'var(--text-primary)' }}>{value}</div>
        </div>
    );
}
