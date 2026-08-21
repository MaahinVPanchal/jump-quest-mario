import Phaser from "phaser";
import type { BossDefinition, BossKind } from "../types";
import { audio } from "../systems/audio";
import { TILE } from "../config";

interface BossProfile {
  color: number;
  accent: number;
  /** Body size in pixels. */
  w: number;
  h: number;
  /** Ground speed while chasing. */
  speed: number;
  /** Milliseconds between hops (0 = grounded walker). */
  hopMs: number;
  /** Milliseconds between ranged attacks (0 = melee only). */
  shootMs: number;
  /** Stomping the head is a valid damage source. */
  stompable: boolean;
  /** Ignores gravity and floats on a sine path. */
  floats: boolean;
}

const PROFILES: Record<BossKind, BossProfile> = {
  guardian: { color: 0x3cbc3c, accent: 0xfcd83c, w: 80, h: 80, speed: 140, hopMs: 1600, shootMs: 2100, stompable: true, floats: false },
  beast: { color: 0x0f7a35, accent: 0xff6b3d, w: 64, h: 56, speed: 110, hopMs: 1100, shootMs: 2400, stompable: true, floats: false },
  serpent: { color: 0x2f9cd8, accent: 0x9ce8ff, w: 72, h: 44, speed: 90, hopMs: 0, shootMs: 1700, stompable: false, floats: true },
  titan: { color: 0xd8d8f0, accent: 0x6888fc, w: 68, h: 60, speed: 120, hopMs: 0, shootMs: 1500, stompable: false, floats: true },
  core: { color: 0xff5a1f, accent: 0xffd166, w: 60, h: 60, speed: 95, hopMs: 1300, shootMs: 1400, stompable: true, floats: false },
  warden: { color: 0x9ce8ff, accent: 0xffffff, w: 64, h: 64, speed: 140, hopMs: 0, shootMs: 1600, stompable: true, floats: false },
  machine: { color: 0xc08cff, accent: 0x4fd8ff, w: 72, h: 64, speed: 110, hopMs: 0, shootMs: 1100, stompable: false, floats: true },
  overlord: { color: 0x7c1f1f, accent: 0xffb03c, w: 84, h: 76, speed: 130, hopMs: 1000, shootMs: 900, stompable: true, floats: false },
};

function textureKey(kind: BossKind): string {
  return `boss_${kind}`;
}

/** Chunky 8-bit boss silhouette generated at runtime — no external art. */
function ensureTexture(scene: Phaser.Scene, kind: BossKind): void {
  const key = textureKey(kind);
  if (scene.textures.exists(key)) return;
  const p = PROFILES[kind];
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  if (kind === "guardian") {
    g.fillStyle(0x11151a, 1);
    g.fillRect(16, 4, 48, 8).fillRect(8, 12, 64, 48).fillRect(16, 60, 48, 16);
    g.fillStyle(p.color, 1);
    g.fillRect(20, 16, 40, 42).fillRect(12, 28, 56, 28).fillRect(20, 58, 14, 18).fillRect(46, 58, 14, 18);
    g.fillStyle(p.accent, 1);
    g.fillRect(24, 8, 10, 12).fillRect(46, 8, 10, 12);
    g.fillRect(18, 22, 44, 8).fillRect(8, 34, 10, 18).fillRect(62, 34, 10, 18);
    g.fillStyle(0xfff3a8, 1).fillRect(24, 34, 12, 10).fillRect(44, 34, 12, 10);
    g.fillStyle(0x182018, 1).fillRect(28, 37, 5, 6).fillRect(47, 37, 5, 6);
    g.fillStyle(0xd83232, 1).fillRect(30, 50, 20, 6);
    g.fillStyle(0xff6b3d, 1).fillRect(34, 51, 4, 4).fillRect(42, 51, 4, 4);
    g.generateTexture(key, p.w, p.h);
    g.destroy();
    return;
  }
  g.fillStyle(0x000000, 1).fillRect(0, 0, p.w, p.h);
  g.fillStyle(p.color, 1).fillRect(4, 4, p.w - 8, p.h - 8);
  g.fillStyle(p.accent, 1).fillRect(10, 10, p.w - 20, 10);
  // eyes
  g.fillStyle(0xffffff, 1).fillRect(12, p.h * 0.45, 12, 10).fillRect(p.w - 24, p.h * 0.45, 12, 10);
  g.fillStyle(0x000000, 1).fillRect(16, p.h * 0.45 + 2, 5, 6).fillRect(p.w - 20, p.h * 0.45 + 2, 5, 6);
  // jaw / vents
  g.fillStyle(p.accent, 1).fillRect(12, p.h - 18, p.w - 24, 8);
  g.generateTexture(key, p.w, p.h);
  g.destroy();
}

