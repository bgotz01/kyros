/**
 * Market Regime State Machine — ported to Panteon
 */

export type RegimeFamily =
    | 'Broad Growth'
    | 'Long Duration'
    | 'Overvaluation'
    | 'Crisis'
    | 'Bond Stress'
    | 'Liquidity Shock'
    | 'None';

export interface CurrentConditions {
    rey: number | null;
    eyp: number | null;
    real10Y: number | null;
    real3M: number | null;
    realM2: number | null;
    liquidityScore: number;
    stage: string;
    pressure: string;
    risk: string;
    direction: string;
    trendAge: number | null;
}

export interface RegimeState {
    regime: RegimeFamily;
    entryDate: string;
    triggerReason: string;
    description: string;
    guidance: string;
    color: string;
}

const T = {
    broadGrowth: { entryREY: 3, exitREY: 1 },
    longDuration: { entryEYP: 0, entryReal10Y: 1, entryREY: 0, exitEYP_hi: 0, exitEYP_lo: -2.5, exitREY: -0.5 },
    overvaluation: { entryEYP: -2.5, entryREY: -0.5, exitEYP: 0, exitREY: 0.5 },
    crisis: { entryReal10Y: -1, entryRealM2: 5, exitReal10Y: 0.5, exitRealM2: 7 },
    bondStress: { entryReal10Y: -0.5, entryReal3M: -1, exitReal10Y: 0.25 },
    liquidityShock: { entryRealM2: 10, exitRealM2: 8 },
} as const;

export const REGIME_TRIGGERS: Record<RegimeFamily, {
    entry: (c: CurrentConditions) => boolean;
    exit: (c: CurrentConditions) => boolean;
    reason: (c: CurrentConditions) => string;
    entryDescription: string;
    exitDescription: string;
}> = {
    'Broad Growth': {
        entry: c => c.rey !== null && c.rey >= T.broadGrowth.entryREY,
        exit: c => c.rey !== null && c.rey < T.broadGrowth.exitREY,
        reason: c => `Broad Growth: REY ${c.rey?.toFixed(2)}%`,
        entryDescription: `Entry: REY ≥ ${T.broadGrowth.entryREY}%`,
        exitDescription: `Exit: REY < ${T.broadGrowth.exitREY}%`,
    },
    'Long Duration': {
        entry: c => c.eyp !== null && c.real10Y !== null && c.rey !== null &&
            c.eyp <= T.longDuration.entryEYP && c.real10Y >= T.longDuration.entryReal10Y && c.rey >= T.longDuration.entryREY,
        exit: c => c.eyp !== null && c.rey !== null &&
            (c.eyp >= T.longDuration.exitEYP_hi || c.eyp <= T.longDuration.exitEYP_lo || c.rey <= T.longDuration.exitREY),
        reason: c => `Long Duration: EYP ${c.eyp?.toFixed(2)}%, Real 10Y ${c.real10Y?.toFixed(2)}%`,
        entryDescription: `Entry: EYP ≤ ${T.longDuration.entryEYP}% AND Real 10Y ≥ ${T.longDuration.entryReal10Y}% AND REY ≥ ${T.longDuration.entryREY}%`,
        exitDescription: `Exit: EYP ≥ ${T.longDuration.exitEYP_hi}% OR EYP ≤ ${T.longDuration.exitEYP_lo}% OR REY < ${T.longDuration.exitREY}%`,
    },
    'Overvaluation': {
        entry: c => c.eyp !== null && c.rey !== null && (c.eyp <= T.overvaluation.entryEYP || c.rey <= T.overvaluation.entryREY),
        exit: c => c.eyp !== null && c.rey !== null && c.eyp >= T.overvaluation.exitEYP && c.rey >= T.overvaluation.exitREY,
        reason: c => `Overvaluation: EYP ${c.eyp?.toFixed(2)}%, REY ${c.rey?.toFixed(2)}%`,
        entryDescription: `Entry: EYP ≤ ${T.overvaluation.entryEYP}% OR REY ≤ ${T.overvaluation.entryREY}%`,
        exitDescription: `Exit: EYP ≥ ${T.overvaluation.exitEYP}% AND REY ≥ ${T.overvaluation.exitREY}%`,
    },
    'Crisis': {
        entry: c => c.real10Y !== null && c.realM2 !== null && c.real10Y <= T.crisis.entryReal10Y && c.realM2 <= T.crisis.entryRealM2,
        exit: c => c.real10Y !== null && c.realM2 !== null && (c.real10Y >= T.crisis.exitReal10Y || c.realM2 >= T.crisis.exitRealM2),
        reason: c => `Crisis: Real 10Y ${c.real10Y?.toFixed(2)}%, Real M2 ${c.realM2?.toFixed(1)}%`,
        entryDescription: `Entry: Real 10Y ≤ ${T.crisis.entryReal10Y}% AND Real M2 ≤ ${T.crisis.entryRealM2}%`,
        exitDescription: `Exit: Real 10Y ≥ ${T.crisis.exitReal10Y}% OR Real M2 ≥ ${T.crisis.exitRealM2}%`,
    },
    'Bond Stress': {
        entry: c => c.real10Y !== null && c.real3M !== null && c.real10Y <= T.bondStress.entryReal10Y && c.real3M <= T.bondStress.entryReal3M,
        exit: c => c.real10Y !== null && c.real10Y >= T.bondStress.exitReal10Y,
        reason: c => `Bond Stress: Real 10Y ${c.real10Y?.toFixed(2)}%, Real 3M ${c.real3M?.toFixed(2)}%`,
        entryDescription: `Entry: Real 10Y ≤ ${T.bondStress.entryReal10Y}% AND Real 3M ≤ ${T.bondStress.entryReal3M}%`,
        exitDescription: `Exit: Real 10Y ≥ ${T.bondStress.exitReal10Y}%`,
    },
    'Liquidity Shock': {
        entry: c => c.realM2 !== null && c.realM2 >= T.liquidityShock.entryRealM2,
        exit: c => c.realM2 !== null && c.realM2 <= T.liquidityShock.exitRealM2,
        reason: c => `Liquidity Shock: Real M2 ${c.realM2?.toFixed(1)}%`,
        entryDescription: `Entry: Real M2 ≥ ${T.liquidityShock.entryRealM2}%`,
        exitDescription: `Exit: Real M2 ≤ ${T.liquidityShock.exitRealM2}%`,
    },
    'None': {
        entry: () => false,
        exit: () => false,
        reason: () => 'Balanced conditions — no extreme triggers',
        entryDescription: 'Default state when no outlier triggers are active',
        exitDescription: '',
    },
};

