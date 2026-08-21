import type { LevelData } from "../types";
import { LevelBuilder, T } from "./builder";
import { getWorld } from "./worlds";

interface Recipe {
  world: number;
  level: number;
  name: string;
  identity: string;
  objective?: string;
  design: () => LevelData;
}

const mix = (w: number) => getWorld(w).enemies;

/** Common closing beat: a short run-up and the goal pole on solid ground. */
function finish(b: LevelBuilder, x: number): void {
  b.ground(x, b.width - 1);
  b.goal = { x: b.width - 6, y: b.surface - 1 };
}

// ============================================================ WORLD 1
// Grass, bridges and gentle hills. Teaches the vocabulary.

function w1_1(): LevelData {
  const b = new LevelBuilder(190);
  b.ground(0, 44).ground(50, 84).ground(90, 132).ground(139, 189);
  b.coinArc(12, b.surface - 4);
  b.block("question", 16, b.surface - 4, "coin", 3);
  b.block("brick", 17, b.surface - 4).block("question", 18, b.surface - 4, "growthOrb");
  b.enemy("walker", 26, b.surface - 1, 70);
  b.stairs(34, b.surface - 1, 4, 1, T.TOP);
  b.checkpoint(46);
  b.blockRow("brick", 56, b.surface - 5, 4).block("hidden", 60, b.surface - 5, "oneUp");
  b.patrol(mix(1), 56, 84, 3);
  b.coins(62, b.surface - 2, 6);
  b.ledge(96, b.surface - 5, 5).coins(97, b.surface - 7, 4);
  b.platform(85, b.surface - 3, 3, { dx: 4 }, 2600);
  b.checkpoint(112);
  b.pipe(120, b.surface - 2, { x: 150, y: b.surface - 1 }, "Meadow tunnel");
  b.secretRoom(150, b.height - 2, 8, "oneUp");
  b.relic(104, b.surface - 9, 1, 1);
  b.patrol(mix(1), 140, 176, 3);
  finish(b, 139);
  return b.build({ world: 1, level: 1, name: "Tutorial Meadow", identity: "tutorial", objective: "Reach the goal", widthTiles: 190, timeLimit: 320 });
}

function w1_2(): LevelData {
  const b = new LevelBuilder(200);
  b.ground(0, 30);
  b.bridge(34, 48, b.surface - 2).bridge(58, 70, b.surface - 4);
  b.platform(50, b.surface - 3, 3, { dx: 6 }, 2800);
  b.platform(72, b.surface - 6, 2, { dy: -4 }, 2200);
  b.ground(80, 120);
  b.checkpoint(84);
  b.blockRow("falling", 92, b.surface - 4, 5);
  b.patrol(mix(1), 84, 118, 4);
  b.bridge(126, 142, b.surface - 3);
  b.platform(144, b.surface - 4, 3, { dx: 5 }, 2400);
  b.coinArc(128, b.surface - 6, 7);
  b.relic(136, b.surface - 8, 1, 2);
  b.checkpoint(160, b.surface - 1);
  b.ground(156, 199);
  b.patrol(mix(1), 160, 190, 3);
  finish(b, 156);
  return b.build({ world: 1, level: 2, name: "Broken Bridge", identity: "moving platforms", objective: "Cross the collapsed spans", widthTiles: 200 });
}

function w1_3(): LevelData {
  const b = new LevelBuilder(180, 30);
  b.ground(0, 26);
  b.stairs(28, b.surface - 1, 6, 1, T.TOP);
  b.zigzag(38, b.surface - 3, 6, 5, 3, 3);
  b.checkpoint(34);
  b.ledge(70, b.surface - 16, 6).coins(71, b.surface - 18, 5);
  b.zigzag(78, b.surface - 4, 7, 6, 3, 3);
  b.patrol(mix(1), 40, 110, 5);
  b.tower(118, b.surface - 1, 10, 4);
  b.ledge(112, b.surface - 12, 4);
  b.relic(120, b.surface - 14, 1, 3);
  b.checkpoint(126, b.surface - 1);
  b.ground(124, 179);
  b.blockRow("brick", 134, b.surface - 6, 6).block("question", 137, b.surface - 10, "fireCrystal");
  b.patrol(mix(1), 130, 172, 4);
  finish(b, 124);
  return b.build({ world: 1, level: 3, name: "Hilltop Run", identity: "vertical climb", objective: "Climb to the summit", widthTiles: 180 });
}

