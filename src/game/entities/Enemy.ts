import Phaser from "phaser";
import { TILE } from "../config";
import { ENEMIES } from "../data/enemies";
import type { EnemyData, EnemyKind, EnemySpawn } from "../types";

export type EnemyState = "patrol" | "shell" | "sliding" | "dead";
export type DamageSource = "stomp" | "fire" | "shell";

/** Classic-feel timings (ms / px per second). */
const SHELL = {
  slideSpeed: 400,
  /** How long a kicked-then-stopped shell stays dormant before waking up. */
  dormantMs: 5200,
  /** Wobble warning window before the patroller pops back out. */
  wakeWarnMs: 1500,
  /** Grace after a kick so the player is never clipped by their own shell. */
  kickGraceMs: 140,
} as const;

const PIRANHA = {
  hiddenMs: 1400,
  riseMs: 480,
  upMs: 2000,
  sinkMs: 480,
  /** Horizontal no-emerge radius around the hero. */
  safeRadius: 52,
  biteMs: 180,
} as const;
const PIRANHA_PERIOD = PIRANHA.hiddenMs + PIRANHA.riseMs + PIRANHA.upMs + PIRANHA.sinkMs;

/** Data-driven enemy; all kinds share this body and branch on their data record. */
export class Enemy extends Phaser.Physics.Arcade.Sprite {
  readonly kind: EnemyKind;
  mode: EnemyState = "patrol";
  dir: number;
  private homeX: number;
  private homeY: number;
  private patrol: number;
  private animTime = 0;
  private frame2 = 0;
  private phase = Math.random() * Math.PI * 2;
  private shellIdleUntil = 0;
  private kickGraceUntil = 0;
  private suppressedUntil = 0;
  /** Piranha emergence cycle timer (ms). */
  private cycle = 0;
  private hideDepth = 44;
  awake = false;

  constructor(scene: Phaser.Scene, spawn: EnemySpawn) {
    const data: EnemyData = ENEMIES[spawn.type];
    const key =
      spawn.type === "walker"
        ? "walker_0"
        : spawn.type === "shell"
          ? "shell_0"
          : spawn.type === "piranha"
            ? "piranha_0"
            : "flyer_0";
    const y = spawn.type === "piranha" ? spawn.y * TILE + 48 : spawn.y * TILE + TILE;
    super(scene, spawn.x * TILE + TILE / 2, y, key);
    this.kind = spawn.type;
    this.dir = spawn.direction ?? -1;
    this.patrol = spawn.patrol ?? data.patrolRange;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setOrigin(0.5, 1);
    this.setDepth(spawn.type === "piranha" ? 7 : 15);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(26, 26);
    body.setOffset(3, 6);
    if (data.canFly) body.setAllowGravity(false);
    if (spawn.type === "piranha") {
      body.setSize(22, 24);
      body.setOffset(5, 0);
      body.setImmovable(true);
      body.checkCollision.none = true;
      this.cycle = Math.random() * PIRANHA_PERIOD;
    }
    this.homeX = this.x;
    this.homeY = this.y;
    this.setActive(false).setVisible(false);
  }

  get stats(): EnemyData {
    return ENEMIES[this.kind];
  }

  wake(): void {
    if (this.awake) return;
    this.awake = true;
    this.setActive(true).setVisible(true);
  }

  /** True while the enemy should not damage the hero (just-kicked shells). */
  canHurt(time: number): boolean {
    if (this.mode === "dead") return false;
    if (this.kind === "piranha" && this.y >= this.homeY - 4) return false;
    return time >= this.kickGraceUntil;
  }

  /** Keeps a pipe plant tucked away (used on pipe entry/exit). */
  suppress(ms: number): void {
    if (this.kind !== "piranha") return;
    this.suppressedUntil = this.scene.time.now + ms;
  }

  /** Returns true when the enemy is removed from play. */
  hit(source: DamageSource): boolean {
    if (this.mode === "dead") return false;
    if (this.kind === "shell" && source === "stomp") {
      if (this.mode === "patrol") {
        this.mode = "shell";
        this.shellIdleUntil = this.scene.time.now + SHELL.dormantMs;
        this.setTexture("shell_hidden");
        this.setVelocity(0, 0);
        return false;
      }
      if (this.mode === "sliding") {
        this.mode = "shell";
        this.shellIdleUntil = this.scene.time.now + SHELL.dormantMs;
        this.setTexture("shell_hidden");
        this.setVelocityX(0);
        return false;
      }
    }
    this.defeat(source === "fire");
    return true;
  }

