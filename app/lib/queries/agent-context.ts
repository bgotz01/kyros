/**
 * Athena Context Queries
 *
 * Each function fetches a category of live market data for Athena.
 * Loaded selectively based on what the question is about.
 *
 * getMacroContext      → regime history, yield curve, VIX
 * getBreadthContext    → market breadth, regime transitions
 * getMomentumContext   → top/weak momentum stocks, key indexes
 * getPositioningContext → CFTC positioning, insider activity
 */

import pool from '../db';

// ─── helpers ─────────────────────────────────────────────────────────────────

const fmt2 = (v: number | null) => v != null ? v.toFixed(2) : 'N/A';
const fmt1 = (v: number | null) => v != null ? v.toFixed(1) : 'N/A';
const fmtPct = (v: number | null) => v != null ? `${v > 0 ? '+' : ''}${v.toFixed(2)}%` : 'N/A';
// pg returns date columns as JS Date objects — coerce to ISO string safely
const fmtDate = (v: unknown) => v != null ? String(v).slice(0, 10) : 'N/A';

// ─── Atlas: regime + yields + VIX ────────────────────────────────────────────

export async function getMacroContext(): Promise<string> {
    try {
        const [regimeHistory, yields, vix] = await Promise.all([
            // Regime transitions only (dedupe consecutive same-regime months)
            // This surfaces every distinct regime change going back to 1960
            pool.query(`
                WITH monthly AS (
                    SELECT DISTINCT ON (entry_date) regime, entry_date, trigger_reason,
                        rey, eyp, "real10Y", "real3M", "realM2"
                    FROM macro_regime_timeline
                    ORDER BY entry_date
                ),
                transitions AS (
                    SELECT *,
                        LAG(regime) OVER (ORDER BY entry_date) AS prev_regime
                    FROM monthly
                )
                SELECT regime, entry_date, trigger_reason, rey, eyp, "real10Y", "real3M", "realM2"
                FROM transitions
                WHERE prev_regime IS DISTINCT FROM regime
                ORDER BY entry_date DESC
                LIMIT 60
            `),
            // Cast date to text to avoid JS Date object issues
            pool.query(`
                SELECT ms.name, md.value::float, md.date::text AS date
                FROM macro_series ms
                JOIN macro_data md ON md."seriesId" = ms.id
                WHERE ms.category = 'YIELD'
                  AND ms.name LIKE 'US%'
                  AND md.date <= CURRENT_DATE
                ORDER BY ms.name, md.date DESC
            `).then(r => {
                const seen = new Set<string>();
                return r.rows.filter((row: { name: string }) => {
                    if (seen.has(row.name)) return false;
                    seen.add(row.name);
                    return true;
                });
            }),
            pool.query(`
                SELECT md.value::float AS vix, md.date::text AS date
                FROM macro_series ms
                JOIN macro_data md ON md."seriesId" = ms.id
                WHERE ms.name = 'CBOE Volatility Index'
                  AND md.date <= CURRENT_DATE
                ORDER BY md.date DESC
                LIMIT 1
            `),
        ]);

        const lines: string[] = ['## Atlas Live Data'];

        if (regimeHistory.rows.length) {
            lines.push('\n### Regime History (most recent first)');
            regimeHistory.rows.forEach((r: {
                regime: string; entry_date: string; trigger_reason: string | null;
                rey: number | null; eyp: number | null; real10Y: number | null;
                real3M: number | null; realM2: number | null;
            }) => {
                lines.push(`${fmtDate(r.entry_date)}: ${r.regime} — ${r.trigger_reason ?? 'N/A'} | REY: ${fmtPct(r.rey)} EYP: ${fmtPct(r.eyp)} Real10Y: ${fmtPct(r.real10Y)} Real3M: ${fmtPct(r.real3M)} RealM2: ${fmtPct(r.realM2)}`);
            });
        }

        if (yields.length) {
            lines.push('\n### US Yield Curve');
            yields.forEach((r: { name: string; value: number; date: string }) => {
                lines.push(`${r.name}: ${fmt2(r.value)}% (${fmtDate(r.date)})`);
            });
            const y2 = yields.find((r: { name: string }) => r.name === 'US 2Y Government Bond Yield');
            const y10 = yields.find((r: { name: string }) => r.name === 'US 10Y Government Bond Yield');
            if (y2 && y10) {
                const spread = y10.value - y2.value;
                lines.push(`2/10 Spread: ${fmt2(spread)}% (${spread > 0 ? 'normal' : 'inverted'})`);
            }
        }

        if (vix.rows.length) {
            lines.push(`\nVIX: ${fmt1(vix.rows[0].vix)} (${fmtDate(vix.rows[0].date)})`);
        }

        return lines.join('\n') + '\n\n';
    } catch (err) {
        console.error('[agent-context] Atlas error:', err);
        return '';
    }
}