function w1_4(): LevelData {
  const b = new LevelBuilder(170);
  b.ground(0, 169);
  // Fortress hall: a high ceiling that never traps the player against a wall.
  b.ceiling(20, 150, 3, 2);
  // Low gateways you hop through, each with a step-up brick on the approach.
  b.arch(24, b.surface - 1, 4, 6).arch(44, b.surface - 1, 4, 6);
  b.block("brick", 22, b.surface - 3).block("brick", 42, b.surface - 3);
  b.hazard(34, b.surface - 1, 2).hazard(56, b.surface - 1, 2);
  b.platform(64, b.surface - 5, 3, { dy: -5 }, 2000);
  b.checkpoint(70);
  b.blockRow("metal", 80, b.surface - 6, 8);
  b.blockRow("brick", 88, b.surface - 3, 3);
  b.patrol(mix(1), 20, 110, 6);
  b.block("question", 76, b.surface - 4, "growthOrb");
  // Battlement before the arena: a climbable staircase, not a sheer wall.
  b.stairs(118, b.surface - 1, 4, 1, T.STONE);
  b.stairs(125, b.surface - 1, 4, -1, T.STONE);
  b.coins(121, b.surface - 6, 3);
  // Open arena floor for the guardian fight.
  b.checkpoint(132);
  b.setBoss("guardian", "Meadow Guardian", 3, 146, b.surface - 3);
  b.goal = { x: 164, y: b.surface - 1 };
  return b.build({ world: 1, level: 4, name: "Emberleaf Fortress", identity: "fortress + boss", objective: "Defeat the Meadow Guardian", widthTiles: 170, timeLimit: 340 });
}



// ============================================================ WORLD 2
// Vertical forest: climbs, hanging platforms, threats above and below.

function w2_1(): LevelData {
  const b = new LevelBuilder(180, 34);
  b.ground(0, 24);
  b.shaft(30, 6, b.surface, 2, 4, 4);
  b.checkpoint(26);
  b.ground(44, 70);
  b.islands(46, b.surface - 8, 4, 4, 3, -2);
  b.patrol(mix(2), 44, 70, 4);
  b.shaft(80, 4, b.surface, 2, 3, 3);
  b.relic(86, 8, 2, 1);
  b.ground(96, 130);
  b.checkpoint(100);
  b.blockRow("brick", 104, b.surface - 5, 5).block("question", 106, b.surface - 9, "banana");
  b.patrol(mix(2), 100, 130, 4);
  b.zigzag(136, b.surface - 3, 6, 5, 4, 3);
  finish(b, 150);
  return b.build({ world: 2, level: 1, name: "Vine Ascent", identity: "vines and shafts", objective: "Climb the canopy shafts", widthTiles: 180, heightTiles: 34 });
}

function w2_2(): LevelData {
  const b = new LevelBuilder(200, 32);
  b.ground(0, 18);
  for (let i = 0; i < 18; i++) b.ledge(24 + i * 10, b.surface - 6 - (i % 4) * 3, 6);
  for (let i = 0; i < 6; i++) b.platform(30 + i * 28, b.surface - 12 - (i % 3) * 3, 3, i % 2 ? { dy: -4 } : { dx: 5 }, 2400 + i * 120);
  b.patrol(["flyer", "flyer", "spiker"], 30, 180, 8, b.surface - 10);
  b.checkpoint(70, b.surface - 12);
  b.ledge(66, b.surface - 11, 8);
  b.checkpoint(140, b.surface - 14);
  b.ledge(136, b.surface - 13, 8);
  b.relic(110, b.surface - 22, 2, 2);
  b.coinArc(50, b.surface - 14, 6).coinArc(120, b.surface - 18, 6);
  finish(b, 182);
  return b.build({ world: 2, level: 2, name: "Canopy Walk", identity: "hanging platforms", objective: "Never touch the forest floor", widthTiles: 200, heightTiles: 32, starsRequired: 3 });
}

function w2_3(): LevelData {
  const b = new LevelBuilder(190, 30);
  b.ground(0, 190);
  b.ceiling(10, 180, 0, 2);
  for (let i = 0; i < 14; i++) b.block("falling", 20 + i * 11, b.surface - 4 - (i % 3) * 3);
  for (let i = 0; i < 8; i++) b.hazard(28 + i * 20, b.surface - 1, 2);
  b.patrol(mix(2), 20, 175, 8);
  b.checkpoint(64);
  b.checkpoint(126);
  b.block("question", 70, b.surface - 8, "banana");
  b.relic(150, b.surface - 9, 2, 3);
  finish(b, 178);
  return b.build({ world: 2, level: 3, name: "Falling Branches", identity: "falling platforms", objective: "Keep moving — branches give way", widthTiles: 190, heightTiles: 30 });
}

