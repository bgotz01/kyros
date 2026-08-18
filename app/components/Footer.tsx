export default function Footer() {
  return (
    <footer className="shrink-0 border-t border-stone-line bg-obsidian px-6 py-2">
      <p className="font-sans text-[0.6rem] uppercase tracking-[0.2em] text-platinum-dim/40">
        © {new Date().getFullYear()} Kyros — Identify the next paradigm.
      </p>
    </footer>
  );
}