// ─── Janus: breadth + regime transitions ─────────────────────────────────────

export async function getBreadthContext(): Promise<string> {
    try {
        const [breadthLatest, breadthTrend, regimeTransitions] = await Promise.all([
            pool.query(`
                SELECT DISTINCT ON ("index") "index", date::text AS date,
                    "percentAbove200DMA"::float, "percentAbove50DMA"::float, "totalStocks"
                FROM market_breadth
                ORDER BY "index", date DESC
            `),
            pool.query(`
                SELECT date::text AS date,
                    "percentAbove200DMA"::float, "percentAbove50DMA"::float
                FROM market_breadth
                WHERE "index" = 'SP500'
                  AND date >= CURRENT_DATE - INTERVAL '60 days'
                ORDER BY date DESC
                LIMIT 8
            `),
            pool.query(`
                SELECT DISTINCT ON (entry_date) regime, entry_date, trigger_reason
                FROM macro_regime_timeline
                ORDER BY entry_date DESC
                LIMIT 10
            `),
        ]);

        const lines: string[] = ['## Janus Live Data'];

        if (breadthLatest.rows.length) {
            lines.push('\n### Market Breadth (latest)');
            breadthLatest.rows.forEach((r: {
                index: string; date: string;
                percentAbove200DMA: number; percentAbove50DMA: number; totalStocks: number;
            }) => {
                lines.push(`${r.index} (${fmtDate(r.date)}): ${fmt1(r.percentAbove200DMA)}% above 200DMA | ${fmt1(r.percentAbove50DMA)}% above 50DMA | n=${r.totalStocks}`);
            });
        }

        if (breadthTrend.rows.length) {
            lines.push('\n### SP500 Breadth Trend (newest first)');
            breadthTrend.rows.forEach((r: { date: string; percentAbove200DMA: number; percentAbove50DMA: number }) => {
                lines.push(`  ${fmtDate(r.date)}: ${fmt1(r.percentAbove200DMA)}% >200DMA | ${fmt1(r.percentAbove50DMA)}% >50DMA`);
            });
        }

        if (regimeTransitions.rows.length) {
            lines.push('\n### Regime Transitions');
            regimeTransitions.rows.forEach((r: { regime: string; entry_date: string; trigger_reason: string | null }) => {
                lines.push(`${fmtDate(r.entry_date)}: → ${r.regime} (${r.trigger_reason ?? 'N/A'})`);
            });
        }

        return lines.join('\n') + '\n\n';
    } catch (err) {
        console.error('[agent-context] Janus error:', err);
        return '';
    }
}

// ─── Sigma: top/weak momentum + key indexes ───────────────────────────────────

