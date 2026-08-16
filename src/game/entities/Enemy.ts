import Phaser from "phaser";
import { TILE } from "../config";
import { ENEMIES } from "../data/enemies";
import type { EnemyData, EnemyKind, EnemySpawn } from "../types";
import { bossKey, themeById } from "../levels/themes";

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

/** Ranged gunner: paces slowly and lobs shots at the hero on a fixed cadence. */
const LOBBER = {
  range: 460,
  cooldownMs: 1900,
  telegraphMs: 420,
} as const;

/** Spiked roller: winds up, then charges when the hero is close and level with it. */
const SPIKER = {
  chargeRange: 260,
  chargeMultiplier: 2.6,
  windUpMs: 260,
} as const;

/** Per-kind signature skills so no stage fields a purely passive patroller. */
const SKILL = {
  walkerHopRange: 150,
  walkerHopCooldown: 1500,
  shellDashRange: 210,
  shellDashCooldown: 2200,
  ogreLeapRange: 190,
  ogreLeapCooldown: 2600,
  bossShotRange: 620,
  bossShotCooldown: 2400,
} as const;

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
  private chargeUntil = 0;
  private nextShotAt = 0;
  private telegraphUntil = 0;
  /** Boss state: remaining hits, hop timer and the theme its art comes from. */
  private hp = 1;
  private enraged = false;
  private hopAt = 0;
  private bossTheme = "meadow";
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
            : spawn.type === "spiker"
              ? "spiker_0"
              : spawn.type === "lobber"
                ? "lobber_0"
              : spawn.type === "boss"
                ? bossKey(themeById(spawn.variant ?? "meadow").id, 0)
                : "ogre_0";
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
    if (spawn.type === "ogre") {
      // Heavy brute: two stomps to fell, bigger hitbox than a walker.
      this.hp = data.health;
      this.setScale(1.25);
      body.setSize(24, 30);
      body.setOffset(4, 2);
    }
    if (spawn.type === "boss") {
      const theme = themeById(spawn.variant ?? "meadow");
      this.bossTheme = theme.id;
      this.hp = 3 + theme.boss.extraHits;
      this.setScale(1.6);
      body.setSize(46, 52);
      body.setOffset(9, 12);
      this.setDepth(16);
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
    if (this.kind === "ogre" && source !== "fire") {
      this.hp -= source === "shell" ? 2 : 1;
      if (this.hp > 0) {
        // First stomp cracks its armour: it turns enraged and speeds up.
        this.enraged = true;
        this.setTint(0xff9c6c);
        this.setVelocityY(-120);
        this.scene.tweens.add({ targets: this, alpha: 0.3, yoyo: true, repeat: 2, duration: 60 });
        return false;
      }
    }
    if (this.kind === "boss") {
      this.hp -= source === "shell" ? 2 : 1;
      if (this.hp > 0) {
        // Flash + knock back so every landed hit reads clearly.
        this.dir = -this.dir;
        this.setVelocityY(-260);
        this.scene.tweens.add({ targets: this, alpha: 0.25, yoyo: true, repeat: 3, duration: 70 });
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
    } else if (this.kind === "boss") {
      this.setVelocityX(this.dir * this.stats.speed);
      if (body.blocked.left || body.blocked.right || Math.abs(this.x - this.homeX) > this.patrol) {
        this.dir *= -1;
        this.x += this.dir * 3;
      }
      if (body.blocked.down && time > this.hopAt) {
        this.hopAt = time + 1400;
        this.setVelocityY(-420);
      }
    } else {
      if (this.kind === "lobber") this.updateLobber(time);
      let speed = this.stats.speed;
      if (this.kind === "ogre" && this.enraged) speed *= 1.6;
      if (this.kind === "spiker") speed *= this.updateSpikerCharge(time);
      this.setVelocityX(this.dir * speed);
      const hitWall = body.blocked.left || body.blocked.right;
      const beyondPatrol = Math.abs(this.x - this.homeX) > this.patrol;
      const edge = body.blocked.down && !this.groundAhead();
      if (hitWall || beyondPatrol || edge) {
        this.dir *= -1;
        this.x += this.dir * 2;
      }
    }

    if (this.kind !== "piranha") this.setFlipX(this.dir > 0);
    if (this.kind === "boss") {
      this.setTexture(bossKey(this.bossTheme, Math.floor(time / 220) % 2));
      return;
    }
    this.animTime += delta;
    if (this.kind !== "piranha" && this.animTime > 180 && this.mode === "patrol") {
      this.animTime = 0;
      this.frame2 = 1 - this.frame2;
      const base =
        this.kind === "walker"
          ? "walker"
          : this.kind === "shell"
            ? "shell"
            : this.kind === "spiker"
              ? "spiker"
              : this.kind === "lobber"
                ? "lobber"
                : "ogre";
      this.setTexture(`${base}_${this.frame2}`);
    }
  }

  /** Returns the speed multiplier for the spiker's patrol / charge rhythm. */
  private updateLobber(time: number): void {
    const scene = this.scene as Phaser.Scene & {
      playerX?: () => number;
      spawnEnemyShot?: (x: number, y: number, dir: number) => void;
    };
    const px = scene.playerX?.();
    if (px === undefined || !Number.isFinite(px)) return;
    const dx = px - this.x;
    if (Math.abs(dx) > LOBBER.range) return;
    this.dir = dx >= 0 ? 1 : -1;
    if (time > this.nextShotAt) {
      this.nextShotAt = time + LOBBER.cooldownMs;
      this.telegraphUntil = time + LOBBER.telegraphMs;
      this.scene.time.delayedCall(LOBBER.telegraphMs, () => {
        if (this.mode === "dead" || !this.active) return;
        scene.spawnEnemyShot?.(this.x + this.dir * 16, this.y - 20, this.dir);
      });
    }
    this.setTint(time < this.telegraphUntil ? 0xffe08a : 0xffffff);
  }

  private updateSpikerCharge(time: number): number {
    const scene = this.scene as Phaser.Scene & { playerX?: () => number };
    const px = scene.playerX?.() ?? Number.NaN;
    if (Number.isFinite(px)) {
      const dx = px - this.x;
      if (Math.abs(dx) < SPIKER.chargeRange && Math.sign(dx) === this.dir) {
        if (time > this.chargeUntil) this.chargeUntil = time + SPIKER.windUpMs + 900;
      }
    }
    const charging = time < this.chargeUntil;
    this.setTint(charging ? 0xffc0c0 : 0xffffff);
    return charging ? SPIKER.chargeMultiplier : 1;
  }

  /** Rises out of its pipe on a fixed NES cadence; stays down while the hero is on the rim. */
  private updatePiranha(delta: number): void {
    const scene = this.scene as Phaser.Scene & { playerX?: () => number };
    const near = scene.playerX ? Math.abs(scene.playerX() - this.x) < PIRANHA.safeRadius : false;
    const blocked = near || this.scene.time.now < this.suppressedUntil;

    const hidden = PIRANHA.hiddenMs;
    const riseEnd = hidden + PIRANHA.riseMs;
    const upEnd = riseEnd + PIRANHA.upMs;
    const sinkEnd = upEnd + PIRANHA.sinkMs;

    // Hold the cycle at the bottom while the hero blocks the pipe mouth.
    if (blocked && this.cycle >= hidden) {
      if (this.cycle < riseEnd) this.cycle = 0;
      else if (this.cycle < upEnd) this.cycle = upEnd; // finish the retract, then wait
    }
    if (blocked && this.cycle < hidden) this.cycle = 0;
    else this.cycle = (this.cycle + delta) % PIRANHA_PERIOD;

    let t = 0;
    if (this.cycle < hidden) t = 0;
    else if (this.cycle < riseEnd) t = (this.cycle - hidden) / PIRANHA.riseMs;
    else if (this.cycle < upEnd) t = 1;
    else t = 1 - (this.cycle - upEnd) / PIRANHA.sinkMs;
    t = Math.min(1, Math.max(0, t));

    // Bite animation only while fully out.
    if (t >= 1) {
      const bite = Math.floor(this.scene.time.now / PIRANHA.biteMs) % 2;
      this.setTexture(`piranha_${bite}`);
    }
    void sinkEnd;
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
