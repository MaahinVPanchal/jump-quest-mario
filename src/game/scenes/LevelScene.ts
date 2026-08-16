import Phaser from "phaser";
import { CAMERA, COLORS, COMBAT, PHYSICS, SCORE, TILE, VIEW } from "../config";
import { LEVEL_1 } from "../levels/level1";
import { getLevel } from "../levels";
import { CHARACTERS, DEFAULT_CHARACTER } from "../data/characters";
import type { LevelData, LevelResult, MovingPlatformSpawn } from "../types";
import { InputManager } from "../systems/input";
import { audio } from "../systems/audio";
import { gameState } from "../systems/state";
import { GameEvent } from "../systems/events";
import { Player } from "../entities/player/Player";
import { Enemy } from "../entities/Enemy";
import { Block } from "../entities/Block";
import { Collectible } from "../entities/Collectible";

interface MovingPlatform {
  sprite: Phaser.Physics.Arcade.Image;
  lastX: number;
  lastY: number;
}

export class LevelScene extends Phaser.Scene {
  private level: LevelData = LEVEL_1;
  private controls!: InputManager;
  private player!: Player;
  private terrain!: Phaser.Physics.Arcade.StaticGroup;
  private blocks!: Phaser.Physics.Arcade.StaticGroup;
  private enemies!: Phaser.Physics.Arcade.Group;
  private items!: Phaser.Physics.Arcade.Group;
  private fireballs!: Phaser.Physics.Arcade.Group;
  private platformGroup!: Phaser.Physics.Arcade.StaticGroup;
  private platforms: MovingPlatform[] = [];
  private dust!: Phaser.GameObjects.Group;
  private pipeZones: { zone: Phaser.GameObjects.Zone; target: { x: number; y: number } }[] = [];
  private checkpointSprites: Phaser.GameObjects.Image[] = [];
  private goalZone!: Phaser.GameObjects.Zone;
  private goalFlag!: Phaser.GameObjects.Image;
  private timeLeft = 0;
  private elapsed = 0;
  private finished = false;
  private respawning = false;
  private transitioning = false;
  private debugText?: Phaser.GameObjects.Text;
  private showHitboxes = false;
  private invincible = false;
  private lastCheckpointIndex = -1;
  private goalLocked = false;
  private airJumpPip?: Phaser.GameObjects.Text;
  private controlHint?: Phaser.GameObjects.Text;

  private get starsRequired(): number {
    return this.level.starsRequired ?? 0;
  }

  private get starsCollected(): number {
    return gameState.starIds.length;
  }

  constructor() {
    super("Level");
  }

