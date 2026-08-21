import Phaser from "phaser";
import { JUMP, MOVE } from "../../config";
import type { InputManager } from "../../systems/input";

export type MoveState = "idle" | "walk" | "run" | "jump" | "fall" | "land" | "hurt" | "dead";

interface Host {
  sprite: Phaser.Physics.Arcade.Sprite;
  facing: number;
  onJump: () => void;
  onLand: () => void;
}

/** Responsive platformer movement: accel/friction, coyote time, jump buffer, variable height. */
export class MovementController {
  state: MoveState = "idle";
  private coyote = 0;
  private buffer = 0;
  private wasGrounded = false;
  private jumping = false;
  /** Granted by characters with an air jump (e.g. Mira). */
  canDoubleJump = false;
  /** Form multiplier for jump height (monkey / cat forms jump higher). */
  jumpScale = 1;
  private airJumpUsed = false;
  controlsLocked = false;
  /** Environment modifiers (world profile + local zones). */
  frictionScale = 1;
  speedScale = 1;
  envJumpScale = 1;
  /** Water: repeatable strokes instead of grounded jumps. */
  swimming = false;
  /** Horizontal push from wind / current zones, px/s^2. */
  windForce = 0;
  knockbackUntil = 0;

  // ---- per-character identity (set from CharacterData.move) ----
  speedMul = 1;
  accelMul = 1;
  airControlMul = 1;
  charJumpMul = 1;
  /** Aero: hold jump while falling for a slow descent. */
  glideEnabled = false;
  gliding = false;
  /** 0 = normal knockback, 1 = immovable (Titan). */
  knockbackResist = 0;
  /** Frost keeps traction on slippery ground. */
  iceGrip = false;
  dashDistance = 0;
  private dashUntil = 0;
  private dashReadyAt = 0;
  /** Shin's air step: one small mid-air nudge per jump, granted by attacking. */
  private airStepBanked = false;

  constructor(
    private host: Host,
    private input: InputManager,
  ) {}

  get grounded(): boolean {
    const body = this.host.sprite.body as Phaser.Physics.Arcade.Body | null;
    return !!body && (body.blocked.down || body.touching.down);
  }

  /** True while a mid-air jump is still banked (double-jump characters only). */
  get airJumpReady(): boolean {
    return this.canDoubleJump && !this.airJumpUsed && !this.grounded && !this.controlsLocked;
  }