function w2_4(): LevelData {
  const b = new LevelBuilder(170, 30);
  b.ground(0, 169);
  b.shaft(30, 6, b.surface, 2, 4, 4);
  b.zigzag(60, b.surface - 4, 6, 5, 4, 3);
  b.checkpoint(56);
  b.patrol(mix(2), 20, 120, 7);
  b.blockRow("brick", 90, b.surface - 6, 6).block("question", 93, b.surface - 10, "catBell");
  b.setBoss("beast", "Canopy Beast", 4, 146, b.surface - 3);
  b.goal = { x: 164, y: b.surface - 1 };
  return b.build({ world: 2, level: 4, name: "Forest Guardian", identity: "boss arena", objective: "Defeat the Canopy Beast", widthTiles: 170, heightTiles: 30 });
}

// ============================================================ WORLD 3
// Water: gravity 0.45, slow movement, swimming, currents.

function w3_1(): LevelData {
  const b = new LevelBuilder(190, 28);
  b.ground(0, 40);
  b.ground(46, 78, b.surface + 2);
  b.pool("water", 41, 78, b.surface + 1);
  b.ground(84, 120);
  b.checkpoint(88);
  b.pool("water", 121, 158, b.surface - 2);
  b.islands(124, b.surface - 6, 5, 3, 3);
  b.patrol(["piranha", "flyer"], 46, 76, 4, b.surface);
  b.patrol(mix(3), 88, 118, 4);
  b.block("question", 92, b.surface - 5, "aquaPearl");
  b.coins(50, b.surface + 1, 8);
  b.relic(140, b.surface - 8, 3, 1);
  finish(b, 162);
  return b.build({ world: 3, level: 1, name: "Shallow Tide", identity: "water introduction", objective: "Wade in — water changes everything", widthTiles: 190, heightTiles: 28 });
}

function w3_2(): LevelData {
  const b = new LevelBuilder(200, 30);
  b.ground(0, 16);
  b.pool("water", 17, 190, 2);
  b.ceiling(17, 190, 0, 2);
  b.ground(17, 199, b.surface + 3);
  for (let i = 0; i < 10; i++) b.ledge(24 + i * 16, 6 + (i % 4) * 5, 4, T.STONE);
  for (let i = 0; i < 8; i++) b.fill(30 + i * 20, 31 + i * 20, b.surface - 6, b.surface + 2, T.STONE);
  b.zone("current", 60, 4, 20, 20, 260);
  b.zone("current", 130, 4, 20, 20, -220);
  b.patrol(["piranha", "flyer", "piranha"], 24, 185, 9, b.surface - 4);
  b.checkpoint(70, b.surface + 2);
  b.checkpoint(140, b.surface + 2);
  b.star(60, 8, 3, 2).star(100, 20, 3, 2).star(150, 10, 3, 2);
  b.relic(170, 7, 3, 2);
  b.goal = { x: 194, y: b.surface + 2 };
  b.ground(190, 199, b.surface + 3);
  return b.build({ world: 3, level: 2, name: "Sunken Ruins", identity: "fully submerged", objective: "Collect 3 Sky Stars underwater", widthTiles: 200, heightTiles: 30, starsRequired: 3 });
}

function w3_3(): LevelData {
  const b = new LevelBuilder(160, 36);
  b.ground(0, 159, b.height - 2);
  b.pool("water", 0, 159, b.height - 12);
  b.shaft(30, 4, b.height - 12, 2, 4, 4);
  b.zigzag(60, b.height - 14, 8, 6, 4, 4);
  b.islands(100, b.height - 20, 5, 4, 4, -3);
  b.patrol(mix(3), 20, 150, 8, b.height - 14);
  b.checkpoint(58, b.height - 3);
  b.checkpoint(110, b.height - 22);
  b.relic(130, 8, 3, 3);
  b.goal = { x: 150, y: 8 };
  b.ledge(144, 9, 10);
  return b.build({ world: 3, level: 3, name: "Rising Depths", identity: "outclimb the water", objective: "Reach the top before the tide", widthTiles: 160, heightTiles: 36 });
}

function w3_4(): LevelData {
  const b = new LevelBuilder(170, 30);
  b.ground(0, 169, b.surface + 3);
  b.pool("water", 0, 169, 4);
  b.ceiling(0, 169, 0, 3);
  for (let i = 0; i < 8; i++) b.fill(20 + i * 16, 21 + i * 16, b.surface - 4, b.surface + 2, T.STONE);
  b.patrol(["piranha", "flyer"], 20, 120, 6, b.surface - 4);
  b.checkpoint(80, b.surface + 2);
  b.setBoss("serpent", "Tide Serpent", 5, 146, b.surface - 4);
  b.goal = { x: 164, y: b.surface + 2 };
  return b.build({ world: 3, level: 4, name: "Serpent Trench", identity: "underwater boss", objective: "Defeat the Tide Serpent", widthTiles: 170, heightTiles: 30 });
}

// ============================================================ WORLD 4
// Sky: wind, floating islands, long falls.

