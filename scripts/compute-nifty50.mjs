// compute-nifty50.mjs
// Computes equal-weighted index of the first 8 Nifty 50 stocks (KO, DIS, GE, IBM,
// JNJ, MRK, PG, XRX) for each year 1962-1970, using the last available trading
// day of December as the year-end price.

import { createReadStream } from 'fs';
import { createInterface } from 'readline';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CSV_PATH = join(__dirname, '../public/data/nifty50.csv');

const STOCKS = ['KO', 'DIS', 'GE', 'IBM', 'JNJ', 'MRK', 'PG', 'XRX'];

// Parse M/D/YY or M/D/YYYY
function parseDate(str) {
    const [m, d, y] = str.split('/').map(Number);
    const year = y < 100 ? (y >= 60 ? 1900 + y : 2000 + y) : y;
    return { year, month: m, day: d };
}

async function readCSV() {
    const rl = createInterface({ input: createReadStream(CSV_PATH) });

    let headers = null;
    // yearEndPrices[year][stock] = last price seen in December of that year
    const yearEndPrices = {};

    for await (const line of rl) {
        if (!headers) {
            headers = line.split(',');
            continue;
        }

        const parts = line.split(',');
        const dateStr = parts[0];
        const { year, month } = parseDate(dateStr);

        if (year < 1962 || year > 1970) continue;
        if (month !== 12) continue;

        // Build row object
        const row = {};
        for (let i = 1; i < headers.length; i++) {
            const val = parts[i];
            if (val && val.trim() !== '') {
                row[headers[i]] = parseFloat(val);
            }
        }

        // Check all 8 stocks are present
        const allPresent = STOCKS.every(s => !isNaN(row[s]));
        if (!allPresent) continue;

        if (!yearEndPrices[year]) yearEndPrices[year] = {};
        // Overwrite — last December row wins
        for (const s of STOCKS) {
            yearEndPrices[year][s] = row[s];
        }
    }

    return yearEndPrices;
}

// Also need the first trading day of 1962 as the base (since data starts 1/2/62)
async function readFirstRow() {
    const rl = createInterface({ input: createReadStream(CSV_PATH) });
    let headers = null;
    let first = null;

    for await (const line of rl) {
        if (!headers) {
            headers = line.split(',');
            continue;
        }
        if (!first) {
            const parts = line.split(',');
            const row = {};
            for (let i = 1; i < headers.length; i++) {
                row[headers[i]] = parseFloat(parts[i]);
            }
            const allPresent = STOCKS.every(s => !isNaN(row[s]));
            if (allPresent) {
                first = { date: parts[0], prices: row };
                break;
            }
        }
    }
    return first;
}

function buildEqualWeightedIndex(basePrices, yearEndPrices) {
    // Each stock starts at 1.0 at base
    // Index level = average of (price / basePrice) across all 8 stocks
    const results = {};

    for (const [year, prices] of Object.entries(yearEndPrices)) {
        const relatives = STOCKS.map(s => prices[s] / basePrices[s]);
        const indexLevel = relatives.reduce((a, b) => a + b, 0) / STOCKS.length;
        results[parseInt(year)] = { prices, relatives, indexLevel };
    }

    return results;
}

function annualReturn(indexLevelStart, indexLevelEnd) {
    return ((indexLevelEnd - indexLevelStart) / indexLevelStart) * 100;
}

async function main() {
    const firstRow = await readFirstRow();
    const yearEndPrices = await readCSV();

    console.log('\n=== Base prices (first row:', firstRow.date, ') ===');
    for (const s of STOCKS) {
        console.log(`  ${s}: ${firstRow.prices[s]}`);
    }

    const index = buildEqualWeightedIndex(firstRow.prices, yearEndPrices);

    console.log('\n=== Year-end index levels (base = 1.0 on', firstRow.date, ') ===');
    const years = Object.keys(index).map(Number).sort();
    for (const y of years) {
        const { indexLevel, relatives } = index[y];
        console.log(`  ${y}: ${indexLevel.toFixed(4)}  (${STOCKS.map((s, i) => `${s} ${relatives[i].toFixed(3)}`).join(', ')})`);
    }

    console.log('\n=== Annual returns ===');
    // Base year for annual return: use first row of 1962 as "start of 1962"
    const baseLevel = 1.0; // by construction
    let prevLevel = baseLevel;
    let prevYear = 'Jan 1962';

    const annualReturns = [];

    for (const y of years) {
        const { indexLevel } = index[y];
        const ret = annualReturn(prevLevel, indexLevel);
        console.log(`  ${prevYear} → Dec ${y}: ${ret >= 0 ? '+' : ''}${ret.toFixed(2)}%`);
        annualReturns.push({ year: y, ret: parseFloat(ret.toFixed(2)) });
        prevLevel = indexLevel;
        prevYear = `Dec ${y}`;
    }

    // Overall: Jan 1962 → Dec 1970
    const lastYear = years[years.length - 1];
    const totalReturn = annualReturn(1.0, index[lastYear].indexLevel);
    console.log(`\n=== Total return Jan 1962 → Dec ${lastYear}: ${totalReturn >= 0 ? '+' : ''}${totalReturn.toFixed(2)}% ===`);

    const avg = annualReturns.reduce((a, b) => a + b.ret, 0) / annualReturns.length;
    console.log(`=== Average annual return: ${avg >= 0 ? '+' : ''}${avg.toFixed(2)}% ===`);

    // Print per-stock decade returns too
    const lastPrices = index[lastYear].prices;
    console.log('\n=== Per-stock total returns (Jan 1962 → Dec', lastYear, ') ===');
    for (const s of STOCKS) {
        const ret = ((lastPrices[s] - firstRow.prices[s]) / firstRow.prices[s]) * 100;
        console.log(`  ${s}: ${firstRow.prices[s]} → ${lastPrices[s]} = ${ret >= 0 ? '+' : ''}${ret.toFixed(1)}%`);
    }

    // Output the data structure for the TypeScript file
    console.log('\n=== Annual returns array ===');
    console.log(JSON.stringify(annualReturns, null, 2));

    // Exact year-end prices
    console.log('\n=== Exact year-end prices ===');
    for (const y of years) {
        const prices = yearEndPrices[y];
        const line = STOCKS.map(s => `${s}: ${prices[s]}`).join(', ');
        console.log(`  ${y}: { ${line} }`);
    }
}

main().catch(console.error);
