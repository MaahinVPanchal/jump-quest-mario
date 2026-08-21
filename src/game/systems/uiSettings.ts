import { audio } from "./audio";

/**
 * Player-facing settings that outlive a single run. Stored on their own key so
 * they survive save-slot resets, and applied to <html> so the CSS accessibility
 * modes (high contrast, reduced motion) take effect everywhere at once.
 */
export interface UiSettings {
  music: number;
  sfx: number;
  screenShake: boolean;
  pixelPerfect: boolean;
  particles: boolean;
  reducedMotion: boolean;
  highContrast: boolean;
  touchControls: "auto" | "on" | "off";
}

const KEY = "emberleaf.settings.v1";

export const DEFAULT_SETTINGS: UiSettings = {
  music: 0.5,
  sfx: 0.8,
  screenShake: true,
  pixelPerfect: true,
  particles: true,
  reducedMotion: false,
  highContrast: false,
  touchControls: "auto",
};

export function loadSettings(): UiSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<UiSettings>) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(next: UiSettings): void {
  audio.unlock();
  audio.settings.music = next.music;
  audio.settings.sfx = next.sfx;
  audio.applyVolumes();
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage blocked - settings stay for this session only */
  }
  applySettings(next);
}

/** Mirrors accessibility settings onto the document root. */
export function applySettings(s: UiSettings): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("hc", s.highContrast);
  root.classList.toggle("reduced-motion", s.reducedMotion);
}
