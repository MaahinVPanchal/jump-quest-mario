import Phaser from "phaser";
import { COMBAT, PHYSICS } from "../../config";
import type { InputManager } from "../../systems/input";
import { audio } from "../../systems/audio";
import { MovementController } from "./MovementController";
import type { CharacterData, ThrowKind } from "../../types";
import { DEFAULT_CHARACTER } from "../../data/characters";

export type PowerState = "small" | "big" | "fire" | "monkey" | "cat";

export interface PlayerHooks {
  onFire: (x: number, y: number, dir: number, kind: ThrowKind, power: number) => void;
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

/** Each ability has its own rhythm — heavy attacks are deliberately slow. */
const ABILITY_COOLDOWN: Partial<Record<ThrowKind, number>> = {
  emberBurst: 260,
  bounceShot: 300,
  electricArc: 340,
  knifeThrow: 220,
  shield: 700,
  ninjaStar: 170,
  fireBurst: 620,
  frostShard: 420,
  windBlast: 380,
  groundSmash: 720,
  banana: 260,
  claw: 150,
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
  private transforming = false;
  readonly character: CharacterData;
  /** ARMOR passive: spare hits before a power stage is lost. */
  armorHits = 0;
  /** COMBO EDGE: kills chained without taking a hit. */
  private killStreak = 0;
  /** OVERCHARGE: coins banked toward the next speed surge. */
  private coinCharge = 0;
  private boostUntil = 0;
  private baseSpeedMul = 1;
  private lastFacing = 1;
  private recoveryUntil = 0;
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
    const m = character.move;
    this.movement.speedMul = m.speedMul;
    this.movement.accelMul = m.accelMul;
    this.movement.airControlMul = m.airControlMul;
    this.movement.charJumpMul = m.jumpMul;
    this.movement.glideEnabled = !!m.glide || character.passive === "glide";
    this.movement.knockbackResist = m.knockbackResist ?? (character.passive === "heavyForce" ? 1 : 0);
    this.movement.iceGrip = !!m.iceGrip || character.passive === "iceWalk";
    this.movement.dashDistance = character.canDash ? (m.dashDistance ?? 150) : 0;
    this.baseSpeedMul = m.speedMul;
    // ARMOR / heavy frames soak extra hits before the power stage is lost.
    this.armorHits = Math.max(0, character.maxHealth - 1);
  }

  private applyForm(state: PowerState): void {
    this.power = state;
    const scale = SCALE[state];
    this.sprite.setScale(scale);
    this.sprite.body?.setSize(20, 30);
    (this.sprite.body as Phaser.Physics.Arcade.Body).setOffset(6, 18);
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

  /** The signature ability is intrinsic: every hero can use X from the start. */
  get canThrow(): boolean {
    return true;
  }

  get throwKind(): ThrowKind {
    if (this.power === "monkey") return "banana";
    if (this.power === "cat") return "claw";
    return this.character.ability;
  }

  /** HEAT: Cinder ignores environmental fire / lava. */
  get fireImmune(): boolean {
    return this.character.passive === "heat";
  }

  /** HEAVY FORCE: Titan shatters reinforced and metal blocks. */
  get breaksHeavyBlocks(): boolean {
    return this.character.passive === "heavyForce";
  }

  /** COMBO EDGE ramps damage; other heroes use their flat attack value. */
  get attackPower(): number {
    const combo = this.character.passive === "comboEdge" ? Math.min(2, this.killStreak * 0.5) : 0;
    return this.character.attackDamage + combo;
  }

  /** Scene hook: OVERCHARGE banks coins into short speed surges. */
  onCoin(time: number): void {
    if (this.character.passive !== "overcharge") return;
    this.coinCharge += 1;
    if (this.coinCharge >= 10) {
      this.coinCharge = 0;
      this.boostUntil = time + 4000;
    }
  }

  /** Scene hook: COMBO EDGE counts chained kills. */
  onKill(): void {
    if (this.character.passive === "comboEdge") this.killStreak += 1;
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
    this.killStreak = 0;
    // EMBER RESOLVE: a short adrenaline burst right after being hit.
    if (this.character.passive === "emberResolve") this.boostUntil = time + 1200;
    if (this.armorHits > 0) {
      this.armorHits -= 1;
      this.invulnerableUntil = time + COMBAT.invulnerableMs;
      this.movement.knockback(time, -this.facing);
      audio.play("hurt");
      return false;
    }
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

    this.updatePassives(time);

    const cooldown = ABILITY_COOLDOWN[this.throwKind] ?? COMBAT.fireCooldownMs;
    if (this.input.justPressed("ATTACK") && time - this.lastFire > cooldown) {
      this.lastFire = time;
      const grounded = this.movement.grounded;
      // GROUND SMASH only works with both feet on the floor.
      if (this.throwKind !== "groundSmash" || grounded) {
        this.hooks.onFire(
          this.sprite.x + this.facing * 14,
          this.throwKind === "groundSmash" ? this.sprite.y - 6 : this.sprite.y - 26,
          this.facing,
          this.throwKind,
          this.attackPower,
        );
        audio.play("shoot");
        // AIR STEP: attacking in mid-air grants one small controlled nudge.
        if (this.character.passive === "airStep" && !grounded) {
          this.movement.bankAirStep();
          this.movement.spendAirStep();
        }
      }
    }

    // Dash characters (Blade, Shin) burst forward with RUN tapped in place.
    if (this.character.canDash && this.input.justPressed("RUN")) {
      if (this.movement.tryDash(time)) this.dust(6);
    }

    this.sprite.setFlipX(this.facing < 0);
    this.sprite.setAlpha(time < this.invulnerableUntil && Math.floor(time / 70) % 2 === 0 ? 0.35 : 1);
    this.sprite.setTint(FORM_TINT[this.power]);
    this.animate(time, delta);
  }

  /** Passive upkeep: temporary boosts and air-control tweaks. */
  private updatePassives(time: number): void {
    const boosted = time < this.boostUntil;
    this.movement.speedMul = this.baseSpeedMul * (boosted ? 1.28 : 1);

    // QUICK RECOVERY: turning around in the air sharpens control briefly.
    if (this.character.passive === "quickRecovery") {
      if (this.facing !== this.lastFacing && !this.movement.grounded) this.recoveryUntil = time + 400;
      this.movement.airControlMul =
        this.character.move.airControlMul * (time < this.recoveryUntil ? 1.5 : 1);
    }
    this.lastFacing = this.facing;
  }

  /** NES four-frame run cycle plus dedicated jump / fall / landing poses. */
  private animate(time: number, delta: number): void {
    const s = this.movement.state;
    if (s === "jump") return void this.sprite.setTexture(`${this.prefix}_jump`);
    if (s === "fall") return void this.sprite.setTexture(`${this.prefix}_fall`);
    if (s === "hurt") return void this.sprite.setTexture(`${this.prefix}_hurt`);
    if (time < this.landUntil) return void this.sprite.setTexture(`${this.prefix}_land`);
    if (s === "walk" || s === "run") {
      this.animTime += delta * (s === "run" ? 1.8 : 1);
      if (this.animTime > 90) {
        this.animTime = 0;
        this.animFrame = (this.animFrame + 1) % 4;
      }
      this.sprite.setTexture(`${this.prefix}_walk_${this.animFrame}`);
      return;
    }
    this.animFrame = 0;
    this.animTime = 0;
    this.sprite.setTexture(`${this.prefix}_idle`);
  }
}
