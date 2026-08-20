// ─── Axis scales and number formatting ────────────────────────────────────────
// Index levels run from 66 (the Dow in 1900) to 45,000, so the markets chart
// needs a log axis and tick labels that stay short at every magnitude. The
// macro chart's integer-percent range maths does neither.

const NICE_MANTISSAS = [1, 2, 5];

/** Round a positive value out to the nearest 1/2/5 × 10ⁿ. */
function niceBound(v: number, dir: 'down' | 'up'): number {
    const exp = Math.floor(Math.log10(v));
    const mantissa = v / 10 ** exp;

    if (dir === 'down') {
        const m = [...NICE_MANTISSAS].reverse().find(n => n <= mantissa + 1e-9) ?? 1;
        return m * 10 ** exp;
    }
    const m = NICE_MANTISSAS.find(n => n >= mantissa - 1e-9);
    return m != null ? m * 10 ** exp : 10 ** (exp + 1);
}

export interface Scale {
    /** Domain the plot is drawn against. */
    lo: number;
    hi: number;
    ticks: number[];
    /** Value → 0-1 along the axis, bottom to top. */
    norm: (v: number) => number;
}

/** Grid points of the 1/2/5 × 10ⁿ ladder that fall inside [lo, hi]. */
function ladder(lo: number, hi: number): number[] {
    const ticks: number[] = [];
    for (let exp = Math.floor(Math.log10(lo)); exp <= Math.ceil(Math.log10(hi)); exp++) {
        for (const m of NICE_MANTISSAS) {
            const v = m * 10 ** exp;
            if (v >= lo * 0.999 && v <= hi * 1.001) ticks.push(v);
        }
    }
    return ticks;
}

/** A log₁₀ axis ruled at 1/2/5 × 10ⁿ. Only valid for strictly positive data,
 *  which index levels always are.
 *
 *  The domain is held tight to the readings — a single decade of a single
 *  index moves within one order of magnitude, and rounding out to a full
 *  power of ten would spend half the plot on empty air. It is only widened
 *  when the range is too narrow to rule. */
export function logScale(min: number, max: number): Scale {
    const lo = niceBound(Math.max(min, 1e-6), 'down');
    let hi = Math.max(niceBound(max, 'up'), lo * 2);

    let ticks = ladder(lo, hi);
    // Two rules do not read as an axis; step the top up the ladder until three.
    while (ticks.length < 3) {
        hi = niceBound(hi * 1.5, 'up');
        ticks = ladder(lo, hi);
    }

    const l = Math.log10(lo);
    const span = Math.log10(hi) - l || 1;
    return { lo, hi, ticks, norm: v => (Math.log10(Math.max(v, 1e-6)) - l) / span };
}

/** A linear axis on a 1/2/2.5/5 × 10ⁿ step, aiming for `count` intervals. */
export function linearScale(min: number, max: number, count = 6): Scale {
    const span = max - min || Math.abs(max) || 1;
    const raw = span / count;
    const exp = Math.floor(Math.log10(raw));
    const mantissa = raw / 10 ** exp;
    const step =
        (mantissa <= 1 ? 1 : mantissa <= 2 ? 2 : mantissa <= 2.5 ? 2.5 : mantissa <= 5 ? 5 : 10) *
        10 ** exp;

    const lo = Math.floor(min / step) * step;
    const hi = Math.ceil(max / step) * step;

    // Steps below 1 accumulate float dust; snap each tick back to the step grid.
    const decimals = Math.max(0, -Math.floor(Math.log10(step)) + 1);
    const ticks: number[] = [];
    for (let i = 0; lo + i * step <= hi + step * 0.5; i++) {
        ticks.push(Number((lo + i * step).toFixed(decimals)));
        if (ticks.length > 14) break;
    }

    const range = hi - lo || 1;
    return { lo, hi, ticks, norm: v => (v - lo) / range };
}

// ─── formatting ───────────────────────────────────────────────────────────────

/** Axis-width labels: 45k, 5.4k, 500, 66, 0.5. */
export function formatCompact(v: number): string {
    const abs = Math.abs(v);
    if (abs >= 1_000_000) return `${trim(v / 1_000_000)}M`;
    if (abs >= 1_000) return `${trim(v / 1_000)}k`;
    if (abs >= 10) return String(Math.round(v));
    if (abs >= 1) return trim(v);
    return v === 0 ? '0' : trim(v);
}

function trim(v: number): string {
    return String(Number(v.toFixed(v === Math.round(v) ? 0 : 2)));
}

/** Full precision, for the readout panel rather than the axis. */
export function formatFull(v: number): string {
    return v.toLocaleString('en-US', {
        minimumFractionDigits: Math.abs(v) >= 100 ? 0 : 2,
        maximumFractionDigits: Math.abs(v) >= 100 ? 0 : 2,
    });
}
