// ─── centuries.ts ─────────────────────────────────────────────────────────────
// Dominant powers, capital centers, and paradigm shifts across five centuries.
// ─────────────────────────────────────────────────────────────────────────────

export interface Century {
    century: string;
    dominantPower: string;
    risingChallenger: string;
    capitalCenter: string;
    capitalParadigm: string;
    transition: string;
    majorInnovations: string[];
    events: string[];
}

// ─── data ─────────────────────────────────────────────────────────────────────

export const CENTURIES: Century[] = [
    {
        century: '1600',
        dominantPower: 'Spanish Empire',
        risingChallenger: 'Dutch Republic',
        capitalCenter: 'Iberia → Netherlands',
        capitalParadigm: 'Maritime trade / commercial capitalism',
        transition: 'Imperial extraction → commercial capitalism',
        majorInnovations: ['Joint-stock corporation', 'Stock exchange', 'Modern commercial finance'],
        events: ['Dutch Revolt', '1588 Spanish Armada', '1602 VOC'],
    },
    {
        century: '1700',
        dominantPower: 'Dutch Republic → Great Britain',
        risingChallenger: 'Great Britain',
        capitalCenter: 'Amsterdam → London',
        capitalParadigm: 'Maritime trade / finance / colonial commerce',
        transition: 'Dutch commercial dominance → British commercial-imperial dominance',
        majorInnovations: ['Central banking', 'Sovereign debt markets', 'Early mechanization'],
        events: ['1688 Glorious Revolution', '1694 Bank of England', 'War of the Spanish Succession'],
    },
    {
        century: '1800',
        dominantPower: 'British Empire',
        risingChallenger: 'United States',
        capitalCenter: 'Britain → North America',
        capitalParadigm: 'Industrialization / infrastructure',
        transition: 'Commercial capital → industrial capital',
        majorInnovations: ['Steam engine', 'Mechanized factories', 'Railways', 'Telegraph'],
        events: ['French Revolution', 'Napoleonic Wars', '1815 British victory'],
    },
    {
        century: '1900',
        dominantPower: 'British Empire',
        risingChallenger: 'United States',
        capitalCenter: 'United States',
        capitalParadigm: 'Mass industrial corporations / consumer economy',
        transition: 'British financial-imperial dominance → American industrial dominance',
        majorInnovations: ['Electricity', 'Automobile', 'Telephone', 'Mass production', 'Aviation'],
        events: ['WWI', 'Great Depression', 'WWII'],
    },
    {
        century: '2000',
        dominantPower: 'United States',
        risingChallenger: 'China',
        capitalCenter: 'United States / China rising',
        capitalParadigm: 'Digital economy / globalization',
        transition: 'Unipolar American globalization → contested US–China order',
        majorInnovations: ['Internet', 'Smartphones', 'Cloud computing', 'AI'],
        events: ['Communist collapse', '2001 China WTO', '2008 Financial Crisis', 'US–China trade conflict', 'COVID'],
    },
];
