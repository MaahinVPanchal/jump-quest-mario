import Phaser from "phaser";
import { TILE } from "../config";
import type { BlockKind, BlockSpawn, ItemKind } from "../types";

const TEXTURE: Record<BlockKind, string> = {
  question: "block_question",
  brick: "block_brick",
  hidden: "block_question",
  metal: "block_metal",
};

/** Question / brick / hidden / metal blocks share one body with data-driven behaviour. */
export class Block extends Phaser.Physics.Arcade.Sprite {
  readonly kind: BlockKind;
  readonly contains: ItemKind | undefined;
  coinsLeft: number;
  used = false;
  revealed: boolean;

  constructor(scene: Phaser.Scene, spawn: BlockSpawn) {
    super(scene, spawn.x * TILE + TILE / 2, spawn.y * TILE + TILE / 2, TEXTURE[spawn.kind]);
    this.kind = spawn.kind;
    this.contains = spawn.contains;
    this.coinsLeft = spawn.coins ?? (spawn.contains === "coin" ? 1 : 0);
    this.revealed = spawn.kind !== "hidden";
    scene.add.existing(this);
    scene.physics.add.existing(this, true);
    this.setDepth(10);
    this.setVisible(this.revealed);
    if (!this.revealed) {
      const body = this.body as Phaser.Physics.Arcade.StaticBody;
      // hidden blocks only exist for upward hits until revealed
      body.checkCollision.down = true;
      body.checkCollision.up = false;
      body.checkCollision.left = false;
      body.checkCollision.right = false;
    }
  }

  reveal(): void {
    if (this.revealed) return;
    this.revealed = true;
    this.setVisible(true);
    const body = this.body as Phaser.Physics.Arcade.StaticBody;
    body.checkCollision.up = true;
    body.checkCollision.left = true;
    body.checkCollision.right = true;
  }

  markEmpty(): void {
    this.used = true;
    this.setTexture("block_empty");
  }

  bumpAnimation(): void {
    const startY = this.y;
    this.scene.tweens.add({
      targets: this,
      y: startY - 9,
      duration: 80,
      yoyo: true,
      onUpdate: () => (this.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject(),
      onComplete: () => {
        this.y = startY;
        (this.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();
      },
    });
  }
}
