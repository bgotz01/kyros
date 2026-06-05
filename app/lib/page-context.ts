/**
 * Page Context Configuration
 *
 * Maps each route to:
 * - The primary agent for that page (who leads the response)
 * - A description of what the user is looking at
 * - The data layers to load for that page (primary = always, secondary = question-triggered)
 *
 * This is injected into Athena's system prompt so she understands what the user is looking at.
 */

import type { AgentName } from './settings';

export type DataLayer = 'macro' | 'breadth' | 'momentum' | 'positioning' | 'returns';

export interface PageContext {
    /** The agent who is the primary voice on this page */
    primaryAgent: AgentName;
    /** Short label shown in the sidebar UI */
    pageLabel: string;
    /** Injected into the system prompt — describes what the page shows */
    description: string;
    /** Data layers always loaded for this page (primary context) */
    primaryLayers?: DataLayer[];
    /** Data layers loaded only when question asks for them */
    secondaryLayers?: DataLayer[];
}

const PAGE_CONTEXT_MAP: Record<string, PageContext> = {
    // ── Home / Council ───────────────────────────────────────────────────────
    '/': {
        primaryAgent: 'athena',
        pageLabel: 'Council Chamber',
        description: 'The user is on the main Council Chamber — the primary dialogue interface.',
        primaryLayers: ['macro'],
        secondaryLayers: ['breadth', 'momentum', 'positioning'],
    },
    '/council': {
        primaryAgent: 'athena',
        pageLabel: 'Council',
        description: 'The user is in the Council view — the full-screen dialogue chamber.',
        primaryLayers: ['macro'],
        secondaryLayers: ['breadth', 'momentum', 'positioning'],
    },

    // ── Regime ───────────────────────────────────────────────────────────────
    '/regime': {
        primaryAgent: 'atlas',
        pageLabel: 'Regime Engine',
        description: 'The user is on the Regime page, which displays the active macro regime — including regime classification (Overvaluation, Long Duration, Broad Growth, Crisis, Bond Stress, Liquidity Shock, Normal), entry date, and key metrics: Real Earnings Yield, Earnings Yield Premium, Real 10Y, Real 3M, Real M2.',
        primaryLayers: ['macro'],
        secondaryLayers: ['breadth', 'returns'],
    },
    '/regime/returns': {
        primaryAgent: 'atlas',
        pageLabel: 'Regime Returns',
        description: 'The user is on the Regime Returns page, showing historical S&P 500, Nasdaq 100, and Gold returns during each regime type — duration, total return, annualized return, monthly return, and 1Y/3Y/5Y forward returns from regime entry.',
        primaryLayers: ['macro', 'returns'],
        secondaryLayers: ['breadth'],
    },

    // ── Cycle ─────────────────────────────────────────────────────────────────
    '/cycle': {
        primaryAgent: 'janus',
        pageLabel: 'Cycle',
        description: 'The user is on the Cycle page — showing the Trend Pressure Score chart for the S&P 500 (and optionally Nasdaq 100). The chart displays four rolling percentile metrics: Price Divergence from the 200MA, Days Above 200MA (streak), 200MA Slope, and 50/200 MA spread. These combine into a composite Trend Pressure Score (0–100) where >70 is elevated and >85 is historically stretched. Users can toggle between 200MA and 500MA, switch between S&P 500 and Nasdaq 100, and view either percentile or raw values.',
        primaryLayers: ['macro', 'breadth'],
        secondaryLayers: ['momentum'],
    },

    // ── Stocks ────────────────────────────────────────────────────────────────
    '/stocks': {
        primaryAgent: 'sigma',
        pageLabel: 'Stocks',
        description: 'The user is on the Stocks page — equity intelligence screen showing momentum structure, sector dynamics, breadth, factor exposure, and relative strength.',
        primaryLayers: ['momentum'],
        secondaryLayers: ['macro', 'breadth', 'positioning'],
    },
    '/stocks/stock-screener': {
        primaryAgent: 'sigma',
        pageLabel: 'Stock Screener',
        description: 'The user is on the Stock Screener page — filtering and ranking stocks by momentum, sector, market cap, revenue growth, and technical structure.',
        primaryLayers: ['momentum'],
        secondaryLayers: ['macro'],
    },

    // ── Agent Chambers (kept for backward compat) ─────────────────────────────
    '/atlas': {
        primaryAgent: 'atlas',
        pageLabel: 'Atlas Chamber',
        description: 'Macro regime intelligence center — liquidity conditions, rate structures, valuation levels, regime state.',
        primaryLayers: ['macro'],
        secondaryLayers: ['breadth', 'returns'],
    },
    '/janus': {
        primaryAgent: 'janus',
        pageLabel: 'Janus Chamber',
        description: 'Transition and pattern intelligence — cycle phases, leadership rotations, historical analogs, regime transition signals.',
        primaryLayers: ['breadth', 'macro'],
        secondaryLayers: ['momentum'],
    },
    '/sigma': {
        primaryAgent: 'sigma',
        pageLabel: 'Sigma Chamber',
        description: 'Asset and momentum intelligence — price structure, sector dynamics, breadth conditions, momentum extension.',
        primaryLayers: ['momentum', 'breadth'],
        secondaryLayers: ['macro'],
    },
    '/achilles': {
        primaryAgent: 'achilles',
        pageLabel: 'Achilles Chamber',
        description: 'Asymmetry and risk intelligence — crowding, concentration risk, fragility signals, asymmetric setups.',
        primaryLayers: ['positioning', 'breadth'],
        secondaryLayers: ['macro'],
    },
    '/athena': {
        primaryAgent: 'athena',
        pageLabel: 'Athena Chamber',
        description: 'Synthesis and judgment center — portfolio scenarios, probability maps, strategic summaries.',
        primaryLayers: ['macro', 'breadth'],
        secondaryLayers: ['momentum', 'positioning'],
    },
};

/**
 * Returns the PageContext for a given pathname.
 * Matches longest prefix so nested routes inherit parent context.
 * Falls back to a generic Athena context if no match.
 */
export function getPageContext(pathname: string): PageContext {
    // Try exact match first, then longest prefix
    let bestMatch: PageContext | null = null;
    let bestLength = -1;

    for (const [route, context] of Object.entries(PAGE_CONTEXT_MAP)) {
        if (pathname === route || (pathname.startsWith(route + '/') && route !== '/')) {
            if (route.length > bestLength) {
                bestLength = route.length;
                bestMatch = context;
            }
        }
    }

    // Exact '/' match
    if (!bestMatch && (pathname === '/' || pathname === '')) {
        bestMatch = PAGE_CONTEXT_MAP['/'];
    }

    return bestMatch ?? {
        primaryAgent: 'athena',
        pageLabel: 'Panteon',
        description: `The user is navigating Panteon at path: ${pathname}`,
    };
}

/** Agent display metadata — glyph and domain label */
export const AGENT_META: Record<AgentName, { glyph: string; domain: string; label: string }> = {
    atlas: { glyph: '△', domain: 'Regime', label: 'Atlas' },
    janus: { glyph: '◐', domain: 'Transition', label: 'Janus' },
    sigma: { glyph: 'Σ', domain: 'Asset', label: 'Sigma' },
    achilles: { glyph: '◇', domain: 'Asymmetry', label: 'Achilles' },
    athena: { glyph: 'ϟ', domain: 'Judgment', label: 'Athena' },
};
