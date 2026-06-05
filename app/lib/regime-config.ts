/** Liquidity + Valuation classification helpers — ported to Panteon */

export interface LiquidityRegime { name: string; description: string }

function scoreReal3M(v: number | null) {
    if (v === null) return 0;
    if (v < -1.0) return 2; if (v < 0.0) return 1; if (v <= 1.5) return 0; if (v <= 3.0) return -1; return -2;
}
function scoreReal10Y(v: number | null) {
    if (v === null) return 0;
    if (v < 0.0) return 2; if (v < 1.0) return 1; if (v <= 2.5) return 0; if (v <= 4.0) return -1; return -2;
}
function scoreYieldCurve(v: number | null) {
    if (v === null) return 0;
    if (v > 1.75) return 2; if (v > 0.75) return 1; if (v >= 0.25) return 0; if (v >= -0.25) return -1; return -2;
}
function scoreRealM2(v: number | null) {
    if (v === null) return 0;
    if (v > 5.0) return 2; if (v > 1.0) return 1; if (v >= -1.0) return 0; if (v >= -5.0) return -1; return -2;
}
function scoreEYP(v: number | null) {
    if (v === null) return 0;
    if (v > 4.0) return 2; if (v > 2.0) return 1; if (v >= 0.0) return 0; if (v >= -2.0) return -1; return -2;
}
function scoreRealEY(v: number | null) {
    if (v === null) return 0;
    if (v > 6.0) return 2; if (v > 4.0) return 1; if (v > 2.0) return 0; if (v >= 0.0) return -1; return -2;
}

function liquidityName(total: number, realM2: number | null): string {
    if (total >= 5 && realM2 !== null && realM2 >= 5) return 'Highly Expansionary Liquidity';
    if (total >= 2) return 'Expansionary Liquidity';
    if (total >= -1) return 'Neutral Liquidity';
    if (total >= -4) return 'Contractive Liquidity';
    return 'Highly Contractive Liquidity';
}

function valuationName(total: number): string {
    if (total >= 3) return 'Deep Value';
    if (total >= 1) return 'Attractive';
    if (total >= -1) return 'Fair';
    if (total >= -2) return 'Expensive';
    if (total >= -3) return 'Very Expensive';
    return 'Extremely Expensive';
}

export function calculateLiquidityRegime(real3M: number | null, real10Y: number | null, yieldCurve: number | null, realM2: number | null = null) {
    const total = scoreReal3M(real3M) + scoreReal10Y(real10Y) + scoreYieldCurve(yieldCurve) + scoreRealM2(realM2);
    return { regime: { name: liquidityName(total, realM2), description: '' } as LiquidityRegime };
}

export function calculateValuationRegime(eyp: number | null, realEY: number | null) {
    const total = scoreEYP(eyp) + scoreRealEY(realEY);
    return { regime: { name: valuationName(total), description: '' } as LiquidityRegime };
}

export function getReal3MLabel(v: number | null): string {
    if (v === null) return 'N/A';
    if (v < -1) return 'Highly Expansionary'; if (v < 0) return 'Expansionary'; if (v <= 1.5) return 'Neutral'; if (v <= 3) return 'Contractive'; return 'Highly Contractive';
}
export function getReal10YLabel(v: number | null): string {
    if (v === null) return 'N/A';
    if (v < 0) return 'Highly Expansionary'; if (v < 1) return 'Expansionary'; if (v <= 2.5) return 'Neutral'; if (v <= 4) return 'Contractive'; return 'Highly Contractive';
}
export function getYieldCurveLabel(v: number | null): string {
    if (v === null) return 'N/A';
    if (v > 1.75) return 'Highly Expansionary'; if (v > 0.75) return 'Expansionary'; if (v >= 0.25) return 'Neutral'; if (v >= -0.25) return 'Contractive'; return 'Highly Contractive';
}
export function getRealM2Label(v: number | null): string {
    if (v === null) return 'N/A';
    if (v > 5) return 'Highly Expansionary'; if (v > 1) return 'Expansionary'; if (v >= -1) return 'Neutral'; if (v >= -5) return 'Contractive'; return 'Highly Contractive';
}
export function getEYPLabel(v: number | null): string {
    if (v === null) return 'N/A';
    if (v > 4) return 'Extremely Attractive'; if (v > 2) return 'Attractive'; if (v >= 0) return 'Fair'; if (v >= -2) return 'Expensive'; return 'Extremely Expensive';
}
export function getRealEYLabel(v: number | null): string {
    if (v === null) return 'N/A';
    if (v > 6) return 'Extremely Attractive'; if (v > 4) return 'Attractive'; if (v > 2) return 'Fair'; if (v >= 0) return 'Expensive'; return 'Extremely Expensive';
}

export function getRegimeColorClass(name: string): string {
    if (name.includes('Highly Expansionary') || name === 'Deep Value') return 'text-lime-400 border-lime-500';
    if (name.includes('Expansionary') || name === 'Attractive') return 'text-green-400 border-green-500';
    if (name.includes('Neutral') || name === 'Fair') return 'text-blue-400 border-blue-500';
    if (name.includes('Contractive') || name === 'Expensive') return 'text-yellow-400 border-yellow-500';
    return 'text-red-400 border-red-500';
}
