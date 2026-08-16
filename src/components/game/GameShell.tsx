import { useCallback, useEffect, useState } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { emptySave, listSlots, loadSlot, saveSlot, deleteSlot, SLOT_COUNT } from "@/game/save-facade";
import type { SaveData } from "@/game/types";
import PixelSprite, { type SpriteId } from "./PixelSprite";
import { ENEMIES } from "@/game/data/enemies";
import { CHARACTERS } from "@/game/data/characters";
import { LEVELS } from "@/game/levels";

const PhaserMount = lazy(() => import("./PhaserMount"));

type Screen = "menu" | "slots" | "controls" | "playing";

const CONTROLS: [string, string][] = [
  ["Move", "A / D or Left / Right"],
  ["Run", "Shift (or RT)"],
  ["Jump", "Space or W / Up (hold for height)"],
  ["Throw embers", "X — after the Fire Crystal"],
  ["Enter a tunnel", "Down / S on top of a pipe"],
  ["Restart from checkpoint", "R"],
  ["Pause", "Esc"],
  ["Debug (dev only)", "F1 hitboxes · F2 stats · F10 invincible"],
];

function slotSummary(save: SaveData | null): string {
  if (!save) return "Empty slot";
  const done = save.completedLevels.length;
  return `${save.name} · ${done} level${done === 1 ? "" : "s"} · ${save.relics.length}/3 relics · ${save.coins} coins`;
}

const POWER_UPS: { id: SpriteId; name: string; text: string }[] = [
  { id: "growthOrb", name: "Growth Orb", text: "Riko grows big — takes one extra hit and smashes bricks." },
  { id: "fireCrystal", name: "Fire Crystal", text: "Throw embers with X to burn any enemy from range." },
  { id: "oneUp", name: "Ember Heart", text: "Hidden 1-Up. Adds a life to your run." },
  { id: "relic", name: "Golden Relic", text: "Three per level, tucked into secret routes." },
];

type EnemyCard = {
  id: SpriteId;
  key: keyof typeof ENEMIES;
  text: string;
  behaviour: string;
  counters: string[];
  danger: string;
  tip: string;
};

const ENEMY_CARDS: EnemyCard[] = [
  {
    id: "walker",
    key: "walker",
    text: "Marches in a straight line. Stomp it flat.",
    behaviour:
      "Walks at a steady 55 px/s, turns only at ledges and walls, and never chases. Falls off platforms it walks past.",
    counters: ["Stomp — flattens instantly", "Fire ember — one hit", "Sliding shell — knocked away"],
    danger: "Side contact costs one power stage. Small Riko dies.",
    tip: "Chain stomps without touching the ground to build the 100 / 200 / 400 combo ladder.",
  },
  {
    id: "shell",
    key: "shell",
    text: "Shelled patroller. Stomp once to shell it, then kick it into a crowd.",
    behaviour:
      "Patrols at 52 px/s across a 128 px beat. First stomp tucks it into a dormant shell for 5.2 s — the shell wobbles for the last 1.5 s, then it wakes up and walks again.",
    counters: [
      "Stomp 1 — becomes a shell",
      "Stomp/side nudge on a shell — kicks it at 400 px/s",
      "Stomp a sliding shell — stops it dead",
      "Fire ember — defeats it outright",
    ],
    danger:
      "A sliding shell hurts Riko too, but you get a 140 ms grace window right after kicking. Shells bounce off walls and can come back at you.",
    tip: "Kick a shell down a lane of Sprout Walkers for a rapid score chain — it also clears Emberjaw Blooms.",
  },
  {
    id: "flyer",
    key: "flyer",
    text: "Hovers in a wave pattern. Time your jump or use fire.",
    behaviour:
      "Drifts at 60 px/s along a 160 px sine wave, ignoring the ground entirely, so it crosses gaps and pits.",
    counters: ["Stomp at the top of its dip", "Fire ember — safest option"],
    danger: "It can drift into you mid-jump, over pits where a knockback means a fall.",
    tip: "Wait for the low point of the wave and stomp; the bounce carries you over the following gap.",
  },
  {
    id: "piranha",
    key: "piranha",
    text: "Bites out of pipes on a cycle. Cannot be stomped — fire only.",
    behaviour:
      "Lives inside a pipe on a fixed NES cadence: 1.4 s hidden, 0.48 s rise, 2.0 s exposed with a snapping bite, 0.48 s retract. It stays tucked away while Riko stands on or beside its pipe rim, and while he is entering or exiting any pipe.",
    counters: ["Fire ember — the only direct answer", "A sliding shell that hits the pipe"],
    danger: "The head has no weak point — stomping it always hurts. Jumping over the pipe during the bite is the most common death.",
    tip: "Stand on the rim to keep it down, or walk past exactly during the retract beat.",
  },
  {
    id: "spiker",
    key: "spiker",
    text: "New in 2-1. Spiked roller that charges when it spots you. Never stompable.",
    behaviour:
      "Rolls at 48 px/s across a 144 px beat. If Riko is within 260 px and in front of it, it winds up and charges at 2.6x speed for about a second, glowing red as it goes.",
    counters: ["Fire ember — clean kill", "Sliding shell — bowls it over", "Jump clean over the charge"],
    danger: "Spikes cover the top, so a stomp always costs you a power stage.",
    tip: "Bait the charge from a ledge, then drop behind it while it overshoots.",
  },
];