function w4_1(): LevelData {
  const b = new LevelBuilder(200, 28);
  b.ground(0, 14);
  b.islands(20, b.surface - 2, 16, 4, 4, 0);
  for (let i = 0; i < 6; i++) b.platform(40 + i * 26, b.surface - 6 - (i % 3) * 3, 3, i % 2 ? { dx: 5 } : { dy: -4 }, 2200 + i * 150);
  b.patrol(["flyer", "flyer", "spiker"], 30, 180, 7, b.surface - 8);
  b.checkpoint(74, b.surface - 3);
  b.ledge(70, b.surface - 2, 8);
  b.checkpoint(140, b.surface - 3);
  b.ledge(136, b.surface - 2, 8);
  b.block("question", 60, b.surface - 8, "wingSeed");
  b.coinArc(90, b.surface - 8, 7);
  b.relic(160, b.surface - 12, 4, 1);
  finish(b, 184);
  return b.build({ world: 4, level: 1, name: "Cloudstep", identity: "island hopping", objective: "Do not fall", widthTiles: 200, heightTiles: 28 });
}

function w4_2(): LevelData {
  const b = new LevelBuilder(200, 28);
  b.ground(0, 12);
  b.islands(18, b.surface - 3, 18, 4, 4, 0);
  b.zone("wind", 30, 0, 40, 28, 240);
  b.zone("wind", 90, 0, 40, 28, -260);
  b.zone("wind", 150, 0, 40, 28, 300);
  b.patrol(["flyer", "spiker"], 30, 185, 8, b.surface - 8);
  b.checkpoint(84, b.surface - 4);
  b.ledge(80, b.surface - 3, 8);
  b.star(50, b.surface - 12, 4, 2).star(110, b.surface - 14, 4, 2).star(170, b.surface - 10, 4, 2);
  b.relic(140, b.surface - 16, 4, 2);
  b.blockRow("brick", 78, b.surface - 8, 5).block("question", 80, b.surface - 11, "coin", 3);
  b.coins(24, b.surface - 7, 5).coins(156, b.surface - 7, 5);
  finish(b, 188);
  return b.build({ world: 4, level: 2, name: "Gale Corridor", identity: "wind pressure", objective: "Collect 3 Sky Stars in the gale", widthTiles: 200, heightTiles: 28, starsRequired: 3 });
}

function w4_3(): LevelData {
  const b = new LevelBuilder(80, 60);
  // Vertical shaft: a stone ceiling, open air between, floor far below.
  // (Never fill the shaft itself — that buries the ledges and the goal.)
  b.fill(0, 79, 0, 3, T.STONE);
  b.ledge(3, 6, 10);
  b.spawn = { x: 6, y: 5 };
  for (let i = 0; i < 16; i++) b.ledge(8 + ((i * 17) % 56), 8 + i * 3, 5);
  for (let i = 0; i < 6; i++) b.platform(20 + ((i * 23) % 40), 12 + i * 8, 3, i % 2 ? { dx: 4 } : { dy: 3 }, 2100);
  b.patrol(["flyer", "spiker", "flyer"], 8, 70, 9, 30);
  b.checkpoint(20, 20);
  b.ledge(16, 21, 6);
  b.checkpoint(50, 40);
  b.ledge(46, 41, 6);
  b.relic(64, 30, 4, 3);
  b.ground(0, 79, 57);
  b.goal = { x: 70, y: 56 };
  return b.build({ world: 4, level: 3, name: "The Long Fall", identity: "vertical descent", objective: "Descend without splatting", widthTiles: 80, heightTiles: 60, timeLimit: 300 });
}

function w4_4(): LevelData {
  const b = new LevelBuilder(170, 28);
  b.ground(0, 20);
  b.islands(26, b.surface - 3, 10, 5, 4, 0);
  b.zone("wind", 26, 0, 60, 28, 200);
  b.patrol(["flyer", "flyer"], 30, 110, 6, b.surface - 8);
  b.checkpoint(60, b.surface - 4);
  b.ledge(56, b.surface - 3, 8);
  b.ground(120, 169);
  b.setBoss("titan", "Sky Titan", 5, 146, b.surface - 3);
  b.goal = { x: 164, y: b.surface - 1 };
  return b.build({ world: 4, level: 4, name: "Sky Fortress", identity: "aerial boss", objective: "Defeat the Sky Titan", widthTiles: 170, heightTiles: 28 });
}

// ============================================================ WORLD 5
// Lava: hazard management, rising heat, collapsing rock.

