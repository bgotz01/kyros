export interface AssetLeader {
    decade: string;

    /** The asset through which the decade's capital primarily ran. */
    asset: string;

    /** The structural force behind the leadership regime. */
    descriptor: string;

    /** The old regime and the new regime that displaced it. */
    inversion: {
        from: string;
        to: string;
    };
}

export const ASSET_LEADERS: AssetLeader[] = [
    {
        decade: "1950s",
        asset: "German Equities",
        descriptor: "Reconstruction",
        inversion: {
            from: "War & destruction",
            to: "Rebuilding",
        },
    },
    {
        decade: "1960s",
        asset: "American Brands",
        descriptor: "Mass consumption",
        inversion: {
            from: "Infrastructure",
            to: "Consumer economy",
        },
    },
    {
        decade: "1970s",
        asset: "Gold & Oil",
        descriptor: "Fiat regime",
        inversion: {
            from: "Gold constraint",
            to: "Fiat money",
        },
    },
    {
        decade: "1980s",
        asset: "Japanese Equities",
        descriptor: "Financial expansion",
        inversion: {
            from: "Inflation",
            to: "Disinflation",
        },
    },
    {
        decade: "1990s",
        asset: "Internet Stocks",
        descriptor: "Information age",
        inversion: {
            from: "Physical",
            to: "Digital",
        },
    },
    {
        decade: "2000s",
        asset: "Commodities & EM",
        descriptor: "China industrialisation",
        inversion: {
            from: "Digital",
            to: "Physical",
        },
    },
    {
        decade: "2010s",
        asset: "Platform Tech",
        descriptor: "Software scale",
        inversion: {
            from: "Hardware",
            to: "Software",
        },
    },
    {
        decade: "2020s",
        asset: "Semiconductors",
        descriptor: "Compute buildout",
        inversion: {
            from: "Software",
            to: "Hardware",
        },
    },
];