export interface BossHooks {
  /** Fire a boss projectile from world coordinates. */
  onShoot: (x: number, y: number, dir: number) => void;
  onPhase: (phase: number) => void;
  onDefeated: () => void;
  playerX: () => number;
  playerY: () => number;
}

/**
 * Multi-phase boss. Phases speed up movement and shorten attack intervals, and
 * every hit triggers a telegraphed flash so the pattern stays readable.
 */
export class Boss extends Phaser.Physics.Arcade.Sprite {
  readonly def: BossDefinition;
  readonly profile: BossProfile;
  readonly maxHealth = 10;
  health: number;
  phase = 1;
  defeated = false;
  private nextHop = 0;
  private nextShot = 0;
  private invulnUntil = 0;
  private baseY: number;
  private readonly arenaMinX: number;
  private readonly arenaMaxX: number;
  private lastDebugLog = -Infinity;

  constructor(scene: Phaser.Scene, def: BossDefinition, x: number, y: number, private hooks: BossHooks, startingHealth = 10) {
    ensureTexture(scene, def.kind);
    super(scene, x + TILE / 2, y + TILE, textureKey(def.kind));
    this.def = def;
    this.profile = PROFILES[def.kind];
    this.health = Phaser.Math.Clamp(startingHealth, 0, this.maxHealth);
    console.log(
      "[BOSS CONSTRUCTOR]",
      this.constructor.name,
      "health=",
      this.health,
      "maxHealth=",
      this.maxHealth,
      "active=",
      this.active,
      "visible=",
      this.visible,
    );
    this.baseY = y;
    this.arenaMinX = (def.arenaMinX ?? def.x - 12) * TILE;
    this.arenaMaxX = (def.arenaMaxX ?? def.x + 10) * TILE;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(19);
    this.setOrigin(0.5, 1);
    this.setActive(true).setVisible(true).setAlpha(1);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(this.profile.w * 0.8, this.profile.h * 0.85);
    body.setOffset(this.profile.w * 0.1, this.profile.h * 0.15);
    body.setAllowGravity(!this.profile.floats);
    body.setCollideWorldBounds(false);
    body.setBounce(0, 0);
    console.log("[BOSS READY]", {
      name: this.def.name,
      kind: this.def.kind,
      x: this.x,
      y: this.y,
      active: this.active,
      visible: this.visible,
      bodyEnabled: body.enable,
      bodyActive: body.gameObject.active,
      bodyAllowGravity: body.allowGravity,
      health: this.health,
    });
  }

  get phaseCount(): number {
    return 3;
  }

  /** True only while the sprite is still alive and attached to a running scene. */
  get alive(): boolean {
    return !this.defeated && this.active && this.visible && !!this.scene;
  }

  canBeHurt(time: number): boolean {
    return this.alive && time >= this.invulnUntil;
  }