export const REGIME_METADATA: Record<RegimeFamily, { description: string; guidance: string; color: string }> = {
    'Broad Growth': { description: 'Strong real earnings environment — healthy equity expansion', guidance: 'Earnings growing faster than inflation — lean into quality growth', color: '#22c55e' },
    'Long Duration': { description: 'Equities overvalued relative to bonds — duration growth', guidance: 'Negative equity risk premium — investors buying duration/growth', color: '#3b82f6' },
    'Overvaluation': { description: 'Extreme equity unattractiveness — equities far below risk-free rate', guidance: 'Rotate away from equities: favor bonds if Real 10Y > 0%, favor gold if Real 10Y < 0%', color: '#eab308' },
    'Crisis': { description: 'Financial repression with low money growth — crisis conditions', guidance: 'Real rates negative but money tight — defensive positioning critical', color: '#991b1b' },
    'Bond Stress': { description: 'Real rates deeply negative across the curve — bond market stress', guidance: 'Severe financial repression — rotate to gold as bonds are unattractive', color: '#ea580c' },
    'Liquidity Shock': { description: 'Financial repression with high money growth — liquidity shock', guidance: 'Massive liquidity injection — speculative assets thrive', color: '#a855f7' },
    'None': { description: 'Balanced conditions — no extreme triggers active', guidance: 'Standard market environment — maintain diversified positioning', color: '#6b7280' },
};

const PRECEDENCE: RegimeFamily[] = ['Liquidity Shock', 'Crisis', 'Bond Stress', 'Overvaluation', 'Broad Growth', 'Long Duration'];

export function determineNextRegime(
    currentState: RegimeState | null,
    conditions: CurrentConditions,
    currentDate: string,
): RegimeState {
    const currentRegime = currentState?.regime ?? null;

    for (const regime of PRECEDENCE) {
        const cfg = REGIME_TRIGGERS[regime];
        const triggered = cfg.entry(conditions);
        const shouldExit = regime === currentRegime && cfg.exit(conditions);

        if (triggered && regime !== currentRegime) {
            return mkState(regime, currentDate, cfg.reason(conditions));
        }
        if (regime === currentRegime && !shouldExit) {
            return currentState!;
        }
    }

    if (currentState && currentState.regime !== 'None') {
        const cfg = REGIME_TRIGGERS[currentState.regime];
        if (!cfg.exit(conditions)) return currentState;
    }

    return mkState('None', currentDate, 'Balanced conditions — no extreme triggers');
}

function mkState(regime: RegimeFamily, entryDate: string, triggerReason: string): RegimeState {
    const m = REGIME_METADATA[regime];
    return { regime, entryDate, triggerReason, description: m.description, guidance: m.guidance, color: m.color };
}