function w5_1(): LevelData {
  const b = new LevelBuilder(190, 28);
  b.ground(0, 30);
  b.pool("lava", 31, 48, b.surface);
  b.islands(33, b.surface - 4, 4, 2, 3);
  b.ground(50, 84);
  b.checkpoint(54);
  b.pool("lava", 85, 110, b.surface);
  for (let i = 0; i < 4; i++) b.platform(88 + i * 6, b.surface - 4, 2, { dy: -3 }, 1800 + i * 200);
  b.ground(112, 150);
  b.checkpoint(116);
  b.blockRow("falling", 120, b.surface - 5, 6);
  b.block("question", 60, b.surface - 5, "emberCore");
  b.patrol(mix(5), 50, 148, 6);
  b.relic(130, b.surface - 9, 5, 1);
  b.pool("lava", 151, 168, b.surface);
  b.islands(153, b.surface - 5, 3, 3, 3);
  finish(b, 170);
  return b.build({ world: 5, level: 1, name: "Ember Crossing", identity: "lava introduction", objective: "Cross the lava rivers", widthTiles: 190, heightTiles: 28 });
}

function w5_2(): LevelData {
  const b = new LevelBuilder(150, 40);
  b.ground(0, 149, b.height - 2);
  b.pool("lava", 0, 149, b.height - 3);
  b.zigzag(10, b.height - 6, 10, 6, 3, 4);
  b.shaft(60, 4, b.height - 8, 2, 3, 4);
  b.islands(90, b.height - 20, 6, 4, 3, -2);
  b.patrol(mix(5), 20, 140, 8, b.height - 12);
  b.checkpoint(30, b.height - 20);
  b.ledge(26, b.height - 19, 6);
  b.checkpoint(100, b.height - 28);
  b.ledge(96, b.height - 27, 6);
  b.relic(120, 10, 5, 2);
  b.ledge(134, 8, 12);
  b.goal = { x: 142, y: 7 };
  return b.build({ world: 5, level: 2, name: "Rising Embers", identity: "outclimb the lava", objective: "Climb ahead of the rising lava", widthTiles: 150, heightTiles: 40, timeLimit: 280 });
}

function w5_3(): LevelData {
  const b = new LevelBuilder(200, 30);
  b.ground(0, 199);
  b.ceiling(10, 190, 3, 2);
  for (let i = 0; i < 9; i++) b.pool("lava", 20 + i * 20, 26 + i * 20, b.surface);
  for (let i = 0; i < 9; i++) b.platform(20 + i * 20, b.surface - 5, 3, i % 2 ? { dx: 4 } : { dy: -4 }, 1900 + i * 90);
  b.blockRow("metal", 60, b.surface - 8, 10);
  b.patrol(mix(5), 20, 190, 9);
  b.checkpoint(70);
  b.checkpoint(140);
  b.block("question", 100, b.surface - 8, "emberCore");
  b.relic(160, b.surface - 10, 5, 3);
  finish(b, 192);
  return b.build({ world: 5, level: 3, name: "Volcanic Machinery", identity: "timed hazards", objective: "Time the moving platforms", widthTiles: 200, heightTiles: 30 });
}

function w5_4(): LevelData {
  const b = new LevelBuilder(170, 28);
  b.ground(0, 169);
  b.pool("lava", 30, 40, b.surface);
  b.pool("lava", 70, 82, b.surface);
  b.islands(31, b.surface - 4, 3, 2, 3);
  b.platform(70, b.surface - 4, 3, { dx: 4 }, 2000);
  b.patrol(mix(5), 20, 110, 6);
  b.checkpoint(96);
  b.setBoss("core", "Magma Core", 6, 146, b.surface - 3);
  b.goal = { x: 164, y: b.surface - 1 };
  return b.build({ world: 5, level: 4, name: "Caldera Heart", identity: "lava boss", objective: "Defeat the Magma Core", widthTiles: 170, heightTiles: 28 });
}

// ============================================================ WORLD 6
// Ice: friction 0.25, sliding, breakable ice.

function w6_1(): LevelData {
  const b = new LevelBuilder(190, 28);
  b.ground(0, 189);
  b.zone("ice", 0, 0, 190, 28);
  for (let i = 0; i < 8; i++) b.hazard(24 + i * 20, b.surface - 1, 2);
  b.blockRow("ice", 40, b.surface - 5, 6).blockRow("ice", 100, b.surface - 5, 6);
  b.patrol(mix(6), 20, 180, 7);
  b.checkpoint(64);
  b.checkpoint(130);
  b.block("question", 50, b.surface - 9, "frostCrystal");
  b.relic(120, b.surface - 9, 6, 1);
  b.coinArc(80, b.surface - 4, 7);
  finish(b, 182);
  return b.build({ world: 6, level: 1, name: "Glacier Slide", identity: "ice friction", objective: "Learn to brake early", widthTiles: 190, heightTiles: 28 });
}