export async function getMomentumContext(): Promise<string> {
    try {
        const [topMomentum, weakMomentum, indexes] = await Promise.all([
            pool.query(`
                SELECT DISTINCT ON (pd.symbol)
                    pd.symbol, sp.company, sp.sector,
                    pd.dma_200::float  AS dma200,
                    pd.rsi14::float    AS rsi14,
                    pd."daysAbove200MA"
                FROM price_divergence pd
                JOIN "StockProfile" sp ON sp.symbol = pd.symbol
                WHERE pd.dma_200 IS NOT NULL
                ORDER BY pd.symbol, pd.date DESC
                LIMIT 500
            `).then(r => r.rows
                .sort((a: { dma200: number }, b: { dma200: number }) => (b.dma200 ?? 0) - (a.dma200 ?? 0))
                .slice(0, 12)
            ),
            pool.query(`
                SELECT DISTINCT ON (pd.symbol)
                    pd.symbol, sp.company, sp.sector,
                    pd.dma_200::float AS dma200,
                    pd.rsi14::float   AS rsi14
                FROM price_divergence pd
                JOIN "StockProfile" sp ON sp.symbol = pd.symbol
                WHERE pd.dma_200 IS NOT NULL
                ORDER BY pd.symbol, pd.date DESC
                LIMIT 500
            `).then(r => r.rows
                .sort((a: { dma200: number }, b: { dma200: number }) => (a.dma200 ?? 0) - (b.dma200 ?? 0))
                .slice(0, 8)
            ),
            pool.query(`
                SELECT ms.name, md.value::float, md.dma_200::float, md.rsi14::float, md.date::text AS date
                FROM macro_series ms
                JOIN macro_data md ON md."seriesId" = ms.id
                WHERE ms.name IN (
                    'S&P 500 Index', 'NASDAQ Composite Index',
                    'CBOE Volatility Index', 'Gold Price Index'
                )
                  AND md.date <= CURRENT_DATE
                ORDER BY ms.name, md.date DESC
            `).then(r => {
                const seen = new Set<string>();
                return r.rows.filter((row: { name: string }) => {
                    if (seen.has(row.name)) return false;
                    seen.add(row.name);
                    return true;
                });
            }),
        ]);

        const lines: string[] = ['## Sigma Live Data'];

        if (indexes.length) {
            lines.push('\n### Market Indexes');
            indexes.forEach((r: { name: string; value: number; dma_200: number | null; rsi14: number | null; date: string }) => {
                const mom = r.dma_200 != null ? ` | vs200MA: ${fmtPct(r.dma_200)}` : '';
                const rsi = r.rsi14 != null ? ` | RSI14: ${fmt1(r.rsi14)}` : '';
                lines.push(`${r.name}: ${fmt2(r.value)} (${fmtDate(r.date)})${mom}${rsi}`);
            });
        }

        if (topMomentum.length) {
            lines.push('\n### Top Momentum Leaders (% above 200DMA)');
            topMomentum.forEach((r: {
                symbol: string; company: string | null; sector: string | null;
                dma200: number; rsi14: number | null; daysAbove200MA: number | null;
            }) => {
                lines.push(`${r.symbol} (${r.company ?? '—'}) | ${r.sector ?? '—'} | +${fmt1(r.dma200)}% vs200MA | RSI: ${fmt1(r.rsi14)} | days>200MA: ${r.daysAbove200MA ?? 'N/A'}`);
            });
        }

        if (weakMomentum.length) {
            lines.push('\n### Weakest Momentum (% below 200DMA)');
            weakMomentum.forEach((r: { symbol: string; company: string | null; sector: string | null; dma200: number; rsi14: number | null }) => {
                lines.push(`${r.symbol} (${r.company ?? '—'}) | ${r.sector ?? '—'} | ${fmt1(r.dma200)}% vs200MA | RSI: ${fmt1(r.rsi14)}`);
            });
        }

        return lines.join('\n') + '\n\n';
    } catch (err) {
        console.error('[agent-context] Sigma error:', err);
        return '';
    }
}

// ─── Achilles: positioning + insider activity + breadth ───────────────────────

