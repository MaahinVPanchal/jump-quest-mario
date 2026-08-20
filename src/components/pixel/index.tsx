/**
 * The pixel UI kit. Every game screen composes these primitives, so spacing,
 * borders, shadows and typography stay identical from the title screen to the
 * results panel. Nothing here knows about game state.
 */
import type { ButtonHTMLAttributes, ReactNode } from "react";

export const cx = (...parts: (string | false | null | undefined)[]) =>
  parts.filter(Boolean).join(" ");

/* ------------------------------------------------------------------ panel */

export function PixelPanel({
  children,
  tone = "paper",
  className,
  as: Tag = "div",
}: {
  children: ReactNode;
  tone?: "paper" | "night" | "coin";
  className?: string;
  as?: "div" | "section" | "aside" | "nav";
}) {
  const tones = {
    paper: "bg-nes-paper text-nes-ink shadow-[6px_6px_0_0_var(--nes-ink)]",
    night: "bg-nes-night text-nes-paper shadow-[6px_6px_0_0_var(--nes-brick-dark)]",
    coin: "bg-nes-coin text-nes-ink shadow-[6px_6px_0_0_var(--nes-ink)]",
  } as const;
  return <Tag className={cx("border-4 border-nes-ink", tones[tone], className)}>{children}</Tag>;
}

/** Panel header bar: same rhythm on every screen. */
export function PanelTitle({
  children,
  hint,
  right,
}: {
  children: ReactNode;
  hint?: string;
  right?: ReactNode;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b-4 border-nes-ink bg-nes-ink px-4 py-3">
      <div className="min-w-0">
        <h2 className="truncate text-[11px] uppercase leading-5 tracking-[0.25em] text-nes-coin">
          {children}
        </h2>
        {hint ? (
          <p className="mt-1 truncate text-[8px] uppercase tracking-[0.2em] text-nes-paper/70">
            {hint}
          </p>
        ) : null}
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}

/* ----------------------------------------------------------------- button */

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "md" | "lg";
  block?: boolean;
};

/** Chunky retro button: lifts on hover, sinks on press, hard focus ring. */
export function PixelButton({
  variant = "secondary",
  size = "md",
  block,
  className,
  ...rest
}: ButtonProps) {
  const tones = {
    primary: "bg-nes-coin text-nes-ink",
    secondary: "bg-nes-paper text-nes-ink",
    ghost: "bg-nes-night text-nes-paper",
    danger: "bg-nes-danger text-nes-paper",
  } as const;
  const sizes = {
    md: "px-5 py-3 text-[10px]",
    lg: "px-8 py-4 text-xs sm:text-sm",
  } as const;
  return (
    <button
      type="button"
      {...rest}
      className={cx(
        "ui-focus border-4 border-nes-ink uppercase tracking-[0.18em] transition-transform",
        "shadow-[5px_5px_0_0_var(--nes-ink)] hover:-translate-y-[2px] hover:shadow-[5px_7px_0_0_var(--nes-ink)]",
        "active:translate-x-[3px] active:translate-y-[3px] active:shadow-none",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-[5px_5px_0_0_var(--nes-ink)]",
        "min-h-11",
        tones[variant],
        sizes[size],
        block && "w-full",
        className,
      )}
    />
  );
}

/* ------------------------------------------------------------------ badge */

export function PixelBadge({
  children,
  tone = "neutral",
  icon,
}: {
  children: ReactNode;
  tone?: "neutral" | "good" | "warn" | "bad" | "gold";
  icon?: string;
}) {
  const tones = {
    neutral: "bg-nes-paper text-nes-ink",
    good: "bg-nes-success text-nes-ink",
    warn: "bg-nes-warning text-nes-ink",
    bad: "bg-nes-danger text-nes-paper",
    gold: "bg-nes-coin text-nes-ink",
  } as const;
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 border-2 border-nes-ink px-2 py-1 text-[8px] uppercase tracking-[0.18em]",
        tones[tone],
      )}
    >
      {icon ? <span aria-hidden>{icon}</span> : null}
      {children}
    </span>
  );
}

/* ---------------------------------------------------------------- stat bar */

/** Ten-segment meter. Fills animate on width so hero swaps read as a change. */
export function StatBar({
  label,
  value,
  max = 10,
  tone = "ink",
}: {
  label: string;
  value: number;
  max?: number;
  tone?: "ink" | "coin";
}) {
  const pct = Math.max(0, Math.min(1, value / max)) * 100;
  return (
    <div className="grid grid-cols-[4.5rem_minmax(0,1fr)_2rem] items-center gap-2">
      <span className="text-[8px] uppercase tracking-[0.2em] text-nes-muted">{label}</span>
      <span className="relative block h-3 border-2 border-nes-ink bg-nes-ink/10">
        <span
          className={cx(
            "absolute inset-y-0 left-0 transition-[width] duration-500 ease-out",
            tone === "coin" ? "bg-nes-coin" : "bg-nes-pipe",
          )}
          style={{ width: `${pct}%` }}
        />
      </span>
      <span className="text-right text-[8px] tabular-nums text-nes-ink">{value}</span>
    </div>
  );
}

/** Difficulty as stars — text characters, never colour alone. */
export function Difficulty({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <span className="text-[10px] tracking-[0.2em] text-nes-brick-dark" aria-label={`Difficulty ${value} of ${max}`}>
      {"\u2605".repeat(value)}
      <span className="text-nes-ink/25">{"\u2606".repeat(Math.max(0, max - value))}</span>
    </span>
  );
}

/* ------------------------------------------------------------------- keys */

/** Visual keycap used by the controls guide and tutorial prompts. */
export function KeyCap({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex min-h-8 min-w-8 items-center justify-center border-4 border-nes-ink bg-nes-paper px-2 py-1 text-[9px] uppercase tracking-widest text-nes-ink shadow-[3px_3px_0_0_var(--nes-ink)]">
      {children}
    </kbd>
  );
}

/** Hard pixel rule between sections. */
export function PixelDivider() {
  return <div aria-hidden className="my-4 h-1 w-full bg-nes-ink/20" />;
}

/** Small labelled read-out used by results and level details. */
export function StatRow({
  label,
  value,
  tone = "normal",
}: {
  label: string;
  value: ReactNode;
  tone?: "normal" | "good" | "bad";
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3 border-b-2 border-nes-ink/10 py-2">
      <span className="truncate text-[8px] uppercase tracking-[0.2em] text-nes-muted">{label}</span>
      <span
        className={cx(
          "text-[10px] tabular-nums uppercase tracking-widest",
          tone === "good" && "text-nes-pipe",
          tone === "bad" && "text-nes-danger",
        )}
      >
        {value}
      </span>
    </div>
  );
}
