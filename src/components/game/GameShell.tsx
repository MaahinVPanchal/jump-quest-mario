import { useCallback, useEffect, useState } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { emptySave, loadSlot, saveSlot } from "@/game/save-facade";
import type { SaveData } from "@/game/types";
import PixelSprite, { type SpriteId } from "./PixelSprite";
import { ENEMIES } from "@/game/data/enemies";
import { CHARACTERS, ROSTER } from "@/game/data/characters";
import { LEVELS } from "@/game/levels";

const PhaserMount = lazy(() => import("./PhaserMount"));

type Screen = "menu" | "roster" | "controls" | "playing";

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


const SAVE_SLOT = 1;

/** "emberFlare" -> "EMBER FLARE" for the ability tag on each hero card. */
const abilityLabel = (id: string): string =>
  id.replace(/([A-Z])/g, " $1").trim().toUpperCase();

export default function GameShell() {
  const [screen, setScreen] = useState<Screen>("menu");
  const [save, setSave] = useState<SaveData | null>(null);
  const [activeSave, setActiveSave] = useState<SaveData | null>(null);
  const [characterId, setCharacterId] = useState("riko");

  useEffect(() => {
    setSave(loadSlot(SAVE_SLOT));
  }, [screen]);

  const completedLevels = save?.completedLevels ?? [];
  // Campaign flows automatically: drop straight into the first unfinished stage.
  const nextLevel = LEVELS.find((l) => !completedLevels.includes(l.id)) ?? LEVELS[0]!;

  const play = useCallback(() => {
    const existing = loadSlot(SAVE_SLOT) ?? emptySave("Riko");
    saveSlot(SAVE_SLOT, existing);
    setActiveSave(existing);
    setScreen("playing");
  }, []);

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
              slot={SAVE_SLOT}
              save={activeSave}
              characterId={characterId}
              levelId={nextLevel.id}
              onExit={exit}
            />
          </Suspense>
        </ClientOnly>
      </div>
    );
  }

  const hero = CHARACTERS[characterId]!;

  return (
    <main className="relative min-h-screen overflow-hidden bg-nes-sky font-pixel text-nes-ink">
      {/* Pixel scenery: stepped hills, blocky clouds, brick floor. */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <PixelClouds />
        <PixelHills />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-nes-brick [background-image:repeating-linear-gradient(0deg,transparent_0_14px,var(--nes-brick-dark)_14px_16px),repeating-linear-gradient(90deg,transparent_0_30px,var(--nes-brick-dark)_30px_32px)]" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center gap-10 px-6 py-20">
        <header className="text-center">
          <p className="text-[10px] uppercase tracking-[0.4em] text-nes-brick-dark">Chapter One</p>
          <h1 className="mx-auto mt-5 max-w-3xl bg-nes-ink px-6 py-5 text-xl leading-relaxed text-nes-paper shadow-[8px_8px_0_0_var(--nes-brick-dark)] sm:text-3xl sm:leading-relaxed">
            RIKO <span className="text-nes-coin">&</span> THE
            <br />
            EMBERLEAF MEADOW
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-[10px] leading-6 text-nes-ink sm:text-xs sm:leading-7">
            An original 8-bit style platformer. Pick a hero and run — the campaign carries you
            straight from stage to stage.
          </p>
        </header>

        {screen === "menu" && (
          <nav className="flex flex-col items-center gap-3">
            <MenuButton primary onClick={() => setScreen("roster")}>
              Play
            </MenuButton>
            <MenuButton onClick={() => setScreen("controls")}>Controls</MenuButton>
            <p className="mt-4 max-w-md text-center text-[9px] leading-5 text-nes-brick-dark">
              Original characters, art, music and sound. No third-party game assets are used.
            </p>
          </nav>
        )}

        {screen === "roster" && (
          <section className="w-full space-y-6">
            {/* Hero roster - every hero is playable, arcade select-screen style */}
            <div className="border-4 border-nes-ink bg-nes-ink p-4 shadow-[8px_8px_0_0_var(--nes-brick-dark)]">
              <h2 className="text-center text-xs uppercase tracking-[0.3em] text-nes-coin">
                Select your hero
              </h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {ROSTER.map((c) => {
                  const selected = characterId === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCharacterId(c.id)}
                      className={`flex items-start gap-3 border-4 p-3 text-left transition ${
                        selected
                          ? "border-nes-paper bg-nes-coin"
                          : "border-nes-ink bg-nes-coin/80 hover:bg-nes-coin active:translate-y-[2px]"
                      }`}
                    >
                      <PixelSprite
                        id={c.canDoubleJump ? "mira" : "riko"}
                        px={3}
                        tint={c.tint}
                      />
                      <div className="min-w-0">
                        <p className="text-[9px] uppercase tracking-widest text-nes-brick-dark">
                          {c.name} · {abilityLabel(c.specialAbility)}
                        </p>
                        <p className="mt-1 text-[8px] leading-5">{c.blurb}</p>
                        <p className="mt-2 text-[8px] uppercase tracking-widest text-nes-ink/70">
                          {c.canDoubleJump ? "Double jump" : "Single jump"} · SPD {c.speed} · JMP{" "}
                          {c.jumpForce}
                          {c.canDash ? " · Dash" : ""}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected hero forms */}
            <div className="border-4 border-nes-ink bg-nes-paper p-5 shadow-[6px_6px_0_0_var(--nes-ink)]">
              <h2 className="text-center text-xs uppercase tracking-widest text-nes-ink">
                {hero.name} · power forms
              </h2>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-8">
                <PixelSprite id="star" px={4} />
                {(["riko", "rikoBig", "rikoFire"] as SpriteId[]).map((id, i) => (
                  <div key={id} className="flex flex-col items-center gap-2">
                    <PixelSprite id={id} px={i === 0 ? 3 : 4} tint={i === 2 ? undefined : hero.tint} />
                    <p className="text-[8px] uppercase tracking-widest text-nes-brick-dark">
                      {["Small", "Big", "Fire"][i]}
                    </p>
                  </div>
                ))}
                <PixelSprite id="coin" px={4} />
              </div>
              <p className="mt-4 text-center text-[9px] leading-5">{hero.blurb}</p>
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
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="flex flex-col items-center gap-3">
              <MenuButton primary onClick={play}>
                Start {hero.name} · {nextLevel.world}-{nextLevel.level}
              </MenuButton>
              <p className="text-center text-[9px] leading-5 text-nes-brick-dark">
                {completedLevels.length}/{LEVELS.length} stages cleared · next up {nextLevel.name}
              </p>
              <MenuButton onClick={() => setScreen("menu")}>Back</MenuButton>
            </div>
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