export async function getPositioningContext(): Promise<string> {
    try {
        const [cot, insiders, breadth] = await Promise.all([
            pool.query(`
                SELECT DISTINCT ON (commodity) commodity, "reportDate"::text AS report_date,
                    "mMoneyNet", "speculativeNet", "openInterest"
                FROM cftc_cot
                ORDER BY commodity, "reportDate" DESC
            `),
            pool.query(`
                SELECT symbol, insider, relation, transaction, cost, shares, value,
                    "tradeDate"::text AS trade_date
                FROM insider_activity
                WHERE "tradeDate" >= CURRENT_DATE - INTERVAL '30 days'
                  AND ABS(value) > 50000
                ORDER BY ABS(value) DESC
                LIMIT 15
            `),
            pool.query(`
                SELECT DISTINCT ON ("index") "index", date::text AS date,
                    "percentAbove200DMA"::float, "percentAbove50DMA"::float
                FROM market_breadth
                ORDER BY "index", date DESC
            `),
        ]);

        const lines: string[] = ['## Achilles Live Data'];

        if (cot.rows.length) {
            lines.push('\n### CFTC Positioning (latest)');
            cot.rows.forEach((r: {
                commodity: string; report_date: string;
                mMoneyNet: number | null; speculativeNet: number | null; openInterest: number | null;
            }) => {
                const mm = r.mMoneyNet != null ? `MMoney: ${r.mMoneyNet.toLocaleString()}` : '';
                const spec = r.speculativeNet != null ? ` | Spec: ${r.speculativeNet.toLocaleString()}` : '';
                const oi = r.openInterest != null ? ` | OI: ${r.openInterest.toLocaleString()}` : '';
                lines.push(`${r.commodity} (${fmtDate(r.report_date)}): ${mm}${spec}${oi}`);
            });
        }

        if (insiders.rows.length) {
            lines.push('\n### Insider Activity (last 30d, >$50k)');
            insiders.rows.forEach((r: {
                symbol: string; insider: string; relation: string | null;
                transaction: string; value: number | null; trade_date: string;
            }) => {
                const val = r.value != null ? `$${Math.abs(r.value).toLocaleString()}` : '—';
                const type = r.transaction.includes('Purchase') || r.transaction.startsWith('P -') ? 'BUY' : 'SELL';
                lines.push(`${r.symbol} — ${type} — ${val} — ${r.insider} (${r.relation ?? 'N/A'}) — ${fmtDate(r.trade_date)}`);
            });
        }

        if (breadth.rows.length) {
            lines.push('\n### Breadth');
            breadth.rows.forEach((r: { index: string; date: string; percentAbove200DMA: number; percentAbove50DMA: number }) => {
                lines.push(`${r.index}: ${fmt1(r.percentAbove200DMA)}% >200DMA | ${fmt1(r.percentAbove50DMA)}% >50DMA`);
            });
        }

        return lines.join('\n') + '\n\n';
    } catch (err) {
        console.error('[agent-context] Achilles error:', err);
        return '';
    }
}

// ─── Janus: Trend Pressure Score (Cycle page) ────────────────────────────────

/**
 * Fetches the current trend pressure score and its components from macro_percentile_analysis.
 * The score is the average of four rolling percentile metrics:
 *   1. Price Divergence from 200MA
 *   2. Days Above 200MA (streak)
 *   3. 200MA Slope
 *   4. 50/200 MA spread (computed here from raw MA values)
 *
 * Also returns a 10-day trend so agents can say whether pressure is rising or falling.
 */