function w6_2(): LevelData {
  const b = new LevelBuilder(200, 28);
  b.brokenGround(0, 199, 8, 12, 5);
  b.zone("ice", 0, 0, 200, 28);
  for (let i = 0; i < 7; i++) b.platform(24 + i * 24, b.surface - 4, 3, i % 2 ? { dx: 5 } : { dy: -3 }, 2300);
  b.patrol(mix(6), 20, 190, 8);
  b.checkpoint(70);
  b.checkpoint(146);
  b.star(40, b.surface - 8, 6, 2).star(110, b.surface - 10, 6, 2).star(176, b.surface - 8, 6, 2);
  b.relic(150, b.surface - 12, 6, 2);
  return b.build({ world: 6, level: 2, name: "Frozen Gaps", identity: "slippery precision", objective: "Collect 3 Sky Stars on the ice", widthTiles: 200, heightTiles: 28, starsRequired: 3 });
}

function w6_3(): LevelData {
  const b = new LevelBuilder(170, 34);
  b.ground(0, 169, b.height - 2);
  b.zone("ice", 0, 0, 170, 34);
  b.shaft(30, 6, b.height - 4, 2, 4, 4);
  b.zigzag(60, b.height - 8, 8, 6, 3, 3);
  b.islands(110, b.height - 16, 5, 5, 3, -2);
  b.blockRow("ice", 80, b.height - 20, 8);
  b.patrol(mix(6), 20, 160, 8, b.height - 10);
  b.checkpoint(58, b.height - 3);
  b.checkpoint(120, b.height - 18);
  b.ledge(116, b.height - 17, 10);
  b.relic(150, 10, 6, 3);
  b.ledge(150, 12, 12);
  b.goal = { x: 158, y: 11 };
  return b.build({ world: 6, level: 3, name: "Frozen Falls", identity: "icy vertical", objective: "Climb the frozen waterfall", widthTiles: 170, heightTiles: 34 });
}

function w6_4(): LevelData {
  const b = new LevelBuilder(170, 28);
  b.ground(0, 169);
  b.zone("ice", 0, 0, 130, 28);
  b.blockRow("ice", 40, b.surface - 5, 8);
  b.hazard(60, b.surface - 1, 3).hazard(90, b.surface - 1, 3);
  b.patrol(mix(6), 20, 110, 7);
  b.checkpoint(100);
  b.setBoss("warden", "Frost Warden", 6, 146, b.surface - 3);
  b.goal = { x: 164, y: b.surface - 1 };
  return b.build({ world: 6, level: 4, name: "Warden's Hollow", identity: "ice boss", objective: "Defeat the Frost Warden", widthTiles: 170, heightTiles: 28 });
}

// ============================================================ WORLD 7
// Space: low gravity, gravity fields, long floaty arcs.

function w7_1(): LevelData {
  const b = new LevelBuilder(200, 30);
  b.ground(0, 20);
  b.islands(28, b.surface - 4, 16, 4, 4, 0);
  b.zone("lowgrav", 28, 0, 172, 30);
  b.patrol(["flyer", "spiker", "shell"], 30, 190, 8, b.surface - 8);
  b.checkpoint(76, b.surface - 5);
  b.ledge(72, b.surface - 4, 8);
  b.checkpoint(148, b.surface - 5);
  b.ledge(144, b.surface - 4, 8);
  b.block("question", 60, b.surface - 9, "gravityOrb");
  b.coinArc(100, b.surface - 10, 9);
  b.relic(170, b.surface - 14, 7, 1);
  finish(b, 186);
  return b.build({ world: 7, level: 1, name: "Orbital Docks", identity: "low gravity", objective: "Master the floaty arc", widthTiles: 200, heightTiles: 30 });
}

function w7_2(): LevelData {
  const b = new LevelBuilder(180, 36);
  b.ground(0, 179, b.height - 2);
  b.shaft(40, 4, b.height - 4, 2, 5, 4);
  b.zone("lowgrav", 30, 0, 40, 36);
  b.zone("wind", 90, 0, 40, 36, 220);
  b.islands(100, b.height - 14, 6, 5, 3, -2);
  b.patrol(["flyer", "spiker"], 20, 170, 9, b.height - 12);
  b.checkpoint(70, b.height - 3);
  b.checkpoint(130, b.height - 16);
  b.ledge(126, b.height - 15, 8);
  b.star(50, 10, 7, 2).star(110, b.height - 20, 7, 2).star(160, 12, 7, 2);
  b.relic(150, 8, 7, 2);
  finish(b, 168);
  return b.build({ world: 7, level: 2, name: "Gravity Wells", identity: "gravity fields", objective: "Collect 3 Sky Stars between fields", widthTiles: 180, heightTiles: 36, starsRequired: 3 });
}