  update(time: number, deltaMs: number): void {
    const body = this.host.sprite.body as Phaser.Physics.Arcade.Body | null;
    if (!body) return;
    const dt = Math.min(deltaMs, 50) / 1000;
    const grounded = this.grounded;

    if (grounded) this.coyote = JUMP.coyoteMs;
    else this.coyote = Math.max(0, this.coyote - deltaMs);
    if (grounded) {
      this.airJumpUsed = false;
      this.airStepBanked = false;
    }

    if (this.input.justPressed("JUMP")) this.buffer = JUMP.bufferMs;
    else this.buffer = Math.max(0, this.buffer - deltaMs);

    if (grounded && !this.wasGrounded && this.state !== "dead") this.host.onLand();
    this.wasGrounded = grounded;

    if (this.state === "dead") return;

    const knocked = time < this.knockbackUntil;
    const axis = this.controlsLocked || knocked ? 0 : this.input.axisX();
    const running = this.input.isDown("RUN");
    const maxSpeed = (running ? MOVE.runSpeed : MOVE.walkSpeed) * this.speedScale * this.speedMul;

    if (axis !== 0) {
      this.host.facing = axis;
      const turning = Math.sign(body.velocity.x) === -axis && body.velocity.x !== 0;
      const accel =
        (grounded ? MOVE.groundAccel * this.accelMul : MOVE.airAccel * this.airControlMul) *
        (turning ? MOVE.turnBoost : 1);
      body.velocity.x += axis * accel * dt;
      body.velocity.x = Phaser.Math.Clamp(body.velocity.x, -maxSpeed, maxSpeed);
    } else if (!knocked) {
      const slip = this.iceGrip ? Math.max(this.frictionScale, 0.9) : this.frictionScale;
      const friction = (grounded ? MOVE.groundFriction : MOVE.airFriction) * slip * dt;
      if (Math.abs(body.velocity.x) <= friction) body.velocity.x = 0;
      else body.velocity.x -= Math.sign(body.velocity.x) * friction;
    }

    if (this.windForce !== 0 && !this.controlsLocked) {
      body.velocity.x = Phaser.Math.Clamp(
        body.velocity.x + this.windForce * dt,
        -maxSpeed * 1.6,
        maxSpeed * 1.6,
      );
    }

    // Water: JUMP is a repeatable swim stroke, capped so ascent stays gentle.
    if (this.swimming) {
      if ((this.buffer > 0 || this.input.isDown("JUMP")) && !this.controlsLocked) {
        const airJump = this.canDoubleJump && !this.grounded && !this.airJumpUsed;
        body.velocity.y = Math.max(airJump ? -380 : -320, body.velocity.y - (airJump ? 330 : 280));
        if (airJump) this.airJumpUsed = true;
        this.buffer = 0;
        this.host.onJump();
      }
      if (this.state !== "hurt") {
        this.state = Math.abs(body.velocity.x) > 8 ? "walk" : "idle";
        if (!grounded && body.velocity.y < -10) this.state = "jump";
      }
      return;
    }

    if (this.buffer > 0 && this.coyote > 0 && !this.controlsLocked) {
      const bonus = Math.abs(body.velocity.x) > MOVE.walkSpeed ? JUMP.runBonus : 0;
      body.velocity.y = (JUMP.velocity + bonus) * this.jumpScale * this.envJumpScale * this.charJumpMul;
      this.buffer = 0;
      this.coyote = 0;
      this.jumping = true;
      this.host.onJump();
    } else if (
      this.buffer > 0 &&
      this.canDoubleJump &&
      !this.airJumpUsed &&
      !grounded &&
      !this.controlsLocked
    ) {
      body.velocity.y = JUMP.velocity * 0.86 * this.jumpScale * this.envJumpScale * this.charJumpMul;
      this.buffer = 0;
      this.airJumpUsed = true;
      this.jumping = true;
      this.host.onJump();
    }

    // Aero glide: falling with JUMP held clamps descent to a gentle float.
    this.gliding = false;
    if (this.glideEnabled && !grounded && body.velocity.y > 40 && this.input.isDown("JUMP")) {
      body.velocity.y = Math.min(body.velocity.y, 120);
      this.gliding = true;
    }

    if (time < this.dashUntil) {
      body.velocity.x = this.host.facing * Math.max(maxSpeed * 1.7, 520);
    }

    if (this.jumping && body.velocity.y < 0 && this.input.justReleased("JUMP")) {
      body.velocity.y *= JUMP.cutMultiplier;
      this.jumping = false;
    }
    if (body.velocity.y >= 0) this.jumping = false;

    if (this.state !== "hurt") {
      if (!grounded) this.state = body.velocity.y < 0 ? "jump" : "fall";
      else if (Math.abs(body.velocity.x) > MOVE.walkSpeed + 10) this.state = "run";
      else if (Math.abs(body.velocity.x) > 8) this.state = "walk";
      else this.state = "idle";
    }
  }

  /** Short forward burst (Blade / Shin). Returns false while on cooldown. */
  tryDash(time: number): boolean {
    if (this.dashDistance <= 0 || time < this.dashReadyAt || this.controlsLocked) return false;
    this.dashUntil = time + 150;
    this.dashReadyAt = time + 900;
    return true;
  }

  /** Shin banks one air step per jump; spend it for a small controlled nudge. */
  bankAirStep(): void {
    this.airStepBanked = true;
  }

  spendAirStep(): boolean {
    const body = this.host.sprite.body as Phaser.Physics.Arcade.Body | null;
    if (!body || !this.airStepBanked || this.grounded) return false;
    this.airStepBanked = false;
    body.velocity.x = this.host.facing * Math.max(Math.abs(body.velocity.x), 300);
    body.velocity.y = Math.min(body.velocity.y, -140);
    return true;
  }

  bounce(): void {
    const body = this.host.sprite.body as Phaser.Physics.Arcade.Body | null;
    if (!body) return;
    body.velocity.y = this.input.isDown("JUMP") ? JUMP.velocity : JUMP.bounceVelocity;
    this.jumping = true;
    this.airJumpUsed = false;
  }

  knockback(time: number, dir: number): void {
    const body = this.host.sprite.body as Phaser.Physics.Arcade.Body | null;
    if (!body) return;
    const resist = 1 - Math.min(1, this.knockbackResist);
    body.velocity.x = dir * 220 * resist;
    body.velocity.y = -320 * Math.max(0.4, resist);
    this.knockbackUntil = time + 220 * resist;
  }
}
