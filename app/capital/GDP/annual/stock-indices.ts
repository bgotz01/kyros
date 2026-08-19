// ─── stock-indices.ts ─────────────────────────────────────────────────────────
// Benchmark equity index for each country in the GDP dataset.
// tvSymbol: TradingView chart symbol (exchange:ticker format).
// marketCapT: total equity market cap in USD trillions (Jan 2026 estimate).
// ─────────────────────────────────────────────────────────────────────────────

export interface StockIndex {
    country: string;
    flag: string;
    name: string;
    ticker: string;
    tvSymbol: string;
    currency: string;
    currencyCode: string;
    marketCapT: number;   // USD trillions
}

export const STOCK_INDICES: StockIndex[] = [
    { country: 'Argentina', flag: '🇦🇷', name: 'S&P MERVAL', ticker: 'IMV', tvSymbol: 'BCBA:IMV', currency: 'Argentine Peso', currencyCode: 'ARS', marketCapT: 0.1 },
    { country: 'Australia', flag: '🇦🇺', name: 'S&P/ASX 200', ticker: 'XJO', tvSymbol: 'ASX:XJO', currency: 'Australian Dollar', currencyCode: 'AUD', marketCapT: 2.1 },
    { country: 'Brazil', flag: '🇧🇷', name: 'Ibovespa', ticker: 'IBOV', tvSymbol: 'BMFBOVESPA:IBOV', currency: 'Brazilian Real', currencyCode: 'BRL', marketCapT: 1.0 },
    { country: 'Canada', flag: '🇨🇦', name: 'S&P/TSX Composite', ticker: 'TSX', tvSymbol: 'TSX:TSX', currency: 'Canadian Dollar', currencyCode: 'CAD', marketCapT: 4.7 },
    { country: 'China', flag: '🇨🇳', name: 'CSI 300', ticker: '000300', tvSymbol: 'SSE:000300', currency: 'Chinese Yuan', currencyCode: 'CNY', marketCapT: 15.5 },
    { country: 'France', flag: '🇫🇷', name: 'CAC 40', ticker: 'PX1', tvSymbol: 'EURONEXT:PX1', currency: 'Euro', currencyCode: 'EUR', marketCapT: 3.4 },
    { country: 'Germany', flag: '🇩🇪', name: 'DAX', ticker: 'DAX', tvSymbol: 'XETR:DAX', currency: 'Euro', currencyCode: 'EUR', marketCapT: 3.0 },
    { country: 'India', flag: '🇮🇳', name: 'NIFTY 50', ticker: 'NIFTY', tvSymbol: 'NSE:NIFTY', currency: 'Indian Rupee', currencyCode: 'INR', marketCapT: 5.0 },
    { country: 'Indonesia', flag: '🇮🇩', name: 'IDX Composite', ticker: 'COMPOSITE', tvSymbol: 'IDX:COMPOSITE', currency: 'Indonesian Rupiah', currencyCode: 'IDR', marketCapT: 0.9 },
    { country: 'Italy', flag: '🇮🇹', name: 'FTSE MIB', ticker: 'FTSEMIB', tvSymbol: 'MIL:FTSEMIB', currency: 'Euro', currencyCode: 'EUR', marketCapT: 1.1 },
    { country: 'Japan', flag: '🇯🇵', name: 'Nikkei 225', ticker: 'NI225', tvSymbol: 'TVC:NI225', currency: 'Japanese Yen', currencyCode: 'JPY', marketCapT: 8.0 },
    { country: 'Mexico', flag: '🇲🇽', name: 'S&P/BMV IPC', ticker: 'ME', tvSymbol: 'BMV:ME', currency: 'Mexican Peso', currencyCode: 'MXN', marketCapT: 0.6 },
    { country: 'Nigeria', flag: '🇳🇬', name: 'NGX All Share Index', ticker: 'ASI', tvSymbol: 'NSENG:ASI', currency: 'Nigerian Naira', currencyCode: 'NGN', marketCapT: 0.065 },
    { country: 'Poland', flag: '🇵🇱', name: 'WIG', ticker: 'WIG', tvSymbol: 'GPW:WIG', currency: 'Polish Zloty', currencyCode: 'PLN', marketCapT: 0.65 },
    { country: 'Russia', flag: '🇷🇺', name: 'MOEX Russia Index', ticker: 'IRUS', tvSymbol: 'RUS:IRUS', currency: 'Russian Ruble', currencyCode: 'RUB', marketCapT: 0.6 },
    { country: 'Saudi Arabia', flag: '🇸🇦', name: 'Tadawul All Share (TASI)', ticker: 'TASI', tvSymbol: 'TADAWUL:TASI', currency: 'Saudi Riyal', currencyCode: 'SAR', marketCapT: 2.4 },
    { country: 'South Africa', flag: '🇿🇦', name: 'FTSE/JSE All Share', ticker: 'J203', tvSymbol: 'JSE:J203', currency: 'South African Rand', currencyCode: 'ZAR', marketCapT: 1.0 },
    { country: 'South Korea', flag: '🇰🇷', name: 'KOSPI', ticker: 'KOSPI', tvSymbol: 'KRX:KOSPI', currency: 'South Korean Won', currencyCode: 'KRW', marketCapT: 2.7 },
    { country: 'Turkey', flag: '🇹🇷', name: 'BIST 100', ticker: 'XU100', tvSymbol: 'BIST:XU100', currency: 'Turkish Lira', currencyCode: 'TRY', marketCapT: 0.4 },
    { country: 'United Kingdom', flag: '🇬🇧', name: 'FTSE 100', ticker: 'UKX', tvSymbol: 'TVC:UKX', currency: 'Pound Sterling', currencyCode: 'GBP', marketCapT: 4.0 },
    { country: 'United States', flag: '🇺🇸', name: 'S&P 500', ticker: 'SPX', tvSymbol: 'SP:SPX', currency: 'US Dollar', currencyCode: 'USD', marketCapT: 68.0 },
];

// Keyed lookup for O(1) access by country name
export const STOCK_INDEX_BY_COUNTRY: Record<string, StockIndex> = Object.fromEntries(
    STOCK_INDICES.map((s) => [s.country, s]),
);

/** Returns the TradingView chart URL for a given symbol */
export function tvChartUrl(tvSymbol: string): string {
    return `https://www.tradingview.com/chart/?symbol=${encodeURIComponent(tvSymbol)}`;
}

/** Returns the TradingView FX chart URL for currencyCode vs USD, or null if already USD */
export function tvFxUrl(currencyCode: string): string | null {
    if (currencyCode === 'USD') return null;
    return `https://www.tradingview.com/chart/?symbol=FX_IDC:USD${currencyCode}`;
}

/** Formats a market cap in trillions to a readable string */
export function formatMarketCap(t: number): string {
    if (t >= 1) return `$${t.toFixed(1)}T`;
    return `$${(t * 1000).toFixed(0)}B`;
}
