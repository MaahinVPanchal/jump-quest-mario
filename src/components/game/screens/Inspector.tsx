/**
 * Stage inspector: per-stage brick/block aggregation plus the exact per-hero
 * reachability verdict for gaps, coins, checkpoints and the secret zone.
 */
import { useMemo, useState } from "react";
import { PanelTitle, PixelBadge, PixelButton, PixelPanel, cx } from "@/components/pixel";
import { LEVELS, getWorld } from "@/game/levels";
import { blockLabel, inspectStage, type HeroReach, type ReachTally } from "@/game/systems/inspect";

function CountGrid({ title, data }: { title: string; data: Record<string, number> }) {
  const rows = Object.entries(data).sort((a, b) => b[1] - a[1]);
  return (
    <div>
      <p className="text-[8px] uppercase tracking-[0.25em] text-nes-muted">{title}</p>
      {rows.length === 0 ? (
        <p className="mt-2 text-[8px] uppercase tracking-[0.2em] text-nes-muted">none</p>
      ) : (
        <ul className="mt-2 space-y-1">
          {rows.map(([k, v]) => (
            <li key={k} className="flex items-baseline justify-between gap-2 text-[9px] uppercase">
              <span className="truncate tracking-[0.15em]">{blockLabel(k)}</span>
              <span className="tracking-[0.2em] text-nes-brick-dark">{String(v).padStart(3, "0")}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function TallyCell({ label, t }: { label: string; t: ReachTally }) {
  const ok = t.unreachable === 0;
  return (
    <div
      className={cx(
        "border-4 border-nes-ink px-2 py-2 text-center",
        t.total === 0 ? "bg-nes-paper/60" : ok ? "bg-nes-success" : "bg-nes-danger text-nes-paper",
      )}
      title={t.misses.map((m) => `${m.x},${m.y}${m.detail ? ` — ${m.detail}` : ""}`).join("\n")}
    >
      <p className="text-[7px] uppercase tracking-[0.2em]">{label}</p>
      <p className="mt-1 text-[10px] tracking-[0.15em]">
        {t.reachable}/{t.total}
      </p>
    </div>
  );
}

function HeroRow({ h }: { h: HeroReach }) {
  const [open, setOpen] = useState(false);
  const misses = [
    ...h.gaps.misses.map((m) => ({ ...m, kind: "gap" })),
    ...h.coins.misses.map((m) => ({ ...m, kind: "coin" })),
    ...h.stars.misses.map((m) => ({ ...m, kind: "star" })),
    ...h.relics.misses.map((m) => ({ ...m, kind: "relic" })),
    ...h.checkpoints.misses.map((m) => ({ ...m, kind: "checkpoint" })),
    ...h.blocks.misses.map((m) => ({ ...m, kind: "block" })),
  ];
  return (
    <li className="border-4 border-nes-ink bg-nes-paper p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em]">{h.heroName}</p>
          <p className="mt-1 text-[8px] uppercase tracking-[0.18em] text-nes-muted">
            jump {h.jumpTiles.width}t across · {h.jumpTiles.height}t up · widest gap {h.widestGap}t
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PixelBadge tone={h.routeClear && h.goalReachable ? "good" : "bad"}>
            {h.routeClear && h.goalReachable ? "Clears stage" : "Blocked"}
          </PixelBadge>
          <PixelButton className="!px-3 !py-2" onClick={() => setOpen((v) => !v)}>
            {open ? "Hide" : "Detail"}
          </PixelButton>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
        <TallyCell label="Gaps" t={h.gaps} />
        <TallyCell label="Coins" t={h.coins} />
        <TallyCell label="Stars" t={h.stars} />
        <TallyCell label="Relics" t={h.relics} />
        <TallyCell label="Checks" t={h.checkpoints} />
        <TallyCell label="Blocks" t={h.blocks} />
      </div>

      {open ? (
        <div className="mt-3 border-4 border-nes-ink bg-nes-night p-3 text-nes-paper">
          <p className="text-[8px] uppercase tracking-[0.2em]">
            Route: {h.routeNote} · Secret:{" "}
            {h.secret.present ? (h.secret.reachable ? "reachable" : "UNREACHABLE") : "none"}
          </p>
          {misses.length === 0 ? (
            <p className="mt-2 text-[8px] uppercase tracking-[0.2em] text-nes-success">
              Everything reachable for this hero.
            </p>
          ) : (
            <ul className="mt-2 grid gap-1 sm:grid-cols-2">
              {misses.map((m, i) => (
                <li key={`${m.kind}-${i}`} className="text-[8px] uppercase tracking-[0.18em] text-nes-coin">
                  {m.kind} @ {m.x},{m.y}
                  {m.label ? ` · ${m.label}` : ""}
                  {m.detail ? ` · ${m.detail}` : ""}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </li>
  );
}

export default function Inspector({ onBack }: { onBack: () => void }) {
  const [levelId, setLevelId] = useState(LEVELS[0]!.id);
  const level = LEVELS.find((l) => l.id === levelId) ?? LEVELS[0]!;
  const report = useMemo(() => inspectStage(level), [level]);
  const c = report.composition;

  return (
    <PixelPanel className="ui-pop w-full max-w-5xl">
      <PanelTitle
        hint={`${report.world}-${report.level} ${report.name} · ${getWorld(report.world).name}`}
        right={<PixelButton onClick={onBack}>Back</PixelButton>}
      >
        Stage inspector
      </PanelTitle>

      <div className="max-h-[70vh] overflow-y-auto p-4">
        <div className="flex flex-wrap gap-1">
          {LEVELS.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => setLevelId(l.id)}
              className={cx(
                "ui-focus border-2 border-nes-ink px-2 py-1 text-[8px] uppercase tracking-[0.15em]",
                l.id === levelId ? "bg-nes-coin" : "bg-nes-paper hover:bg-nes-coin/40",
              )}
            >
              {l.world}-{l.level}
            </button>
          ))}
        </div>

        <p className="mt-4 text-[9px] uppercase leading-5 tracking-[0.18em] text-nes-muted">
          {report.objective}
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="border-4 border-nes-ink bg-nes-night p-3 text-nes-paper">
            <p className="text-[8px] uppercase tracking-[0.25em] text-nes-coin">Aggregation</p>
            <ul className="mt-2 space-y-1 text-[9px] uppercase tracking-[0.15em]">
              <li>Blocks total · {c.blockTotal}</li>
              <li>Per 100 tiles · {c.blocksPerHundred}</li>
              <li>Solid tiles · {c.tiles.solid}</li>
              <li>Fill density · {c.density}%</li>
              <li>
                Grid · {c.widthTiles}×{c.heightTiles}
              </li>
            </ul>
          </div>
          <div className="border-4 border-nes-ink bg-nes-paper p-3">
            <CountGrid title="Blocks by kind" data={c.blocks} />
          </div>
          <div className="border-4 border-nes-ink bg-nes-paper p-3">
            <CountGrid title="Items" data={c.items} />
          </div>
          <div className="border-4 border-nes-ink bg-nes-paper p-3">
            <CountGrid title="Enemies" data={c.enemies} />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <PixelBadge>Terrain top {c.tiles.top}</PixelBadge>
          <PixelBadge>Dirt {c.tiles.dirt}</PixelBadge>
          <PixelBadge>Stone {c.tiles.stone}</PixelBadge>
          <PixelBadge>Platforms {c.platforms}</PixelBadge>
          <PixelBadge>Pipes {c.pipes}</PixelBadge>
          <PixelBadge>Hazards {c.hazards}</PixelBadge>
          <PixelBadge>Checkpoints {c.checkpoints}</PixelBadge>
          <PixelBadge tone={c.hasSecret ? "gold" : "neutral"}>
            {c.hasSecret ? "Secret zone" : "No secret"}
          </PixelBadge>
          {c.hasBoss ? <PixelBadge tone="bad">Boss</PixelBadge> : null}
        </div>

        <p className="mt-5 text-[9px] uppercase tracking-[0.2em]">
          Per-hero reachability ·{" "}
          {report.blockedHeroes.length === 0 ? (
            <span className="text-nes-brick-dark">all 10 heroes clear this stage</span>
          ) : (
            <span className="text-nes-danger">blocked: {report.blockedHeroes.join(", ")}</span>
          )}
        </p>

        <ul className="mt-3 space-y-3">
          {report.heroes.map((h) => (
            <HeroRow key={h.heroId} h={h} />
          ))}
        </ul>
      </div>
    </PixelPanel>
  );
}
