'use client';

import { SectionLabel } from './ui';

const PATTERNS = [
    'Central bank rate hike cycle preceded each peak by 12–18 months',
    'Peak P/E multiples were 2–6× historical averages at the top',
    'Margin / credit availability amplified both the rise and the fall',
    'Initial crash widely dismissed as a "healthy correction" — lured buyers in',
    'Full drawdown took 2.5–3 years in all three cases',
    'Recovery to prior peak took 15–30+ years — generational timescales',
    'All three featured a "new era" narrative that justified any price',
    'Institutional memory reset between peaks — each felt historically unique',
];

export default function PatternsNote() {
    return (
        <div className="border border-dashed rounded-sm px-4 py-4"
            style={{ borderColor: 'rgba(181,139,74,0.25)' }}>
            <SectionLabel>Common Structural Patterns</SectionLabel>
            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-1.5 mt-1">
                {PATTERNS.map((pt, i) => (
                    <div key={i} className="flex items-start gap-2">
                        <span className="mt-1.5 w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: 'var(--accent)' }} />
                        <span className="text-[11px] leading-5" style={{ color: 'var(--text-muted)' }}>{pt}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
