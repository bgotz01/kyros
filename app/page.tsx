'use client';

import InterfaceInline from './components/InterfaceInline';
import MacroAlerts from './components/MacroAlerts';
import ActiveRegimeBar from './components/ActiveRegimeBar';

export default function PanteonChamber() {
  return (
    <main style={{ backgroundColor: 'var(--surface)', color: 'var(--text-primary)' }}>
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none" style={{ background: 'var(--bg-glow)' }} />
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          opacity: 'var(--grid-opacity)',
          backgroundImage: `linear-gradient(to right, var(--grid-color) 1px, transparent 1px),
                            linear-gradient(to bottom, var(--grid-color) 1px, transparent 1px)`,
          backgroundSize: '44px 44px',
        }}
      />

      <section className="relative mx-auto max-w-7xl px-6 py-6">

        {/* ── Active Regime bar ────────────────────────────────── */}
        <ActiveRegimeBar />

        {/* ── Main grid: Athena chamber + Macro Shifts ────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">

          {/* Athena chamber */}
          <section
            className="relative border overflow-hidden flex flex-col"
            style={{
              borderColor: 'var(--surface-border)',
              backgroundColor: 'var(--chamber, var(--surface))',
              minHeight: '640px',
            }}
          >
            <div className="absolute inset-6 border pointer-events-none"
              style={{ borderColor: 'rgba(181,139,74,0.05)' }} />
            <div className="absolute left-1/2 top-24 h-[420px] w-[420px] -translate-x-1/2 rounded-full border pointer-events-none"
              style={{ borderColor: 'rgba(181,139,74,0.07)' }} />
            <div className="relative z-10 flex-1 flex flex-col min-h-0">
              <InterfaceInline />
            </div>
          </section>

          {/* Macro Shifts */}
          <aside>
            <MacroAlerts />
          </aside>
        </div>
      </section>
    </main>
  );
}
