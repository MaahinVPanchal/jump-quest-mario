/**
 * World map: a vertical route of stage nodes per world, with a detail panel for
 * the highlighted stage. Locked / cleared / current states are readable from
 * icon and text, never from colour alone.
 */
import { useMemo, useState } from "react";
import { PanelTitle, PixelBadge, PixelButton, PixelPanel, StatRow } from "@/components/pixel";
import { LEVELS, WORLDS, isLevelUnlocked, levelsOfWorld } from "@/game/levels";
import type { SaveData } from "@/game/types";

const ICONS = ["\u2618", "\u2593", "\u25B2", "\u265C"];

function formatTime(seconds?: number) {
  if (!seconds || !Number.isFinite(seconds)) return "--:--";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function WorldMap({
  save,
  onPlay,
  onBack,
}: {
  save: SaveData | null;
  onPlay: (levelId: string) => void;
  onBack: () => void;
}) {
  const completed = useMemo(() => save?.completedLevels ?? [], [save]);
  const firstOpen = LEVELS.find((l) => !completed.includes(l.id)) ?? LEVELS[0]!;
  const [world, setWorld] = useState(firstOpen.world);
  const [selectedId, setSelectedId] = useState(firstOpen.id);

  const stages = levelsOfWorld(world);
  const def = WORLDS.find((w) => w.world === world)!;
  const selected = LEVELS.find((l) => l.id === selectedId) ?? stages[0]!;
  const unlocked = isLevelUnlocked(selected.id, completed);
  const cleared = completed.includes(selected.id);

  return (
    <PixelPanel as="section" className="w-full">
      <PanelTitle
        hint={`${completed.length} / ${LEVELS.length} stages cleared`}
        right={<PixelButton onClick={onBack}>Back</PixelButton>}
      >
        World map
      </PanelTitle>

      {/* world switcher */}
      <div className="flex gap-2 overflow-x-auto border-b-4 border-nes-ink bg-nes-ink/5 p-3">
        {WORLDS.map((w) => {
          const open = isLevelUnlocked(levelsOfWorld(w.world)[0]!.id, completed);
          return (
            <button
              key={w.world}
              type="button"
              disabled={!open}
              onClick={() => {
                setWorld(w.world);
                setSelectedId(levelsOfWorld(w.world)[0]!.id);
              }}
              aria-pressed={w.world === world}
              className={`ui-focus min-h-11 shrink-0 border-4 border-nes-ink px-3 text-[8px] uppercase tracking-[0.2em] ${
                w.world === world ? "bg-nes-coin" : open ? "bg-nes-paper" : "bg-nes-ink/20 opacity-60"
              }`}
            >
              {open ? `W${w.world}` : `\u2716 W${w.world}`}
            </button>
          );
        })}
      </div>

      <div className="grid gap-6 p-5 md:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
        {/* the route */}
        <div>
          <p className="text-[11px] uppercase tracking-[0.25em]">
            World {def.world} · {def.name}
          </p>
          <p className="mt-2 text-[9px] leading-5 text-nes-muted">{def.pitch}</p>
          <ol className="mt-4 space-y-0">
            {stages.map((l, i) => {
              const open = isLevelUnlocked(l.id, completed);
              const done = completed.includes(l.id);
              const current = !done && open;
              return (
                <li key={l.id}>
                  <button
                    type="button"
                    disabled={!open}
                    onClick={() => setSelectedId(l.id)}
                    aria-pressed={l.id === selectedId}
                    className={`ui-focus grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-4 border-nes-ink p-3 text-left transition ${
                      l.id === selectedId ? "bg-nes-coin" : open ? "bg-nes-paper" : "bg-nes-ink/15 opacity-70"
                    } ${current && l.id !== selectedId ? "ui-node-pulse" : ""}`}
                  >
                    <span aria-hidden className="text-sm">
                      {open ? (ICONS[i] ?? "\u25A0") : "\u26BF"}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[10px] uppercase tracking-[0.2em]">
                        {l.world}-{l.level} {l.boss ? "· BOSS" : ""}
                      </span>
                      <span className="mt-1 block truncate text-[8px] uppercase tracking-widest text-nes-muted">
                        {open ? l.name : "Locked"}
                      </span>
                    </span>
                    <span className="text-[8px] uppercase tracking-widest">
                      {done ? "\u2713 Clear" : open ? "Open" : "\u2716"}
                    </span>
                  </button>
                  {i < stages.length - 1 ? (
                    <div aria-hidden className="mx-auto h-6 w-1 bg-nes-ink/40" />
                  ) : null}
                </li>
              );
            })}
          </ol>
        </div>

        {/* stage details */}
        <PixelPanel tone="paper" className="h-fit p-4">
          <p className="text-[11px] uppercase tracking-[0.25em]">
            {selected.world}-{selected.level}
          </p>
          <p className="mt-1 text-[9px] uppercase tracking-widest text-nes-muted">
            {unlocked ? selected.name : "Locked stage"}
          </p>
          <div className="mt-3 space-y-0">
            <StatRow label="Best score" value={String(save?.bestScores?.[selected.id] ?? 0).padStart(6, "0")} />
            <StatRow label="Best time" value={formatTime(save?.bestTimes?.[selected.id])} />
            <StatRow
              label="Stars"
              value={`${save?.levelStars?.[selected.id] ?? 0} / ${selected.starsRequired ?? 0}`}
            />
            <StatRow
              label="Status"
              value={cleared ? "\u2713 Cleared" : unlocked ? "Not cleared" : "\u2716 Locked"}
              tone={cleared ? "good" : "normal"}
            />
          </div>
          <p className="mt-3 text-[8px] uppercase tracking-[0.2em] text-nes-muted">Objective</p>
          <p className="mt-1 text-[9px] leading-5">
            {selected.objectives?.primary.description ?? selected.objective ?? "Reach the goal flag"}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <PixelBadge icon={"\u25A3"}>{selected.buildSet ?? def.buildSet}</PixelBadge>
            {selected.boss ? <PixelBadge tone="bad">Boss</PixelBadge> : null}
          </div>
          <PixelButton
            variant="primary"
            block
            className="mt-4"
            disabled={!unlocked}
            onClick={() => onPlay(selected.id)}
          >
            {unlocked ? `Play ${selected.world}-${selected.level}` : "Locked"}
          </PixelButton>
        </PixelPanel>
      </div>
    </PixelPanel>
  );
}