export async function getTrendPressureContext(): Promise<string> {
    try {
        const { rows } = await pool.query<{
            date: string;
            div_pct: number | null;
            streak_pct: number | null;
            slope_pct: number | null;
            ma50: number | null;
            ma200: number | null;
        }>(`
            SELECT
                date,
                MAX(CASE WHEN series_name = 'SP500-200MA-Div'              THEN percentile_rank END) AS div_pct,
                MAX(CASE WHEN series_name = 'SP500-200MA-PriceAboveStreak' THEN percentile_rank END) AS streak_pct,
                MAX(CASE WHEN series_name = 'SP500-200MA-Slope'            THEN percentile_rank END) AS slope_pct,
                MAX(CASE WHEN series_name = 'SP500-MA50'                   THEN value           END) AS ma50,
                MAX(CASE WHEN series_name = 'SP500-MA200'                  THEN value           END) AS ma200
            FROM macro_percentile_analysis
            WHERE series_name IN (
                'SP500-200MA-Div',
                'SP500-200MA-PriceAboveStreak',
                'SP500-200MA-Slope',
                'SP500-MA50',
                'SP500-MA200'
            )
            GROUP BY date
            HAVING MAX(CASE WHEN series_name = 'SP500-200MA-Div' THEN percentile_rank END) IS NOT NULL
               AND MAX(CASE WHEN series_name = 'SP500-200MA-PriceAboveStreak' THEN percentile_rank END) IS NOT NULL
               AND MAX(CASE WHEN series_name = 'SP500-200MA-Slope' THEN percentile_rank END) IS NOT NULL
            ORDER BY date DESC
            LIMIT 10
        `);

        if (!rows.length) return '';

        // Compute 50/200 spread percentile inline (rolling over available window)
        // For context purposes we just report the raw spread % — full rolling pct isn't needed
        const lines: string[] = ['## Trend Pressure Score (S&P 500, 200MA)'];

        rows.forEach((r, i) => {
            const ma50_200_spread = (r.ma50 != null && r.ma200 != null && r.ma200 > 0)
                ? ((r.ma50 - r.ma200) / r.ma200) * 100
                : null;

            // Simple average of the three DB-provided percentiles as a proxy score
            // (50/200 spread percentile is computed client-side in the full chart; here we use a simple avg of available 3)
            const threeMetricScore = (r.div_pct != null && r.streak_pct != null && r.slope_pct != null)
                ? (r.div_pct + r.streak_pct + r.slope_pct) / 3
                : null;

            if (i === 0) {
                lines.push(`\n### Latest (${r.date})`);
                lines.push(`Composite Score (3-metric avg): ${threeMetricScore != null ? threeMetricScore.toFixed(1) : 'N/A'}/100`);
                lines.push(`  Divergence from 200MA:    ${fmt1(r.div_pct)}th pctl`);
                lines.push(`  Days Above 200MA (streak): ${fmt1(r.streak_pct)}th pctl`);
                lines.push(`  200MA Slope:               ${fmt1(r.slope_pct)}th pctl`);
                lines.push(`  50/200 MA Spread:          ${ma50_200_spread != null ? `${ma50_200_spread.toFixed(2)}% (MA50: ${r.ma50?.toFixed(0)}, MA200: ${r.ma200?.toFixed(0)})` : 'N/A'}`);
                lines.push('\n### 10-Day Score Trend (newest first)');
            } else {
                lines.push(`  ${r.date}: Score ${threeMetricScore != null ? threeMetricScore.toFixed(1) : 'N/A'} | Div: ${fmt1(r.div_pct)}th | Streak: ${fmt1(r.streak_pct)}th | Slope: ${fmt1(r.slope_pct)}th`);
            }
        });

        // Direction summary
        if (rows.length >= 3) {
            const latest = rows[0];
            const older = rows[2];
            const scoreLatest = latest.div_pct != null && latest.streak_pct != null && latest.slope_pct != null
                ? (latest.div_pct + latest.streak_pct + latest.slope_pct) / 3 : null;
            const scoreOlder = older.div_pct != null && older.streak_pct != null && older.slope_pct != null
                ? (older.div_pct + older.streak_pct + older.slope_pct) / 3 : null;
            if (scoreLatest != null && scoreOlder != null) {
                const delta = scoreLatest - scoreOlder;
                const direction = delta > 1 ? 'rising' : delta < -1 ? 'falling' : 'flat';
                lines.push(`\nScore direction (3-day): ${direction} (${delta > 0 ? '+' : ''}${delta.toFixed(1)} pts)`);
            }
        }

        lines.push('\nNote: Score >70 = elevated trend pressure; >85 = historically stretched; <40 = weak trend.');

        return lines.join('\n') + '\n\n';
    } catch (err) {
        console.error('[agent-context] TrendPressure error:', err);
        return '';
    }
}