  kickShell(fromX: number): void {
    if (this.kind !== "shell" || this.mode !== "shell") return;
    this.mode = "sliding";
    this.dir = this.x >= fromX ? 1 : -1;
    this.setVelocityX(this.dir * SHELL.slideSpeed);
    this.setTexture("shell_hidden");
    this.kickGraceUntil = this.scene.time.now + SHELL.kickGraceMs;
  }

  defeat(flip = false): void {
    this.mode = "dead";
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.checkCollision.none = true;
    body.setAllowGravity(true);
    if (flip) {
      body.setVelocity(this.dir * 60, -320);
      this.setFlipY(true);
      this.scene.time.delayedCall(900, () => this.destroy());
    } else {
      this.setTexture(this.kind === "walker" ? "walker_flat" : this.texture.key);
      this.setVelocity(0, 0);
      body.setAllowGravity(false);
      this.scene.tweens.add({
        targets: this,
        alpha: 0,
        scaleY: 0.4,
        duration: 420,
        onComplete: () => this.destroy(),
      });
    }
  }

  override preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    if (this.mode === "dead" || !this.awake) return;
    const body = this.body as Phaser.Physics.Arcade.Body;

    if (this.kind === "piranha") {
      this.updatePiranha(delta);
      body.updateFromGameObject();
    } else if (this.kind === "flyer") {
      this.x += this.dir * this.stats.speed * (delta / 1000);
      if (Math.abs(this.x - this.homeX) > this.patrol) this.dir *= -1;
      this.y = this.homeY + Math.sin(time / 520 + this.phase) * 52;
      body.updateFromGameObject();
    } else if (this.mode === "sliding") {
      this.setVelocityX(this.dir * SHELL.slideSpeed);
      if (body.blocked.left || body.blocked.right) {
        this.dir *= -1;
        this.setVelocityX(this.dir * SHELL.slideSpeed);
        this.x += this.dir * 2;
      }
    } else if (this.mode === "shell") {
      this.setVelocityX(0);
      if (time > this.shellIdleUntil) {
        this.mode = "patrol";
        this.setTexture("shell_0");
        this.setFlipY(false);
      } else if (time > this.shellIdleUntil - SHELL.wakeWarnMs) {
        // Classic wobble tell just before the patroller climbs back out.
        this.setFlipY(Math.floor(time / 110) % 2 === 0);
      }
    } else {
      this.setVelocityX(this.dir * this.stats.speed);
      const hitWall = body.blocked.left || body.blocked.right;
      const beyondPatrol = Math.abs(this.x - this.homeX) > this.patrol;
      const edge = body.blocked.down && !this.groundAhead();
      if (hitWall || beyondPatrol || edge) {
        this.dir *= -1;
        this.x += this.dir * 2;
      }
    }

    if (this.kind !== "piranha") this.setFlipX(this.dir > 0);
    this.animTime += delta;
    if (this.animTime > (this.kind === "piranha" ? 260 : 180) && this.mode === "patrol") {
      this.animTime = 0;
      this.frame2 = 1 - this.frame2;
      const base =
        this.kind === "walker"
          ? "walker"
          : this.kind === "shell"
            ? "shell"
            : this.kind === "piranha"
              ? "piranha"
              : "flyer";
      this.setTexture(`${base}_${this.frame2}`);
    }
  }

  /** Rises out of its pipe on a fixed cadence, but stays down while the hero stands on top. */
  private updatePiranha(delta: number): void {
    const scene = this.scene as Phaser.Scene & { playerX?: () => number };
    const near = scene.playerX ? Math.abs(scene.playerX() - this.x) < 44 : false;
    const period = 4600;
    this.cycle = (this.cycle + delta) % period;
    let t = 0;
    if (this.cycle < 500) t = this.cycle / 500;
    else if (this.cycle < 2400) t = 1;
    else if (this.cycle < 2900) t = 1 - (this.cycle - 2400) / 500;
    if (near && t > 0 && this.cycle < 500) {
      this.cycle = 0;
      t = 0;
    }
    this.y = this.homeY - this.hideDepth * t;
  }

  /** Cheap edge test against the solid tile layer so patrols never walk into pits. */
  private groundAhead(): boolean {
    const scene = this.scene as Phaser.Scene & {
      isSolidAt?: (x: number, y: number) => boolean;
    };
    if (!scene.isSolidAt) return true;
    return scene.isSolidAt(this.x + this.dir * 18, this.y + 8);
  }
}
