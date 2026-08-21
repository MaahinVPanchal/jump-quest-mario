import type { LevelData, LevelObjective, ObjectiveProgress } from "../types";

export interface TrackerState {
  coins: number;
  enemies: number;
  secretFound: boolean;
  waterTouched: boolean;
  timeLeft: number;
}

const labelFor = (o: LevelObjective): string => {
  switch (o.type) {
    case "COIN_TARGET":
      return "COINS";
    case "DEFEAT_ALL":
      return "FOES";
    case "TIME_LIMIT":
      return "BEAT";
    case "NO_WATER":
      return "CLEAN";
    case "FIND_SECRET":
      return "SECRET";
  }
};

/** Runtime evaluation of the level's objectives, shared by the HUD and results. */
export class ObjectiveTracker {
  readonly state: TrackerState = {
    coins: 0,
    enemies: 0,
    secretFound: false,
    waterTouched: false,
    timeLeft: 0,
  };

  private readonly list: LevelObjective[];

  constructor(private readonly level: LevelData) {
    const o = level.objectives;
    this.list = o ? [o.primary, ...(o.secondary ?? [])] : [];
    this.state.timeLeft = level.timeLimit;
  }

  restore(snapshot: Partial<TrackerState>): void {
    this.state.coins = snapshot.coins ?? this.state.coins;
    this.state.enemies = snapshot.enemies ?? this.state.enemies;
    this.state.secretFound = snapshot.secretFound ?? this.state.secretFound;
    this.state.waterTouched = snapshot.waterTouched ?? this.state.waterTouched;
    this.state.timeLeft = snapshot.timeLeft ?? this.state.timeLeft;
  }

  snapshot(): TrackerState {
    return { ...this.state };
  }

  get primary(): LevelObjective | undefined {
    return this.level.objectives?.primary;
  }

  coin(): void {
    this.state.coins += 1;
  }

  enemyDefeated(): void {
    this.state.enemies += 1;
  }

  secret(): void {
    this.state.secretFound = true;
  }

  water(): void {
    this.state.waterTouched = true;
  }

  setTimeLeft(seconds: number): void {
    this.state.timeLeft = seconds;
  }

  evaluate(o: LevelObjective): ObjectiveProgress {
    const s = this.state;
    let current = 0;
    let target = o.target ?? 1;
    let complete = false;
    let failed = false;
    switch (o.type) {
      case "COIN_TARGET":
        current = s.coins;
        complete = current >= target;
        break;
      case "DEFEAT_ALL":
        current = s.enemies;
        complete = current >= target;
        break;
      case "TIME_LIMIT":
        target = o.timeLimit ?? this.level.timeLimit;
        current = Math.ceil(s.timeLeft);
        complete = current >= target;
        failed = current <= 0;
        break;
      case "NO_WATER":
        current = s.waterTouched ? 1 : 0;
        target = 0;
        complete = !s.waterTouched;
        failed = s.waterTouched;
        break;
      case "FIND_SECRET":
        current = s.secretFound ? 1 : 0;
        target = 1;
        complete = s.secretFound;
        break;
    }
    const value =
      o.type === "NO_WATER"
        ? complete
          ? "OK"
          : "FAIL"
        : o.type === "FIND_SECRET"
          ? complete
            ? "FOUND"
            : "??"
          : `${current}/${target}`;
    return { type: o.type, label: labelFor(o), value, current, target, complete, failed };
  }

  /** Progress for every objective, primary first. */
  progress(): ObjectiveProgress[] {
    return this.list.map((o) => this.evaluate(o));
  }

  /** Mandatory objectives gate level completion; the rest only change the rank. */
  blockedReason(): string | null {
    for (const o of this.list) {
      if (!o.mandatory) continue;
      const p = this.evaluate(o);
      if (!p.complete) return o.description;
    }
    return null;
  }

  primaryComplete(): boolean {
    const p = this.primary;
    return p ? this.evaluate(p).complete : true;
  }
}
