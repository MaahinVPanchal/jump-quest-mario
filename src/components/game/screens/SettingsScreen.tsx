/** Persistent settings: audio, display and accessibility, in one retro panel. */
import { PanelTitle, PixelButton, PixelPanel } from "@/components/pixel";
import type { UiSettings } from "@/game/systems/uiSettings";

function Slider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="grid grid-cols-[6rem_minmax(0,1fr)_2.5rem] items-center gap-3 py-2">
      <span className="text-[9px] uppercase tracking-[0.2em]">{label}</span>
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="ui-focus h-3 w-full appearance-none border-2 border-nes-ink bg-nes-ink/10 accent-[var(--nes-coin)]"
      />
      <span className="text-right text-[9px] tabular-nums">{Math.round(value * 100)}%</span>
    </label>
  );
}

function Toggle({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  hint?: string;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-2">
      <div className="min-w-0">
        <p className="text-[9px] uppercase tracking-[0.2em]">{label}</p>
        {hint ? <p className="mt-1 text-[8px] leading-4 text-nes-muted">{hint}</p> : null}
      </div>
      <PixelButton
        variant={value ? "primary" : "secondary"}
        aria-pressed={value}
        onClick={() => onChange(!value)}
      >
        {value ? "On \u2713" : "Off \u2716"}
      </PixelButton>
    </div>
  );
}

export default function SettingsScreen({
  settings,
  onChange,
  onBack,
}: {
  settings: UiSettings;
  onChange: (patch: Partial<UiSettings>) => void;
  onBack: () => void;
}) {
  return (
    <PixelPanel as="section" className="w-full max-w-3xl">
      <PanelTitle hint="Saved automatically" right={<PixelButton onClick={onBack}>Back</PixelButton>}>
        Settings
      </PanelTitle>
      <div className="grid gap-6 p-5 sm:grid-cols-2">
        <div>
          <h3 className="text-[9px] uppercase tracking-[0.25em] text-nes-brick-dark">Audio</h3>
          <Slider label="Music" value={settings.music} onChange={(music) => onChange({ music })} />
          <Slider label="SFX" value={settings.sfx} onChange={(sfx) => onChange({ sfx })} />
        </div>
        <div>
          <h3 className="text-[9px] uppercase tracking-[0.25em] text-nes-brick-dark">Display</h3>
          <Toggle
            label="Screen shake"
            value={settings.screenShake}
            onChange={(screenShake) => onChange({ screenShake })}
          />
          <Toggle
            label="Particles"
            value={settings.particles}
            onChange={(particles) => onChange({ particles })}
          />
          <Toggle
            label="Pixel perfect"
            hint="Locks rendering to whole-number zoom."
            value={settings.pixelPerfect}
            onChange={(pixelPerfect) => onChange({ pixelPerfect })}
          />
        </div>
        <div className="sm:col-span-2">
          <h3 className="text-[9px] uppercase tracking-[0.25em] text-nes-brick-dark">Accessibility</h3>
          <Toggle
            label="Reduced motion"
            hint="Stops background drift and menu animation."
            value={settings.reducedMotion}
            onChange={(reducedMotion) => onChange({ reducedMotion })}
          />
          <Toggle
            label="High contrast"
            hint="Stronger separation between text and panels."
            value={settings.highContrast}
            onChange={(highContrast) => onChange({ highContrast })}
          />
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-2">
            <p className="text-[9px] uppercase tracking-[0.2em]">Touch controls</p>
            <div className="flex gap-2">
              {(["auto", "on", "off"] as const).map((mode) => (
                <PixelButton
                  key={mode}
                  variant={settings.touchControls === mode ? "primary" : "secondary"}
                  aria-pressed={settings.touchControls === mode}
                  onClick={() => onChange({ touchControls: mode })}
                >
                  {mode}
                </PixelButton>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PixelPanel>
  );
}
