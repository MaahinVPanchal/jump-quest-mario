/**
 * Rendering/display controller. Owns the pixel-perfect (integer zoom) toggle
 * and publishes the zoom factor currently applied to the canvas so UI can
 * report it back to the player.
 */
type Listener = (state: DisplayState) => void;

export interface DisplayState {
  /** Lock the canvas to whole-number zoom steps (stable pixels on any DPR). */
  pixelPerfect: boolean;
  /** Zoom factor currently applied to the canvas. */
  zoom: number;
}

class DisplayController {
  private state: DisplayState = { pixelPerfect: true, zoom: 1 };
  private listeners = new Set<Listener>();

  get pixelPerfect(): boolean {
    return this.state.pixelPerfect;
  }

  get zoom(): number {
    return this.state.zoom;
  }

  /** Human readable zoom, e.g. "3x" or "2.5x". */
  get zoomLabel(): string {
    const z = this.state.zoom;
    return `${Number.isInteger(z) ? z : z.toFixed(2)}x`;
  }

  setPixelPerfect(value: boolean): void {
    if (this.state.pixelPerfect === value) return;
    this.state = { ...this.state, pixelPerfect: value };
    this.emit();
  }

  togglePixelPerfect(): boolean {
    this.setPixelPerfect(!this.state.pixelPerfect);
    return this.state.pixelPerfect;
  }

  setZoom(zoom: number): void {
    if (this.state.zoom === zoom) return;
    this.state = { ...this.state, zoom };
    this.emit();
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(): void {
    for (const l of this.listeners) l(this.state);
  }
}

export const display = new DisplayController();

/**
 * Resolves the zoom to apply for a viewport.
 * Pixel-perfect mode floors to a whole device-pixel step (>= 1 CSS-pixel step),
 * free mode uses the raw fit ratio.
 */
export function resolveZoom(fit: number, dpr: number, pixelPerfect: boolean): number {
  if (!Number.isFinite(fit) || fit <= 0) return 1;
  const ratio = Number.isFinite(dpr) && dpr > 0 ? dpr : 1;
  if (!pixelPerfect) return fit;
  const devicePx = Math.floor(fit * ratio);
  return devicePx >= ratio ? devicePx / ratio : Math.max(fit, 1 / ratio);
}
