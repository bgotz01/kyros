// Stocks section layout — adds padding for the sub-navbar (40px)
// The root layout already adds pt-[60px] for the main nav.
// Sub-pages under /stocks render a SubNavbar, so we push content down another 40px.

export default function StocksLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="pt-[40px]">
            {children}
        </div>
    );
}
