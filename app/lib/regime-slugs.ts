/**
 * Slug utilities for regime detail pages
 * Converts between RegimeFamily display names and URL-safe slugs
 */

import type { RegimeFamily } from './regime-state-machine';
import { REGIME_METADATA } from './regime-state-machine';

export const REGIME_SLUGS: Record<RegimeFamily, string> = {
    'Broad Growth': 'broad-growth',
    'Long Duration': 'long-duration',
    'Overvaluation': 'overvaluation',
    'Crisis': 'crisis',
    'Bond Stress': 'bond-stress',
    'Liquidity Shock': 'liquidity-shock',
    'None': 'none',
};

// Reverse map: slug → RegimeFamily
const SLUG_TO_REGIME: Record<string, RegimeFamily> = Object.fromEntries(
    Object.entries(REGIME_SLUGS).map(([regime, slug]) => [slug, regime as RegimeFamily])
) as Record<string, RegimeFamily>;

export function regimeToSlug(regime: RegimeFamily): string {
    return REGIME_SLUGS[regime] ?? 'none';
}

export function slugToRegime(slug: string): RegimeFamily | null {
    return SLUG_TO_REGIME[slug] ?? null;
}

export function isValidRegimeSlug(slug: string): boolean {
    return slug in SLUG_TO_REGIME;
}

/** All regime slugs except 'none', ordered by the standard precedence */
export const ALL_REGIME_SLUGS = [
    'liquidity-shock',
    'crisis',
    'bond-stress',
    'overvaluation',
    'broad-growth',
    'long-duration',
] as const;

export type RegimeSlug = typeof ALL_REGIME_SLUGS[number];
