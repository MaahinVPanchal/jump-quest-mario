import Phaser from "phaser";

export type GameAction =
  | "MOVE_LEFT"
  | "MOVE_RIGHT"
  | "LOOK_UP"
  | "CROUCH"
  | "JUMP"
  | "RUN"
  | "ATTACK"
  | "SPECIAL"
  | "DASH"
  | "INTERACT"
  | "PAUSE"
  | "RESTART";

const KEY_MAP: Record<GameAction, string[]> = {
  MOVE_LEFT: ["LEFT", "A"],
  MOVE_RIGHT: ["RIGHT", "D"],
  LOOK_UP: ["UP", "W"],
  CROUCH: ["DOWN", "S"],
  JUMP: ["SPACE", "UP", "W"],
  RUN: ["SHIFT"],
  ATTACK: ["X"],
  SPECIAL: ["CTRL"],
  DASH: ["F"],
  INTERACT: ["E"],
  PAUSE: ["ESC"],
  RESTART: ["R"],
};

/**
 * Abstracts keyboard + gamepad into semantic actions so touch controls can be
 * added later without touching gameplay code.
 */
export class InputManager {
  private keys = new Map<string, Phaser.Input.Keyboard.Key>();
  private prev = new Set<GameAction>();
  private down = new Set<GameAction>();

  constructor(private scene: Phaser.Scene) {
    const kb = scene.input.keyboard;
    if (!kb) return;
    const unique = new Set(Object.values(KEY_MAP).flat());
    for (const name of unique) {
      const code = (Phaser.Input.Keyboard.KeyCodes as Record<string, number>)[name];
      if (code !== undefined) this.keys.set(name, kb.addKey(code, true, true));
    }
    kb.addCapture(["SPACE", "UP", "DOWN", "LEFT", "RIGHT"]);
  }

  update(): void {
    this.prev = new Set(this.down);
    this.down = new Set<GameAction>();
    const pad = this.scene.input.gamepad?.getPad(0);
    for (const action of Object.keys(KEY_MAP) as GameAction[]) {
      if (KEY_MAP[action].some((k) => this.keys.get(k)?.isDown)) this.down.add(action);
    }
    if (pad) {
      const ax = pad.axes.length > 0 ? pad.axes[0]!.getValue() : 0;
      if (ax < -0.3 || pad.left) this.down.add("MOVE_LEFT");
      if (ax > 0.3 || pad.right) this.down.add("MOVE_RIGHT");
      if (pad.A) this.down.add("JUMP");
      if (pad.X) this.down.add("ATTACK");
      if (pad.B) this.down.add("DASH");
      if (pad.Y) this.down.add("SPECIAL");
      if (pad.R2 > 0.3) this.down.add("RUN");
      if (pad.buttons[9]?.pressed) this.down.add("PAUSE");
    }
  }

  isDown(action: GameAction): boolean {
    return this.down.has(action);
  }

  justPressed(action: GameAction): boolean {
    return this.down.has(action) && !this.prev.has(action);
  }

  justReleased(action: GameAction): boolean {
    return !this.down.has(action) && this.prev.has(action);
  }

  axisX(): number {
    return (this.isDown("MOVE_RIGHT") ? 1 : 0) - (this.isDown("MOVE_LEFT") ? 1 : 0);
  }
}
