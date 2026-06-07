'use client';

import { BUBBLES } from './types';
import { SectionLabel } from './ui';

const ROWS = [
    { label: 'Period', vals: ['1925–1932', '1984–1992', '1995–2002'] },
    { label: 'Peak Date', vals: ['Sep 3, 1929', 'Dec 29, 1989', 'Mar 10, 2000'] },
    { label: 'Peak Level', vals: ['381 (DJIA)', '38,957 (Nikkei)', '5,049 (Nasdaq)'] },
    { label: 'Peak P/E', vals: ['~32×', '~60×', '~200×'] },
    { label: 'Max Drawdown', vals: ['−89%', '−82%', '−78%'] },
    { label: 'Crash Duration', vals: ['34 months', '32 months', '30 months'] },
    { label: 'Recovery', vals: ['25+ years', 'Still unrecovered (30+ yr)', '~15 years'] },
    { label: 'Rate Catalyst', vals: ['Fed hiked 1928–29', 'BoJ hiked 1989–90', 'Fed hiked 1999–2000'] },
    { label: 'Credit Driver', vals: ['Margin debt', 'Land collateral loans', 'VC / IPO mania'] },
    { label: 'Systemic Risk', vals: ['9,000 bank failures', 'Zombie banks', 'Corporate fraud'] },
    { label: 'Narrative', vals: ['"Permanent plateau"', '"Japan #1"', '"New economy"'] },
];

export default function ComparisonTable() {
    return (
        <div className="border rounded-sm overflow-hidden"
            style={{ borderColor: 'var(--surface-border)', backgroundColor: 'var(--surface-raised)' }}>
            <div className="px-4 pt-3 pb-2 border-b" style={{ borderColor: 'var(--surface-border)' }}>
                <SectionLabel>Structural Comparison</SectionLabel>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-[11px]">
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--surface-border)' }}>
                            <th className="text-left px-4 py-2.5 text-[9px] uppercase tracking-[0.25em]"
                                style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Metric</th>
                            {BUBBLES.map(b => (
                                <th key={b.id} className="text-right px-4 py-2.5 text-[9px] uppercase tracking-[0.15em]"
                                    style={{ color: b.color, fontWeight: 500 }}>
                                    {b.label.split(' ').slice(0, 2).join(' ')}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {ROWS.map((row, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                <td className="px-4 py-2 text-[10px] uppercase tracking-wider"
                                    style={{ color: 'var(--text-muted)' }}>
                                    {row.label}
                                </td>
                                {row.vals.map((val, j) => (
                                    <td key={j} className="px-4 py-2 text-right tabular-nums"
                                        style={{ color: 'var(--text-secondary)' }}>
                                        {val}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
