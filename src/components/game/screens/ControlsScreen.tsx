/** Visual control guide built from real keycaps rather than a text table. */
import { KeyCap, PanelTitle, PixelButton, PixelPanel } from "@/components/pixel";

const ROWS: { action: string; keys: string[]; note?: string }[] = [
  { action: "Move", keys: ["A", "D"], note: "or \u2190 \u2192" },
  { action: "Jump", keys: ["Space", "W"], note: "hold for height" },
  { action: "Run", keys: ["Shift"], note: "momentum builds" },
  { action: "Special", keys: ["X"], note: "your hero's signature move" },
  { action: "Duck / tunnel", keys: ["S"], note: "or \u2193 on a pipe" },
  { action: "Restart at checkpoint", keys: ["R"] },
  { action: "Pause", keys: ["Esc"] },
];

export default function ControlsScreen({ onBack }: { onBack: () => void }) {
  return (
    <PixelPanel as="section" className="w-full max-w-3xl">
      <PanelTitle hint="Keyboard · gamepad-friendly" right={<PixelButton onClick={onBack}>Back</PixelButton>}>
        Controls
      </PanelTitle>
      <ul className="divide-y-4 divide-nes-ink/10 p-5">
        {ROWS.map((r) => (
          <li key={r.action} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-[10px] uppercase tracking-[0.2em]">{r.action}</p>
              {r.note ? (
                <p className="mt-1 truncate text-[8px] uppercase tracking-widest text-nes-muted">{r.note}</p>
              ) : null}
            </div>
            <div className="flex shrink-0 gap-2">
              {r.keys.map((k) => (
                <KeyCap key={k}>{k}</KeyCap>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </PixelPanel>
  );
}
