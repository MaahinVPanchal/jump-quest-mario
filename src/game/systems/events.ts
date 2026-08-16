/** Loosely-coupled game event names shared across systems. */
export const GameEvent = {
  HudUpdate: "hud:update",
  Score: "game:score",
  Coin: "game:coin",
  Relic: "game:relic",
  PowerUp: "game:powerup",
  EnemyDefeated: "game:enemyDefeated",
  Checkpoint: "game:checkpoint",
  PlayerDamage: "game:playerDamage",
  PlayerDeath: "game:playerDeath",
  LevelComplete: "game:levelComplete",
  TimerExpired: "game:timerExpired",
  Combo: "game:combo",
  Toast: "game:toast",
} as const;
