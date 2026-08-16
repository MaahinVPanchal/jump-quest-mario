import { useCallback, useEffect, useState } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { emptySave, listSlots, loadSlot, saveSlot, deleteSlot, SLOT_COUNT } from "@/game/save-facade";
import type { SaveData } from "@/game/types";
import PixelSprite, { type SpriteId } from "./PixelSprite";
import { ENEMIES } from "@/game/data/enemies";

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

const ENEMY_CARDS: { id: SpriteId; key: keyof typeof ENEMIES; text: string }[] = [
  { id: "walker", key: "walker", text: "Marches in a straight line. Stomp it flat." },
  { id: "shell", key: "shell", text: "Shelled patroller. Stomp once to shell it, then kick it into a crowd." },
  { id: "flyer", key: "flyer", text: "Hovers in a wave pattern. Time your jump or use fire." },
  { id: "piranha", key: "piranha", text: "Bites out of pipes on a cycle. Cannot be stomped — fire only." },
];

export default function GameShell() {
  const [screen, setScreen] = useState<Screen>("menu");
  const [slots, setSlots] = useState<(SaveData | null)[]>([]);
  const [activeSlot, setActiveSlot] = useState(1);
  const [activeSave, setActiveSave] = useState<SaveData | null>(null);

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

  const exit = useCallback(() => {
    setActiveSave(null);
    setScreen("menu");
  }, []);

  if (screen === "playing" && activeSave) {
    return (
      <div className="fixed inset-0 bg-nes-ink">
        <ClientOnly fallback={<LoadingCanvas />}>
          <Suspense fallback={<LoadingCanvas />}>
            <PhaserMount slot={activeSlot} save={activeSave} onExit={exit} />
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
          <section className="w-full max-w-xl space-y-3">
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
