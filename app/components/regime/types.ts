export interface MetricData {
    value: number | null;
    percentile: number | null;
    date: string | null;
}

export interface RegimeData {
    fedFunds: MetricData;
    irx: MetricData;
    tnx: MetricData;
    cpi: MetricData;
    eyp5yr: MetricData;
    rey5yr: MetricData;
    real10Y: MetricData;
    real3M: MetricData;
    realM2: MetricData;
    yieldCurve: MetricData;
    pe5yr: MetricData;
    ey5yr: MetricData;
}

export function emptyMetric(): MetricData { return { value: null, percentile: null, date: null }; }
export function fmt(v: number | null, d = 2): string { return v === null ? 'N/A' : `${v.toFixed(d)}%`; }
export function fmtDate(d: string | null): string {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
}