function w7_3(): LevelData {
  const b = new LevelBuilder(210, 30);
  b.brokenGround(0, 209, 6, 9, 7);
  b.zone("lowgrav", 0, 0, 210, 30);
  for (let i = 0; i < 8; i++) b.platform(20 + i * 24, b.surface - 6 - (i % 3) * 3, 2, i % 2 ? { dx: 6 } : { dy: -5 }, 2000);
  for (let i = 0; i < 10; i++) b.hazard(18 + i * 20, b.surface - 1, 2);
  b.patrol(["spiker", "flyer", "shell"], 20, 200, 10);
  b.checkpoint(72);
  b.checkpoint(150);
  b.relic(180, b.surface - 12, 7, 3);
  finish(b, 200);
  return b.build({ world: 7, level: 3, name: "Asteroid Run", identity: "precision jumps", objective: "Survive the asteroid belt", widthTiles: 210, heightTiles: 30, timeLimit: 300 });
}

function w7_4(): LevelData {
  const b = new LevelBuilder(180, 30);
  b.ground(0, 179);
  b.zone("lowgrav", 0, 0, 140, 30);
  b.islands(24, b.surface - 5, 11, 4, 4, 0);
  b.patrol(["flyer", "spiker"], 24, 120, 8, b.surface - 8);
  b.checkpoint(108);
  b.blockRow("metal", 90, b.surface - 8, 8);
  b.setBoss("machine", "Void Machine", 7, 154, b.surface - 3);
  b.goal = { x: 174, y: b.surface - 1 };
  return b.build({ world: 7, level: 4, name: "Void Core", identity: "zero-g boss", objective: "Defeat the Void Machine", widthTiles: 180, heightTiles: 30 });
}

// ============================================================ WORLD 8
// The Final Forge: every mechanic, stacked.

function w8_1(): LevelData {
  const b = new LevelBuilder(210, 30);
  b.ground(0, 209);
  b.ceiling(12, 200, 2, 2);
  b.pool("lava", 40, 52, b.surface);
  b.zone("ice", 90, 0, 40, 30);
  b.zone("wind", 150, 0, 40, 30, -240);
  b.islands(41, b.surface - 4, 3, 2, 3);
  for (let i = 0; i < 8; i++) b.platform(60 + i * 18, b.surface - 5 - (i % 3) * 3, 2, i % 2 ? { dx: 4 } : { dy: -4 }, 1800);
  b.blockRow("falling", 100, b.surface - 6, 8);
  b.patrol(mix(8), 20, 200, 11);
  b.checkpoint(66);
  b.checkpoint(140);
  b.block("question", 70, b.surface - 9, "shieldCore");
  b.relic(184, b.surface - 10, 8, 1);
  finish(b, 200);
  return b.build({ world: 8, level: 1, name: "Forge Gates", identity: "mixed mechanics", objective: "Everything at once", widthTiles: 210, heightTiles: 30, timeLimit: 340 });
}

function w8_2(): LevelData {
  const b = new LevelBuilder(160, 44);
  b.ground(0, 159, b.height - 2);
  b.pool("lava", 0, 159, b.height - 3);
  b.shaft(24, 4, b.height - 6, 2, 3, 3);
  b.zigzag(50, b.height - 10, 10, 5, 3, 3);
  b.islands(90, b.height - 24, 6, 4, 3, -2);
  b.blockRow("falling", 60, b.height - 28, 8);
  b.zone("wind", 100, 0, 40, 44, 200);
  b.patrol(mix(8), 20, 150, 10, b.height - 14);
  b.checkpoint(34, b.height - 22);
  b.ledge(30, b.height - 21, 6);
  b.checkpoint(104, b.height - 30);
  b.ledge(100, b.height - 29, 6);
  b.relic(140, 10, 8, 2);
  b.ledge(140, 12, 14);
  b.goal = { x: 150, y: 11 };
  return b.build({ world: 8, level: 2, name: "Crusher Shaft", identity: "vertical gauntlet", objective: "Climb the forge shaft", widthTiles: 160, heightTiles: 44, timeLimit: 300 });
}

function w8_3(): LevelData {
  const b = new LevelBuilder(220, 30);
  b.brokenGround(0, 219, 5, 8, 6);
  b.ceiling(10, 210, 1, 2);
  for (let i = 0; i < 11; i++) b.pool("lava", 14 + i * 19, 18 + i * 19, b.surface);
  for (let i = 0; i < 11; i++) b.platform(14 + i * 19, b.surface - 5, 2, i % 2 ? { dx: 3 } : { dy: -4 }, 1600 + i * 60);
  for (let i = 0; i < 12; i++) b.hazard(20 + i * 17, b.surface - 7, 1);
  b.patrol(mix(8), 20, 210, 12);
  b.checkpoint(76);
  b.checkpoint(154);
  b.block("question", 90, b.surface - 9, "starFragment");
  b.relic(190, b.surface - 10, 8, 3);
  finish(b, 208);
  return b.build({ world: 8, level: 3, name: "Laser Assembly", identity: "expert precision", objective: "No safe ground", widthTiles: 220, heightTiles: 30, timeLimit: 300 });
}

