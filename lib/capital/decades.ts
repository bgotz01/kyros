// ─── slugs ────────────────────────────────────────────────────────────────────

export const DECADE_SLUGS = [
    '1950s',
    '1960s',
    '1970s',
    '1980s',
    '1990s',
    '2000s',
    '2010s',
    '2020s',
] as const;

export type DecadeSlug = (typeof DECADE_SLUGS)[number];

// ─── section nav ──────────────────────────────────────────────────────────────

export const DECADE_SECTIONS = [
    { slug: '', label: 'Themes' },
    { slug: 'inversions', label: 'Inversions' },
    { slug: 'incentives', label: 'Incentives' },
    { slug: 'inflections', label: 'Inflections' },
] as const;