const CHARACTER_CARDS: { id: string; sprite: SpriteId }[] = [
  { id: "riko", sprite: "riko" },
  { id: "mira", sprite: "mira" },
];

export default function GameShell() {
  const [screen, setScreen] = useState<Screen>("menu");
  const [slots, setSlots] = useState<(SaveData | null)[]>([]);
  const [activeSlot, setActiveSlot] = useState(1);
  const [activeSave, setActiveSave] = useState<SaveData | null>(null);
  const [characterId, setCharacterId] = useState("riko");
  const [levelId, setLevelId] = useState(LEVELS[0]!.id);

  useEffect(() => {
    setSlots(listSlots());
  }, [screen]);

  const play = useCallback((slot: number) => {
    const existing = loadSlot(slot) ?? emptySave(`Riko ${slot}`);
    saveSlot(slot, existing);
    setActiveSlot(slot);
    setActiveSave(existing);
    setScreen("playing");
  }, []);

  const unlockedCharacters = new Set(
    slots.flatMap((s) => s?.unlockedCharacters ?? []).concat(["riko"]),
  );
  const completedLevels = new Set(slots.flatMap((s) => s?.completedLevels ?? []));

  const exit = useCallback(() => {
    setActiveSave(null);
    setScreen("menu");
  }, []);

  if (screen === "playing" && activeSave) {
    return (
      <div className="fixed inset-0 bg-nes-ink">
        <ClientOnly fallback={<LoadingCanvas />}>
          <Suspense fallback={<LoadingCanvas />}>
            <PhaserMount
              slot={activeSlot}
              save={activeSave}
              characterId={characterId}
              levelId={levelId}
              onExit={exit}
            />
          </Suspense>
        </ClientOnly>
      </div>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-nes-sky font-pixel text-nes-ink">
      {/* Pixel scenery: stepped hills, blocky clouds, brick floor. */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <PixelClouds />
        <PixelHills />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-nes-brick [background-image:repeating-linear-gradient(0deg,transparent_0_14px,var(--nes-brick-dark)_14px_16px),repeating-linear-gradient(90deg,transparent_0_30px,var(--nes-brick-dark)_30px_32px)]" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center gap-10 px-6 py-20">
        <header className="text-center">
          <p className="text-[10px] uppercase tracking-[0.4em] text-nes-brick-dark">Chapter One</p>
          <h1 className="mx-auto mt-5 max-w-3xl bg-nes-ink px-6 py-5 text-xl leading-relaxed text-nes-paper shadow-[8px_8px_0_0_var(--nes-brick-dark)] sm:text-3xl sm:leading-relaxed">
            RIKO <span className="text-nes-coin">&</span> THE
            <br />
            EMBERLEAF MEADOW
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-[10px] leading-6 text-nes-ink sm:text-xs sm:leading-7">
            An original 8-bit style platformer. Run, stomp, bump blocks and hunt three Golden Relics
            before the timer hits zero.
          </p>
        </header>

        {screen === "menu" && (
          <nav className="flex flex-col items-center gap-3">
            <MenuButton primary onClick={() => setScreen("slots")}>
              Play
            </MenuButton>
            <MenuButton onClick={() => setScreen("controls")}>Controls</MenuButton>
            <p className="mt-4 max-w-md text-center text-[9px] leading-5 text-nes-brick-dark">
              Original characters, art, music and sound. No third-party game assets are used.
            </p>
          </nav>
        )}

        {screen === "slots" && (
          <section className="w-full max-w-3xl space-y-6">
            {/* Hero briefing */}
            <div className="border-4 border-nes-ink bg-nes-paper p-5 shadow-[6px_6px_0_0_var(--nes-ink)]">
              <h2 className="text-center text-xs uppercase tracking-widest text-nes-ink">Your character</h2>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-6">
                <PixelSprite id="star" px={4} />
                <div className="flex flex-col items-center gap-2">
                  <PixelSprite id="riko" px={6} />
                  <p className="text-[10px] uppercase tracking-widest text-nes-brick-dark">Riko</p>
                </div>
                <PixelSprite id="coin" px={4} />
              </div>
              <p className="mt-4 text-center text-[9px] leading-5">
                Original mascot — quick acceleration, skid turns, coyote time and a variable-height jump.
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-6">
                {(["riko", "rikoBig", "rikoFire"] as SpriteId[]).map((id, i) => (
                  <div key={id} className="flex flex-col items-center gap-2">
                    <PixelSprite id={id} px={i === 0 ? 3 : 4} />
                    <p className="text-[8px] uppercase tracking-widest text-nes-brick-dark">
                      {["Small", "Big", "Fire"][i]}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Power-ups */}
            <div className="border-4 border-nes-ink bg-nes-paper p-5 shadow-[6px_6px_0_0_var(--nes-ink)]">
              <h2 className="text-center text-xs uppercase tracking-widest text-nes-ink">Upgrades</h2>
              <ul className="mt-4 grid gap-4 sm:grid-cols-2">
                {POWER_UPS.map((p) => (
                  <li key={p.id} className="flex items-start gap-3">
                    <PixelSprite id={p.id} px={3} />
                    <div>
                      <p className="text-[9px] uppercase tracking-widest text-nes-brick-dark">{p.name}</p>
                      <p className="mt-1 text-[9px] leading-5">{p.text}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Enemies */}
            <div className="border-4 border-nes-ink bg-nes-paper p-5 shadow-[6px_6px_0_0_var(--nes-ink)]">
              <h2 className="text-center text-xs uppercase tracking-widest text-nes-ink">Enemy lineup</h2>
              <ul className="mt-4 grid gap-5 sm:grid-cols-2">
                {ENEMY_CARDS.map((e) => {
                  const data = ENEMIES[e.key];
                  return (
                    <li key={e.id} className="flex items-start gap-3 border-4 border-nes-ink bg-nes-paper p-3">
                      <PixelSprite id={e.id} px={3} />
                      <div className="min-w-0">
                        <p className="text-[9px] uppercase tracking-widest text-nes-brick-dark">
                          {data.name} · {data.score} pts
                        </p>
                        <p className="mt-1 text-[9px] leading-5">{e.text}</p>
                        <p className="mt-2 text-[8px] leading-5 opacity-80">{e.behaviour}</p>
                        <p className="mt-2 text-[8px] uppercase tracking-widest text-nes-brick-dark">How to beat it</p>
                        <ul className="mt-1 list-none space-y-1">
                          {e.counters.map((c) => (
                            <li key={c} className="text-[8px] leading-5">
                              &gt; {c}
                            </li>
                          ))}
                        </ul>
                        <p className="mt-2 text-[8px] leading-5">
                          <span className="text-nes-brick-dark">DANGER: </span>
                          {e.danger}
                        </p>
                        <p className="mt-1 text-[8px] leading-5">
                          <span className="text-nes-brick-dark">TIP: </span>
                          {e.tip}
                        </p>
                        <p className="mt-2 text-[8px] uppercase tracking-widest opacity-70">
                          SPD {data.speed} · RANGE {data.patrolRange}PX · STOMP {data.stompable ? "YES" : "NO"} · WEAK{" "}
                          {data.weakness.join("/")}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Character select */}
            <div className="border-4 border-nes-ink bg-nes-paper p-5 shadow-[6px_6px_0_0_var(--nes-ink)]">
              <h2 className="text-center text-xs uppercase tracking-widest text-nes-ink">Choose your hero</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {CHARACTER_CARDS.map((c) => {
                  const data = CHARACTERS[c.id]!;
                  const locked = !unlockedCharacters.has(c.id);
                  const selected = characterId === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      disabled={locked}
                      onClick={() => setCharacterId(c.id)}
                      className={`flex items-start gap-3 border-4 border-nes-ink p-3 text-left transition ${
                        selected ? "bg-nes-coin" : "bg-nes-paper"
                      } ${locked ? "opacity-50" : "active:translate-y-[2px]"}`}
                    >
                      <PixelSprite id={c.sprite} px={3} />
                      <div className="min-w-0">
                        <p className="text-[9px] uppercase tracking-widest text-nes-brick-dark">
                          {data.name}
                          {locked ? " · locked" : selected ? " · selected" : ""}
                        </p>
                        <p className="mt-1 text-[9px] leading-5">{data.blurb}</p>
                        <p className="mt-2 text-[8px] uppercase tracking-widest opacity-70">
                          {locked ? `Clear ${data.unlockedBy} to unlock` : data.canDoubleJump ? "Double jump" : "Single jump"}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Level select */}
            <div className="border-4 border-nes-ink bg-nes-paper p-5 shadow-[6px_6px_0_0_var(--nes-ink)]">
              <h2 className="text-center text-xs uppercase tracking-widest text-nes-ink">Choose a level</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {LEVELS.map((level, i) => {
                  const prev = LEVELS[i - 1];
                  const locked = !!prev && !completedLevels.has(prev.id);
                  const selected = levelId === level.id;
                  return (
                    <button
                      key={level.id}
                      type="button"
                      disabled={locked}
                      onClick={() => setLevelId(level.id)}
                      className={`border-4 border-nes-ink p-3 text-left transition ${
                        selected ? "bg-nes-coin" : "bg-nes-paper"
                      } ${locked ? "opacity-50" : "active:translate-y-[2px]"}`}
                    >
                      <p className="text-[9px] uppercase tracking-widest text-nes-brick-dark">
                        World {level.world}-{level.level} · {level.name}
                      </p>
                      <p className="mt-2 text-[9px] leading-5">
                        {level.starsRequired
                          ? `Collect all ${level.starsRequired} Sky Stars before the goal flag will open.`
                          : "Reach the goal flag before the timer runs out."}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        {level.starsRequired ? <PixelSprite id="star" px={2} /> : <PixelSprite id="coin" px={2} />}
                        <span className="text-[8px] uppercase tracking-widest opacity-70">
                          {locked ? `Clear ${prev?.id} first` : `${level.timeLimit}s · ${level.enemies.length} enemies`}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <h2 className="text-center text-xs uppercase tracking-widest text-nes-ink">Choose a save slot</h2>
            {Array.from({ length: SLOT_COUNT }, (_, i) => i + 1).map((slot) => {
              const save = slots[slot - 1] ?? null;
              return (
                <div
                  key={slot}
                  className="flex flex-wrap items-center justify-between gap-4 border-4 border-nes-ink bg-nes-paper px-5 py-4 shadow-[6px_6px_0_0_var(--nes-ink)]"
                >
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-nes-brick-dark">Slot {slot}</p>
                    <p className="mt-2 text-[10px] leading-5">{slotSummary(save)}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => play(slot)}
                      className="border-4 border-nes-ink bg-nes-coin px-4 py-2 text-[10px] uppercase text-nes-ink transition active:translate-y-[2px]"
                    >
                      {save ? "Continue" : "New game"}
                    </button>
                    {save && (
                      <button
                        type="button"
                        onClick={() => {
                          deleteSlot(slot);
                          setSlots(listSlots());
                        }}
                        className="border-4 border-nes-ink bg-nes-paper px-4 py-2 text-[10px] uppercase text-nes-ink transition active:translate-y-[2px]"
                      >
                        Erase
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            <MenuButton onClick={() => setScreen("menu")}>Back</MenuButton>
          </section>
        )}

        {screen === "controls" && (
          <section className="w-full max-w-xl space-y-2">
            <h2 className="text-center text-xs uppercase tracking-widest text-nes-ink">Controls</h2>
            <dl className="divide-y-4 divide-nes-ink/10 border-4 border-nes-ink bg-nes-paper px-5 shadow-[6px_6px_0_0_var(--nes-ink)]">
              {CONTROLS.map(([label, keys]) => (
                <div key={label} className="flex flex-wrap items-center justify-between gap-4 py-3">
                  <dt className="text-[9px] uppercase text-nes-brick-dark">{label}</dt>
                  <dd className="text-[9px] leading-5">{keys}</dd>
                </div>
              ))}
            </dl>
            <MenuButton onClick={() => setScreen("menu")}>Back</MenuButton>
          </section>
        )}
      </div>
    </main>
  );
}

function PixelClouds() {
  const clouds = [
    { left: "8%", top: "12%", scale: 1 },
    { left: "42%", top: "6%", scale: 0.8 },
    { left: "72%", top: "18%", scale: 1.2 },
  ];
  return (
    <>
      {clouds.map((c) => (
        <div
          key={c.left}
          className="absolute"
          style={{ left: c.left, top: c.top, transform: `scale(${c.scale})` }}
        >
          <div className="h-4 w-24 bg-nes-paper" />
          <div className="-mt-4 ml-6 h-4 w-12 bg-nes-paper" />
          <div className="ml-3 h-4 w-32 bg-nes-paper" />
        </div>
      ))}
    </>
  );
}

function PixelHills() {
  return (
    <div className="absolute inset-x-0 bottom-24 flex items-end justify-around">
      {[1, 0.7, 1.3, 0.9].map((s, i) => (
        <div key={i} className="flex flex-col items-center" style={{ transform: `scale(${s})` }}>
          <div className="h-4 w-10 bg-nes-pipe" />
          <div className="h-4 w-20 bg-nes-pipe" />
          <div className="h-4 w-32 bg-nes-pipe" />
        </div>
      ))}
    </div>
  );
}

function MenuButton({
  children,
  onClick,
  primary,
}: {
  children: React.ReactNode;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        primary
          ? "w-64 border-4 border-nes-ink bg-nes-coin px-8 py-4 text-sm uppercase tracking-wide text-nes-ink shadow-[6px_6px_0_0_var(--nes-ink)] transition active:translate-x-[3px] active:translate-y-[3px] active:shadow-none"
          : "w-64 border-4 border-nes-ink bg-nes-paper px-8 py-4 text-xs uppercase tracking-wide text-nes-ink shadow-[6px_6px_0_0_var(--nes-ink)] transition active:translate-x-[3px] active:translate-y-[3px] active:shadow-none"
      }
    >
      {children}
    </button>
  );
}

function LoadingCanvas() {
  return (
    <div className="flex h-full w-full items-center justify-center font-pixel text-xs text-nes-paper">
      LOADING…
    </div>
  );
}
