import type { ReactNode } from 'react';

export function SectionEyebrow({ children }: { children: ReactNode }) {
    return (
        <p className="font-sans text-[0.62rem] uppercase tracking-[0.24em] text-bronze">
            {children}
        </p>
    );
}

export function SectionHeader({
    eyebrow,
    title,
    body,
}: {
    eyebrow: string;
    title: string;
    body: ReactNode;
}) {
    return (
        <div className="max-w-3xl">
            <SectionEyebrow>{eyebrow}</SectionEyebrow>
            <h2 className="mt-3 font-serif text-2xl font-light tracking-[0.08em] text-marble md:text-[1.7rem]">
                {title}
            </h2>
            <div className="mt-4 max-w-2xl font-sans text-[0.8rem] leading-7 tracking-[0.025em] text-platinum-dim">
                {body}
            </div>
        </div>
    );
}

export function ConceptCard({
    label,
    title,
    children,
    accent = false,
}: {
    label?: string;
    title: string;
    children: ReactNode;
    accent?: boolean;
}) {
    return (
        <div
            className={`border px-5 py-5 md:px-6 md:py-6 ${
                accent
                    ? 'border-bronze-dim bg-obsidian/55'
                    : 'border-stone-line bg-obsidian/30'
            }`}
        >
            {label && (
                <p className="font-mono text-[0.59rem] uppercase tracking-[0.2em] text-bronze">
                    {label}
                </p>
            )}
            <h3 className="mt-2 font-serif text-lg font-light tracking-[0.07em] text-marble">
                {title}
            </h3>
            <div className="mt-4 font-sans text-[0.76rem] leading-6 tracking-[0.025em] text-platinum-dim">
                {children}
            </div>
        </div>
    );
}

export function DiagramBox({ children }: { children: ReactNode }) {
    return (
        <div className="overflow-x-auto border border-stone-line bg-obsidian px-5 py-5 md:px-6">
            <div className="min-w-max font-mono text-[0.68rem] leading-7 tracking-[0.07em] text-platinum-dim">
                {children}
            </div>
        </div>
    );
}

export function FlowNode({
    children,
    tone = 'default',
}: {
    children: ReactNode;
    tone?: 'default' | 'bronze' | 'dim';
}) {
    const toneClass =
        tone === 'bronze'
            ? 'border-bronze-dim text-bronze-bright bg-bronze-dim/5'
            : tone === 'dim'
              ? 'border-stone-line text-platinum-dim bg-black/10'
              : 'border-stone-line-strong text-platinum bg-obsidian';

    return (
        <div className={`flex min-h-14 items-center justify-center border px-4 py-3 text-center font-mono text-[0.65rem] uppercase tracking-[0.15em] ${toneClass}`}>
            {children}
        </div>
    );
}

export function Arrow({ children = '→' }: { children?: ReactNode }) {
    return (
        <span className="shrink-0 font-mono text-[0.75rem] tracking-normal text-stone-line-strong">
            {children}
        </span>
    );
}
