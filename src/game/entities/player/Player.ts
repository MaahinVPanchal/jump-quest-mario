import { HERO_GRID, HERO_PX } from "@/game/art/heroes";
import Phaser from "phaser";
import { COMBAT, PHYSICS } from "../../config";
import type { InputManager } from "../../systems/input";
import { audio } from "../../systems/audio";
import { MovementController } from "./MovementController";
import type { CharacterData, ThrowKind } from "../../types";
import { DEFAULT_CHARACTER } from "../../data/characters";

export type PowerState = "small" | "big" | "fire" | "monkey" | "cat";

export interface PlayerHooks {
  onFire: (x: number, y: number, dir: number, kind: ThrowKind) => void;
  onDeath: () => void;
  onDamage: () => void;
  onPowerChange: (state: PowerState) => void;
}

const SCALE: Record<PowerState, number> = { small: 1.4, big: 2, fire: 2, monkey: 1.9, cat: 1.9 };

/** Extra jump height granted by the animal forms. */
const JUMP_SCALE: Record<PowerState, number> = {
  small: 1,
  big: 1,
  fire: 1,
  monkey: 1.18,
  cat: 1.3,
};

const FORM_TINT: Record<PowerState, number> = {
  small: 0xffffff,
  big: 0xffffff,
  fire: 0xffd9c2,
  monkey: 0xffe28a,
  cat: 0xc8f0ff,
};

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
  private landUntil = 0;
  private attackUntil = 0;
  private transforming = false;
  readonly character: CharacterData;
  private prefix: string;

  constructor(
    private scene: Phaser.Scene,
    x: number,
    y: number,
    private input: InputManager,
    private hooks: PlayerHooks,
    character: CharacterData = DEFAULT_CHARACTER,
  ) {
    this.character = character;
    this.prefix = character.spritePrefix;
    this.sprite = scene.physics.add.sprite(x, y, `${this.prefix}_idle`);
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
        this.landUntil = this.scene.time.now + 120;
      },
    };
    this.movement = new MovementController(this.host, input);
    this.movement.canDoubleJump = character.canDoubleJump;
  }

  private applyForm(state: PowerState): void {
    this.power = state;
    // Sprites are authored at 16px but rendered at HERO_GRID px, so divide the
    // display scale (and multiply the body) by that density factor to keep the
    // hero exactly the same size on screen at any detail level.
    const density = (HERO_GRID * HERO_PX) / 32;
    const scale = (SCALE[state] * (this.character?.sizeScale ?? 1)) / density;
    this.sprite.setScale(scale);
    this.sprite.body?.setSize(20 * density, 30 * density);
    (this.sprite.body as Phaser.Physics.Arcade.Body).setOffset(6 * density, 18 * density);
    if (this.movement) {
      this.movement.jumpScale = JUMP_SCALE[state];
      // Cat form claws the air: everyone gets an air jump while transformed.
      this.movement.canDoubleJump = this.character.canDoubleJump || state === "cat";
    }
    this.hooks.onPowerChange(state);
  }

  get facing(): number {
    return this.host.facing;
  }

  get isBig(): boolean {
    return this.power !== "small";
  }

  /** Every powered form can throw; the projectile differs per form and hero. */
  get canThrow(): boolean {
    return this.power === "fire" || this.power === "monkey" || this.power === "cat";
  }

  get throwKind(): ThrowKind {
    if (this.power === "monkey") return "banana";
    if (this.power === "cat") return "claw";
    return this.character.throwable ?? "fireball";
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

  /** Banana: monkey form — higher jumps and thrown bananas. */
  giveMonkey(): void {
    this.transforming = true;
    if (this.power === "small") this.sprite.y -= 6;
    this.applyForm("monkey");
    this.scene.time.delayedCall(220, () => (this.transforming = false));
    audio.play("powerup");
  }

  /** Cat bell: cat form — claw shots, an air jump and the highest leap. */
  giveCat(): void {
    this.transforming = true;
    if (this.power === "small") this.sprite.y -= 6;
    this.applyForm("cat");
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
    this.sprite.setTexture(`${this.prefix}_hurt`);
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

    const cooldown = this.power === "cat" ? COMBAT.fireCooldownMs * 0.6 : COMBAT.fireCooldownMs;
    if (this.canThrow && this.input.justPressed("ATTACK") && time - this.lastFire > cooldown) {
      this.lastFire = time;
      this.hooks.onFire(this.sprite.x + this.facing * 14, this.sprite.y - 26, this.facing, this.throwKind);
      this.attackUntil = time + 240;
      audio.play("shoot");
    }

    this.sprite.setFlipX(this.facing < 0);
    this.sprite.setAlpha(time < this.invulnerableUntil && Math.floor(time / 70) % 2 === 0 ? 0.35 : 1);
    this.sprite.setTint(FORM_TINT[this.power]);
    this.animate(time, delta);
  }

  /** NES four-frame run cycle plus dedicated jump / fall / landing poses. */
  private animate(time: number, delta: number): void {
    const s = this.movement.state;
    // Weapon poses win over everything except death: the swing must be visible.
    if (time < this.attackUntil) {
      const frame = Math.min(2, Math.floor((240 - (this.attackUntil - time)) / 80));
      return void this.sprite.setTexture(`${this.prefix}_attack_${frame}`);
    }
    if (s === "jump") return void this.sprite.setTexture(`${this.prefix}_jump`);
    if (s === "fall") return void this.sprite.setTexture(`${this.prefix}_fall`);
    if (s === "hurt") return void this.sprite.setTexture(`${this.prefix}_hurt`);
    if (time < this.landUntil) return void this.sprite.setTexture(`${this.prefix}_land`);
    if (s === "walk" || s === "run") {
      // Skid frame while turning against momentum, like the classic slide-stop.
      const vx = (this.sprite.body as Phaser.Physics.Arcade.Body).velocity.x;
      if (Math.abs(vx) > 60 && Math.sign(vx) !== this.facing) {
        return void this.sprite.setTexture(`${this.prefix}_skid`);
      }
      this.animTime += delta * (s === "run" ? 1.8 : 1);
      if (this.animTime > 70) {
        this.animTime = 0;
        this.animFrame = (this.animFrame + 1) % 4;
      }
      this.sprite.setTexture(`${this.prefix}_walk_${this.animFrame}`);
      return;
    }
    // Idle breathing cycle so heroes never look frozen.
    this.animFrame = 0;
    this.animTime += delta;
    if (this.animTime > 1400) this.animTime = 0;
    this.sprite.setTexture(this.animTime > 1100 ? `${this.prefix}_idle2` : `${this.prefix}_idle`);
  }
}