// ─── Regime Returns: S&P 500 returns by regime ───────────────────────────────

/**
 * Returns a compact summary of S&P 500 returns per regime type for Athena context.
 * Only loaded when the user is on a regime-related page or asks about returns.
 */
export async function getRegimeReturnsContext(): Promise<string> {
    try {
        const [regimeRows, priceRows] = await Promise.all([
            pool.query<{ date: string; regime: string }>(
                `SELECT date::text AS date, regime FROM macro_regime_timeline ORDER BY date ASC`
            ),
            pool.query<{ date: string; value: number }>(
                `SELECT date::text AS date, value::float AS value
                 FROM macro_time_series
                 WHERE asset_class = 'equities' AND series_name = 'US/GSPC' AND column_name = 'Value'
                 ORDER BY date ASC`
            ),
        ]);

        // Build price map
        const prices = new Map<string, number>();
        for (const r of priceRows.rows) prices.set(r.date, r.value);

        function closestPrice(date: string): number | null {
            if (prices.has(date)) return prices.get(date)!;
            const t = new Date(date).getTime();
            let best: number | null = null, bestDiff = Infinity;
            for (const [d, p] of prices) {
                const diff = Math.abs(new Date(d).getTime() - t);
                if (diff < bestDiff && diff < 10 * 86400000) { bestDiff = diff; best = p; }
            }
            return best;
        }

        function fwdReturn(startDate: string, years: number): number | null {
            const t = new Date(startDate);
            t.setFullYear(t.getFullYear() + years);
            const fwdPrice = closestPrice(t.toISOString().slice(0, 10));
            const entryPrice = closestPrice(startDate);
            if (!entryPrice || !fwdPrice) return null;
            return Math.round(((fwdPrice - entryPrice) / entryPrice) * 10000) / 100;
        }

        // Build regime periods
        type Period = { regime: string; start: string; end: string; months: number };
        const periods: Period[] = [];
        let cur: Period | null = null;
        for (const r of regimeRows.rows) {
            if (!cur || cur.regime !== r.regime) {
                if (cur) periods.push(cur);
                cur = { regime: r.regime, start: r.date, end: r.date, months: 1 };
            } else {
                cur.end = r.date;
                cur.months++;
            }
        }
        if (cur) periods.push(cur);

        // Aggregate stats per regime
        const stats = new Map<string, { during: number[]; fwd1: number[]; fwd3: number[] }>();
        for (const p of periods) {
            const entry = closestPrice(p.start);
            const exit = closestPrice(p.end);
            const during = entry && exit ? Math.round(((exit - entry) / entry) * 10000) / 100 : null;
            const f1 = fwdReturn(p.start, 1);
            const f3 = fwdReturn(p.start, 3);
            if (!stats.has(p.regime)) stats.set(p.regime, { during: [], fwd1: [], fwd3: [] });
            const s = stats.get(p.regime)!;
            if (during !== null) s.during.push(during);
            if (f1 !== null) s.fwd1.push(f1);
            if (f3 !== null) s.fwd3.push(f3);
        }

        const avg = (arr: number[]) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length * 10) / 10 : null;
        const sign = (v: number | null) => v != null ? (v >= 0 ? '+' : '') + v.toFixed(1) + '%' : '—';

        const lines = ['## Regime Returns (S&P 500, historical avg)'];
        lines.push('Regime | Occurrences | Avg During | Avg 1Y Fwd | Avg 3Y Fwd');
        for (const [regime, s] of stats) {
            const count = periods.filter(p => p.regime === regime).length;
            lines.push(`${regime} | ${count}x | ${sign(avg(s.during))} | ${sign(avg(s.fwd1))} | ${sign(avg(s.fwd3))}`);
        }
        lines.push('\nSource: macro_regime_timeline + S&P 500 daily closes (1960–present)');

        return lines.join('\n') + '\n\n';
    } catch (err) {
        console.error('[agent-context] RegimeReturns error:', err);
        return '';
    }
}
