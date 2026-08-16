import Phaser from "phaser";
import { TILE } from "../config";
import { ENEMIES } from "../data/enemies";
import type { EnemyData, EnemyKind, EnemySpawn } from "../types";

export type EnemyState = "patrol" | "shell" | "sliding" | "dead";
export type DamageSource = "stomp" | "fire" | "shell";

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
  awake = false;

  constructor(scene: Phaser.Scene, spawn: EnemySpawn) {
    const data: EnemyData = ENEMIES[spawn.type];
    const key = spawn.type === "walker" ? "walker_0" : spawn.type === "shell" ? "shell_0" : "flyer_0";
    super(scene, spawn.x * TILE + TILE / 2, spawn.y * TILE + TILE, key);
    this.kind = spawn.type;
    this.dir = spawn.direction ?? -1;
    this.patrol = spawn.patrol ?? data.patrolRange;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setOrigin(0.5, 1);
    this.setDepth(15);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(26, 26);
    body.setOffset(3, 6);
    if (data.canFly) body.setAllowGravity(false);
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

  /** Returns true when the enemy is removed from play. */
  hit(source: DamageSource): boolean {
    if (this.mode === "dead") return false;
    if (this.kind === "shell" && source === "stomp") {
      if (this.mode === "patrol") {
        this.mode = "shell";
        this.shellIdleUntil = this.scene.time.now + 5000;
        this.setTexture("shell_hidden");
        this.setVelocity(0, 0);
        return false;
      }
      if (this.mode === "sliding") {
        this.mode = "shell";
        this.shellIdleUntil = this.scene.time.now + 5000;
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
    this.setVelocityX(this.dir * 380);
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

    if (this.kind === "flyer") {
      this.x += this.dir * this.stats.speed * (delta / 1000);
      if (Math.abs(this.x - this.homeX) > this.patrol) this.dir *= -1;
      this.y = this.homeY + Math.sin(time / 520 + this.phase) * 52;
      body.updateFromGameObject();
    } else if (this.mode === "sliding") {
      this.setVelocityX(this.dir * 380);
      if (body.blocked.left || body.blocked.right) {
        this.dir *= -1;
        this.setVelocityX(this.dir * 380);
      }
    } else if (this.mode === "shell") {
      this.setVelocityX(0);
      if (time > this.shellIdleUntil) {
        this.mode = "patrol";
        this.setTexture("shell_0");
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

    this.setFlipX(this.dir > 0);
    this.animTime += delta;
    if (this.animTime > 180 && this.mode === "patrol") {
      this.animTime = 0;
      this.frame2 = 1 - this.frame2;
      const base = this.kind === "walker" ? "walker" : this.kind === "shell" ? "shell" : "flyer";
      this.setTexture(`${base}_${this.frame2}`);
    }
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
