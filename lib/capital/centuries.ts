// ─── centuries.ts ─────────────────────────────────────────────────────────────
// Dominant powers, capital centers, and paradigm shifts across five centuries.
// ─────────────────────────────────────────────────────────────────────────────

export interface Century {
    century: string;
    /** The single imperial center that defines this century. Transitions and
     *  challengers belong in their own fields; an arrow here makes the answer
     *  ambiguous and lets adjacent centuries collapse into the same regime. */
    empire: string;
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
        empire: 'Spanish Empire',
        risingChallenger: 'Dutch Republic',
        capitalCenter: 'Iberia → Netherlands',
        capitalParadigm: 'Maritime trade / commercial capitalism',
        transition: 'Imperial extraction → commercial capitalism',
        majorInnovations: ['Joint-stock corporation', 'Stock exchange', 'Modern commercial finance'],
        events: ['Dutch Revolt', '1588 Spanish Armada', '1602 VOC'],
    },
    {
        century: '1700',
        empire: 'Dutch Empire',
        risingChallenger: 'British Empire',
        capitalCenter: 'Amsterdam → London',
        capitalParadigm: 'Maritime trade / finance / colonial commerce',
        transition: 'Dutch commercial dominance → British commercial-imperial dominance',
        majorInnovations: ['Central banking', 'Sovereign debt markets', 'Early mechanization'],
        events: ['1688 Glorious Revolution', '1694 Bank of England', 'War of the Spanish Succession'],
    },
    {
        century: '1800',
        empire: 'British Empire',
        risingChallenger: 'United States',
        capitalCenter: 'London',
        capitalParadigm: 'Industrialization / infrastructure',
        transition: 'Commercial capital → industrial capital',
        majorInnovations: ['Steam engine', 'Mechanized factories', 'Railways', 'Telegraph'],
        events: ['French Revolution', 'Napoleonic Wars', '1815 British victory'],
    },
    {
        century: '1900',
        empire: 'American Empire',
        risingChallenger: 'Soviet Union → China',
        capitalCenter: 'London → New York',
        capitalParadigm: 'Mass industrial corporations / consumer economy',
        transition: 'British financial-imperial dominance → American industrial dominance',
        majorInnovations: ['Electricity', 'Automobile', 'Telephone', 'Mass production', 'Aviation'],
        events: ['WWI', 'Great Depression', 'WWII'],
    },
    {
        century: '2000',
        empire: 'Digital Empire',
        risingChallenger: 'China',
        capitalCenter: 'Silicon Valley / China rising',
        capitalParadigm: 'Digital platforms / networks / artificial intelligence',
        transition: 'American industrial dominance → borderless platform power',
        majorInnovations: ['Internet', 'Smartphones', 'Cloud computing', 'AI'],
        events: ['Communist collapse', '2001 China WTO', '2008 Financial Crisis', 'US–China trade conflict', 'COVID'],
    },
];

// This page is a succession, not a list of eras with overlapping labels. Fail
// loudly during development if a future edit gives two adjacent centuries the
// same empire or leaves one unnamed.
for (const [index, century] of CENTURIES.entries()) {
    if (!century.empire.trim()) throw new Error(`${century.century} must name an empire`);
    if (index > 0 && century.empire === CENTURIES[index - 1].empire) {
        throw new Error(`${century.century} must differ from the previous century's empire`);
    }
}
