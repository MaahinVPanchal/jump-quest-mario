/**
 * Hero select: one large animated preview, a compact stat read-out and a strip
 * of the ten heroes. Everything a player needs in about three seconds.
 */
import { useEffect, useState } from "react";
import PixelSprite from "../PixelSprite";
import {
  Difficulty,
  PanelTitle,
  PixelBadge,
  PixelButton,
  PixelPanel,
  StatBar,
} from "@/components/pixel";
import { ROSTER } from "@/game/data/characters";
import type { CharacterData } from "@/game/types";

/** Short, readable name for the ability demo pass. */
const DEMO_COLOR: Record<string, string> = {
  emberBurst: "var(--nes-brick)",
  fireBurst: "var(--nes-brick)",
  bounceShot: "var(--nes-coin)",
  electricArc: "var(--nes-coin)",
  knifeThrow: "var(--nes-paper)",
  shield: "var(--nes-pipe)",
  ninjaStar: "var(--nes-paper)",
  frostShard: "var(--sky-soft)",
  windBlast: "var(--nes-paper)",
  groundSmash: "var(--nes-brick-dark)",
};

/** Idle bob plus a repeating ability demo, so the move reads before you play. */
function HeroStage({ hero }: { hero: CharacterData }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    setTick(0);
    const id = window.setInterval(() => setTick((t) => t + 1), 1800);
    return () => window.clearInterval(id);
  }, [hero.id]);

  const shield = hero.ability === "shield";
  const smash = hero.ability === "groundSmash";
  return (
    <div className="relative flex h-44 items-end justify-center overflow-hidden border-4 border-nes-ink bg-nes-sky">
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-6 bg-nes-brick" />
      <div className="ui-sway relative z-10 mb-6">
        <PixelSprite id="rikoBig" px={5} rig={hero.rig} tint={hero.tint} />
      </div>
      {/* ability demo: a shield ring, a floor shockwave, or a travelling shot */}
      {shield ? (
        <span
          key={tick}
          aria-hidden
          className="ui-pop absolute bottom-8 z-20 h-24 w-24 border-4"
          style={{ borderColor: DEMO_COLOR[hero.ability] }}
        />
      ) : smash ? (
        <span
          key={tick}
          aria-hidden
          className="absolute bottom-6 z-20 h-3 animate-[drift_1.6s_linear_infinite] bg-nes-brick-dark"
          style={{ width: "60%" }}
        />
      ) : (
        <span
          key={tick}
          aria-hidden
          className="absolute bottom-14 left-1/2 z-20 h-3 w-3 animate-[drift_1.6s_linear_infinite]"
          style={{ background: DEMO_COLOR[hero.ability] ?? "var(--nes-coin)" }}
        />
      )}
      <p className="absolute bottom-1 z-20 w-full text-center text-[8px] uppercase tracking-[0.2em] text-nes-paper">
        {hero.abilityName}
      </p>
    </div>
  );
}

export default function HeroSelect({
  heroId,
  onSelect,
  onStart,
  onMap,
  onBack,
  startLabel,
  progressLine,
}: {
  heroId: string;
  onSelect: (id: string) => void;
  onStart: () => void;
  onMap: () => void;
  onBack: () => void;
  startLabel: string;
  progressLine: string;
}) {
  const index = Math.max(0, ROSTER.findIndex((h) => h.id === heroId));
  const hero = ROSTER[index]!;
  const step = (dir: number) => onSelect(ROSTER[(index + dir + ROSTER.length) % ROSTER.length]!.id);

  return (
    <PixelPanel as="section" className="w-full">
      <PanelTitle
        hint={`${ROSTER.length} unique playstyles`}
        right={
          <PixelButton onClick={onBack} aria-label="Back to title">
            Back
          </PixelButton>
        }
      >
        Select your hero
      </PanelTitle>

      <div className="grid gap-6 p-5 md:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
        {/* preview column */}
        <div className="space-y-3">
          <HeroStage hero={hero} />
          <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
            <PixelButton onClick={() => step(-1)} aria-label="Previous hero">
              {"\u25C0"}
            </PixelButton>
            <div className="min-w-0 text-center">
              <p className="truncate text-sm uppercase tracking-[0.2em]">{hero.name}</p>
              <p className="mt-1 truncate text-[8px] uppercase tracking-[0.2em] text-nes-muted">
                {hero.role}
              </p>
            </div>
            <PixelButton onClick={() => step(1)} aria-label="Next hero">
              {"\u25B6"}
            </PixelButton>
          </div>
          <div className="flex items-center justify-center gap-2">
            <span className="text-[8px] uppercase tracking-[0.2em] text-nes-muted">Difficulty</span>
            <Difficulty value={hero.difficulty} />
          </div>
        </div>

        {/* detail column */}
        <div className="space-y-4">
          <div className="space-y-2">
            <StatBar label="Speed" value={hero.stats.speed} />
            <StatBar label="Jump" value={hero.stats.jump} />
            <StatBar label="Power" value={hero.stats.power} tone="coin" />
            <StatBar label="Defense" value={hero.stats.defense} tone="coin" />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <PixelPanel tone="night" className="p-3">
              <p className="text-[8px] uppercase tracking-[0.2em] text-nes-coin">Special · X</p>
              <p className="mt-1 text-[10px] uppercase tracking-widest">{hero.abilityName}</p>
              <p className="mt-2 text-[8px] leading-5 text-nes-paper/80">{hero.abilityDesc}</p>
            </PixelPanel>
            <PixelPanel tone="night" className="p-3">
              <p className="text-[8px] uppercase tracking-[0.2em] text-nes-coin">Passive</p>
              <p className="mt-1 text-[10px] uppercase tracking-widest">{hero.passiveName}</p>
              <p className="mt-2 text-[8px] leading-5 text-nes-paper/80">{hero.passiveDesc}</p>
            </PixelPanel>
          </div>

          <div className="flex flex-wrap gap-2">
            {hero.strengths.map((s) => (
              <PixelBadge key={s} tone="good" icon="+">
                {s}
              </PixelBadge>
            ))}
            {hero.weaknesses.map((w) => (
              <PixelBadge key={w} tone="bad" icon="-">
                {w}
              </PixelBadge>
            ))}
          </div>
        </div>
      </div>

      {/* roster strip */}
      <div className="border-t-4 border-nes-ink bg-nes-ink/5 p-3">
        <ul className="grid grid-cols-5 gap-2 sm:grid-cols-10">
          {ROSTER.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => onSelect(c.id)}
                aria-pressed={c.id === hero.id}
                className={`ui-focus flex min-h-11 w-full flex-col items-center gap-1 border-4 border-nes-ink p-1 transition ${
                  c.id === hero.id ? "bg-nes-coin" : "bg-nes-paper hover:bg-nes-coin/50"
                }`}
              >
                <PixelSprite id="riko" px={2} rig={c.rig} tint={c.tint} />
                <span className="text-[7px] uppercase tracking-widest">{c.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="grid gap-3 border-t-4 border-nes-ink p-5 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
        <PixelButton variant="primary" size="lg" onClick={onStart} block>
          {startLabel}
        </PixelButton>
        <PixelButton onClick={onMap}>World map</PixelButton>
        <PixelButton onClick={onBack}>Back</PixelButton>
        <p className="text-[8px] uppercase leading-5 tracking-[0.2em] text-nes-muted sm:col-span-3">
          {progressLine}
        </p>
      </div>
    </PixelPanel>
  );
}
