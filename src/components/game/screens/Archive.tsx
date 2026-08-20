/**
 * Archive: the reference material that used to crowd the hero screen —
 * power-ups and the full enemy dossier — now on its own tabbed screen.
 */
import { useState } from "react";
import PixelSprite, { type SpriteId } from "../PixelSprite";
import { PanelTitle, PixelBadge, PixelButton, PixelPanel } from "@/components/pixel";
import { ENEMIES } from "@/game/data/enemies";

const POWER_UPS: { id: SpriteId; name: string; text: string }[] = [
  { id: "growthOrb", name: "Growth Orb", text: "Grow big — take one extra hit and smash bricks." },
  {
    id: "fireCrystal",
    name: "Fire Crystal",
    text: "Throw with X — the shot matches your hero's signature move.",
  },
  { id: "banana", name: "Banana", text: "Monkey form: higher jumps and arcing bananas along the floor." },
  { id: "catBell", name: "Cat Bell", text: "Cat form: claws, the highest leap and a bonus air jump." },
  { id: "oneUp", name: "Ember Heart", text: "Hidden 1-Up. Adds a life to your run." },
  { id: "relic", name: "Golden Relic", text: "Three per stage, tucked into secret routes." },
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
    danger: "Side contact costs one power stage. Small heroes die.",
    tip: "Chain stomps without landing to build the 100 / 200 / 400 combo ladder.",
  },
  {
    id: "shell",
    key: "shell",
    text: "Shelled patroller. Stomp once to shell it, then kick it into a crowd.",
    behaviour:
      "Patrols at 52 px/s across a 128 px beat. First stomp tucks it into a dormant shell for 5.2 s — it wobbles for the last 1.5 s, then wakes.",
    counters: [
      "Stomp 1 — becomes a shell",
      "Nudge a shell — kicks it at 400 px/s",
      "Stomp a sliding shell — stops it dead",
      "Fire ember — defeats it outright",
    ],
    danger: "A sliding shell hurts you too, after a 140 ms grace window. Shells bounce off walls and return.",
    tip: "Kick a shell down a lane of Sprout Walkers for a rapid score chain.",
  },
  {
    id: "flyer",
    key: "flyer",
    text: "Hovers in a wave pattern. Time your jump or use fire.",
    behaviour: "Drifts at 60 px/s along a 160 px sine wave, ignoring the ground, so it crosses pits.",
    counters: ["Stomp at the bottom of its dip", "Fire ember — safest option"],
    danger: "It can drift into you mid-jump, over pits where knockback means a fall.",
    tip: "Stomp at the low point; the bounce carries you over the next gap.",
  },
  {
    id: "piranha",
    key: "piranha",
    text: "Bites out of pipes on a cycle. Cannot be stomped — fire only.",
    behaviour:
      "Fixed NES cadence: 1.4 s hidden, 0.48 s rise, 2.0 s exposed, 0.48 s retract. Stays down while you stand on its rim.",
    counters: ["Fire ember — the only direct answer", "A sliding shell into the pipe"],
    danger: "No weak point on the head — stomping always hurts.",
    tip: "Stand on the rim to keep it down, or pass exactly on the retract beat.",
  },
  {
    id: "spiker",
    key: "spiker",
    text: "Spiked roller that charges when it spots you. Never stompable.",
    behaviour:
      "Rolls at 48 px/s. Within 260 px and in front, it winds up and charges at 2.6x speed for about a second.",
    counters: ["Fire ember — clean kill", "Sliding shell — bowls it over", "Jump clean over the charge"],
    danger: "Spikes cover the top, so a stomp always costs a power stage.",
    tip: "Bait the charge from a ledge, then drop behind it while it overshoots.",
  },
];

export default function Archive({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<"powerups" | "enemies">("powerups");
  return (
    <PixelPanel as="section" className="w-full">
      <PanelTitle hint="Know it before it knows you" right={<PixelButton onClick={onBack}>Back</PixelButton>}>
        Archive
      </PanelTitle>

      <div className="flex gap-2 border-b-4 border-nes-ink bg-nes-ink/5 p-3">
        {(["powerups", "enemies"] as const).map((t) => (
          <PixelButton
            key={t}
            variant={tab === t ? "primary" : "secondary"}
            aria-pressed={tab === t}
            onClick={() => setTab(t)}
          >
            {t === "powerups" ? "Power-ups" : "Enemies"}
          </PixelButton>
        ))}
      </div>

      {tab === "powerups" ? (
        <ul className="grid gap-4 p-5 sm:grid-cols-2">
          {POWER_UPS.map((p) => (
            <li key={p.id} className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 border-4 border-nes-ink p-3">
              <span className="shrink-0">
                <PixelSprite id={p.id} px={3} />
              </span>
              <div className="min-w-0">
                <p className="text-[9px] uppercase tracking-[0.2em] text-nes-brick-dark">{p.name}</p>
                <p className="mt-1 text-[9px] leading-5">{p.text}</p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="grid gap-4 p-5 sm:grid-cols-2">
          {ENEMY_CARDS.map((e) => {
            const data = ENEMIES[e.key];
            return (
              <li key={e.id} className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 border-4 border-nes-ink p-3">
                <span className="shrink-0">
                  <PixelSprite id={e.id} px={3} />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[9px] uppercase tracking-[0.2em] text-nes-brick-dark">{data.name}</p>
                    <PixelBadge tone="gold">{data.score} pts</PixelBadge>
                  </div>
                  <p className="mt-2 text-[9px] leading-5">{e.text}</p>
                  <p className="mt-2 text-[8px] leading-5 opacity-80">{e.behaviour}</p>
                  <p className="mt-2 text-[8px] uppercase tracking-[0.2em] text-nes-brick-dark">How to beat it</p>
                  <ul className="mt-1 space-y-1">
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
      )}
    </PixelPanel>
  );
}
