import Phaser from "phaser";
import { TILE } from "../config";
import type { ItemKind, ItemSpawn } from "../types";

const TEXTURE: Record<ItemKind, string> = {
  coin: "coin_0",
  relic: "relic",
  growthOrb: "item_orb",
  fireCrystal: "item_crystal",
  oneUp: "item_oneup",
};

/** Coins, relics and power-ups. Power-ups walk along the ground after spawning. */
export class Collectible extends Phaser.Physics.Arcade.Sprite {
  readonly kind: ItemKind;
  readonly uid: string;
  private t = 0;
  private frame4 = 0;
  private baseY: number;
  walking = false;
  dir = 1;

  constructor(scene: Phaser.Scene, spawn: ItemSpawn, pixel = false) {
    const x = pixel ? spawn.x : spawn.x * TILE + TILE / 2;
    const y = pixel ? spawn.y : spawn.y * TILE + TILE / 2;
    super(scene, x, y, TEXTURE[spawn.type]);
    this.kind = spawn.type;
    this.uid = spawn.id ?? `${spawn.type}:${spawn.x}:${spawn.y}`;
    this.baseY = y;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(12);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setSize(this.width * 0.8, this.height * 0.8, true);
    if (spawn.type === "relic") this.setDepth(13);
  }

  /** Turns a spawned power-up into a moving pickup. */
  startWalking(dir: number): void {
    this.walking = true;
    this.dir = dir;
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(true);
    body.setBounce(0, 0);
    this.setVelocity(dir * 90, -180);
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    this.t += delta;
    if (this.kind === "coin") {
      if (this.t > 110) {
        this.t = 0;
        this.frame4 = (this.frame4 + 1) % 4;
        this.setTexture(`coin_${this.frame4}`);
      }
      return;
    }
    if (this.walking) {
      const body = this.body as Phaser.Physics.Arcade.Body;
      if (body.blocked.left || body.blocked.right) this.dir *= -1;
      this.setVelocityX(this.dir * 90);
      return;
    }
    this.y = this.baseY + Math.sin(time / 320) * 4;
    if (this.kind === "relic") this.setScale(1 + Math.sin(time / 260) * 0.06);
  }
}
