// Panteon stock screener — built-in filter presets
// Column keys match STATIC_COLS in StockScreener.tsx

export interface Preset {
    label: string;
    filters: Record<string, { min: string; max: string }>;
    columns: string[];
    sectors?: string[];
    rangeStart?: string;
    rangeEnd?: string;
}

export const PRESETS: Preset[] = [
    {
        label: 'Breakout + Rev',
        filters: {
            MarketCap: { min: '1000', max: '' },
            RevGrowth2024: { min: '10', max: '' },
            RevGrowth2023: { min: '10', max: '' },
            YearsActive: { min: '', max: '30' },
            Slope200: { min: '0', max: '' },
        },
        columns: ['Symbol', 'Sector', 'MarketCap', 'RevGrowth2025', 'RevGrowth2024', 'RevGrowth2023', 'YearsActive', 'Slope200'],
    },
    {
        label: 'High P/S',
        filters: {
            MarketCap: { min: '30000', max: '' },
            Rev2024: { min: '1000', max: '' },
            PS2024: { min: '10', max: '' },
        },
        columns: ['Symbol', 'Sector', 'MarketCap', 'Rev2024', 'PS2024', 'PE_TTM'],
    },
    {
        label: 'New Growth',
        filters: {
            MarketCap: { min: '500', max: '' },
            YearsActive: { min: '', max: '10' },
            RevGrowth2024: { min: '20', max: '' },
            PS_TTM: { min: '10', max: '' },
        },
        columns: ['Symbol', 'Sector', 'MarketCap', 'YearsActive', 'RevGrowth2024', 'RevGrowth2023', 'PS_TTM'],
    },
    {
        label: 'Low Cap High Growth',
        filters: {
            MarketCap: { min: '1000', max: '30000' },
            Rev2024: { min: '500', max: '' },
            RevGrowth2024: { min: '30', max: '' },
            RevGrowth2023: { min: '20', max: '' },
        },
        columns: ['Symbol', 'Sector', 'MarketCap', 'Rev2024', 'RevGrowth2024', 'RevGrowth2023', 'PE_TTM'],
    },
    {
        label: 'Profitable Large Cap',
        filters: {
            MarketCap: { min: '10000', max: '' },
            NetMargin2024: { min: '15', max: '' },
            RevGrowth2024: { min: '5', max: '' },
        },
        columns: ['Symbol', 'Sector', 'MarketCap', 'Rev2024', 'RevGrowth2024', 'NetMargin2024', 'PE_TTM', 'PS2024'],
    },
    {
        label: 'Trending Up',
        filters: {
            MarketCap: { min: '1000', max: '' },
            Slope200: { min: '0', max: '' },
            Dma200: { min: '1', max: '' },
        },
        columns: ['Symbol', 'Sector', 'MarketCap', 'Price', 'Dma200', 'Dma50', 'Slope200', 'DaysAbove200'],
    },
];
