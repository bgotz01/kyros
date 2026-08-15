export default function TheoryPage() {
  return (
    <div className="mx-auto w-full max-w-[1000px] px-8 py-20">

      {/* ── lede ──────────────────────────────────────────────────────────── */}
      <div className="mb-20 flex flex-col gap-8 sm:flex-row sm:items-start sm:gap-20">
        <div className="flex flex-col gap-3">
          <span className="font-serif text-4xl font-light tracking-[0.12em] text-marble">
            Poesis <span className="text-bronze">= O³</span>
          </span>
          <span className="font-sans text-xs uppercase tracking-[0.28em] text-platinum">
            Creation lens
          </span>
          <p className="mt-1 text-sm leading-relaxed tracking-[0.03em] text-platinum-dim">
            From Greek <span className="italic text-platinum">poiesis</span> — making; bringing something into being.
          </p>
        </div>

        <span
          aria-hidden
          className="mt-6 hidden h-px w-16 bg-stone-line-strong sm:block"
        />

        <div className="flex flex-col gap-3">
          <span className="font-serif text-4xl font-light tracking-[0.12em] text-marble">
            Kyros <span className="text-bronze">= I³</span>
          </span>
          <span className="font-sans text-xs uppercase tracking-[0.28em] text-platinum">
            Capital lens
          </span>
          <p className="mt-1 text-sm leading-relaxed tracking-[0.03em] text-platinum-dim">
            From Greek <span className="italic text-platinum">kairos</span> — the opportune moment for action.
          </p>
        </div>
      </div>

      {/* ── overview ──────────────────────────────────────────────────────── */}
      <SectionTitle>Overview</SectionTitle>

      <div className="mb-20 overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b-2 border-stone-line-strong">
              <th className="w-36 pb-4 pr-8 text-left font-sans text-[0.65rem] uppercase tracking-[0.22em] text-platinum-dim" />
              <th className="pb-4 pr-10 text-left font-sans text-[0.65rem] uppercase tracking-[0.22em] text-platinum-dim">
                Poesis
              </th>
              <th className="pb-4 text-left font-sans text-[0.65rem] uppercase tracking-[0.22em] text-platinum-dim">
                Kyros
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-line">
            {[
              { label: 'Formula', poesis: 'O³', kyros: 'I³', bold: true },
              { label: 'Domain', poesis: 'Stories, ideas, culture', kyros: 'Markets, technology, capital' },
              { label: 'Objective', poesis: 'Create the next paradigm', kyros: 'Invest in the next paradigm', bold: true },
              { label: 'Orientation', poesis: 'Creative / generative', kyros: 'Observational / allocative' },
              { label: 'Question', poesis: 'What should exist next?', kyros: 'Where is the next paradigm emerging?', italic: true },

            ].map(({ label, poesis, kyros, bold, italic }) => (
              <tr key={label} className="group transition-colors duration-300 ease-mechanical hover:bg-charcoal">
                <td className="py-4 pr-8 align-top font-sans text-[0.65rem] uppercase tracking-[0.22em] text-platinum-dim">
                  {label}
                </td>
                <td className={`py-4 pr-10 align-top text-sm leading-relaxed tracking-[0.03em]
                  ${bold ? 'font-medium text-marble' : italic ? 'italic text-platinum' : 'text-platinum'}`}>
                  {poesis}
                </td>
                <td className={`py-4 align-top text-sm leading-relaxed tracking-[0.03em]
                  ${bold ? 'font-medium text-marble' : italic ? 'italic text-platinum' : 'text-platinum'}`}>
                  {kyros}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── laws ──────────────────────────────────────────────────────────── */}
      <SectionTitle>Laws</SectionTitle>

      <div className="mb-6 grid grid-cols-[1fr_4rem_1fr] gap-8">
        <span className="font-sans text-[0.6rem] uppercase tracking-[0.28em] text-bronze">
          Create
        </span>

        <span />

        <span className="font-sans text-[0.6rem] uppercase tracking-[0.28em] text-bronze">
          Observe
        </span>
      </div>

      <div className="mb-20 flex flex-col gap-10">
        {[
          {
            number: '01',
            poesis: {
              term: 'Opposites',
              text: 'What can be inverted from the existing paradigm?',
            },
            kyros: {
              term: 'Inversion',
              text: 'What is starting to be inverted from the existing paradigm?',
            },
          },
          {
            number: '02',
            poesis: {
              term: 'Obvious',
              text: 'Does it create obvious value? What underlying trend does it capture?',
            },
            kyros: {
              term: 'Incentives',
              text: 'What incentives are pushing the inversion forward?',
            },
          },
          {
            number: '03',
            poesis: {
              term: 'Outliers',
              text: 'How can the outlier be formed? What makes it memorable and unique?',
            },
            kyros: {
              term: 'Inflection',
              text: 'What new vehicles are carrying the inversion forward?',
            },
          },
        ].map(({ number, poesis, kyros }) => (
          <div
            key={number}
            className="grid grid-cols-[1fr_4rem_1fr] items-start gap-8 border-b border-stone-line pb-10"
          >
            <div>
              <div className="mb-3 font-serif text-2xl font-light tracking-[0.08em] text-marble">
                {poesis.term}
              </div>
              <p className="max-w-sm text-sm leading-relaxed tracking-[0.03em] text-platinum">
                {poesis.text}
              </p>
            </div>

            <div className="flex flex-col items-center gap-3 pt-1">
              <span className="font-sans text-[0.65rem] uppercase tracking-[0.22em] text-bronze">
                {number}
              </span>
              <span className="h-12 w-px bg-stone-line-strong" />
            </div>

            <div>
              <div className="mb-3 font-serif text-2xl font-light tracking-[0.08em] text-marble">
                {kyros.term}
              </div>
              <p className="max-w-sm text-sm leading-relaxed tracking-[0.03em] text-platinum">
                {kyros.text}
              </p>
            </div>
          </div>
        ))}
      </div>



    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-8 flex items-center gap-5">
      <h2 className="font-serif text-xl font-light tracking-[0.2em] text-marble">{children}</h2>
      <span aria-hidden className="h-px flex-1 bg-stone-line" />
    </div>
  );
}
