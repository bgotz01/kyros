/**
 * Instant screener bootstrap from stockscreen.csv
 * Parses the CSV server-side and returns only the columns needed for initial render.
 * File read + parse takes ~30ms vs 48s for the full DB query.
 */

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Cache parsed result in memory — CSV only changes when manually updated
let cache: { data: unknown; ts: number } | null = null;
const TTL_MS = 10 * 60 * 1000; // 10 min

const WANTED = new Set([
    'Symbol', 'Company', 'Sector', 'Industry', 'Exchange', 'Currency',
    'Year_End', 'IPO', 'YearsActive', 'Price', 'Shares',
    'MarketCap',
    'P/S_TTM', 'P/E_TTM', 'P/S_2024', 'P/E_2024',
    'TTM_Revenue', 'TTM_NetIncome',
    '2025_Revenue', '2025_NetIncome', '2025_Rev%', '2025_NetMargin',
    '2024_Revenue', '2024_NetIncome', '2024_Rev%', '2024_NetMargin',
    '2023_Revenue', '2023_NetIncome', '2023_Rev%',
    '2022_Revenue', '2022_NetIncome', '2022_Rev%',
    '2021_Revenue', '2021_Rev%',
    '2025_EBITDA', '2024_EBITDA', '2025_EBITDA%', '2024_EBITDA%',
    '2025_FCF', '2024_FCF', '2025_FCF%', '2024_FCF%',
    '2025_Assets', '2024_Assets',
    '2025_Cash', '2024_Cash',
    '2025_Debt', '2024_Debt',
    '2025_NetDebt', '2024_NetDebt',
    '2025_Liabilities', '2024_Liabilities',
    'Draw_5Y', 'Draw_2Y', 'Return_1Y', 'Return_2Y', 'Return_5Y',
    'Slope_200', 'Divergence_200',
    'ATHPrice', 'Days_ATH',
]);

function parseCSV(text: string) {
    const lines = text.split('\n');
    if (lines.length < 2) return [];

    // Parse header — handle quoted fields
    const headers = parseCSVLine(lines[0]);
    const wantedIdx: { col: string; idx: number }[] = [];
    headers.forEach((h, i) => {
        if (WANTED.has(h.trim())) wantedIdx.push({ col: h.trim(), idx: i });
    });

    const rows: Record<string, string | number | null>[] = [];
    for (let li = 1; li < lines.length; li++) {
        const line = lines[li].trim();
        if (!line) continue;
        const fields = parseCSVLine(line);
        const row: Record<string, string | number | null> = {};
        for (const { col, idx } of wantedIdx) {
            const raw = fields[idx]?.trim() ?? '';
            if (raw === '' || raw === 'N/A' || raw === 'None' || raw === 'null') {
                row[col] = null;
            } else {
                const num = Number(raw);
                row[col] = isNaN(num) ? raw : num;
            }
        }
        if (row['Symbol']) rows.push(row);
    }
    return rows;
}

function parseCSVLine(line: string): string[] {
    const fields: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
            inQuotes = !inQuotes;
        } else if (ch === ',' && !inQuotes) {
            fields.push(cur);
            cur = '';
        } else {
            cur += ch;
        }
    }
    fields.push(cur);
    return fields;
}

export async function GET() {
    try {
        const now = Date.now();
        if (cache && now - cache.ts < TTL_MS) {
            return NextResponse.json(cache.data);
        }

        const filePath = path.join(process.cwd(), 'public', 'stockscreen.csv');
        const text = fs.readFileSync(filePath, 'utf-8');
        const rows = parseCSV(text);

        cache = { data: rows, ts: now };
        return NextResponse.json(rows);
    } catch (err) {
        console.error('CSV screener error:', err);
        return NextResponse.json({ error: 'Failed to load CSV' }, { status: 500 });
    }
}
