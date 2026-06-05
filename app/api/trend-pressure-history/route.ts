import { NextRequest, NextResponse } from 'next/server';
import pool from '@/app/lib/db';

function rollingPercentile(values: number[]): number[] {
    return values.map((v, i) => {
        const history = values.slice(0, i + 1);
        const below = history.filter(x => x <= v).length;
        return parseFloat(((below / history.length) * 100).toFixed(4));
    });
}

export async function GET(request: NextRequest) {
    const ma = request.nextUrl.searchParams.get('ma') || '200';
    const index = request.nextUrl.searchParams.get('index') || 'sp500';

    try {
        const prefix = index === 'ndx' ? 'NDX' : 'SP500';

        const seriesDiv = `${prefix}-${ma}MA-Div`;
        const seriesStreak = `${prefix}-${ma}MA-PriceAboveStreak`;
        const seriesSlope = `${prefix}-${ma}MA-Slope`;
        const seriesMa50 = `${prefix}-MA50`;
        const seriesMa200 = `${prefix}-MA200`;

        const seriesNames = [seriesDiv, seriesStreak, seriesSlope, seriesMa50, seriesMa200];

        const { rows } = await pool.query<{
            date: string;
            divergence_value: number | null;
            divergence_percentile: number | null;
            days_above_value: number | null;
            days_above_percentile: number | null;
            slope_value: number | null;
            slope_percentile: number | null;
            ma50_price: number | null;
            ma200_price: number | null;
        }>(
            `SELECT
                date::text AS date,
                MAX(CASE WHEN series_name = $1 THEN value           END) AS divergence_value,
                MAX(CASE WHEN series_name = $1 THEN percentile_rank END) AS divergence_percentile,
                MAX(CASE WHEN series_name = $2 THEN value           END) AS days_above_value,
                MAX(CASE WHEN series_name = $2 THEN percentile_rank END) AS days_above_percentile,
                MAX(CASE WHEN series_name = $3 THEN value           END) AS slope_value,
                MAX(CASE WHEN series_name = $3 THEN percentile_rank END) AS slope_percentile,
                MAX(CASE WHEN series_name = $4 THEN value           END) AS ma50_price,
                MAX(CASE WHEN series_name = $5 THEN value           END) AS ma200_price
            FROM macro_percentile_analysis
            WHERE series_name = ANY($6)
            GROUP BY date
            HAVING
                MAX(CASE WHEN series_name = $1 THEN percentile_rank END) IS NOT NULL
                AND MAX(CASE WHEN series_name = $2 THEN percentile_rank END) IS NOT NULL
                AND MAX(CASE WHEN series_name = $3 THEN percentile_rank END) IS NOT NULL
            ORDER BY date ASC`,
            [seriesDiv, seriesStreak, seriesSlope, seriesMa50, seriesMa200, seriesNames],
        );

        // Compute rolling percentile of the 50/200 MA divergence
        const divValues = rows.map(r =>
            (r.ma200_price ?? 0) > 0
                ? ((r.ma50_price ?? 0) - (r.ma200_price ?? 0)) / (r.ma200_price ?? 1) * 100
                : 0,
        );
        const divPct = rollingPercentile(divValues);

        const data = rows.map((r, i) => ({
            date: r.date,
            divergence_value: r.divergence_value,
            divergence_percentile: r.divergence_percentile,
            days_above_value: r.days_above_value,
            days_above_percentile: r.days_above_percentile,
            slope_value: r.slope_value,
            slope_percentile: r.slope_percentile,
            ma50_200_value: parseFloat(divValues[i].toFixed(4)),
            ma50_200_percentile: divPct[i],
        }));

        return NextResponse.json({ data, ma, index }, {
            headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=600' },
        });
    } catch (error) {
        console.error('Error fetching trend pressure history:', error);
        return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }
}
