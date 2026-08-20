/**
 * Optional on-screen controls for touch devices. They synthesise the same
 * keyboard events Phaser already listens for, so gameplay code stays untouched.
 */
import { useCallback, useState } from "react";

type Pad = { code: string; key: string; label: string; hint: string };

const LEFT: Pad = { code: "ArrowLeft", key: "ArrowLeft", label: "\u25C0", hint: "Move left" };
const RIGHT: Pad = { code: "ArrowRight", key: "ArrowRight", label: "\u25B6", hint: "Move right" };
const JUMP: Pad = { code: "Space", key: " ", label: "JUMP", hint: "Jump" };
const SPECIAL: Pad = { code: "KeyX", key: "x", label: "X", hint: "Special" };

function send(type: "keydown" | "keyup", pad: Pad) {
  const event = new KeyboardEvent(type, { code: pad.code, key: pad.key, bubbles: true });
  window.dispatchEvent(event);
  document.dispatchEvent(event);
}

function PadButton({ pad, wide }: { pad: Pad; wide?: boolean }) {
  const press = useCallback(() => send("keydown", pad), [pad]);
  const release = useCallback(() => send("keyup", pad), [pad]);
  return (
    <button
      type="button"
      aria-label={pad.hint}
      onPointerDown={(e) => {
        e.preventDefault();
        press();
      }}
      onPointerUp={release}
      onPointerLeave={release}
      onPointerCancel={release}
      className={`ui-focus select-none border-4 border-nes-paper/70 bg-nes-ink/45 text-nes-paper backdrop-blur-[1px] active:bg-nes-coin/70 active:text-nes-ink ${
        wide ? "h-20 w-24" : "h-20 w-20"
      } text-[10px] uppercase tracking-widest`}
    >
      {pad.label}
    </button>
  );
}

export default function TouchControls({ onHide }: { onHide: () => void }) {
  const [hidden, setHidden] = useState(false);
  if (hidden) return null;
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-end justify-between p-4 pb-6">
      <div className="pointer-events-auto flex gap-3">
        <PadButton pad={LEFT} />
        <PadButton pad={RIGHT} />
      </div>
      <div className="pointer-events-auto flex items-end gap-3">
        <PadButton pad={SPECIAL} />
        <PadButton pad={JUMP} wide />
        <button
          type="button"
          onClick={() => {
            setHidden(true);
            onHide();
          }}
          className="ui-focus min-h-11 border-4 border-nes-paper/70 bg-nes-ink/45 px-3 text-[8px] uppercase tracking-widest text-nes-paper"
        >
          Hide
        </button>
      </div>
    </div>
  );
}
