// Regime section layout — adds padding for the sub-navbar (≈40px)
// The root layout already adds pt-[52px] for the main nav.
// Sub-pages under /regime render a SubNavbar, so we push content down by another 40px.

export default function RegimeLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="pt-[40px]">
            {children}
        </div>
    );
}
