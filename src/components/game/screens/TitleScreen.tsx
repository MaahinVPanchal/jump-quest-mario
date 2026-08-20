/** Title screen: one clear primary action, everything else secondary. */
import PixelSprite from "../PixelSprite";
import { PixelBadge, PixelButton, PixelPanel } from "@/components/pixel";

export default function TitleScreen({
  onPlay,
  onMap,
  onArchive,
  onControls,
  onSettings,
  playLabel,
  progressLine,
}: {
  onPlay: () => void;
  onMap: () => void;
  onArchive: () => void;
  onControls: () => void;
  onSettings: () => void;
  playLabel: string;
  progressLine: string;
}) {
  return (
    <div className="flex w-full flex-col items-center gap-8">
      <header className="text-center">
        <p className="text-[9px] uppercase tracking-[0.4em] text-nes-brick-dark">An original 8-bit adventure</p>
        <h1 className="ui-pop mx-auto mt-5 max-w-3xl border-4 border-nes-coin bg-nes-ink px-6 py-6 text-xl leading-relaxed text-nes-paper shadow-[10px_10px_0_0_var(--nes-brick-dark)] sm:text-3xl sm:leading-relaxed">
          RIKO <span className="text-nes-coin">&</span> THE
          <br />
          EMBERLEAF MEADOW
        </h1>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <PixelBadge tone="gold" icon={"\u2605"}>
            10 heroes
          </PixelBadge>
          <PixelBadge icon={"\u25A3"}>8 worlds · 32 stages</PixelBadge>
          <PixelBadge icon={"\u266B"}>Original art & audio</PixelBadge>
        </div>
      </header>

      <div className="ui-sway">
        <PixelSprite id="rikoBig" px={6} />
      </div>

      <PixelPanel as="nav" className="w-full max-w-md p-5">
        <PixelButton variant="primary" size="lg" block onClick={onPlay}>
          {playLabel}
        </PixelButton>
        <p className="mt-3 text-center text-[8px] uppercase leading-5 tracking-[0.2em] text-nes-muted">
          {progressLine}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <PixelButton block onClick={onMap}>
            World map
          </PixelButton>
          <PixelButton block onClick={onArchive}>
            Archive
          </PixelButton>
          <PixelButton block onClick={onControls}>
            Controls
          </PixelButton>
          <PixelButton block onClick={onSettings}>
            Settings
          </PixelButton>
        </div>
      </PixelPanel>
    </div>
  );
}