  create(): void {
    this.level = getLevel(gameState.levelId);
    const level = this.level;
    this.finished = false;
    this.respawning = false;
    this.transitioning = false;
    this.platforms = [];
    this.pipeZones = [];
    this.checkpointSprites = [];
    this.elapsed = 0;

    const worldW = level.widthTiles * TILE;
    const worldH = level.heightTiles * TILE;
    this.physics.world.setBounds(0, 0, worldW, worldH + 200);
    this.physics.world.gravity.y = PHYSICS.gravity;
    this.cameras.main.setBounds(0, 0, worldW, worldH);
    this.cameras.main.setBackgroundColor(level.skyColor ?? COLORS.sky);

    this.buildParallax(worldW);
    this.buildTerrain();

    this.blocks = this.physics.add.staticGroup();
    for (const spawn of level.blocks) {
      const id = `block:${spawn.x}:${spawn.y}`;
      const block = new Block(this, spawn);
      if (gameState.collectedIds.has(id)) {
        block.markEmpty();
        block.used = true;
        block.reveal();
      }
      this.blocks.add(block);
    }

    this.items = this.physics.add.group({ allowGravity: false });
    // Saved Sky Stars come back with the level so refreshing never loses progress.
    const restored = gameState.restoreStars(
      level.items.filter((i) => i.type === "star").map((i) => i.id ?? `${i.type}:${i.x}:${i.y}`),
    );
    for (const id of restored) gameState.collectedIds.add(id);
    for (const spawn of level.items) {
      const item = new Collectible(this, spawn);
      if (gameState.collectedIds.has(item.uid)) {
        item.destroy();
        continue;
      }
      this.items.add(item);
    }

    this.enemies = this.physics.add.group();
    for (const spawn of level.enemies) this.enemies.add(new Enemy(this, spawn));

    this.fireballs = this.physics.add.group({ maxSize: COMBAT.maxProjectiles, runChildUpdate: false });
    this.dust = this.add.group();

    this.buildPlatforms();
    this.buildPipes();
    this.buildHazards();
    this.buildCheckpoints();
    this.buildGoal();

    this.controls = new InputManager(this);
    const start = gameState.checkpoint ?? {
      x: level.spawn.x * TILE + TILE / 2,
      y: level.spawn.y * TILE + TILE,
      power: "small" as const,
      coins: gameState.coins,
      score: gameState.score,
      timeLeft: level.timeLimit,
    };
    this.timeLeft = gameState.checkpoint ? start.timeLeft : level.timeLimit;

    this.player = new Player(
      this,
      start.x,
      start.y,
      this.controls,
      {
        onFire: (x, y, dir) => this.spawnFireball(x, y, dir),
        onDeath: () => this.handleDeath(),
        onDamage: () => {
          gameState.damageTaken += 1;
          this.shake(CAMERA.shakeBig);
        },
        onPowerChange: () => this.emitHud(),
      },
      CHARACTERS[gameState.characterId] ?? DEFAULT_CHARACTER,
    );
    if (start.power === "big") this.player.grow();
    if (start.power === "fire") this.player.giveFire();

    this.setupCollisions();
    this.setupCamera();
    this.setupTimer();
    this.setupDebug();

    this.scene.launch("Hud");
    this.emitHud();
    audio.startMusic("level");

    this.game.events.emit(GameEvent.Toast, `World ${level.world}-${level.level}  ${level.name}`);
    if (this.starsRequired > 0) {
      this.time.delayedCall(2200, () =>
        this.toast(`Collect ${this.starsRequired} Sky Stars to open the goal`),
      );
    }
    this.buildAbilityUi();
    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scene.stop("Hud");
      audio.stopMusic();
    });
  }

  /**
   * Double-jump characters get a floating pip over their head that lights up
   * while the air jump is banked, plus a persistent on-screen control hint.
   */
  private buildAbilityUi(): void {
    if (!this.player.character.canDoubleJump) return;
    this.airJumpPip = this.add
      .text(0, 0, "^^", {
        fontFamily: "'Press Start 2P', monospace",
        fontSize: "10px",
        color: "#fcd83c",
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0.5, 1)
      .setDepth(30);
    this.controlHint = this.add
      .text(
        this.scale.width / 2,
        this.scale.height - 18,
        `${this.player.character.name.toUpperCase()} DOUBLE JUMP - PRESS JUMP AGAIN IN MID-AIR`,
        {
          fontFamily: "'Press Start 2P', monospace",
          fontSize: "8px",
          color: "#fcfcfc",
          backgroundColor: "#000000",
          padding: { x: 6, y: 4 },
        },
      )
      .setOrigin(0.5, 1)
      .setScrollFactor(0)
      .setDepth(100);
    this.tweens.add({
      targets: this.controlHint,
      alpha: { from: 1, to: 0 },
      delay: 7000,
      duration: 900,
      onComplete: () => this.controlHint?.destroy(),
    });
  }

  private updateAbilityUi(): void {
    const pip = this.airJumpPip;
    if (!pip) return;
    const ready = this.player.movement.airJumpReady && !this.player.dead;
    pip.setVisible(ready);
    if (!ready) return;
    pip.setPosition(this.player.sprite.x, this.player.sprite.y - this.player.sprite.displayHeight - 6);
    pip.setAlpha(0.6 + 0.4 * Math.abs(Math.sin(this.time.now / 160)));
  }

  // ---------------------------------------------------------------- build

  private buildParallax(worldW: number): void {
    const layers: [string, number, number, number][] = [
      ["bg_hills_far", 0.12, 250, 0.9],
      ["bg_hills_near", 0.25, 320, 1],
      ["bg_clouds", 0.18, 40, 1],
      ["bg_trees", 0.45, 420, 1],
    ];
    for (const [key, factor, y, alpha] of layers) {
      const strip = this.add
        .tileSprite(0, y, VIEW.width, this.textures.get(key).getSourceImage().height as number, key)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setAlpha(alpha)
        .setDepth(-10);
      strip.setData("factor", factor);
      strip.setData("parallax", true);
    }
    void worldW;
  }

  private buildTerrain(): void {
    this.terrain = this.physics.add.staticGroup();
    const { tiles, heightTiles, widthTiles } = this.level;
    const visual = this.add.container(0, 0).setDepth(5);
    // Dark void behind the floor line so pits read as bottomless, not as sky.
    const surfaceRow = tiles.findIndex((row) => row.filter((v) => v > 0).length > widthTiles * 0.5);
    const voidTop = (surfaceRow < 0 ? heightTiles - 5 : surfaceRow) * TILE;
    const voidHeight = heightTiles * TILE - voidTop;
    for (let x = 0; x < widthTiles * TILE; x += 1024) {
      const w = Math.min(1024, widthTiles * TILE - x);
      this.add.rectangle(x, voidTop, w, voidHeight, 0x0b0b12).setOrigin(0, 0).setDepth(4);
    }
    for (let y = 0; y < heightTiles; y++) {
      const row = tiles[y]!;
      let runStart = -1;
      for (let x = 0; x <= widthTiles; x++) {
        const index = x < widthTiles ? row[x]! : 0;
        if (index > 0) {
          if (runStart < 0) runStart = x;
          const key = index === 1 ? "tile_top" : index === 2 ? "tile_dirt" : "tile_stone";
          visual.add(this.add.image(x * TILE, y * TILE, key).setOrigin(0, 0));
        } else if (runStart >= 0) {
          const w = (x - runStart) * TILE;
          const body = this.add.rectangle(runStart * TILE + w / 2, y * TILE + TILE / 2, w, TILE);
          body.setVisible(false);
          this.terrain.add(body);
          runStart = -1;
        }
      }
    }
  }

  private buildPlatforms(): void {
    this.platformGroup = this.physics.add.staticGroup();
    for (const spec of this.level.platforms) this.addPlatform(spec);
  }

  private addPlatform(spec: MovingPlatformSpawn): void {
    const width = spec.widthTiles * TILE;
    const sprite = this.physics.add.staticImage(
      spec.x * TILE + width / 2,
      spec.y * TILE,
      "tile_platform",
    );
    sprite.setDisplaySize(width, 16).refreshBody();
    sprite.setDepth(9);
    this.platformGroup.add(sprite);
    const platform: MovingPlatform = { sprite, lastX: sprite.x, lastY: sprite.y };
    this.platforms.push(platform);
    this.tweens.add({
      targets: sprite,
      x: sprite.x + (spec.dx ?? 0) * TILE,
      y: sprite.y + (spec.dy ?? 0) * TILE,
      duration: spec.duration,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1,
      onUpdate: () => sprite.refreshBody(),
    });
  }

  private buildPipes(): void {
    for (const pipe of this.level.pipes) {
      const img = this.physics.add.staticImage(pipe.x * TILE + TILE, pipe.y * TILE + TILE, "pipe");
      img.setDepth(8).refreshBody();
      this.terrain.add(img);
      const zone = this.add.zone(pipe.x * TILE + TILE, pipe.y * TILE + 8, 56, 18);
      this.physics.add.existing(zone, true);
      this.pipeZones.push({ zone, target: pipe.target });
    }
  }

  private buildHazards(): void {
    for (const hazard of this.level.hazards) {
      const spike = this.physics.add.staticImage(hazard.x * TILE + TILE / 2, hazard.y * TILE + TILE - 8, "spike");
      spike.setDepth(9).refreshBody();
      spike.setData("hazard", true);
      this.hazardSprites.push(spike);
    }
  }
  private hazardSprites: Phaser.Physics.Arcade.Image[] = [];

  private buildCheckpoints(): void {
    this.level.checkpoints.forEach((cp, index) => {
      const reached = gameState.checkpoint !== null && index <= this.lastCheckpointIndex;
      const img = this.add
        .image(cp.x * TILE + TILE / 2, cp.y * TILE + TILE, reached ? "checkpoint_on" : "checkpoint")
        .setOrigin(0.5, 1)
        .setDepth(7);
      img.setData("index", index);
      this.checkpointSprites.push(img);
    });
  }

  private buildGoal(): void {
    const gx = this.level.goal.x * TILE + TILE / 2;
    const gy = this.level.goal.y * TILE + TILE;
    this.add.image(gx, gy, "goal_pole").setOrigin(0.5, 1).setDepth(6);
    this.goalFlag = this.add.image(gx + 22, gy - 300, "goal_flag").setOrigin(0, 0).setDepth(7);
    if (this.starsRequired > 0 && this.starsCollected < this.starsRequired) this.goalFlag.setAlpha(0.45);
    this.goalZone = this.add.zone(gx, gy - 160, 48, 320);
    this.physics.add.existing(this.goalZone, true);
  }

  // ---------------------------------------------------------- collisions

  private setupCollisions(): void {
    const sprite = this.player.sprite;
    this.physics.add.collider(sprite, this.terrain);
    this.physics.add.collider(sprite, this.platformGroup);
    this.physics.add.collider(this.enemies, this.terrain);
    this.physics.add.collider(this.enemies, this.platformGroup);
    this.physics.add.collider(this.enemies, this.blocks);
    this.physics.add.collider(this.items, this.terrain);
    this.physics.add.collider(this.items, this.platformGroup);

    this.physics.add.collider(sprite, this.blocks, (_p, b) => this.onBlockCollide(b as unknown as Block));
    this.physics.add.overlap(sprite, this.enemies, (_p, e) => this.onEnemyTouch(e as unknown as Enemy));
    this.physics.add.overlap(sprite, this.items, (_p, i) => this.collect(i as unknown as Collectible));
    this.physics.add.overlap(sprite, this.hazardSprites, () => this.hurtPlayer());
    this.physics.add.overlap(sprite, this.goalZone, () => this.completeLevel());

    this.physics.add.collider(this.fireballs, this.terrain, (f) => this.bounceFireball(f as unknown as Phaser.Physics.Arcade.Image));
    this.physics.add.collider(this.fireballs, this.blocks, (f) => this.bounceFireball(f as unknown as Phaser.Physics.Arcade.Image));
    this.physics.add.overlap(this.fireballs, this.enemies, (f, e) => {
      (f as unknown as Phaser.Physics.Arcade.Image).destroy();
      this.defeatEnemy(e as Enemy, "fire");
    });
    this.physics.add.overlap(this.enemies, this.enemies, (a, b) => {
      const ea = a as Enemy;
      const eb = b as Enemy;
      if (ea.mode === "sliding" && eb.mode !== "dead" && eb !== ea) this.defeatEnemy(eb, "shell");
      else if (eb.mode === "sliding" && ea.mode !== "dead" && ea !== eb) this.defeatEnemy(ea, "shell");
    });
  }

  private onBlockCollide(block: Block): void {
    const body = this.player.sprite.body as Phaser.Physics.Arcade.Body;
    if (!body.blocked.up && !body.touching.up) return;
    if (!block.revealed) block.reveal();
    if (block.used) return;

    block.bumpAnimation();
    this.shake(CAMERA.shakeSmall);

    if (block.kind === "brick") {
      if (this.player.isBig) {
        this.breakBlock(block);
      } else {
        audio.play("block");
      }
      return;
    }
    if (block.kind === "metal") {
      audio.play("block");
      return;
    }

    audio.play("block");
    if (block.coinsLeft > 0) {
      this.popCoin(block.x, block.y - TILE);
      block.coinsLeft -= 1;
      if (block.coinsLeft <= 0) {
        block.markEmpty();
        gameState.collectedIds.add(`block:${Math.round(block.x / TILE - 0.5)}:${Math.round(block.y / TILE - 0.5)}`);
      }
      return;
    }
    if (block.contains && block.contains !== "coin") {
      this.spawnPowerUp(block);
      block.markEmpty();
    } else {
      block.markEmpty();
    }
  }

  private breakBlock(block: Block): void {
    audio.play("break");
    this.shake(CAMERA.shakeBig);
    this.burst(block.x, block.y, COLORS.brick, 10);
    this.addScore(50, block.x, block.y);
    block.destroy();
  }

  private spawnPowerUp(block: Block): void {
    const kind = block.contains;
    if (!kind || kind === "coin") return;
    const item = new Collectible(this, { type: kind, x: block.x, y: block.y - TILE }, true);
    this.items.add(item);
    item.startWalking(this.player.facing >= 0 ? 1 : -1);
    audio.play("powerup");
  }

  private popCoin(x: number, y: number): void {
    const coin = this.add.image(x, y, "coin_0").setDepth(14);
    this.tweens.add({
      targets: coin,
      y: y - 56,
      duration: 260,
      yoyo: true,
      ease: "Quad.easeOut",
      onComplete: () => coin.destroy(),
    });
    this.registerCoin(x, y);
  }

  private registerCoin(x: number, y: number): void {
    audio.play("coin");
    gameState.addCoin();
    this.addScore(SCORE.coin, x, y);
    this.emitHud();
  }

  private collect(item: Collectible): void {
    if (!item.active) return;
    const { x, y } = item;
    switch (item.kind) {
      case "coin":
        gameState.collectedIds.add(item.uid);
        this.registerCoin(x, y);
        this.burst(x, y, COLORS.coin, 5);
        break;
      case "relic":
        gameState.collectedIds.add(item.uid);
        gameState.relicIds.push(item.uid);
        audio.play("checkpoint");
        this.addScore(SCORE.secret, x, y);
        this.burst(x, y, COLORS.relic, 18);
        this.toast("Golden Relic found!");
        break;
      case "star": {
        gameState.collectedIds.add(item.uid);
        gameState.collectStar(item.uid);
        audio.play("life");
        this.addScore(SCORE.secret, x, y);
        this.burst(x, y, COLORS.coin, 22);
        const left = Math.max(0, this.starsRequired - this.starsCollected);
        this.toast(left > 0 ? `Sky Star!  ${left} to go` : "All Sky Stars collected — the goal is open!");
        if (left <= 0) this.unlockGoal();
        break;
      }
      case "growthOrb":
        this.player.grow();
        this.addScore(SCORE.powerUp, x, y);
        this.toast("Growth Orb - break bricks from below!");
        break;
      case "fireCrystal":
        this.player.giveFire();
        this.addScore(SCORE.powerUp, x, y);
        this.toast("Fire Crystal - press X to throw embers");
        break;
      case "oneUp":
        gameState.lives += 1;
        audio.play("life");
        this.toast("Extra life!");
        break;
    }
    item.destroy();
    this.emitHud();
  }

  private onEnemyTouch(enemy: Enemy): void {
    if (enemy.mode === "dead" || this.player.dead || this.finished) return;
    const body = this.player.sprite.body as Phaser.Physics.Arcade.Body;
    const stomping = body.velocity.y > 40 && this.player.sprite.y < enemy.y - enemy.displayHeight * 0.45;

    if (stomping && enemy.stats.stompable) {
      this.player.movement.bounce();
      this.hitStop();
      audio.play("stomp");
      this.burst(enemy.x, enemy.y - 10, 0xffffff, 6);
      const removed = enemy.hit("stomp");
      if (removed) this.defeatEnemy(enemy, "stomp", true);
      else this.addScore(SCORE.enemyBase, enemy.x, enemy.y - 20);
      return;
    }
    if (enemy.kind === "shell" && enemy.mode === "shell") {
      enemy.kickShell(this.player.sprite.x);
      audio.play("block");
      return;
    }
    // A shell we just kicked can't clip us on the same frame.
    if (!enemy.canHurt(this.time.now)) return;
    if (this.invincible) {
      this.defeatEnemy(enemy, "fire");
      return;
    }
    this.hurtPlayer();
  }

  private defeatEnemy(enemy: Enemy, source: "stomp" | "fire" | "shell", alreadyHandled = false): void {
    if (enemy.mode === "dead") return;
    if (!alreadyHandled) {
      const removed = enemy.hit(source);
      if (!removed) return;
    }
    gameState.enemiesDefeated += 1;
    const multiplier = gameState.bumpCombo(this.time.now);
    const points = enemy.stats.score * multiplier;
    this.addScore(points, enemy.x, enemy.y - 20, multiplier > 1 ? `x${multiplier}` : undefined);
    this.burst(enemy.x, enemy.y - 12, 0xfff1a8, 8);
    audio.play("stomp");
    this.emitHud();
  }

  private hurtPlayer(): void {
    if (this.invincible || this.finished) return;
    this.player.takeDamage(this.time.now);
    this.emitHud();
  }

  // ------------------------------------------------------------ feedback

  private addScore(points: number, x?: number, y?: number, label?: string): void {
    gameState.addScore(points);
    if (x !== undefined && y !== undefined) {
      const text = this.add
        .text(x, y, `${label ? `${label} ` : ""}+${points}`, {
          fontFamily: "system-ui, sans-serif",
          fontSize: "16px",
          color: "#fffbe8",
          stroke: "#2b2f3a",
          strokeThickness: 4,
        })
        .setOrigin(0.5)
        .setDepth(40);
      this.tweens.add({ targets: text, y: y - 40, alpha: 0, duration: 700, onComplete: () => text.destroy() });
    }
    this.emitHud();
  }

  spawnDust(x: number, y: number, count: number): void {
    this.burst(x, y, 0xffffff, count, 90);
  }

  private burst(x: number, y: number, color: number, count: number, speed = 140): void {
    for (let i = 0; i < count; i++) {
      const p = this.add.image(x, y, "particle").setTint(color).setDepth(30);
      p.setScale(Phaser.Math.FloatBetween(0.3, 0.8));
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      this.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * Phaser.Math.Between(10, speed),
        y: y + Math.sin(angle) * Phaser.Math.Between(10, speed) - 20,
        alpha: 0,
        scale: 0,
        duration: Phaser.Math.Between(240, 520),
        onComplete: () => p.destroy(),
      });
    }
  }

  private hitStop(): void {
    if (this.physics.world.isPaused) return;
    this.physics.world.pause();
    this.time.delayedCall(COMBAT.hitStopMs, () => {
      if (!this.finished && !this.respawning) this.physics.world.resume();
    });
  }

  private shake(intensity: number): void {
    if (!gameState.save.settings.screenShake) return;
    this.cameras.main.shake(140, intensity);
  }

  private toast(message: string): void {
    this.game.events.emit(GameEvent.Toast, message);
  }

  private emitHud(): void {
    this.game.events.emit(GameEvent.HudUpdate, {
      coins: gameState.coins,
      score: gameState.score,
      lives: gameState.lives,
      time: Math.max(0, Math.ceil(this.timeLeft)),
      power: this.player?.power ?? "small",
      combo: gameState.comboMultiplier(this.time.now),
      world: `${this.level.world}-${this.level.level}`,
      relics: gameState.relicIds.length,
      stars: this.starsCollected,
      starsRequired: this.starsRequired,
    });
  }

  /** Visual cue that the sealed goal is now usable. */
  private unlockGoal(): void {
    this.goalFlag.setAlpha(1);
    this.tweens.add({ targets: this.goalFlag, scale: 1.3, yoyo: true, duration: 220, repeat: 2 });
  }

  // ------------------------------------------------------------ fireball

  private spawnFireball(x: number, y: number, dir: number): void {
    if (this.fireballs.countActive(true) >= COMBAT.maxProjectiles) return;
    const ball = this.physics.add.image(x, y, "fireball");
    this.fireballs.add(ball);
    ball.setDepth(18);
    const body = ball.body as Phaser.Physics.Arcade.Body;
    body.setCircle(8);
    body.setVelocity(dir * COMBAT.projectileSpeed, 120);
    body.setBounce(1, 0.85);
    body.setCollideWorldBounds(false);
    ball.setData("dir", dir);
    this.time.delayedCall(COMBAT.projectileLifeMs, () => {
      if (ball.active) {
        this.burst(ball.x, ball.y, COLORS.crystal, 5);
        ball.destroy();
      }
    });
  }

  private bounceFireball(ball: Phaser.Physics.Arcade.Image): void {
    const body = ball.body as Phaser.Physics.Arcade.Body;
    if (body.blocked.left || body.blocked.right) {
      this.burst(ball.x, ball.y, COLORS.crystal, 6);
      ball.destroy();
      return;
    }
    body.setVelocityX((ball.getData("dir") as number) * COMBAT.projectileSpeed);
  }

  // ------------------------------------------------------------ sequence

  private setupCamera(): void {
    const cam = this.cameras.main;
    cam.startFollow(this.player.sprite, true, CAMERA.lerp, CAMERA.lerp, 0, 80);
    cam.setDeadzone(CAMERA.deadzoneWidth, CAMERA.deadzoneHeight);
  }

  private setupTimer(): void {
    this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        if (this.finished || this.respawning || this.transitioning) return;
        if (this.scene.isPaused()) return;
        this.timeLeft -= 1;
        if (this.timeLeft <= 30 && this.timeLeft > 0 && this.timeLeft % 1 === 0) audio.play("menu");
        if (this.timeLeft <= 0) {
          this.timeLeft = 0;
          this.player.kill();
        }
        this.emitHud();
      },
    });
  }

  private handleDeath(): void {
    if (this.respawning) return;
    this.respawning = true;
    audio.stopMusic();
    gameState.lives -= 1;
    this.emitHud();
    this.time.delayedCall(1500, () => {
      if (gameState.lives <= 0) {
        gameState.persist();
        this.scene.stop("Hud");
        this.scene.start("GameOver");
        return;
      }
      this.scene.restart();
    });
  }

  private completeLevel(): void {
    if (this.finished) return;
    if (this.starsRequired > 0 && this.starsCollected < this.starsRequired) {
      if (!this.goalLocked) {
        this.goalLocked = true;
        this.toast(
          `The goal is sealed — collect ${this.starsRequired - this.starsCollected} more Sky Star${
            this.starsRequired - this.starsCollected === 1 ? "" : "s"
          }`,
        );
        this.time.delayedCall(1400, () => (this.goalLocked = false));
      }
      return;
    }
    this.finished = true;
    this.player.lockControls(true);
    const body = this.player.sprite.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
    audio.stopMusic();
    audio.play("goal");
    this.tweens.add({ targets: this.goalFlag, y: this.goalFlag.y + 250, duration: 900, ease: "Quad.easeOut" });
    this.cameras.main.zoomTo(1.15, 800);

    const timeBonus = Math.ceil(this.timeLeft) * SCORE.timeBonusPerSecond;
    gameState.addScore(SCORE.levelComplete + timeBonus);
    const result: LevelResult = {
      levelId: this.level.id,
      score: gameState.score,
      coins: gameState.levelCoins,
      relics: gameState.relicIds.length,
      relicIds: [...gameState.relicIds],
      enemies: gameState.enemiesDefeated,
      timeLeft: Math.ceil(this.timeLeft),
      timeTaken: Math.round(this.elapsed / 1000),
      damageTaken: gameState.damageTaken,
      stars: this.starsCollected,
      rank: gameState.rankFor(this.timeLeft, this.level.timeLimit),
    };
    gameState.lastResult = result;
    gameState.checkpoint = null;
    gameState.persist(result);

    this.time.delayedCall(1600, () => {
      this.scene.stop("Hud");
      this.scene.start("LevelComplete");
    });
  }

  private travelPipe(target: { x: number; y: number }): void {
    if (this.transitioning) return;
    this.transitioning = true;
    audio.play("pipe");
    this.suppressPipePlants(1400);
    this.player.lockControls(true);
    this.cameras.main.fadeOut(280);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.player.sprite.setPosition(target.x * TILE + TILE / 2, target.y * TILE + TILE);
      this.player.sprite.setVelocity(0, 0);
      this.suppressPipePlants(1400);
      this.cameras.main.fadeIn(280);
      this.time.delayedCall(300, () => {
        this.player.lockControls(false);
        this.transitioning = false;
      });
    });
  }

  private setupDebug(): void {
    if (!import.meta.env.DEV) return;
    this.debugText = this.add
      .text(12, 92, "", {
        fontFamily: "monospace",
        fontSize: "12px",
        color: "#0f172a",
        backgroundColor: "rgba(255,255,255,0.72)",
        padding: { x: 6, y: 4 },
      })
      .setScrollFactor(0)
      .setDepth(100)
      .setVisible(false);

    const keyboard = this.input.keyboard;
    keyboard?.on("keydown-F1", (e: KeyboardEvent) => {
      e.preventDefault();
      this.showHitboxes = !this.showHitboxes;
      this.physics.world.drawDebug = this.showHitboxes;
      if (!this.showHitboxes) this.physics.world.debugGraphic?.clear();
    });
    keyboard?.on("keydown-F2", () => this.debugText?.setVisible(!this.debugText.visible));
    keyboard?.on("keydown-F3", () => this.player.giveFire());
    keyboard?.on("keydown-F4", () => this.player.kill());
    keyboard?.on("keydown-F8", () => {
      for (let i = 0; i < 10; i++) gameState.addCoin();
      this.emitHud();
    });
    keyboard?.on("keydown-F9", () => this.completeLevel());
    keyboard?.on("keydown-F10", () => {
      this.invincible = !this.invincible;
      this.toast(this.invincible ? "Debug invincibility ON" : "Debug invincibility OFF");
    });
  }

  isSolidAt(x: number, y: number): boolean {
    const tx = Math.floor(x / TILE);
    const ty = Math.floor(y / TILE);
    return (this.level.tiles[ty]?.[tx] ?? 0) > 0;
  }

  /** Keeps every pipe plant tucked away while the hero enters or exits a pipe. */
  private suppressPipePlants(ms: number): void {
    for (const e of this.enemies.getChildren() as Enemy[]) e.suppress(ms);
  }

  /** Used by pipe plants so they stay down while the hero is standing on the rim. */
  playerX(): number {
    return this.player?.sprite.x ?? -9999;
  }

  // ------------------------------------------------------------- update

  override update(time: number, delta: number): void {
    this.controls.update();
    if (!this.finished && !this.respawning) this.elapsed += delta;

    if (this.controls.justPressed("PAUSE") && !this.finished && !this.respawning) {
      this.scene.pause();
      this.scene.launch("Pause");
      return;
    }
    if (this.controls.justPressed("RESTART") && !this.respawning && !this.finished) {
      this.player.kill();
      return;
    }

    this.player.update(time, delta);
    this.updateParallax();
    this.updateAbilityUi();
    this.updateRiding();
    this.updateWakeRange();
    this.checkPipes();
    this.checkCheckpoints();

    if (this.player.sprite.y > this.level.heightTiles * TILE + 80 && !this.player.dead) {
      this.player.kill();
    }

    if (this.debugText?.visible) {
      const body = this.player.sprite.body as Phaser.Physics.Arcade.Body;
      this.debugText.setText(
        [
          `fps ${Math.round(this.game.loop.actualFps)}`,
          `pos ${Math.round(this.player.sprite.x)},${Math.round(this.player.sprite.y)}`,
          `vel ${Math.round(body.velocity.x)},${Math.round(body.velocity.y)}`,
          `grounded ${this.player.movement.grounded}`,
          `state ${this.player.movement.state}  power ${this.player.power}`,
          `enemies ${this.enemies.countActive(true)}  shots ${this.fireballs.countActive(true)}`,
          `checkpoint ${gameState.checkpoint ? "yes" : "no"}  time ${Math.ceil(this.timeLeft)}`,
        ].join("\n"),
      );
    }
  }

  private updateParallax(): void {
    const scrollX = this.cameras.main.scrollX;
    for (const child of this.children.list) {
      if (child instanceof Phaser.GameObjects.TileSprite && child.getData("parallax")) {
        child.tilePositionX = scrollX * (child.getData("factor") as number);
      }
    }
  }

  private updateRiding(): void {
    const body = this.player.sprite.body as Phaser.Physics.Arcade.Body;
    for (const platform of this.platforms) {
      const dx = platform.sprite.x - platform.lastX;
      const dy = platform.sprite.y - platform.lastY;
      const onTop =
        body.blocked.down &&
        Math.abs(this.player.sprite.x - platform.sprite.x) < platform.sprite.displayWidth / 2 + 12 &&
        Math.abs(this.player.sprite.y - (platform.sprite.y - 8)) < 14;
      if (onTop) {
        this.player.sprite.x += dx;
        this.player.sprite.y += dy;
      }
      platform.lastX = platform.sprite.x;
      platform.lastY = platform.sprite.y;
    }
  }

  /** Enemies stay dormant (and cost nothing) until they approach the view. */
  private updateWakeRange(): void {
    const camLeft = this.cameras.main.scrollX - 120;
    const camRight = this.cameras.main.scrollX + VIEW.width + 240;
    for (const obj of this.enemies.getChildren()) {
      const enemy = obj as Enemy;
      if (!enemy.awake && enemy.x > camLeft && enemy.x < camRight) enemy.wake();
    }
  }

  private checkPipes(): void {
    if (this.transitioning || !this.controls.isDown("CROUCH")) return;
    const body = this.player.sprite.body as Phaser.Physics.Arcade.Body;
    if (!body.blocked.down) return;
    for (const { zone, target } of this.pipeZones) {
      if (Math.abs(zone.x - this.player.sprite.x) < 30 && Math.abs(zone.y - this.player.sprite.y) < 40) {
        this.travelPipe(target);
        return;
      }
    }
  }

  private checkCheckpoints(): void {
    this.checkpointSprites.forEach((img, index) => {
      if (img.texture.key === "checkpoint_on") return;
      if (Math.abs(img.x - this.player.sprite.x) < 40 && Math.abs(img.y - this.player.sprite.y) < 90) {
        img.setTexture("checkpoint_on");
        this.lastCheckpointIndex = index;
        gameState.checkpoint = {
          x: this.player.sprite.x,
          y: this.player.sprite.y,
          power: this.player.power,
          coins: gameState.coins,
          score: gameState.score,
          timeLeft: this.timeLeft,
        };
        gameState.persist();
        audio.play("checkpoint");
        this.burst(img.x, img.y - 60, COLORS.checkpoint, 16);
        this.toast("Checkpoint reached");
      }
    });
  }
}