function w8_4(): LevelData {
  const b = new LevelBuilder(200, 30);
  b.ground(0, 199);
  b.ceiling(10, 190, 1, 2);
  b.pool("lava", 34, 44, b.surface);
  b.islands(35, b.surface - 4, 3, 2, 3);
  b.zone("ice", 60, 0, 30, 30);
  b.blockRow("metal", 100, b.surface - 6, 10);
  b.patrol(mix(8), 20, 130, 9);
  b.checkpoint(126);
  b.block("question", 120, b.surface - 6, "shieldCore");
  b.setBoss("overlord", "Forge Overlord", 9, 170, b.surface - 3);
  b.goal = { x: 194, y: b.surface - 1 };
  return b.build({ world: 8, level: 4, name: "Final Forge", identity: "multi-phase final boss", objective: "Defeat the Forge Overlord", widthTiles: 200, heightTiles: 30, timeLimit: 400 });
}

const RECIPES: Recipe[] = [
  { world: 1, level: 1, name: "Tutorial Meadow", identity: "tutorial", design: w1_1 },
  { world: 1, level: 2, name: "Broken Bridge", identity: "moving platforms", design: w1_2 },
  { world: 1, level: 3, name: "Hilltop Run", identity: "vertical climb", design: w1_3 },
  { world: 1, level: 4, name: "Emberleaf Fortress", identity: "fortress + boss", design: w1_4 },
  { world: 2, level: 1, name: "Vine Ascent", identity: "vines", design: w2_1 },
  { world: 2, level: 2, name: "Canopy Walk", identity: "hanging platforms", design: w2_2 },
  { world: 2, level: 3, name: "Falling Branches", identity: "falling platforms", design: w2_3 },
  { world: 2, level: 4, name: "Forest Guardian", identity: "boss", design: w2_4 },
  { world: 3, level: 1, name: "Shallow Tide", identity: "water intro", design: w3_1 },
  { world: 3, level: 2, name: "Sunken Ruins", identity: "submerged", design: w3_2 },
  { world: 3, level: 3, name: "Rising Depths", identity: "rising water", design: w3_3 },
  { world: 3, level: 4, name: "Serpent Trench", identity: "underwater boss", design: w3_4 },
  { world: 4, level: 1, name: "Cloudstep", identity: "cloud platforms", design: w4_1 },
  { world: 4, level: 2, name: "Gale Corridor", identity: "wind", design: w4_2 },
  { world: 4, level: 3, name: "The Long Fall", identity: "vertical descent", design: w4_3 },
  { world: 4, level: 4, name: "Sky Fortress", identity: "aerial boss", design: w4_4 },
  { world: 5, level: 1, name: "Ember Crossing", identity: "lava intro", design: w5_1 },
  { world: 5, level: 2, name: "Rising Embers", identity: "rising lava", design: w5_2 },
  { world: 5, level: 3, name: "Volcanic Machinery", identity: "timed hazards", design: w5_3 },
  { world: 5, level: 4, name: "Caldera Heart", identity: "lava boss", design: w5_4 },
  { world: 6, level: 1, name: "Glacier Slide", identity: "ice friction", design: w6_1 },
  { world: 6, level: 2, name: "Frozen Gaps", identity: "slippery precision", design: w6_2 },
  { world: 6, level: 3, name: "Frozen Falls", identity: "icy vertical", design: w6_3 },
  { world: 6, level: 4, name: "Warden's Hollow", identity: "ice boss", design: w6_4 },
  { world: 7, level: 1, name: "Orbital Docks", identity: "low gravity", design: w7_1 },
  { world: 7, level: 2, name: "Gravity Wells", identity: "gravity fields", design: w7_2 },
  { world: 7, level: 3, name: "Asteroid Run", identity: "precision jumps", design: w7_3 },
  { world: 7, level: 4, name: "Void Core", identity: "zero-g boss", design: w7_4 },
  { world: 8, level: 1, name: "Forge Gates", identity: "mixed mechanics", design: w8_1 },
  { world: 8, level: 2, name: "Crusher Shaft", identity: "vertical gauntlet", design: w8_2 },
  { world: 8, level: 3, name: "Laser Assembly", identity: "expert precision", design: w8_3 },
  { world: 8, level: 4, name: "Final Forge", identity: "final boss", design: w8_4 },
];

/** 32 hand-designed stages, four per world. */
export function buildCampaign(): LevelData[] {
  const levels = RECIPES.map((r) => r.design());
  levels.forEach((level, i) => {
    const next = levels[i + 1];
    if (next) level.next = next.id;
    else delete level.next;
  });
  return levels;
}
