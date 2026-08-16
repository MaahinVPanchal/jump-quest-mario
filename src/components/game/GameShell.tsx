import { useCallback, useEffect, useState } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { emptySave, listSlots, loadSlot, saveSlot, deleteSlot, SLOT_COUNT } from "@/game/save-facade";
import type { SaveData } from "@/game/types";

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
      <div className="fixed inset-0 bg-dusk">
        <ClientOnly fallback={<LoadingCanvas />}>
          <Suspense fallback={<LoadingCanvas />}>
            <PhaserMount slot={activeSlot} save={activeSave} onExit={exit} />
          </Suspense>
        </ClientOnly>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-dusk text-primary-foreground">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-sky-soft/25 blur-3xl" />
        <div className="absolute bottom-0 h-64 w-full bg-meadow-deep/40" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center gap-10 px-6 py-16">
        <header className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-ember">Chapter One</p>
          <h1 className="mt-3 text-5xl font-black tracking-tight sm:text-7xl">
            Riko <span className="text-meadow">&</span> the Emberleaf Meadow
          </h1>
          <p className="mt-4 max-w-xl text-balance text-base text-sky-soft/80">
            An original 2D precision platformer. Run, stomp, uncover hidden blocks and hunt three Golden
            Relics before the clock runs out.
          </p>
        </header>

        {screen === "menu" && (
          <nav className="flex flex-col items-center gap-3">
            <MenuButton primary onClick={() => setScreen("slots")}>
              Play
            </MenuButton>
            <MenuButton onClick={() => setScreen("controls")}>Controls</MenuButton>
            <p className="mt-4 max-w-md text-center text-xs text-sky-soft/60">
              Original characters, art, music and sound. No third-party game assets are used.
            </p>
          </nav>
        )}

        {screen === "slots" && (
          <section className="w-full max-w-xl space-y-3">
            <h2 className="text-center text-lg font-semibold uppercase tracking-widest text-sky-soft/70">
              Choose a save slot
            </h2>
            {Array.from({ length: SLOT_COUNT }, (_, i) => i + 1).map((slot) => {
              const save = slots[slot - 1] ?? null;
              return (
                <div
                  key={slot}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-sky-soft/15 bg-dusk-soft/70 px-5 py-4"
                >
                  <div>
                    <p className="text-sm uppercase tracking-widest text-sky-soft/60">Slot {slot}</p>
                    <p className="text-base font-semibold">{slotSummary(save)}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => play(slot)}
                      className="rounded-full bg-ember px-5 py-2 text-sm font-bold text-dusk transition hover:brightness-110"
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
                        className="rounded-full border border-sky-soft/25 px-4 py-2 text-sm text-sky-soft/80 transition hover:bg-sky-soft/10"
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
            <h2 className="text-center text-lg font-semibold uppercase tracking-widest text-sky-soft/70">
              Controls
            </h2>
            <dl className="divide-y divide-sky-soft/10 rounded-2xl border border-sky-soft/15 bg-dusk-soft/70 px-5">
              {CONTROLS.map(([label, keys]) => (
                <div key={label} className="flex items-center justify-between gap-6 py-3">
                  <dt className="text-sm text-sky-soft/70">{label}</dt>
                  <dd className="text-sm font-semibold">{keys}</dd>
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
          ? "w-64 rounded-full bg-meadow px-8 py-3 text-lg font-black uppercase tracking-wide text-dusk transition hover:brightness-110"
          : "w-64 rounded-full border border-sky-soft/25 px-8 py-3 text-base font-semibold uppercase tracking-wide text-sky-soft/90 transition hover:bg-sky-soft/10"
      }
    >
      {children}
    </button>
  );
}

function LoadingCanvas() {
  return (
    <div className="flex h-full w-full items-center justify-center text-sky-soft/70">Loading the meadow…</div>
  );
}
