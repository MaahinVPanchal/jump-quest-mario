import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { emptySave, loadSlot, saveSlot } from "@/game/save-facade";
import type { SaveData } from "@/game/types";
import { CHARACTERS, ROSTER } from "@/game/data/characters";
import { LEVELS, getWorld } from "@/game/levels";
import {
  applySettings,
  DEFAULT_SETTINGS,
  loadSettings,
  saveSettings,
  type UiSettings,
} from "@/game/systems/uiSettings";
import Backdrop from "./Backdrop";
import TouchControls from "./TouchControls";
import TitleScreen from "./screens/TitleScreen";
import HeroSelect from "./screens/HeroSelect";
import WorldMap from "./screens/WorldMap";
import Archive from "./screens/Archive";
import ControlsScreen from "./screens/ControlsScreen";
import SettingsScreen from "./screens/SettingsScreen";
import Inspector from "./screens/Inspector";
import { PixelButton, PixelPanel } from "@/components/pixel";

const PhaserMount = lazy(() => import("./PhaserMount"));

type Screen = "menu" | "roster" | "map" | "archive" | "inspector" | "controls" | "settings" | "loading" | "playing";

const SAVE_SLOT = 1;
const HERO_KEY = "emberleaf.hero.v1";

/** Full-bleed stage card shown between the menu and the running level. */
function StageCard({ levelId, heroName }: { levelId: string; heroName: string }) {
  const level = LEVELS.find((l) => l.id === levelId) ?? LEVELS[0]!;
  const world = getWorld(level.world);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-nes-ink px-6 font-pixel">
      <PixelPanel tone="night" className="ui-pop w-full max-w-xl p-8 text-center">
        <p className="text-[9px] uppercase tracking-[0.35em] text-nes-coin">
          World {level.world} — {world.name}
        </p>
        <h2 className="mt-4 text-lg uppercase leading-relaxed tracking-[0.15em]">
          {level.world}-{level.level} · {level.name}
        </h2>
        <p className="mt-4 text-[9px] leading-6 text-nes-paper/80">
          {level.objectives?.primary.description ?? level.objective ?? "Reach the goal flag."}
        </p>
        <p className="mt-6 text-[8px] uppercase tracking-[0.25em] text-nes-coin">
          {heroName} ready · loading…
        </p>
      </PixelPanel>
    </div>
  );
}

function LoadingCanvas() {
  return (
    <div className="flex h-full w-full items-center justify-center font-pixel text-xs text-nes-paper">
      LOADING…
    </div>
  );
}

export default function GameShell() {
  const [screen, setScreen] = useState<Screen>("menu");
  const [save, setSave] = useState<SaveData | null>(null);
  const [activeSave, setActiveSave] = useState<SaveData | null>(null);
  const [characterId, setCharacterId] = useState("riko");
  const [pickedLevelId, setPickedLevelId] = useState<string | null>(null);
  const [settings, setSettings] = useState<UiSettings>(DEFAULT_SETTINGS);
  const [touchVisible, setTouchVisible] = useState(false);

  // Restore persisted progress, hero pick and preferences on mount.
  useEffect(() => {
    setSave(loadSlot(SAVE_SLOT));
    const s = loadSettings();
    setSettings(s);
    applySettings(s);
    const hero = window.localStorage.getItem(HERO_KEY);
    if (hero && CHARACTERS[hero]) setCharacterId(hero);
  }, []);

  // Refresh progress whenever we come back to a menu screen.
  useEffect(() => {
    if (screen !== "playing" && screen !== "loading") setSave(loadSlot(SAVE_SLOT));
  }, [screen]);

  const patchSettings = useCallback((patch: Partial<UiSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveSettings(next);
      applySettings(next);
      return next;
    });
  }, []);

  const completedLevels = useMemo(() => save?.completedLevels ?? [], [save]);
  const autoLevel = LEVELS.find((l) => !completedLevels.includes(l.id)) ?? LEVELS[0]!;
  const nextLevel = (pickedLevelId && LEVELS.find((l) => l.id === pickedLevelId)) || autoLevel;
  const hero = CHARACTERS[characterId] ?? ROSTER[0]!;
  const progressLine = `${completedLevels.length}/${LEVELS.length} stages cleared · next up ${nextLevel.world}-${nextLevel.level} ${nextLevel.name}`;

  const pickHero = useCallback((id: string) => {
    setCharacterId(id);
    try {
      window.localStorage.setItem(HERO_KEY, id);
    } catch {
      /* storage unavailable — the pick simply won't persist */
    }
  }, []);

  // Stage card first, then hand off to Phaser so the swap never flashes.
  const play = useCallback(() => {
    const existing = loadSlot(SAVE_SLOT) ?? emptySave("Riko");
    saveSlot(SAVE_SLOT, existing);
    setActiveSave(existing);
    setScreen("loading");
    const coarse = window.matchMedia?.("(pointer: coarse)").matches ?? false;
    setTouchVisible(settings.touchControls === "on" || (settings.touchControls === "auto" && coarse));
    window.setTimeout(() => setScreen("playing"), 1100);
  }, [settings.touchControls]);

  const exit = useCallback(() => {
    setActiveSave(null);
    setPickedLevelId(null);
    setScreen("menu");
  }, []);

  if (screen === "loading" && activeSave) {
    return <StageCard levelId={nextLevel.id} heroName={hero.name} />;
  }

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
        {touchVisible ? <TouchControls onHide={() => setTouchVisible(false)} /> : null}
        <PixelButton
          className="absolute right-3 top-3 z-20"
          onClick={exit}
          aria-label="Quit to menu"
        >
          Quit
        </PixelButton>
      </div>
    );
  }

  return (
    <main className="relative min-h-dvh overflow-hidden font-pixel text-nes-ink">
      <Backdrop />
      <div className="relative mx-auto flex min-h-dvh max-w-5xl flex-col items-center justify-center gap-8 px-4 py-16 sm:px-6">
        {screen === "menu" && (
          <TitleScreen
            playLabel={`Play · ${hero.name}`}
            progressLine={progressLine}
            onPlay={() => setScreen("roster")}
            onMap={() => setScreen("map")}
            onArchive={() => setScreen("archive")}
            onInspector={() => setScreen("inspector")}
            onControls={() => setScreen("controls")}
            onSettings={() => setScreen("settings")}
          />
        )}

        {screen === "roster" && (
          <HeroSelect
            heroId={hero.id}
            onSelect={pickHero}
            onStart={play}
            onMap={() => setScreen("map")}
            onBack={() => setScreen("menu")}
            startLabel={`Start ${hero.name} · ${nextLevel.world}-${nextLevel.level}`}
            progressLine={progressLine}
          />
        )}

        {screen === "map" && (
          <WorldMap
            save={save}
            onBack={() => setScreen("menu")}
            onPlay={(id) => {
              setPickedLevelId(id);
              setScreen("roster");
            }}
          />
        )}

        {screen === "archive" && <Archive onBack={() => setScreen("menu")} />}
        {screen === "inspector" && <Inspector onBack={() => setScreen("menu")} />}
        {screen === "controls" && <ControlsScreen onBack={() => setScreen("menu")} />}
        {screen === "settings" && (
          <SettingsScreen settings={settings} onChange={patchSettings} onBack={() => setScreen("menu")} />
        )}
      </div>
    </main>
  );
}