  /** Every successful boss hit removes exactly one health segment. */
  hurt(time: number): boolean {
    console.log("[BOSS HURT CALLED]", {
      healthBefore: this.health,
      maxHealth: this.maxHealth,
      defeated: this.defeated,
      active: this.active,
      visible: this.visible,
      time,
    });
    if (!this.canBeHurt(time)) return false;
    this.invulnUntil = time + 150;
    const previousHealth = this.health;
    this.health = Math.max(0, this.health - 1);
    console.log("[BOSS HEALTH CHANGED]", {
      previousHealth,
      healthAfter: this.health,
      maxHealth: this.maxHealth,
      defeated: this.defeated,
      active: this.active,
      visible: this.visible,
    });
    console.log("[BOSS HIT]", {
      boss: this.def.name,
      previousHealth,
      health: this.health,
      maxHealth: this.maxHealth,
      alive: this.alive,
    });
    audio.play("stomp");
    this.setTint(0xffffff);
    this.scene.time.delayedCall(80, () => {
      if (this.alive) this.clearTint();
    });
    const nextPhase = Math.min(3, 1 + Math.floor((this.maxHealth - Math.max(0, this.health)) / 3.34));
    if (nextPhase > this.phase) {
      this.phase = nextPhase;
      this.hooks.onPhase(this.phase);
    }
    if (this.health <= 0) this.die();
    return true;
  }

  private die(): void {
    console.log("[BOSS DIE CALLED]", {
      health: this.health,
      maxHealth: this.maxHealth,
      defeated: this.defeated,
      active: this.active,
      visible: this.visible,
    });
    if (this.defeated) return;
    this.defeated = true;
    const body = this.body as Phaser.Physics.Arcade.Body | null;
    if (body) body.enable = false;
    // Open the arena immediately when health reaches zero. Waiting for the
    // defeat tween left a short window where the flag still claimed the boss
    // was guarding it despite the health bar being empty.
    this.hooks.onDefeated();
    if (!this.scene) {
      return;
    }
    audio.play("goal");
    this.scene.tweens.add({
      targets: this,
      angle: 220,
      y: this.y + 260,
      alpha: 0,
      duration: 1100,
      onComplete: () => {
        this.destroy();
      },
    });
  }

  override preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    if (time - this.lastDebugLog >= 500) {
      const body = this.body as Phaser.Physics.Arcade.Body | undefined;
      console.log("[BOSS HEARTBEAT]", {
        time,
        x: Math.round(this.x),
        y: Math.round(this.y),
        health: this.health,
        defeated: this.defeated,
        active: this.active,
        visible: this.visible,
        alpha: this.alpha,
        sceneAttached: !!this.scene,
        bodyEnabled: body?.enable ?? false,
        bodyActive: body?.gameObject.active ?? false,
      });
      this.lastDebugLog = time;
    }
    if (!this.alive) return;
    this.setVisible(true).setAlpha(1);
    const body = this.body as Phaser.Physics.Arcade.Body;
    const px = this.hooks.playerX();
    const dir = px < this.x ? -1 : 1;
    const speedUp = 1 + (this.phase - 1) * 0.35;
    const rateUp = 1 / speedUp;

    this.setFlipX(dir < 0);

    if (this.x <= this.arenaMinX && dir < 0) this.x = this.arenaMinX;
    if (this.x >= this.arenaMaxX && dir > 0) this.x = this.arenaMaxX;

    if (this.profile.floats) {
      body.setVelocityX(
        this.x <= this.arenaMinX ? Math.abs(this.profile.speed * speedUp) :
          this.x >= this.arenaMaxX ? -Math.abs(this.profile.speed * speedUp) : dir * this.profile.speed * speedUp,
      );
      this.y = this.baseY + Math.sin(time / (420 * rateUp)) * 60;
    } else {
      body.setVelocityX(
        this.x <= this.arenaMinX ? Math.abs(this.profile.speed * speedUp * 0.8) :
          this.x >= this.arenaMaxX ? -Math.abs(this.profile.speed * speedUp * 0.8) : dir * this.profile.speed * speedUp * 0.8,
      );
      if (this.profile.hopMs && time > this.nextHop && body.blocked.down) {
        this.nextHop = time + this.profile.hopMs * rateUp;
        body.setVelocityY(-620);
      }
    }

    if (this.profile.shootMs && time > this.nextShot) {
      this.nextShot = time + this.profile.shootMs * rateUp;
      // Telegraph, then fire.
      this.scene.tweens.add({ targets: this, scaleX: 1.12, scaleY: 0.9, yoyo: true, duration: 140 });
      this.scene.time.delayedCall(280, () => {
        if (this.alive) this.hooks.onShoot(this.x + dir * 20, this.y - this.profile.h * 0.5, dir);
      });
    }
  }
}
