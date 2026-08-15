/**
 * The Kyros mark — three columns of ascending height standing on a
 * stylobate inside an observatory ring: Alexandria enclosed by the lens.
 * The columns also read as I · I · I — the three stages of I³, the tallest
 * in bronze. Drawn on a 28×28 grid so it stays crisp at nav scale.
 */

const columns = [
  { x: 8.4, top: 14.6, opacity: 0.5, color: "currentColor" },
  { x: 14, top: 9.8, opacity: 0.75, color: "currentColor" },
  { x: 19.6, top: 4.4, opacity: 1, color: "var(--color-bronze)" },
];

export default function KyrosMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 28" fill="none" aria-hidden className={className}>
      {/* Observatory ring */}
      <circle
        cx="14"
        cy="14"
        r="12.5"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.45"
      />

      {columns.map(({ x, top, opacity, color }) => (
        <g key={x} stroke={color} opacity={opacity}>
          {/* Capital */}
          <line
            x1={x - 1.9}
            y1={top}
            x2={x + 1.9}
            y2={top}
            strokeWidth="1.1"
          />
          {/* Shaft */}
          <line x1={x} y1={top} x2={x} y2="20.4" strokeWidth="1.5" />
        </g>
      ))}

      {/* Stylobate */}
      <line
        x1="5.9"
        y1="20.8"
        x2="22.1"
        y2="20.8"
        stroke="currentColor"
        strokeWidth="1.1"
        opacity="0.6"
      />
    </svg>
  );
}
