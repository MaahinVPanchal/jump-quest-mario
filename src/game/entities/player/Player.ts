import Phaser from "phaser";
import { COMBAT, PHYSICS } from "../../config";
import type { InputManager } from "../../systems/input";
import { audio } from "../../systems/audio";
import { MovementController } from "./MovementController";

export type PowerState = "small" | "big" | "fire";

export interface PlayerHooks {
  onFire: (x: number, y: number, dir: number) => void;
  onDeath: () => void;
  onDamage: () => void;
  onPowerChange: (state: PowerState) => void;
}

const SCALE: Record<PowerState, number> = { small: 0.68, big: 1, fire: 1 };

/** Thin façade: state + wiring only; behaviour lives in the controllers. */
export class Player {
  sprite: Phaser.Physics.Arcade.Sprite;
  movement: MovementController;
  private host: { sprite: Phaser.Physics.Arcade.Sprite; facing: number; onJump: () => void; onLand: () => void };
  power: PowerState = "small";
  invulnerableUntil = 0;
  dead = false;
  private lastFire = 0;
  private animTime = 0;
  private animFrame = 0;
  private transforming = false;

  constructor(
    private scene: Phaser.Scene,
    x: number,
    y: number,
    private input: InputManager,
    private hooks: PlayerHooks,
  ) {
    this.sprite = scene.physics.add.sprite(x, y, "hero_idle");
    this.sprite.setOrigin(0.5, 1);
    this.sprite.setDepth(20);
    this.sprite.setCollideWorldBounds(true);
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setMaxVelocityY(PHYSICS.maxFallSpeed);
    this.applyForm("small");
    this.host = {
      sprite: this.sprite,
      facing: 1,
      onJump: () => {
        audio.play("jump");
        this.dust(6);
      },
      onLand: () => {
        audio.play("land");
        this.dust(8);
      },
    };
    this.movement = new MovementController(this.host, input);
  }

  private applyForm(state: PowerState): void {
    this.power = state;
    const scale = SCALE[state];
    this.sprite.setScale(scale);
    this.sprite.body?.setSize(20, 44);
    (this.sprite.body as Phaser.Physics.Arcade.Body).setOffset(6, 4);
    this.hooks.onPowerChange(state);
  }

  get facing(): number {
    return this.host.facing;
  }

  get isBig(): boolean {
    return this.power !== "small";
  }

  grow(): void {
    if (this.power === "small") {
      this.transforming = true;
      this.sprite.y -= 6;
      this.applyForm("big");
      this.scene.time.delayedCall(220, () => (this.transforming = false));
    }
    audio.play("powerup");
  }

  giveFire(): void {
    this.transforming = true;
    if (this.power === "small") this.sprite.y -= 6;
    this.applyForm("fire");
    this.scene.time.delayedCall(220, () => (this.transforming = false));
    audio.play("powerup");
  }

  takeDamage(time: number): boolean {
    if (this.dead || time < this.invulnerableUntil || this.transforming) return false;
    this.hooks.onDamage();
    if (this.power !== "small") {
      this.applyForm("small");
      this.invulnerableUntil = time + COMBAT.invulnerableMs;
      this.movement.knockback(time, -this.facing);
      audio.play("hurt");
      return false;
    }
    this.kill();
    return true;
  }

  kill(): void {
    if (this.dead) return;
    this.dead = true;
    this.movement.state = "dead";
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(true);
    body.checkCollision.none = true;
    body.setVelocity(0, -520);
    this.sprite.setTexture("hero_hurt");
    audio.play("death");
    this.hooks.onDeath();
  }

  lockControls(locked: boolean): void {
    this.movement.controlsLocked = locked;
    if (locked) this.sprite.setVelocityX(0);
  }

  dust(count: number): void {
    const emitterScene = this.scene as Phaser.Scene & { spawnDust?: (x: number, y: number, n: number) => void };
    emitterScene.spawnDust?.(this.sprite.x, this.sprite.y, count);
  }

  update(time: number, delta: number): void {
    if (this.dead) {
      this.sprite.angle += delta * 0.3;
      return;
    }
    this.movement.update(time, delta);

    if (this.power === "fire" && this.input.justPressed("ATTACK") && time - this.lastFire > COMBAT.fireCooldownMs) {
      this.lastFire = time;
      this.hooks.onFire(this.sprite.x + this.facing * 14, this.sprite.y - 26, this.facing);
      audio.play("shoot");
    }

    this.sprite.setFlipX(this.facing < 0);
    this.sprite.setAlpha(time < this.invulnerableUntil && Math.floor(time / 70) % 2 === 0 ? 0.35 : 1);
    this.sprite.setTint(this.power === "fire" ? 0xffd9c2 : 0xffffff);
    this.animate(delta);
  }

  private animate(delta: number): void {
    const s = this.movement.state;
    if (s === "jump") return void this.sprite.setTexture("hero_jump");
    if (s === "fall") return void this.sprite.setTexture("hero_fall");
    if (s === "hurt") return void this.sprite.setTexture("hero_hurt");
    if (s === "walk" || s === "run") {
      this.animTime += delta * (s === "run" ? 1.7 : 1);
      if (this.animTime > 110) {
        this.animTime = 0;
        this.animFrame = 1 - this.animFrame;
      }
      this.sprite.setTexture(`hero_walk_${this.animFrame}`);
      return;
    }
    this.sprite.setTexture("hero_idle");
  }
}
