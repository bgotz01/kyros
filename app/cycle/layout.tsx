// Cycle section layout — adds padding for the sub-navbar (≈40px)
export default function CycleLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="pt-[40px]">
            {children}
        </div>
    );
}
