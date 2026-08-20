/**
 * Layered pixel scene behind every menu screen: sky, drifting clouds, distant
 * hills, a tree line, terrain and a brick floor. Purely decorative — it never
 * takes pointer events and never competes with foreground text.
 */
const CLOUDS = [
  { top: "8%", delay: "0s", duration: "90s", scale: 1 },
  { top: "18%", delay: "-30s", duration: "120s", scale: 0.7 },
  { top: "4%", delay: "-60s", duration: "150s", scale: 1.3 },
];

export default function Backdrop({ tone = "day" }: { tone?: "day" | "night" }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden ${
        tone === "night" ? "bg-nes-night" : "bg-nes-sky"
      }`}
    >
      {/* layer 1 - clouds */}
      {CLOUDS.map((c) => (
        <div
          key={c.top}
          className="ui-drift absolute left-0 opacity-90"
          style={{
            top: c.top,
            animationDelay: c.delay,
            animationDuration: c.duration,
            transform: `scale(${c.scale})`,
          }}
        >
          <div className="h-4 w-24 bg-nes-paper" />
          <div className="-mt-4 ml-6 h-4 w-12 bg-nes-paper" />
          <div className="ml-3 h-4 w-32 bg-nes-paper" />
        </div>
      ))}

      {/* layer 2 - far hills */}
      <div className="absolute inset-x-0 bottom-40 flex items-end justify-around opacity-60">
        {[1.4, 1, 1.7, 1.1, 1.5].map((s, i) => (
          <div key={i} className="flex flex-col items-center" style={{ transform: `scale(${s})` }}>
            <div className="h-3 w-8 bg-nes-pipe/70" />
            <div className="h-3 w-16 bg-nes-pipe/70" />
            <div className="h-3 w-24 bg-nes-pipe/70" />
          </div>
        ))}
      </div>

      {/* layer 3 - tree line */}
      <div className="absolute inset-x-0 bottom-28 flex items-end justify-between px-6">
        {Array.from({ length: 14 }).map((_, i) => (
          <div key={i} className="ui-sway flex flex-col items-center" style={{ animationDelay: `${i * 0.18}s` }}>
            <div className="h-3 w-8 bg-nes-pipe" />
            <div className="h-3 w-14 bg-nes-pipe" />
            <div className="h-4 w-3 bg-nes-brick-dark" />
          </div>
        ))}
      </div>

      {/* layer 4 - terrain + brick floor */}
      <div className="absolute inset-x-0 bottom-24 h-4 bg-nes-pipe" />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-nes-brick [background-image:repeating-linear-gradient(0deg,transparent_0_14px,var(--nes-brick-dark)_14px_16px),repeating-linear-gradient(90deg,transparent_0_30px,var(--nes-brick-dark)_30px_32px)]" />
    </div>
  );
}
