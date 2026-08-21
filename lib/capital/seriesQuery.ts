// ─── Bucketed series queries ──────────────────────────────────────────────────
// Both market routes read the same shape of table: a text 'YYYY-MM-DD' date, a
// series name, a column name and a value. What differs is how finely the rows
// are bucketed and what slice of history is asked for.
//
// The source is daily. A bucket takes the last reading inside it — a close, not
// an average — whatever its width.

import type { Resolution, Window } from './marketIndexes';

const BUCKET: Record<Resolution, string> = {
    daily: 'day',
    weekly: 'week',
    monthly: 'month',
};

const STEP: Record<Resolution, string> = {
    daily: '1 day',
    weekly: '1 week',
    monthly: '1 month',
};

const RESOLUTIONS = Object.keys(BUCKET) as Resolution[];

export function isResolution(v: string | null): v is Resolution {
    return v != null && (RESOLUTIONS as string[]).includes(v);
}

/** 'YYYY-MM-DD', and nothing else — these reach a WHERE clause. */
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export function parseWindow(params: URLSearchParams): Window | null {
    const from = params.get('from');
    const to = params.get('to');
    const trailing = params.get('trailing');

    if (from != null || to != null) {
        if (from == null || to == null || !DATE.test(from) || !DATE.test(to)) return null;
        return { kind: 'range', from, to };
    }
    if (trailing != null) {
        const years = Number(trailing);
        if (!Number.isInteger(years) || years < 1 || years > 200) return null;
        return { kind: 'trailing', years };
    }
    return { kind: 'all' };
}

export interface SeriesQuery {
    text: string;
    params: (string | number)[];
}

/**
 * One series, bucketed and windowed.
 *
 * Weekly and monthly results are laid on a complete spine of buckets, so a
 * period with no reading behind it comes back as a null and the plot breaks
 * the line there — points are spaced evenly, so a dropped bucket would
 * compress the gap and quietly redraw the timeline. Daily results are not
 * spined: weekends and holidays are absences every price chart already skips,
 * and ruling them in would dash the line.
 */
export function seriesQuery(
    assetClass: string,
    series: string,
    column: string,
    resolution: Resolution,
    window: Window,
): SeriesQuery {
    const bucket = BUCKET[resolution];
    const params: (string | number)[] = [assetClass, series, column];

    const filters = [
        'asset_class = $1',
        'series_name = $2',
        'column_name = $3',
        'value IS NOT NULL',
    ];

    if (window.kind === 'range') {
        // `date` is text in ISO order, so a lexical compare is a date compare.
        params.push(window.from, window.to);
        filters.push(`date >= $${params.length - 1}`, `date <= $${params.length}`);
    } else if (window.kind === 'trailing') {
        params.push(window.years);
        filters.push(`
            TO_DATE(date, 'YYYY-MM-DD') >= (
                SELECT max(TO_DATE(date, 'YYYY-MM-DD'))
                FROM macro_time_series
                WHERE asset_class = $1 AND series_name = $2 AND column_name = $3
            ) - ($${params.length}::int * INTERVAL '1 year')`);
    }

    const present = `
        SELECT DISTINCT ON (date_trunc('${bucket}', TO_DATE(date, 'YYYY-MM-DD')))
            date_trunc('${bucket}', TO_DATE(date, 'YYYY-MM-DD')) AS bucket,
            value
        FROM macro_time_series
        WHERE ${filters.join('\n          AND ')}
        ORDER BY
            date_trunc('${bucket}', TO_DATE(date, 'YYYY-MM-DD')) ASC,
            TO_DATE(date, 'YYYY-MM-DD') DESC`;

    if (resolution === 'daily') {
        return {
            text: `
                WITH present AS (${present})
                SELECT to_char(bucket, 'YYYY-MM-DD') AS date, value
                FROM present
                ORDER BY bucket ASC`,
            params,
        };
    }

    return {
        text: `
            WITH present AS (${present}),
            spine AS (
                SELECT generate_series(min(bucket), max(bucket), INTERVAL '${STEP[resolution]}') AS bucket
                FROM present
            )
            SELECT to_char(s.bucket, 'YYYY-MM-DD') AS date, p.value
            FROM spine s
            LEFT JOIN present p ON p.bucket = s.bucket
            ORDER BY s.bucket ASC`,
        params,
    };
}
